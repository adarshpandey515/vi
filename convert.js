const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, 'Vi_Enterprise_Combined_JSON_Render.html');
const JSON_DIR = path.join(ROOT, 'jsons');
const OUTPUT_DIR = path.join(ROOT, 'html');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function escapeForInlineScript(jsonText) {
  return jsonText.replace(/<\/script/gi, '<\\/script');
}

function injectEmbeddedJson(templateHtml, payload) {
  const injection = `<script>\nwindow.__EMBEDDED_JSON__ = ${payload};\n</script>\n`;
  if (templateHtml.includes('</head>')) {
    return templateHtml.replace('</head>', `${injection}</head>`);
  }
  if (templateHtml.includes('<body>')) {
    return templateHtml.replace('<body>', `<body>\n${injection}`);
  }
  return `${injection}${templateHtml}`;
}

function setAbsJsonPath(html, absoluteJsonPath) {
  const webPath = absoluteJsonPath.replace(/\\/g, '/');
  return html.replace(/var ABS_JSON_PATH = '[^']*';/, `var ABS_JSON_PATH = '${webPath}';`);
}

function formatDateRange(startDate, endDate) {
  const startParts = (startDate || '').split('/');
  const endParts = (endDate || '').split('/');
  if (startParts.length !== 3 || endParts.length !== 3) {
    return `${startDate} - ${endDate}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[Number(startParts[1]) - 1] || '';
  const endMonth = months[Number(endParts[1]) - 1] || '';
  return `${startParts[0]} ${startMonth} - ${endParts[0]} ${endMonth} ${endParts[2]}`.trim();
}

// Update static template placeholders with dynamic data from JSON
function applyDynamicReplacements(html, data) {
  const acctNum = data?.accountSummary?.accountNumber || 'N/A';
  const companyName = data?.accountSummary?.companyName || data?.accountSummary?.accountName || 'Enterprise Account';
  const totalDue = data?.currentBilling?.totalDue || 'N/A';
  const invoiceNo = data?.currentBilling?.invoiceNumber || 'N/A';
  const billStart = data?.currentBilling?.billPeriod?.startDate || '01/02/2026';
  const billEnd = data?.currentBilling?.billPeriod?.endDate || '28/02/2026';
  const dueDate = data?.currentBilling?.dueDate || '15/03/2026';
  const primaryPhone = data?.connections?.[0]?.phoneNumber || '9876543210';
  const billRangeText = formatDateRange(billStart, billEnd);

  let updated = html;

  updated = updated.replace(/Globe Consultancy Services Ltd\./g, companyName);
  updated = updated.replace(/Globe Consultancy Services Limited/g, companyName);
  updated = updated.replace(/Globe Consultancy Services Building/g, `${companyName} Building`);
  updated = updated.replace(/ENT-88234571/g, acctNum);
  updated = updated.replace(/INV-2026-03-ENT-0847/g, invoiceNo);
  updated = updated.replace(/INV-2026-03-0847/g, invoiceNo);
  updated = updated.replace(/Rs\.7,842\.50/g, `Rs.${totalDue}`);
  updated = updated.replace(/01 Feb - 28 Feb 2026/g, billRangeText);
  updated = updated.replace(/9876543210/g, primaryPhone);

  updated = updated.replace(
    /<li>Account Number: <strong>ENT-\d+<\/strong><\/li>/g,
    `<li>Account Number: <strong>${acctNum}</strong></li>`
  );
  updated = updated.replace(
    /<li>Billing Period: <strong>[\d/]+ - [\d/]+<\/strong><\/li>/g,
    `<li>Billing Period: <strong>${billStart} - ${billEnd}</strong></li>`
  );
  updated = updated.replace(
    /<li>Amount Due: <strong class="amount">Rs\.[\d,\.]+<\/strong><\/li>/g,
    `<li>Amount Due: <strong class="amount">Rs.${totalDue}</strong></li>`
  );
  updated = updated.replace(
    /<li>Due Date: <strong>[\d/]+<\/strong><\/li>/g,
    `<li>Due Date: <strong>${dueDate}</strong></li>`
  );
  updated = updated.replace(
    /Your <strong>[^<]+<\/strong> enterprise bill summary for <strong>[\d/]+<\/strong>/g,
    `Your <strong>${companyName}</strong> enterprise bill summary for <strong>${billStart}</strong>`
  );
  updated = updated.replace(
    /Bill Period','\d{2}\/\d{2}\/\d{4}'/g,
    `Bill Period','${billStart} - ${billEnd}'`
  );
  updated = updated.replace(
    /Due By','\d{2}\/\d{2}\/\d{4}'/g,
    `Due By','${dueDate}'`
  );

  return updated;
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found: ${TEMPLATE_PATH}`);
  }
  if (!fs.existsSync(JSON_DIR)) {
    throw new Error(`JSON folder not found: ${JSON_DIR}`);
  }

  ensureDir(OUTPUT_DIR);

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const jsonFiles = fs.readdirSync(JSON_DIR).filter((f) => f.toLowerCase().endsWith('.json'));

  if (!jsonFiles.length) {
    console.log(`No JSON files found in ${JSON_DIR}`);
    return;
  }

  let builtCount = 0;
  for (const fileName of jsonFiles) {
    const inputPath = path.join(JSON_DIR, fileName);
    const baseName = path.parse(fileName).name;
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.html`);

    try {
      const raw = fs.readFileSync(inputPath, 'utf8');
      const parsed = JSON.parse(raw);
      const payload = escapeForInlineScript(JSON.stringify(parsed));

      let outHtml = injectEmbeddedJson(template, payload);
      outHtml = setAbsJsonPath(outHtml, inputPath);
      
      // Replace template placeholders with dynamic JSON data
      outHtml = applyDynamicReplacements(outHtml, parsed);
      
      fs.writeFileSync(outputPath, outHtml, 'utf8');

      builtCount += 1;
      const acctNo = parsed?.accountSummary?.accountNumber || 'N/A';
      const totalDue = parsed?.currentBilling?.totalDue || 'N/A';
      console.log(`✓ Built: html\\${baseName}.html | Account: ${acctNo} | Total: Rs.${totalDue}`);
    } catch (err) {
      console.error(`✗ Failed for ${fileName}: ${err.message}`);
    }
  }

  console.log(`\n✓ Done! Generated ${builtCount}/${jsonFiles.length} HTML files with embedded JSON data.`);
}

main();
