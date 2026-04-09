const path = require("path");
const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const puppeteer = require("puppeteer");

const app = express();
const PORT = Number(process.env.PORT || 8081);
const CHART_SELECTOR = [
  '[data-i_designer-type="custom_line_chart"]',
  '[data-gjs-type="custom_line_chart"]',
  ".highchart-live-areaspline",
].join(", ");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 200,
  },
});

const vendorFiles = {
  "/vendor/highstock.js": require.resolve("highcharts/highstock.js"),
  "/vendor/highcharts-more.js": require.resolve("highcharts/highcharts-more.js"),
  "/vendor/highcharts-3d.js": require.resolve("highcharts/highcharts-3d.js"),
  "/vendor/modules/data.js": require.resolve("highcharts/modules/data.js"),
  "/vendor/modules/exporting.js": require.resolve("highcharts/modules/exporting.js"),
  "/vendor/modules/accessibility.js": require.resolve("highcharts/modules/accessibility.js"),
  "/vendor/modules/drilldown.js": require.resolve("highcharts/modules/drilldown.js"),
};

Object.entries(vendorFiles).forEach(([routePath, filePath]) => {
  app.get(routePath, (_req, res) => {
    res.sendFile(path.resolve(filePath));
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function getBaseUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto ? String(forwardedProto).split(",")[0] : req.protocol;
  return `${protocol}://${req.get("host")}`;
}

function parsePayload(rawPayload) {
  if (!rawPayload) return [];
  try {
    const parsed = JSON.parse(rawPayload);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function sanitizeFilename(name) {
  return String(name || "export")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "export";
}

function stripExtension(fileName) {
  return String(fileName || "").replace(/\.[^.]+$/u, "");
}

function getPayloadValues(payload, key) {
  if (!Array.isArray(payload)) return [];
  const entry = payload.find((item) => item && Array.isArray(item[key]));
  return entry ? entry[key] : [];
}

function tokenizePath(pathExpression) {
  return String(pathExpression || "")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function readValueByPath(input, pathExpression) {
  const parts = tokenizePath(pathExpression);
  let current = input;

  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}

function resolveOutputBaseName(jsonObject, originalName, index, payload) {
  const configuredNames = getPayloadValues(payload, "file_name");

  for (const configuredPath of configuredNames) {
    const value = readValueByPath(jsonObject, configuredPath);
    if (value != null && String(value).trim()) {
      return sanitizeFilename(String(value).trim());
    }
  }

  return sanitizeFilename(stripExtension(originalName) || `file_${index + 1}`);
}

function parseJsonFile(file) {
  try {
    return JSON.parse(file.buffer.toString("utf8"));
  } catch (err) {
    throw new Error(`Invalid JSON in ${file.originalname}`);
  }
}

function replaceHighchartsUrls(html, baseUrl) {
  const replacements = [
    [/https:\/\/code\.highcharts\.com\/stock\/(?:[^"'\\s]+\/)?highstock\.js/gi, `${baseUrl}/vendor/highstock.js`],
    [/https:\/\/code\.highcharts\.com\/highcharts-3d\.js/gi, `${baseUrl}/vendor/highcharts-3d.js`],
    [/https:\/\/code\.highcharts\.com\/highcharts-more\.js/gi, `${baseUrl}/vendor/highcharts-more.js`],
    [/https:\/\/code\.highcharts\.com\/modules\/data\.js/gi, `${baseUrl}/vendor/modules/data.js`],
    [/https:\/\/code\.highcharts\.com\/modules\/exporting\.js/gi, `${baseUrl}/vendor/modules/exporting.js`],
    [/https:\/\/code\.highcharts\.com\/modules\/accessibility\.js/gi, `${baseUrl}/vendor/modules/accessibility.js`],
    [/https:\/\/code\.highcharts\.com\/modules\/drilldown\.js/gi, `${baseUrl}/vendor/modules/drilldown.js`],
  ];

  return replacements.reduce((output, [pattern, nextValue]) => {
    return output.replace(pattern, nextValue);
  }, html);
}

function injectBulkRuntime(html, jsonObject) {
  const serializedJson = JSON.stringify(jsonObject);
  const runtimeScript = `
<script>
window.project_type2 = "downloadedJsonType";
window.jsonData1 = [${serializedJson}];
window.__BULK_EXPORT_JSON__ = ${serializedJson};
try {
  localStorage.setItem("common_json", JSON.stringify(window.__BULK_EXPORT_JSON__));
  localStorage.removeItem("common_json_files");
  localStorage.setItem("common_json_file_name", "");
} catch (storageErr) {
  console.warn("Bulk export storage bootstrap skipped:", storageErr);
}
</script>`;

  const withoutInlineJson = html.replace(
    /<script[^>]*>\s*var\s+jsonData1\s*=\s*[\s\S]*?<\/script>/gi,
    ""
  );

  if (/<head[^>]*>/i.test(withoutInlineJson)) {
    return withoutInlineJson.replace(/<head[^>]*>/i, (match) => `${match}\n${runtimeScript}`);
  }

  return `${runtimeScript}\n${withoutInlineJson}`;
}

function prepareTemplateHtml(templateHtml, jsonObject, baseUrl) {
  const withLocalHighcharts = replaceHighchartsUrls(templateHtml, baseUrl);
  return injectBulkRuntime(withLocalHighcharts, jsonObject);
}

async function waitForChartsToRender(page) {
  await page.waitForFunction(() => document.readyState === "complete", {
    timeout: 60000,
  });

  const chartCount = await page.evaluate((selector) => {
    return document.querySelectorAll(selector).length;
  }, CHART_SELECTOR);

  if (!chartCount) {
    return;
  }

  await page.waitForFunction(
    (selector) => {
      const chartNodes = Array.from(document.querySelectorAll(selector));
      if (!chartNodes.length) return true;

      const hasFailure = chartNodes.some((node) =>
        /Failed to load chart library/i.test(node.textContent || "")
      );

      if (hasFailure) return true;

      return chartNodes.every((node) => {
        if (node.getAttribute("data-chart-ready") === "true") return true;
        return Boolean(node.querySelector("svg, canvas, .highcharts-container, .highcharts-root"));
      });
    },
    { timeout: 60000 },
    CHART_SELECTOR
  );

  const failureMessage = await page.evaluate((selector) => {
    const failedNode = Array.from(document.querySelectorAll(selector)).find((node) =>
      /Failed to load chart library/i.test(node.textContent || "")
    );

    return failedNode ? failedNode.textContent.trim() : "";
  }, CHART_SELECTOR);

  if (failureMessage) {
    throw new Error(failureMessage);
  }

  await page.evaluate(() => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  });
}

async function freezeChartsInPage(page) {
  await page.evaluate((selector) => {
    const charts = Array.from(document.querySelectorAll(selector));

    charts.forEach((chart) => {
      let dataUrl = null;

      try {
        const svg =
          chart.tagName && chart.tagName.toUpperCase() === "SVG"
            ? chart
            : chart.querySelector("svg");

        if (svg) {
          const markup = new XMLSerializer().serializeToString(svg);
          dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
        }
      } catch (svgErr) {}

      if (!dataUrl) {
        try {
          const canvas =
            chart.tagName && chart.tagName.toUpperCase() === "CANVAS"
              ? chart
              : chart.querySelector("canvas");

          if (canvas && typeof canvas.toDataURL === "function") {
            dataUrl = canvas.toDataURL("image/png");
          }
        } catch (canvasErr) {}
      }

      if (!dataUrl) {
        return;
      }

      const rect = chart.getBoundingClientRect();
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "chart";
      img.style.display = "block";
      img.style.maxWidth = "100%";
      img.style.height = "auto";

      if (rect.width > 0 && rect.height > 0) {
        chart.style.width = `${Math.ceil(rect.width)}px`;
        chart.style.height = `${Math.ceil(rect.height)}px`;
        img.style.width = `${Math.ceil(rect.width)}px`;
        img.style.height = `${Math.ceil(rect.height)}px`;
      }

      if (chart.classList) {
        chart.classList.remove("highchart-live-areaspline");
      }

      chart.removeAttribute("id");
      chart.removeAttribute("data-i_designer-type");
      chart.removeAttribute("data-gjs-type");
      chart.removeAttribute("data-chart-ready");
      chart.removeAttribute("data-chart-initialized");
      chart.innerHTML = "";
      chart.appendChild(img);
    });
  }, CHART_SELECTOR);
}

async function renderTemplateForJson(browser, templateHtml, jsonObject, baseUrl, outputType) {
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
    await page.emulateMediaType("screen");

    const preparedHtml = prepareTemplateHtml(templateHtml, jsonObject, baseUrl);

    await page.setContent(preparedHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    await waitForChartsToRender(page);
    await freezeChartsInPage(page);

    const renderedHtml = `<!DOCTYPE html>\n${await page.content()}`;

    if (outputType === "html") {
      return { html: renderedHtml };
    }

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: "A4",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return { html: renderedHtml, pdf };
  } finally {
    await page.close();
  }
}

async function streamBulkArchive(req, res, outputType) {
  const uploadedFiles = req.files || {};
  const templateFile = uploadedFiles.file && uploadedFiles.file[0];
  const jsonFiles = uploadedFiles.jsonFile || [];
  const payload = parsePayload(req.body && req.body.payload);

  if (!templateFile) {
    res.status(400).json({ error: "Missing template HTML file in field 'file'." });
    return;
  }

  if (!jsonFiles.length) {
    res.status(400).json({ error: "Missing JSON inputs in field 'jsonFile'." });
    return;
  }

  const templateHtml = templateFile.buffer.toString("utf8");
  const baseUrl = getBaseUrl(req);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bulk-${outputType}-${Date.now()}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    for (let index = 0; index < jsonFiles.length; index++) {
      const jsonFile = jsonFiles[index];
      const jsonObject = parseJsonFile(jsonFile);
      const outputName = resolveOutputBaseName(
        jsonObject,
        jsonFile.originalname,
        index,
        payload
      );

      const rendered = await renderTemplateForJson(
        browser,
        templateHtml,
        jsonObject,
        baseUrl,
        outputType
      );

      if (outputType === "pdf") {
        archive.append(rendered.pdf, { name: `${outputName}.pdf` });
      } else {
        archive.append(rendered.html, { name: `${outputName}.html` });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Bulk ${outputType} export failed`, err);

    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.post(
  "/api/uploadPdf",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "jsonFile", maxCount: 200 },
  ]),
  async (req, res) => {
    await streamBulkArchive(req, res, "pdf");
  }
);

app.post(
  "/api/uploadHtml",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "jsonFile", maxCount: 200 },
  ]),
  async (req, res) => {
    await streamBulkArchive(req, res, "html");
  }
);

app.listen(PORT, () => {
  console.log(`Bulk export reference server listening on http://localhost:${PORT}`);
});
