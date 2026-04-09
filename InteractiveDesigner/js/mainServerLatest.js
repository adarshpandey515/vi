
window.editor = InteractiveDesigner.init({
  height: "100%",
  container: "#editor",
  fromElement: 1,
  allowScripts: 1,
  telemetry: false,
  showOffsets: true,
  fromElement: true,
  noticeOnUnload: true,
  storageManager: false,
  selectorManager: {
    componentFirst: true,
  },
  plugins: [
    //initNotificationsPlugin,
    "code-editor-component",
    "postcss-parser-component",
    "webpage-component",
    drawingTool,
    customChartCommonJson,
    flowLayoutComponent,
    customTable,
    source,
    customCarousel,
    customNewFontUrl,
    customLoadingPage,
    customVideoIn,
    loadBackButtonComponent,
    customSeparator,
    customSections,
    jsontablecustom,
    addFormattedRichTextComponent,
    marqueTag,
    exportPlugin,
    addQRBarcodeComponent,
    registerCustomShapes,
    customTableOfContents,
    addLiveLineChartComponent,
    //linkTrackerPlugin,
    backgroundMusic,
    // customFlowColumns,
    subreportPlugin,
    "basic-block-component",
    "countdown-component",
    "forms-component",
    "video-forms-component",
    "table-component",
    newComponents,
    object,
    customTabWithNav,
    //customImage,
    "image-editor-component",
    "zip-export-component",
    "custom-code-component",
    "toolbox-component",
    "tooltip-component",
    "typed-component",
    "style-bg-component",
    "navbar-component",
    "page-manager-component",
    "grapesjsHideOnPrint",
  ],
  pluginsOpts: {
    "grapesjs-plugin-toolbox": {
      panels: true,
    },
    "page-manager-component": {
      category: "Pages",
      defaultPages: ["Home"],
    },
    grapesjsHideOnPrint: {
      label: "Hide on print",
      traitName: "hideOnPrint",
      className: "hide-on-print",
    },
  },
  canvas: {
    styles: [
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
      "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
      "https://fonts.googleapis.com/icon?family=Material+Icons",
      "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
      "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
    ],
    scripts: [
      "https://code.jquery.com/jquery-3.3.1.slim.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
      "https://code.jquery.com/jquery-2.1.1.min.js",
      "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
      "https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
      "https://code.highcharts.com/stock/highstock.js",
      "https://code.highcharts.com/highcharts-3d.js",
      "https://code.highcharts.com/highcharts-more.js",
      "https://code.highcharts.com/modules/data.js",
      "https://code.highcharts.com/modules/exporting.js",
      "https://code.highcharts.com/modules/accessibility.js",
      "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
      "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
      "https://code.highcharts.com/modules/drilldown.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js",
      "https://code.jquery.com/jquery-3.6.0.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
      "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/html-docx-js/dist/html-docx.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"

    ],
  },
});

editor.on('component:update:name component:update:attributes component:selected', (component) => {
  updateLayerName(component);
});

editor.on('layer:component', ({ model }) => {
  updateLayerName(model);
});

editor.on('component:add', (component) => {
  updateLayerName(component);
});

editor.on('load', () => {
  editor.getComponents().forEach((component) => {
    updateLayerName(component)
  });
});

editor.on('run:open-assets', () => {
  const assetManager = editor.AssetManager;
  const container = assetManager.getContainer();

  if (!document.getElementById('json-image-selector-btn')) {
    const jsonButton = document.createElement('button');
    jsonButton.id = 'json-image-selector-btn';
    jsonButton.innerHTML = 'Select from JSON';
    jsonButton.style.cssText = 'margin: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
    jsonButton.addEventListener('click', () => {
      openJsonImageSelector();
    });

    const uploadSection = container.querySelector('.i_designer-am-file-uploader') || container.firstChild;
    if (uploadSection) {
      uploadSection.parentNode.insertBefore(jsonButton, uploadSection);
    }
  }
});

function updateLayerRecursively(component) {
  updateLayerName(component);
  if (component.components && component.components.length) {
    component.components.each(updateLayerRecursively);
  }
}

function updateLayerName(component) {
  if (!component) return;

  const layers = editor.Layers;
  if (!layers) return;

  const customId = component.getTrait('id')?.get('value');
  const idToShow = customId || component.getId();

  let baseName = component.getName();
  if (baseName.includes(' #')) baseName = baseName.split(' #')[0];

  const layerName = `${baseName} #${idToShow}`;

  try {
    layers.setName(component, layerName);
  } catch (err) {
  }
}

let pageManager = null;
let pageSetupManager = null;

editor.on("load", () => {
  const waitForPageManager = () => {
    pageManager = editor.Pages || editor.get?.("Pages") || editor.Plugins?.get?.("page-manager-component");

    if (!pageManager) {
      setTimeout(waitForPageManager, 300);
      return;
    }

    try {
      pageSetupManager = new PageSetupManager(editor);

      editor.PageSetupManager = pageSetupManager;
      window.pageSetupManager = pageSetupManager;

      setTimeout(() => {
        restorePageSetupFromTemplate(editor, pageSetupManager);
      }, 1000);

    } catch (e) {
      console.error("❌ PageSetupManager init failed:");
    }
  };
  waitForPageManager();
  console.groupEnd();
});

function restorePageSetupFromTemplate(editor, pageSetupManager) {
  let retryCount = 0;
  const maxRetries = 10;

  const attemptRestore = () => {
    retryCount++;

    if (typeof window.pageSetupSettings !== 'undefined' && window.pageSetupSettings !== null) {

      if (pageSetupManager && typeof pageSetupManager.importPageSettings === 'function') {
        if (window.pageSetupSettings.isInitialized &&
          window.pageSetupSettings.pageSettings &&
          window.pageSetupSettings.pageSettings.numberOfPages > 0) {

          pageSetupManager.importPageSettings(window.pageSetupSettings);

          setTimeout(() => {
            if (pageSetupManager.updatePageRule) {
              pageSetupManager.updatePageRule();
            }
            if (pageSetupManager.updateNavbarButton) {
              pageSetupManager.updateNavbarButton();
            }
            if (pageSetupManager.updateAddPageButton) {
              pageSetupManager.updateAddPageButton();
            }
            if (pageSetupManager.updateAllPageVisuals) {
              pageSetupManager.updateAllPageVisuals();
            }

          }, 500);

          return;
        } else {
          console.warn('⚠️ Invalid page settings structure');
        }
      }
    } else {
      if (retryCount < maxRetries) {
        setTimeout(attemptRestore, 300);
        return;
      }
    }

    const existingPages = editor.getWrapper().find('.page-container');

    if (existingPages && existingPages.length > 0) {
      pageSetupManager.isInitialized = true;

      if (!pageSetupManager.pageSettings) {
        pageSetupManager.pageSettings = {
          format: 'a4',
          orientation: 'portrait',
          numberOfPages: existingPages.length,
          width: 210,
          height: 297,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          backgroundColor: '#ffffff',
          pages: [],
          headerFooter: {
            headerEnabled: true,
            footerEnabled: true,
            headerHeight: 12.7,
            footerHeight: 12.7
          }
        };
      }

      pageSetupManager.pageSettings.numberOfPages = existingPages.length;
      pageSetupManager.pageSettings.pages = [];

      for (let i = 0; i < existingPages.length; i++) {
        pageSetupManager.pageSettings.pages.push({
          id: `page-${i + 1}`,
          name: `Page ${i + 1}`,
          pageNumber: i + 1,
          backgroundColor: '#ffffff',
          header: { enabled: true, content: '', height: 12.7, text: '' },
          footer: { enabled: true, content: '', height: 12.7, text: '' }
        });
      }

      if (pageSetupManager.updateNavbarButton) {
        pageSetupManager.updateNavbarButton();
      }
      if (pageSetupManager.updateAddPageButton) {
        pageSetupManager.updateAddPageButton();
      }
    } else {
      console.log('📋 No existing pages found - user needs to run initial setup');
    }
  };

  attemptRestore();
}

const pn = editor.Panels;
const panelViews = pn.addPanel({
  id: "views",
});

panelViews.get("buttons").add([
  {
    attributes: {
      title: "Open Code",
    },
    className: "fa fa-file-code-o",
    command: "open-code",
    togglable: false,
    id: "open-code",
  },
]);

editor.Panels.addPanel({ id: "devices-c" })
  .get("buttons")
  .add([
    {
      id: "exportPDF",
      attributes: { title: "Export PDF", id: "exportPDF" },
      className: "exportPDF fa fa-file-pdf-o",
    },
    {
      id: "savePage",
      attributes: { title: "Save Page", id: "savePage" },
      className: "fa fa-download",
    },
    {
      id: "importPage",
      attributes: { title: "Import Page", id: "importPage" },
      className: "fa fa-upload",
    },
    {
      id: "jsonFileUpload",
      attributes: { title: "Upload DataSource file", id: "jsonFileUpload" },
      className: "fa fa-file",
    },
    {
      id: "multiLanguage",
      attributes: { title: "Change Language", id: "multiLanguage" },
      className: "fa fa-language",
    },
    {
      id: "bulkpage",
      className: "fa fa-files-o",
      attributes: { title: "Bulk PDF Generation", id: "bulkpage" },
      command: "open-modal",
    },

    {
      id: "allTemplateList",
      attributes: { title: "View All Template", id: "allTemplateList" },
      className: "fa fa-list",
    },
    {
      id: "allLogs",
      attributes: { title: "View All Logs", id: "allLogs" },
      className: "fa fa-envelope",
    },
    {
      id: "excelCsvUpload",
      attributes: { title: "Upload Excel/CSV file", id: "excelCsvUpload" },
      className: "fa fa-file-excel-o",
    },
  ]);

var el = document.getElementById("exportPDF");
el.addEventListener("click", generatePrintDialog, true);
var save = document.getElementById("savePage");
save.addEventListener("click", savePage, true);

var importPage = document.getElementById("importPage");
importPage.addEventListener("click", importSinglePages, true);


var viewAllPage = document.getElementById("allTemplateList");
viewAllPage.addEventListener("click", viewAllTemplates, true);

var viewAllLogsP = document.getElementById("allLogs");
viewAllLogsP.addEventListener("click", viewAllLogsD, true);

function viewAllTemplates() {
  window.location.href = 'template.html';
}

function viewAllLogsD() {
  window.location.href = 'logs.html';
}

var excelscv = document.getElementById("excelCsvUpload");
excelscv.addEventListener("click", uploadExcelCsv, true);

let uploadedJsonFiles = [];

function getHtmlWithCurrentFormState(editor) {
  const baseHtml = editor.getHtml();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = baseHtml;

  const iframe = editor.Canvas && editor.Canvas.getFrameEl ? editor.Canvas.getFrameEl() : null;
  const liveDoc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
  if (!liveDoc || !liveDoc.body) return tempDiv.innerHTML;

  const selectors = [
    'input[type="checkbox"]',
    'input[type="radio"]',
    "textarea",
    "select",
  ];

  selectors.forEach((selector) => {
    const liveNodes = liveDoc.body.querySelectorAll(selector);
    const exportNodes = tempDiv.querySelectorAll(selector);
    const len = Math.min(liveNodes.length, exportNodes.length);

    for (let i = 0; i < len; i++) {
      const liveNode = liveNodes[i];
      const exportNode = exportNodes[i];

      if (liveNode.matches('input[type="checkbox"], input[type="radio"]')) {
        if (liveNode.checked) {
          exportNode.setAttribute("checked", "checked");
        } else {
          exportNode.removeAttribute("checked");
        }
      } else if (liveNode.matches("textarea")) {
        exportNode.textContent = liveNode.value || "";
      } else if (liveNode.matches("select")) {
        const liveOptions = liveNode.options || [];
        const exportOptions = exportNode.options || [];
        const optionLen = Math.min(liveOptions.length, exportOptions.length);
        for (let j = 0; j < optionLen; j++) {
          if (liveOptions[j].selected) {
            exportOptions[j].setAttribute("selected", "selected");
          } else {
            exportOptions[j].removeAttribute("selected");
          }
        }
      }
    }
  });

  const exportNodesById = new Map();
  tempDiv.querySelectorAll("[id]").forEach((node) => {
    if (node.id) {
      exportNodesById.set(node.id, node);
    }
  });

  liveDoc.body
    .querySelectorAll("[id][my-input-json], [id][data-template-text], [id][data-json-file-index]")
    .forEach((liveNode) => {
      const exportNode = exportNodesById.get(liveNode.id);
      if (!exportNode) return;

      [
        "my-input-json",
        "data-template-text",
        "data-json-file-index",
        "data-gjs-type",
        "data-i_designer-type",
      ].forEach((attrName) => {
        if (liveNode.hasAttribute(attrName)) {
          exportNode.setAttribute(attrName, liveNode.getAttribute(attrName) || "");
        }
      });

      if (liveNode.hasAttribute("data-template-text") || liveNode.hasAttribute("my-input-json")) {
        exportNode.innerHTML = liveNode.innerHTML;
      }
    });

  if (typeof window.syncFlowLayoutsFromLiveDoc === "function") {
    window.syncFlowLayoutsFromLiveDoc(tempDiv, liveDoc.body);
  }

  return tempDiv.innerHTML;
}

function restoreTemplateAwareTextForBulkExport(root) {
  if (!root || typeof root.querySelectorAll !== "function") return;

  root.querySelectorAll("[data-template-text]").forEach((node) => {
    const templateText = decodeDatasourceTemplateText(
      node.getAttribute("data-template-text") || ""
    );

    if (!hasDatasourceTemplatePlaceholders(templateText)) return;

    if (node.getAttribute("data-gjs-type") === "custom-heading") {
      node.textContent = templateText;
      return;
    }

    node.innerHTML = templateText;
  });
}

editor.Commands.add("open-modal", {
  run(editor) {
    const html = getHtmlWithCurrentFormState(editor);
    const css = editor.getCss();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const mappingMap = {};
    tempDiv.querySelectorAll("[my-input-json]").forEach(el => {
      const id = el.id || null;
      if (id) {
        const jsonPath = el.getAttribute("my-input-json");
        const pathWithoutLanguage = jsonPath.includes('.') ? jsonPath.split('.').slice(1).join('.') : jsonPath;
        mappingMap[id] = pathWithoutLanguage;
      }
    });

    const cssRegex = /#([\w-]+)\s*{[^}]*my-input-json\s*:\s*([^;]+);/g;
    let match;
    while ((match = cssRegex.exec(css)) !== null) {
      const id = match[1].trim();
      const value = match[2].trim();
      const pathWithoutLanguage = value.includes('.') ? value.split('.').slice(1).join('.') : value;
      mappingMap[id] = pathWithoutLanguage;
    }

    const inputJsonMappings = Object.keys(mappingMap).map(id => ({ [id]: mappingMap[id] }));

    let fileNameSaved = [];
    let passwordSaved = [];
    let passwordCustom = "";
    uploadedJsonFiles = loadStoredDatasourceFilesForBulkModal();

    editor.Modal.open({
      title: "Bulk Export",
      content: `
        <div style="height:100%; overflow:auto;">

          <button id="payload-preview-btn" style="margin-bottom:10px; display: none;">View Payload Mappings</button>
          <div id="payload-preview-container"></div>
          
          <h5>Upload DataDource Files</h5>
          <input type="file" 
                class="form-control popupinput2"
                accept="application/json,.xml,.json"
                multiple
                style="width:95%"  
                name="importJsonInputFile"
                id="json-upload-input">
          <div id="uploaded-json-list" style="margin-top:10px; font-size:0.9em; color:#333;"></div>

        </div>

                <hr>

                <h5>Export Type</h5>
                <select id="export-type-dropdown">
                  <option value="pdf">PDF</option>
                  <option value="html">HTML</option>
                </select>
                <hr>
                <!-- File Name Section -->
                <h5>File Name</h5>
                <select id="file-name-mode">
                  <option value="none">None</option>
                  <option value="json">JSON Keys</option>
                </select>

                <div id="file-name-key-section" style="display:none; margin-top:5px;">
                  <label>Select Language:</label>
                  <select id="file-name-language-dropdown"><option value="">--Select Language--</option></select>
                  <div id="file-name-key-dropdown-section" style="display:none; margin-top:5px;">
                    <label>Select JSON Key:</label>
                    <select id="file-name-key-dropdown"><option value="">--Select Key--</option></select>
                  </div>
                </div>

                <div id="file-name-index-section" style="display:none; margin-top:5px;">
                  <input type="text" id="file-name-index-input" placeholder="Enter indexes, e.g., 0,1" style="width:70%">
                  <button id="file-name-add-btn">Add</button>
                </div>

                <div id="file-name-saved" style="margin-top:5px; font-size:0.9em;"></div>

                <hr>

                <!-- Password Section -->
                <h5>Password</h5>
                <select id="password-mode">
                  <option value="none">None</option>
                  <option value="json">JSON Keys</option>
                  <option value="custom">Custom String</option>
                </select>

                <!-- Password JSON Keys -->
                <div id="password-key-section" style="display:none; margin-top:5px;">
                  <label>Select Language:</label>
                  <select id="password-language-dropdown"><option value="">--Select Language--</option></select>
                  <div id="password-key-dropdown-section" style="display:none; margin-top:5px;">
                    <label>Select JSON Key:</label>
                    <select id="password-key-dropdown"><option value="">--Select Key--</option></select>
                  </div>
                </div>

                <div id="password-index-section" style="display:none; margin-top:5px;">
                  <input type="text" id="password-index-input" placeholder="Enter indexes, e.g., 0,1" style="width:70%">
                  <button id="password-add-btn">Add</button>
                </div>

        <!-- Password Custom -->
        <div id="password-custom-section" style="display:none; margin-top:5px;">
          <input type="text" id="password-custom-input" placeholder="Enter custom password" style="width:70%">
          <button id="password-custom-add-btn">Add</button>
        </div>

                <div id="password-saved" style="margin-top:5px; font-size:0.9em;"></div>

                <button id="send-api-btn" style="margin-top:15px;">Send</button>
              </div>
              `,
      attributes: { class: "export-modal" }
    });

    document.getElementById("payload-preview-btn").addEventListener("click", () => {
      const container = document.getElementById("payload-preview-container");
      container.innerHTML = '';

      inputJsonMappings.forEach((mapping, index) => {
        const [id, jsonPath] = Object.entries(mapping)[0];
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:5px; background:#f5f5f5; margin:3px 0; border-radius:3px;";
        row.innerHTML = `
      <span><strong>ID:</strong> ${id} → <strong>Field:</strong> ${jsonPath}</span>
      <button class="remove-mapping-btn" data-index="${index}" style="background:#ff4444; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:3px;">Cancel</button>
    `;
        container.appendChild(row);
      });

      container.querySelectorAll(".remove-mapping-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          inputJsonMappings.splice(idx, 1);
          document.getElementById("payload-preview-btn").click();
        });
      });
    });

    function extractMetaDataKeys(obj, prefix = '') {
      let keys = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          let newKey;
          if (Array.isArray(obj)) {
            newKey = `${prefix}[${key}]`;
          } else {
            newKey = prefix ? `${prefix}.${key}` : key;
          }
          keys.push(newKey);
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(extractMetaDataKeys(obj[key], newKey));
          }
        }
      }
      return keys;
    }

    const fileNameLanguageDropdown = document.getElementById("file-name-language-dropdown");
    const passwordLanguageDropdown = document.getElementById("password-language-dropdown");

    document.getElementById("file-name-mode").addEventListener("change", e => {
      const val = e.target.value;
      document.getElementById("file-name-key-section").style.display = val === "json" ? "block" : "none";
      document.getElementById("file-name-key-dropdown-section").style.display = "none";
      document.getElementById("file-name-index-section").style.display = "none";
      fileNameSaved = [];
      renderSaved(fileNameSaved, "file-name-saved");
    });

    document.getElementById("password-mode").addEventListener("change", e => {
      const val = e.target.value;
      document.getElementById("password-key-section").style.display = val === "json" ? "block" : "none";
      document.getElementById("password-key-dropdown-section").style.display = "none";
      document.getElementById("password-index-section").style.display = "none";
      document.getElementById("password-custom-section").style.display = val === "custom" ? "block" : "none";
      passwordSaved = [];
      passwordCustom = "";
      renderSaved(passwordSaved, "password-saved");
    });

    document.getElementById("json-upload-input").addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const text = await file.text();
        let parsedData = null;
        const fileExtension = file.name.split(".").pop().toLowerCase();

        if (fileExtension === "xml") {
          try {
            const converted = await convertXmlToJson(text, file.name);
            parsedData = converted?.json || null;
          } catch (err) {
            console.warn(`Failed to parse XML for ${file.name}:`, err);
          }
        } else {
          try {
            parsedData = JSON.parse(text);
          } catch (err) {
            parsedData = null;
          }
        }

        uploadedJsonFiles.push({
          name: file.name,
          content: text,
          fromLocal: false,
          parsedData,
        });
      }
      renderUploadedJsonList();
      refreshLanguageDropdowns();
      e.target.value = "";
    });

    function normalizeBulkDatasourceFileName(fileName, fallbackName = "common_json.json") {
      const trimmedFileName = String(fileName || "").trim();
      if (!trimmedFileName) return fallbackName;

      return /\.(json|xml)$/i.test(trimmedFileName)
        ? trimmedFileName
        : `${trimmedFileName}.json`;
    }

    function isBulkModalJsonContent(content) {
      if (typeof content !== "string" || !content.trim()) return false;

      try {
        const parsed = JSON.parse(content);
        return typeof parsed === "object" && parsed !== null;
      } catch (err) {
        return false;
      }
    }

    function loadStoredDatasourceFilesForBulkModal() {
      const files = [];
      const seenStorageKeys = new Set();
      const storedFileNames =
        typeof getStoredJsonFileNames === "function" ? getStoredJsonFileNames() : [];

      storedFileNames.forEach((fileName) => {
        const normalizedName = normalizeBulkDatasourceFileName(fileName);
        const possibleKeys = [
          `common_json_${fileName}`,
          `common_json_${normalizedName}`,
        ];

        const storageKey = possibleKeys.find((key) => {
          return !seenStorageKeys.has(key) && localStorage.getItem(key) != null;
        });

        if (!storageKey) return;

        const content = localStorage.getItem(storageKey);
        if (!isBulkModalJsonContent(content)) return;

        files.push({
          name: normalizedName,
          content,
          fromLocal: true,
          storageKey,
          parsedData: JSON.parse(content),
        });
        seenStorageKeys.add(storageKey);
      });

      if (files.length) {
        return files;
      }

      const commonJsonContent = localStorage.getItem("common_json");
      if (!isBulkModalJsonContent(commonJsonContent)) {
        return files;
      }

      files.push({
        name: normalizeBulkDatasourceFileName(
          localStorage.getItem("common_json_file_name"),
          "common_json.json"
        ),
        content: commonJsonContent,
        fromLocal: true,
        storageKey: "common_json",
        parsedData: JSON.parse(commonJsonContent),
      });

      return files;
    }

    function getMergedUploadedJsonData() {
      const mergedJson = {};

      uploadedJsonFiles.forEach((f) => {
        try {
          const jsonData =
            typeof f.parsedData === "object" && f.parsedData !== null
              ? f.parsedData
              : JSON.parse(f.content);
          if (typeof jsonData === "object" && jsonData !== null) {
            Object.assign(mergedJson, jsonData);
          }
        } catch (e) {
          console.warn(`Failed to parse ${f.name}:`);
        }
      });

      return mergedJson;
    }

    function renderUploadedJsonList() {
      const container = document.getElementById("uploaded-json-list");
      container.innerHTML = "";
      uploadedJsonFiles.forEach((f, i) => {
        const row = document.createElement("div");
        row.style.cssText =
          "display:flex; justify-content:space-between; align-items:center; padding:4px; color:white; margin:2px 0; border-radius:3px;";
        row.innerHTML = `
          <span>${f.name}${f.fromLocal ? " (localStorage)" : ""}</span>
          <button data-index="${i}" style="background:#ff4444; color:white; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">✕</button>
        `;
        container.appendChild(row);
      });
      container.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          uploadedJsonFiles.splice(idx, 1);
          renderUploadedJsonList();
          refreshLanguageDropdowns();
        });
      });
    }

    function refreshLanguageDropdowns() {
      const fileNameLanguageDropdown = document.getElementById("file-name-language-dropdown");
      const passwordLanguageDropdown = document.getElementById("password-language-dropdown");
      fileNameLanguageDropdown.innerHTML = '<option value="">--Select Language--</option>';
      passwordLanguageDropdown.innerHTML = '<option value="">--Select Language--</option>';

      const mergedJson = getMergedUploadedJsonData();

      const topLevelKeys = Object.keys(mergedJson);
      topLevelKeys.forEach(k => {
        const opt1 = document.createElement("option"); opt1.value = k; opt1.textContent = k; fileNameLanguageDropdown.appendChild(opt1);
        const opt2 = document.createElement("option"); opt2.value = k; opt2.textContent = k; passwordLanguageDropdown.appendChild(opt2);
      });

      document.getElementById("file-name-key-dropdown-section").style.display = "none";
      document.getElementById("password-key-dropdown-section").style.display = "none";
      document.getElementById("file-name-index-section").style.display = "none";
      document.getElementById("password-index-section").style.display = "none";
    }

    fileNameLanguageDropdown.addEventListener("change", e => {
      const selectedLanguage = e.target.value;
      const fileNameKeyDropdown = document.getElementById("file-name-key-dropdown");
      const fileNameKeySection = document.getElementById("file-name-key-dropdown-section");

      if (selectedLanguage) {
        fileNameKeyDropdown.innerHTML = '<option value="">--Select Key--</option>';
        const mergedJson = getMergedUploadedJsonData();

        const languageData = mergedJson[selectedLanguage];
        if (languageData) {
          const keys = extractMetaDataKeys(languageData);
          keys.forEach(key => {
            const opt = document.createElement("option");
            opt.value = `${selectedLanguage}.${key}`;
            opt.textContent = key;
            fileNameKeyDropdown.appendChild(opt);
          });
        }
        fileNameKeySection.style.display = "block";
      } else {
        fileNameKeySection.style.display = "none";
      }
      document.getElementById("file-name-index-section").style.display = "none";
    });

    passwordLanguageDropdown.addEventListener("change", e => {
      const selectedLanguage = e.target.value;
      const passwordKeyDropdown = document.getElementById("password-key-dropdown");
      const passwordKeySection = document.getElementById("password-key-dropdown-section");

      if (selectedLanguage) {
        passwordKeyDropdown.innerHTML = '<option value="">--Select Key--</option>';
        const mergedJson = getMergedUploadedJsonData();

        const languageData = mergedJson[selectedLanguage];
        if (languageData) {
          const keys = extractMetaDataKeys(languageData);
          keys.forEach(key => {
            const opt = document.createElement("option");
            opt.value = `${selectedLanguage}.${key}`;
            opt.textContent = key;
            passwordKeyDropdown.appendChild(opt);
          });
        }
        passwordKeySection.style.display = "block";
      } else {
        passwordKeySection.style.display = "none";
      }
      document.getElementById("password-index-section").style.display = "none";
    });

    document.getElementById("file-name-key-dropdown").addEventListener("change", e => {
      if (e.target.value) {
        document.getElementById("file-name-index-section").style.display = "block";
      } else {
        document.getElementById("file-name-index-section").style.display = "none";
      }
    });

    document.getElementById("password-key-dropdown").addEventListener("change", e => {
      if (e.target.value) {
        document.getElementById("password-index-section").style.display = "block";
      } else {
        document.getElementById("password-index-section").style.display = "none";
      }
    });

    document.getElementById("file-name-add-btn").addEventListener("click", () => {
      const key = document.getElementById("file-name-key-dropdown").value;
      const idx = document.getElementById("file-name-index-input").value.trim();
      if (key) {
        fileNameSaved.push({ key, indexes: idx });
        renderSaved(fileNameSaved, "file-name-saved");
        document.getElementById("file-name-index-input").value = "";
        document.getElementById("file-name-key-dropdown").value = "";
        document.getElementById("file-name-index-section").style.display = "none";
      }
    });

    document.getElementById("password-add-btn").addEventListener("click", () => {
      const key = document.getElementById("password-key-dropdown").value;
      const idx = document.getElementById("password-index-input").value.trim();
      if (key) {
        passwordSaved.push({ key, indexes: idx });
        renderSaved(passwordSaved, "password-saved");
        document.getElementById("password-index-input").value = "";
        document.getElementById("password-key-dropdown").value = "";
        document.getElementById("password-index-section").style.display = "none";
      }
    });

    document.getElementById("password-custom-add-btn").addEventListener("click", () => {
      const val = document.getElementById("password-custom-input").value.trim();
      if (val) {
        passwordCustom = val;
        document.getElementById("password-saved").innerHTML = `Custom: ${val}`;
      }
    });

    function renderSaved(arr, containerId) {
      const div = document.getElementById(containerId);
      div.innerHTML = "";
      arr.forEach((o, idx) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:4px 0; margin:2px 0; gap:8px;";
        const label = document.createElement("span");
        label.textContent = `${o.key}${o.indexes ? `[${o.indexes}]` : ""}`;
        const delBtn = document.createElement("button");
        delBtn.textContent = "✕";
        delBtn.style.cssText = "background:#ff4444; color:white; border:none; padding:2px 8px; cursor:pointer; border-radius:3px; flex-shrink:0;";
        delBtn.addEventListener("click", () => {
          arr.splice(idx, 1);
          renderSaved(arr, containerId);
        });
        row.appendChild(label);
        row.appendChild(delBtn);
        div.appendChild(row);
      });
    }

    renderUploadedJsonList();
    refreshLanguageDropdowns();

    document.getElementById("send-api-btn").addEventListener("click", async () => {
      editor.Modal.close();

      let fileNamePayload;
      if (document.getElementById("file-name-mode").value === "json" && fileNameSaved.length) {
        fileNamePayload = fileNameSaved.map(o => {
          const keyWithoutLanguage = o.key.includes('.') ? o.key.split('.').slice(1).join('.') : o.key;
          return o.indexes ? `${keyWithoutLanguage}[${o.indexes}]` : keyWithoutLanguage;
        });
      }

      let passwordPayload;
      const pwMode = document.getElementById("password-mode").value;
      if (pwMode === "json" && passwordSaved.length) {
        passwordPayload = passwordSaved.map(o => {
          const keyWithoutLanguage = o.key.includes('.') ? o.key.split('.').slice(1).join('.') : o.key;
          return o.indexes ? `${keyWithoutLanguage}[${o.indexes}]` : keyWithoutLanguage;
        });
      } else if (pwMode === "custom") {
        const val = document.getElementById("password-custom-input").value.trim();
        if (val) passwordPayload = [val];
      }

      const finalPayload = [...inputJsonMappings];

      if (fileNamePayload) {
        finalPayload.push({ file_name: fileNamePayload });
      }

      if (passwordPayload) {
        finalPayload.push({ password: passwordPayload });
      }

      try {
        const message = await exportDesignAndSend(editor, finalPayload);
        alert("✅ " + message);
      } catch (err) {

        alert("❌ Error: " + err.message);
      }
    });
  }
});

function htmlWithCss(html, css) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

function getFilenameFromResponse(response, fallback = "export.pdf") {

  const contentDisp = response.headers.get("Content-Disposition");
  if (!contentDisp) return fallback;
  const match = contentDisp.match(/filename\*?=(?:UTF-8''|")?([^;\n"]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1].trim());
  }
  return fallback;
}

async function convertXmlToJson(xmlContent, fileName) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window.X2JS === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.min.js';
        script.onload = () => performConversion();
        script.onerror = () => reject(new Error('Failed to load X2JS library'));
        document.head.appendChild(script);
      } else {
        performConversion();
      }

      function normalizeXMLtoJSON(obj, parentKey = '') {
        if (obj === null || obj === undefined) return obj;

        if (Array.isArray(obj)) {
          return obj.map(item => normalizeXMLtoJSON(item, parentKey));
        }

        if (typeof obj !== 'object') {
          return obj;
        }

        const normalized = {};

        for (let key in obj) {
          if (!obj.hasOwnProperty(key)) continue;
          const value = obj[key];

          if (key === '__text' && Object.keys(obj).length === 1) {
            return value;
          }

          if (key === 'item' && Object.keys(obj).length === 1) {
            return normalizeXMLtoJSON(value, key);
          }

          if (value && typeof value === 'object') {
            if (value.item !== undefined) {
              normalized[key] = Array.isArray(value.item)
                ? value.item.map(i => normalizeXMLtoJSON(i, key))
                : [normalizeXMLtoJSON(value.item, key)];
            }

            else if (value.__text !== undefined && Object.keys(value).length === 1) {
              normalized[key] = value.__text;
            }
            else if (value.__text !== undefined) {
              const textValue = value.__text;
              if (!isNaN(textValue) && textValue !== '') {
                normalized[key] = Number(textValue);
              } else {
                normalized[key] = textValue;
              }
            }
            else if (Array.isArray(value)) {
              normalized[key] = value.map(i => normalizeXMLtoJSON(i, key));
            }
            else {
              normalized[key] = normalizeXMLtoJSON(value, key);
            }
          } else {
            if (typeof value === 'string' && !isNaN(value) && value !== '') {
              normalized[key] = Number(value);
            } else {
              normalized[key] = value;
            }
          }
        }

        return normalized;
      }

      function performConversion() {
        try {
          const x2js = new X2JS();
          const xmlDoc = new DOMParser().parseFromString(xmlContent, 'text/xml');
          const rawJson = x2js.xml2json(xmlDoc);
          const normalizedJson = normalizeXMLtoJSON(rawJson);
          resolve({
            json: normalizedJson,
            jsonString: JSON.stringify(normalizedJson)
          });
        } catch (err) {
          console.error(`❌ Error converting XML ${fileName}:`);
          reject(err);
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function exportDesignAndSend(editor, inputJsonMappings) {
  const exportType = document.getElementById("export-type-dropdown")?.value || "pdf";
const apiUrl =
  exportType === "pdf"
    ? `${API_BASE_URL}/uploadPdf`
    : `${API_BASE_URL}/uploadHtml`;


  const html = getHtmlWithCurrentFormState(editor);
  const css = editor.getCss();

  let finalHtml;
  const canvasResources = {
    styles: [
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
      "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
      "https://fonts.googleapis.com/icon?family=Material+Icons",
      "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
      "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
    ],
    scripts: [
      "https://code.jquery.com/jquery-3.3.1.slim.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
      "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
      "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
      "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
      "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
    ]
  };

  const externalStyles = canvasResources.styles
    .map((url) => `<link rel="stylesheet" href="${url}">`)
    .join("\n");

  const externalScripts = canvasResources.scripts
    .map((url) => `<script src="${url}" defer></script>`)
    .join("\n");

  if (exportType === "pdf") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    restoreTemplateAwareTextForBulkExport(tempDiv);

    // Hide editor-only page-break markers in Bulk Export output.
    tempDiv.querySelectorAll('.page-break').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });

    const pageContainers = tempDiv.querySelectorAll(".page-container");
    const idsToClean = [];

    pageContainers.forEach((el) => {
      if (el.id) idsToClean.push(el.id);
    });

    let cleanedCss = css;

    idsToClean.forEach((id) => {
      const idRegex = new RegExp(`(#${id}\\s*{[^}]*?)margin[^;]*;`, "g");
      cleanedCss = cleanedCss.replace(idRegex, "$1");
    });

    finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          ${externalScripts}
          <style>${cleanedCss}</style>
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;
  } else {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    restoreTemplateAwareTextForBulkExport(tempDiv);

    // Hide editor-only page-break markers in Bulk Export output.
    tempDiv.querySelectorAll('.page-break').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });

    finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          ${externalScripts}
          <style>${css}</style>
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;
  }

  const formData = new FormData();
  formData.append("file", new Blob([finalHtml], { type: "text/html" }), "template.html");

  for (let idx = 0; idx < uploadedJsonFiles.length; idx++) {
    const f = uploadedJsonFiles[idx];
    const fileExtension = f.name.split(".").pop().toLowerCase();

    let jsonContent = f.content;
    let jsonFileName = f.name;

    if (fileExtension === "xml") {
      try {
        const converted = await convertXmlToJson(f.content, f.name);
        jsonContent = converted.jsonString;
        jsonFileName = f.name.replace(/\.xml$/i, ".json");
      } catch (err) {
        alert(`Failed to convert XML file: ${f.name}`);
        throw err;
      }
    }

    formData.append(
      "jsonFile",
      new Blob([jsonContent], { type: "application/json" }),
      jsonFileName
    );
  }

  formData.append("payload", JSON.stringify(inputJsonMappings));

  let overlay = document.createElement("div");
  overlay.id = "pdf-loading-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    flexDirection: "column",
    gap: "12px",
  });

  const spinner = document.createElement("div");
  Object.assign(spinner.style, {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "6px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    animation: "spin 1s linear infinite",
  });

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @keyframes spin { from { transform: rotate(0deg);} to {transform: rotate(360deg);} }
  `;
  document.head.appendChild(styleTag);

  const overlayText = document.createElement("div");
  overlayText.style.fontSize = "18px";
  overlayText.innerText =
    exportType === "pdf" ? "Generating Bulk PDF..." : "Generating Bulk HTML...";

  overlay.appendChild(spinner);
  overlay.appendChild(overlayText);
  document.body.appendChild(overlay);

  try {
    const response = await fetch(apiUrl, { method: "POST", body: formData });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const blob = await response.blob();
    const filename = getFilenameFromResponse(response, "export.zip");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return "Export successful!";
  } catch (err) {
    alert("Failed to export. Check console.");
    throw err;
  } finally {
    if (overlay) overlay.remove();
    if (styleTag) styleTag.remove();
  }
}

async function generatePrintDialog() {
const apiUrl = `${API_BASE_URL}/uploadHtmlToPdf?file`;

  const getCurrentPdfExportSnapshot = () => {
    try {
      updateComponentsWithNewJson(editor);
    } catch (err) {
      console.warn("PDF export state sync failed", err);
    }

    return {
      html: getHtmlWithCurrentFormState(editor),
    };
  };

  const modalStyles = `
    <style>
    #pdf-preview-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #pdf-preview-content {
      background: #fff;
      width: 90%;
      height: 90%;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
    }
    #pdf-preview-header {
      padding: 15px 20px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f5f5f5;
    }
    #pdf-preview-controls {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    #pdf-preview-iframe {
      flex: 1;
      border: none;
     background: #ffffff;
    }
    #pdf-preview-footer {
      padding: 15px 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #f5f5f5;
    }
    .pdf-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .pdf-btn-primary {
      background: #007bff;
      color: white;
    }
    .pdf-btn-primary:hover {
      background: #0056b3;
    }
    .pdf-btn-secondary {
      background: #6c757d;
      color: white;
    }
    .pdf-btn-secondary:hover {
      background: #545b62;
    }
    #page-selection-input {
      padding: 5px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 200px;
    }
    #page-selection-mode {
      padding: 5px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    </style>
  `;

  const initialSnapshot = getCurrentPdfExportSnapshot();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = initialSnapshot.html;

  const allPageContainers = Array.from(tempDiv.querySelectorAll(".page-container"));
  const totalPages = allPageContainers.length;

  const modal = document.createElement("div");
  modal.id = "pdf-preview-modal";
  modal.innerHTML = `
    ${modalStyles}
    <div id="pdf-preview-content">
      <div id="pdf-preview-header">
        <div>
          <h3 style="margin: 0;">PDF Preview</h3>
          <small id="pdf-total-pages" style="color: #666;">Total Pages: ${totalPages}</small>
        </div>
        <div id="pdf-preview-controls">
          <label>
            Pages:
            <select id="page-selection-mode">
              <option value="all">All Pages</option>
              <option value="odd">Odd Pages</option>
              <option value="even">Even Pages</option>
              <option value="custom">Custom Pages</option>
            </select>
          </label>
          <input 
            type="text" 
            id="page-selection-input" 
            placeholder="e.g., 1,3,5-7" 
            style="display: none;"
          />
        </div>
      </div>
      <iframe id="pdf-preview-iframe"></iframe>
      <div id="pdf-preview-footer">
        <button class="pdf-btn pdf-btn-secondary" id="pdf-cancel-btn">Cancel</button>
        <button class="pdf-btn pdf-btn-primary" id="pdf-generate-btn">Generate PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  let pageCountListener = function (event) {
    if (event.data && event.data.type === 'pageCountUpdate') {
      const totalPages = event.data.totalPages;
      const modal = document.getElementById('pdf-preview-modal');
      if (modal) {
        const titleElement = document.getElementById('pdf-total-pages');
        if (titleElement) {
          titleElement.textContent = 'Total Pages: ' + totalPages;
        }
      }
    }
  };

  window.addEventListener('message', pageCountListener);

  const originalRemove = modal.remove;
  modal.remove = function () {
    window.removeEventListener('message', pageCountListener);
    originalRemove.call(this);
  };

  const iframe = modal.querySelector("#pdf-preview-iframe");
  const modeSelect = modal.querySelector("#page-selection-mode");
  const customInput = modal.querySelector("#page-selection-input");
  const generateBtn = modal.querySelector("#pdf-generate-btn");
  const cancelBtn = modal.querySelector("#pdf-cancel-btn");

  async function expandSubreports(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const subreportSelectors = [
      '.subreport-container',
      '[data-gjs-type="subreport"]',
      '.subreport-block'
    ];

    const subreports = [];
    subreportSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => subreports.push(el));
    });

    if (subreports.length === 0) {
      return { html: htmlString, styles: [] };
    }

    const allSubreportStyles = [];

    for (let i = 0; i < subreports.length; i++) {
      const subreportElement = subreports[i];
      const getAttr = (name) => {
        const variations = [name, name.toLowerCase(), name.replace(/([A-Z])/g, '-$1').toLowerCase()];
        for (const variant of variations) {
          const val = subreportElement.getAttribute(variant);
          if (val !== null && val !== undefined && val !== '') {
            return val;
          }
        }
        return null;
      };

      const filePath = getAttr('filePath') || getAttr('filepath');

      if (!filePath) {
        continue;
      }

      const filterColumn = getAttr('filterColumn') || getAttr('filtercolumn');
      const filterValue = getAttr('filterValue') || getAttr('filtervalue');
      const sharePageNumber = getAttr('sharePageNumber') !== 'false';

      try {
        const apiUrl = `${API_BASE_URL}/getTemplate/${filePath}`;

        const response = await fetch(apiUrl, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const templateData = await response.json();
        let htmlContent = templateData.EditableHtml;

        if (!htmlContent) {
          throw new Error("No EditableHtml in template");
        }

        const tempDoc = parser.parseFromString(htmlContent, 'text/html');
        const styleElements = tempDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleElements.forEach((styleEl, idx) => {
          const styleContent = styleEl.outerHTML;
          allSubreportStyles.push(styleContent);
        });

        const hasPageContainers = tempDoc.querySelectorAll('.page-container').length > 0;
        const bodyContent = tempDoc.querySelector('body');
        let contentToInsert = bodyContent ? bodyContent.innerHTML : htmlContent;

        if (filterColumn && filterValue) {
          contentToInsert = applyTableFilter(contentToInsert, filterColumn, filterValue);
        }

        if (hasPageContainers) {
          const subreportDoc = parser.parseFromString(contentToInsert, 'text/html');
          const pageContainers = subreportDoc.querySelectorAll('.page-container');

          pageContainers.forEach((page, idx) => {
            page.setAttribute('data-subreport-page', 'true');
            page.setAttribute('data-subreport-id', filePath);
            page.setAttribute('data-share-page-number', sharePageNumber);
            page.setAttribute('data-subreport-page-index', idx);
          });

          contentToInsert = subreportDoc.body.innerHTML;
          let currentPage = subreportElement.closest('.page-container');

          if (currentPage) {
            const replacementHTML = `
                        <div class="subreport-page-marker" 
                             data-subreport-id="${filePath}"
                             data-share-page-number="${sharePageNumber}"
                             style="display:none;">
                        </div>
                    `;
            subreportElement.outerHTML = replacementHTML;

            const tempContainer = doc.createElement('div');
            tempContainer.innerHTML = contentToInsert;

            let insertAfter = currentPage;
            Array.from(tempContainer.querySelectorAll('.page-container')).forEach(subPage => {
              insertAfter.insertAdjacentElement('afterend', subPage);
              insertAfter = subPage;
            });

          } else {
            subreportElement.outerHTML = `<div class="expanded-subreport" data-subreport-id="${filePath}">${contentToInsert}</div>`;
          }
        } else {

          const replacementHTML = `<div class="expanded-subreport" data-subreport-id="${filePath}" data-share-page-number="${sharePageNumber}">${contentToInsert}</div>`;
          subreportElement.outerHTML = replacementHTML;
        }

      } catch (error) {
        console.error(`❌ [EXPAND] Failed to fetch subreport ${filePath}:`);
        subreportElement.outerHTML = `<div class="subreport-error" style="color:red;padding:10px;border:1px solid red;">⚠️ Failed to load subreport: ${error.message}</div>`;
      }
    }
    return { html: doc.body.innerHTML, styles: allSubreportStyles };
  }

  function applyTableFilter(htmlText, columnName, filterValue) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const table = doc.querySelector('.json-table-container table, .table, table');

    if (!table) {
      return htmlText;
    }

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) {
      return htmlText;
    }

    const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
    const columnIndex = headers.indexOf(columnName);
    if (columnIndex === -1) {
      return htmlText;
    }

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let removedCount = 0;
    rows.forEach((row, idx) => {
      const cells = Array.from(row.querySelectorAll('td'));
      const cellValue = cells[columnIndex]?.textContent.toLowerCase() || '';
      const matches = cellValue.includes(filterValue.toLowerCase());

      if (!matches) {
        row.remove();
        removedCount++;
      }
    });
    return doc.body.innerHTML;
  }

  // Function to filter pages and generate HTML
  async function getFilteredHtml(mode, customPages = "") {
    const { html: currentHtml } = getCurrentPdfExportSnapshot();
    const clone = document.createElement("div");
    clone.innerHTML = currentHtml;
    const { html: expandedHtml, styles: subreportStyles } = await expandSubreports(clone.innerHTML);

    clone.innerHTML = expandedHtml;
    const allContainers = Array.from(clone.querySelectorAll(".page-container"));
    let pagesToKeep = [];

    if (mode === "all") {
      pagesToKeep = allContainers.map((_, i) => i);
    } else if (mode === "odd") {
      pagesToKeep = allContainers.map((_, i) => i).filter(i => (i + 1) % 2 === 1);
    } else if (mode === "even") {
      pagesToKeep = allContainers.map((_, i) => i).filter(i => (i + 1) % 2 === 0);
    } else if (mode === "custom") {
      const ranges = customPages.split(",").map(s => s.trim());
      ranges.forEach(range => {
        if (range.includes("-")) {
          const [start, end] = range.split("-").map(n => parseInt(n.trim()));
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= allContainers.length) pagesToKeep.push(i - 1);
          }
        } else {
          const page = parseInt(range);
          if (page >= 1 && page <= allContainers.length) pagesToKeep.push(page - 1);
        }
      });
      pagesToKeep = [...new Set(pagesToKeep)].sort((a, b) => a - b);
    }

    allContainers.forEach((container, index) => {
      if (!pagesToKeep.includes(index)) {
        container.remove();
      }
    });

    return { html: clone.innerHTML, styles: subreportStyles };
  }

  function buildExportDatasourceBootstrapScript() {
    const storedFileNames = getStoredJsonFileNames();
    const fileEntries = [];

    storedFileNames.forEach((fileName) => {
      const rawJson =
        localStorage.getItem(`common_json_${fileName}`) ||
        localStorage.getItem(`common_json_${fileName}.json`);

      if (!rawJson) return;

      try {
        fileEntries.push({
          name: fileName,
          data: JSON.parse(rawJson),
        });
      } catch (err) {
        console.warn(`Failed to serialize datasource file: ${fileName}`, err);
      }
    });

    let baseJson = getJsonDataByFileIndex("0");
    if (baseJson == null && fileEntries.length) {
      baseJson = fileEntries[0].data;
    }

    const defaultFileName = localStorage.getItem("common_json_file_name") || "";
    const payload = {
      defaultFileName,
      fileNames: fileEntries.map((entry) => entry.name),
      files: fileEntries,
      baseJson,
    };

    const escapedPayload = JSON.stringify(payload).replace(/<\//g, "<\\/");

    return `
<script>
(function() {
  var exportDatasourcePayload = ${escapedPayload};
  var exportedJsonData = [];

  if (exportDatasourcePayload.baseJson != null) {
    exportedJsonData.push(exportDatasourcePayload.baseJson);
  }

  exportDatasourcePayload.files.forEach(function(entry) {
    exportedJsonData.push(entry.data);
  });

  window.__iDesignerExportDataSources = exportDatasourcePayload;
  window.project_type2 = "downloadedJsonType";
  window.jsonData1 = exportedJsonData;
  var project_type2 = window.project_type2;
  var jsonData1 = window.jsonData1;

  try {
    if (exportDatasourcePayload.baseJson != null) {
      localStorage.setItem("common_json", JSON.stringify(exportDatasourcePayload.baseJson));
    } else {
      localStorage.removeItem("common_json");
    }

    if (exportDatasourcePayload.defaultFileName) {
      localStorage.setItem("common_json_file_name", exportDatasourcePayload.defaultFileName);
    } else {
      localStorage.removeItem("common_json_file_name");
    }

    if (exportDatasourcePayload.fileNames.length) {
      localStorage.setItem("common_json_files", exportDatasourcePayload.fileNames.join(", "));
    } else {
      localStorage.removeItem("common_json_files");
    }

    exportDatasourcePayload.files.forEach(function(entry) {
      localStorage.setItem("common_json_" + entry.name, JSON.stringify(entry.data));
    });
  } catch (storageErr) {
    console.warn("Export datasource bootstrap failed:", storageErr);
  }
})();
</script>`;
  }

  function buildFinalHtml(htmlContent, cssOrStyles, maybeSubreportStyles) {

    let mainCSS;
    let subreportStyles = [];

    if (typeof cssOrStyles === 'string') {
      mainCSS = cssOrStyles;
      if (Array.isArray(maybeSubreportStyles)) {
        subreportStyles = maybeSubreportStyles;
      }
    } else {
      mainCSS = editor.getCss();
      if (Array.isArray(cssOrStyles)) {
        subreportStyles = cssOrStyles;
      }
    }

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = htmlContent;
    const remainingPageContainers = tempContainer.querySelectorAll(".page-container");
    const idsToClean = Array.from(remainingPageContainers)
      .filter(el => el.id)
      .map(el => el.id);

    idsToClean.forEach(id => {
      const marginRegex = new RegExp(`(#${id}\\s*{[^}]*?)margin[^;]*;`, "g");
      mainCSS = mainCSS.replace(marginRegex, "$1");

      const boxShadowRegex = new RegExp(`(#${id}\\s*{[^}]*?)box-shadow[^;]*;`, "g");
      mainCSS = mainCSS.replace(boxShadowRegex, "$1");
    });

    const subStyles = Array.isArray(subreportStyles) && subreportStyles.length
      ? subreportStyles.join('\n')
      : '';

    const combinedStyles = `
  <style>${mainCSS}</style>
  ${subStyles}
`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(tempContainer.innerHTML, 'text/html');
    const allPages = Array.from(doc.querySelectorAll('.page-container'));
    const hasSubreportPages = allPages.some(page =>
      page.getAttribute('data-subreport-page') === 'true'
    );
    const hasSubreportMarkers = doc.querySelector('.subreport-page-marker') !== null;

    let finalBodyHTML;
    let totalPages;

    if (hasSubreportPages || hasSubreportMarkers) {
      const mainPages = [];
      const subreportPageGroups = new Map();

      allPages.forEach((page, idx) => {
        if (page.getAttribute('data-subreport-page') === 'true') {
          const subreportId = page.getAttribute('data-subreport-id');
          if (!subreportPageGroups.has(subreportId)) {
            subreportPageGroups.set(subreportId, []);
          }
          subreportPageGroups.get(subreportId).push(page);
        } else {
          mainPages.push(page);
        }
      });

      const reorganizedPages = [];
      mainPages.forEach((mainPage, idx) => {
        reorganizedPages.push(mainPage);

        const marker = mainPage.querySelector('.subreport-page-marker');
        if (marker) {
          const subreportId = marker.getAttribute('data-subreport-id');
          const sharePageNumber = marker.getAttribute('data-share-page-number') !== 'false';

          const subreportPages = subreportPageGroups.get(subreportId) || [];
          subreportPages.forEach(subPage => {
            subPage.setAttribute('data-skip-page-number', !sharePageNumber);
            reorganizedPages.push(subPage);
          });

          marker.remove();
        }
      });

      doc.body.innerHTML = '';
      reorganizedPages.forEach(page => doc.body.appendChild(page));

      totalPages = reorganizedPages.length;
    } else {
      totalPages = allPages.length > 0 ? allPages.length : 1;
    }

    finalBodyHTML = doc.body.innerHTML;

    const paginationScript = `
<script>
  
  if (window.parent) {
    window.parent.postMessage({
      type: 'pageCountUpdate',
      totalPages: ${totalPages}
    }, '*');
  }
  
  const chartSelector = '[data-i_designer-type="custom_line_chart"], [data-gjs-type="custom_line_chart"], .highchart-live-areaspline';

  function areChartsReady() {
    const charts = Array.from(document.querySelectorAll(chartSelector));
    if (!charts.length) return true;

    return charts.every((chart) => {
      const text = (chart.textContent || '').trim();
      if (/Failed to load chart library|Chart could not be rendered/i.test(text)) {
        return true;
      }

      if (chart.getAttribute('data-chart-ready') === 'true') {
        return true;
      }

      return Boolean(
        chart.querySelector('svg, canvas, .highcharts-container, .highcharts-root')
      );
    });
  }

  function waitForChartsBeforePagination(timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();

      function check() {
        if (areChartsReady()) {
          resolve(true);
          return;
        }

        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }

        setTimeout(check, 250);
      }

      check();
    });
  }

  window.addEventListener('load', function() {
    waitForChartsBeforePagination(15000).then(function() {
      setTimeout(function() {
        paginatePreview();
      }, 250);
    });
  });
  function findDecorationsInDocument() {
    const allWatermarks = document.querySelectorAll('.watermark, [data-watermark]');
    const allPageNumbers = document.querySelectorAll('.page-number, [data-page-number]');

    return {
      watermark: allWatermarks.length > 0 ? allWatermarks[0] : null,
      pageNumber: allPageNumbers.length > 0 ? allPageNumbers[0] : null
    };
  }

 function paginatePreview() {
  const documentDecorations = findDecorationsInDocument();
const pageContainers = document.querySelectorAll('.page-container');

if (pageContainers.length === 0) {
  if (window.parent) {
    window.parent.postMessage({
      type: 'pageCountUpdate',
      totalPages: 1
    }, '*');
  }
  return;
}

const firstPage = pageContainers[0];
const firstPageContent = firstPage.querySelector('.page-content');

if (!firstPageContent) {
  if (window.parent) {
    window.parent.postMessage({
      type: 'pageCountUpdate',
      totalPages: pageContainers.length
    }, '*');
  }
  return;
}

const pageSettings = extractPageSettings(firstPage);
  if (!pageSettings.watermark && documentDecorations.watermark) {
  pageSettings.watermark = {
    content: documentDecorations.watermark.textContent || documentDecorations.watermark.getAttribute('data-watermark'),
    style: documentDecorations.watermark.style.cssText,
    element: documentDecorations.watermark.cloneNode(true)
  };
}

if (!pageSettings.pageNumberFormat && documentDecorations.pageNumber) {
  const text = documentDecorations.pageNumber.textContent.trim();
  const format = documentDecorations.pageNumber.getAttribute('data-format') || text.replace(/\d+/g, '{n}') || 'Page {n}';
  
  pageSettings.pageNumberFormat = format;
  pageSettings.pageNumberPosition = {
    style: documentDecorations.pageNumber.style.cssText,
    classList: Array.from(documentDecorations.pageNumber.classList),
    element: documentDecorations.pageNumber.cloneNode(true)
  };
}

const pageHeight = parseInt(window.getComputedStyle(firstPageContent).height) || 1027;

const allNewPages = [];
let globalPageNumber = 1;

for (let i = 0; i < pageContainers.length; i++) {
  const pageContainer = pageContainers[i];
  const mainContent = pageContainer.querySelector('.main-content-area');

  const skipPageNumber = pageContainer.getAttribute('data-skip-page-number') === 'true';

  if (!mainContent) {
    if (!skipPageNumber) {
      applyPageSettings(pageContainer, pageSettings, globalPageNumber);
      globalPageNumber++;
    } else {
      applyPageSettings(pageContainer, pageSettings, null);
    }
    allNewPages.push(pageContainer.outerHTML);
    continue;
  }

  const headerWrapper = pageContainer.querySelector('.header-wrapper');
  const footerWrapper = pageContainer.querySelector('.footer-wrapper');
  const headerHeight = headerWrapper ? headerWrapper.offsetHeight : 0;
  const footerHeight = footerWrapper ? footerWrapper.offsetHeight : 0;
  const availableHeight = pageHeight - headerHeight - footerHeight - 40;
  const contentHeight = mainContent.scrollHeight;

  if (contentHeight <= availableHeight) {
    if (!skipPageNumber) {
      applyPageSettings(pageContainer, pageSettings, globalPageNumber);
      globalPageNumber++;
    } else {
      applyPageSettings(pageContainer, pageSettings, null);
    }

    allNewPages.push(pageContainer.outerHTML);
    continue;
  }

  const tableRows = extractTableRows(mainContent);
  if (tableRows.length > 0) {
    const contentAboveTable = [];
    const contentBelowTable = [];
    const firstTable = mainContent.querySelector('table');
    if (firstTable) {
      const tableContainer = firstTable.closest('.json-table-container') || firstTable.closest('.json-table-wrapper') || firstTable.parentElement;
      let passedTable = false;
      for (let child of mainContent.children) {
        if (child === tableContainer || (tableContainer && tableContainer.contains(child))) {
          passedTable = true;
          continue;
        }
        if (!passedTable) {
          contentAboveTable.push(child.cloneNode(true));
        } else {
          contentBelowTable.push(child.cloneNode(true));
        }
      }
    }
    const newPages = splitTableIntoPages(
      pageContainer,
      tableRows,
      availableHeight,
      headerWrapper,
      footerWrapper,
      pageSettings,
      globalPageNumber,
      skipPageNumber,
      contentAboveTable,
      contentBelowTable
    );

    allNewPages.push(...newPages);

    if (!skipPageNumber) {
      globalPageNumber += newPages.length;
    }
 } else {
    const children = Array.from(mainContent.children);

    const newPages = splitIntoPages(
      pageContainer,
      children,
      availableHeight,
      headerWrapper,
      footerWrapper,
      pageSettings,
      globalPageNumber,
      skipPageNumber
    );

    allNewPages.push(...newPages);

    if (!skipPageNumber) {
      globalPageNumber += newPages.length;
    }
}
}

document.body.innerHTML = '';
allNewPages.forEach(html => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);
});

if (window.parent) {
  window.parent.postMessage({
    type: 'pageCountUpdate',
    totalPages: allNewPages.length
  }, '*');
}
}


function extractPageSettings(pageContainer) {
    const settings = {
      backgroundColor: window.getComputedStyle(pageContainer).backgroundColor || '#ffffff',
      margin: window.getComputedStyle(pageContainer).margin || '0',
      padding: window.getComputedStyle(pageContainer).padding || '0',
      watermark: null,
      pageNumberFormat: null,
      pageNumberPosition: null,
      containerStyle: pageContainer.style.cssText,
      containerClasses: Array.from(pageContainer.classList)
    };

    const watermark = pageContainer.querySelector('.watermark, [data-watermark]');
    if (watermark) {
      settings.watermark = {
        content: watermark.textContent || watermark.getAttribute('data-watermark'),
        style: watermark.style.cssText,
        element: watermark.cloneNode(true)
      };
    } else {
    }

    const pageNumber = pageContainer.querySelector('.page-number, [data-page-number]');
    if (pageNumber) {
      let format = pageNumber.getAttribute('data-format');
      if (!format) {
        const text = pageNumber.textContent.trim();
        format = text.replace(/\d+/g, '{n}');
        if (!format.includes('{n}')) {
          format = 'Page {n}'; // Default fallback
        }
      }
      
      settings.pageNumberFormat = format;
      settings.pageNumberPosition = {
        style: pageNumber.style.cssText,
        classList: Array.from(pageNumber.classList),
        element: pageNumber.cloneNode(true)
      };

    } else {
    }
    return settings;
  }

function applyPageSettings(pageContainer, settings, pageNumber) {
    if (settings.containerStyle) {
      pageContainer.style.cssText = settings.containerStyle;
    }
    
    if (settings.backgroundColor) {
      pageContainer.style.backgroundColor = settings.backgroundColor;
    }

    if (settings.margin) {
      pageContainer.style.margin = settings.margin;
    }

    if (settings.padding) {
      pageContainer.style.padding = settings.padding;
    }

    if (settings.watermark && settings.watermark.element) {
      let existing = pageContainer.querySelector('.watermark');
      if (!existing) {
        const watermarkEl = settings.watermark.element.cloneNode(true);
        pageContainer.appendChild(watermarkEl);
      }
    }

    if (settings.pageNumberFormat && pageNumber !== null && settings.pageNumberPosition && settings.pageNumberPosition.element) {
      const numberText = settings.pageNumberFormat.replace('{n}', pageNumber);
      let pageNumEl = pageContainer.querySelector('.page-number, [data-page-number]');
  
      if (!pageNumEl) {
        pageNumEl = settings.pageNumberPosition.element.cloneNode(true);
        pageContainer.appendChild(pageNumEl);
      }
  
      pageNumEl.textContent = numberText;
      pageNumEl.setAttribute('data-page-number', pageNumber);
    } else if (settings.pageNumberFormat && pageNumber === null) {
      const pageNumEl = pageContainer.querySelector('.page-number, [data-page-number]');
      if (pageNumEl) {
        pageNumEl.remove();
      }
    }
  }

  function extractTableRows(mainContent) {
    const rows = [];
    const subreports = mainContent.querySelectorAll('.subreport-block, .subreport-container, .expanded-subreport');

    if (subreports.length > 0) {
      subreports.forEach(function(subreport) {
        const tables = subreport.querySelectorAll('table');
    
        tables.forEach(function(table) {
          const tbody = table.querySelector('tbody');
          if (tbody) {
            const tableRows = Array.from(tbody.querySelectorAll('tr'));
            const tableStructure = {
              table: table.cloneNode(false),
              thead: table.querySelector('thead') ? table.querySelector('thead').cloneNode(true) : null,
              tfoot: table.querySelector('tfoot') ? table.querySelector('tfoot').cloneNode(true) : null,
              rows: tableRows
            };
            rows.push(tableStructure);
          }
        });
      });
    } else {
      const tables = mainContent.querySelectorAll('table');
      tables.forEach(function(table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const tableRows = Array.from(tbody.querySelectorAll('tr'));
          const tableStructure = {
            table: table.cloneNode(false),
            thead: table.querySelector('thead') ? table.querySelector('thead').cloneNode(true) : null,
            tfoot: table.querySelector('tfoot') ? table.querySelector('tfoot').cloneNode(true) : null,
            rows: tableRows
          };
          rows.push(tableStructure);
        }
      });
    }

    return rows;
  }

function splitTableIntoPages(templatePage, tableStructures, availableHeight, headerWrapper, footerWrapper, pageSettings, startPageNumber, skipPageNumber, contentAboveTable, contentBelowTable) {
    const pages = [];
    let currentPageNumber = startPageNumber;
    contentAboveTable = contentAboveTable || [];
    contentBelowTable = contentBelowTable || [];

    tableStructures.forEach(function(tableStructure, structureIndex) {
      const rows = tableStructure.rows;
      const tableTemplate = tableStructure.table;
      const thead = tableStructure.thead;
      const tfoot = tableStructure.tfoot;
      const theadHeight = thead ? thead.offsetHeight : 0;
      const tfootHeight = tfoot ? tfoot.offsetHeight : 0;
      const tableOverhead = theadHeight + tfootHeight;
      let currentPage = templatePage.cloneNode(true);
      let mainContent = currentPage.querySelector('.main-content-area');
      mainContent.innerHTML = '';
      if (structureIndex === 0 && contentAboveTable.length > 0) {
        contentAboveTable.forEach(function(cloned) {
          mainContent.appendChild(cloned.cloneNode(true));
        });
      }
  
      let currentTable = tableTemplate.cloneNode(false);
      if (thead) currentTable.appendChild(thead.cloneNode(true));
  
      let currentTbody = document.createElement('tbody');
      currentTable.appendChild(currentTbody);
  
      let currentHeight = tableOverhead;
  
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowHeight = row.offsetHeight || 40;
    
        if (currentHeight + rowHeight > availableHeight && currentHeight > tableOverhead) {
          if (tfoot) currentTable.appendChild(tfoot.cloneNode(true));
          mainContent.appendChild(currentTable);
      
          if (!skipPageNumber) {
            applyPageSettings(currentPage, pageSettings, currentPageNumber);
            currentPageNumber++;
          } else {
            applyPageSettings(currentPage, pageSettings, null);
          }
          
          pages.push(currentPage.outerHTML);

          currentPage = templatePage.cloneNode(true);
          mainContent = currentPage.querySelector('.main-content-area');
          mainContent.innerHTML = '';
      
          currentTable = tableTemplate.cloneNode(false);
          if (thead) currentTable.appendChild(thead.cloneNode(true));
          currentTbody = document.createElement('tbody');
          currentTable.appendChild(currentTbody);
      
          currentHeight = tableOverhead;
        }
    
        currentTbody.appendChild(row.cloneNode(true));
        currentHeight += rowHeight;
      }
  
      if (tfoot) currentTable.appendChild(tfoot.cloneNode(true));
      mainContent.appendChild(currentTable);

      const isLastStructure = structureIndex === tableStructures.length - 1;
      if (isLastStructure && contentBelowTable.length > 0) {
        contentBelowTable.forEach(function(cloned) {
          mainContent.appendChild(cloned.cloneNode(true));
        });
      }
  
      if (!skipPageNumber) {
        applyPageSettings(currentPage, pageSettings, currentPageNumber);
        currentPageNumber++;
      } else {
        applyPageSettings(currentPage, pageSettings, null);
      }
      
      pages.push(currentPage.outerHTML);
    });

    return pages;
  }

  function splitIntoPages(templatePage, children, availableHeight, headerWrapper, footerWrapper, pageSettings, startPageNumber, skipPageNumber) {
    const pages = [];
    let currentPageNumber = startPageNumber;
    let currentPage = templatePage.cloneNode(true);
    let mainContent = currentPage.querySelector('.main-content-area');
    mainContent.innerHTML = '';
    
    let currentHeight = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childHeight = child.offsetHeight || 50;
  
      if (currentHeight + childHeight > availableHeight && currentHeight > 0) {
        if (!skipPageNumber) {
          applyPageSettings(currentPage, pageSettings, currentPageNumber);
          currentPageNumber++;
        } else {
          applyPageSettings(currentPage, pageSettings, null);
        }
        
        pages.push(currentPage.outerHTML);
        currentPage = templatePage.cloneNode(true);
        mainContent = currentPage.querySelector('.main-content-area');
        mainContent.innerHTML = ''; // Clear only main-content
        
        currentHeight = 0;
      }
  
      mainContent.appendChild(child.cloneNode(true));
      currentHeight += childHeight;
    }

    if (!skipPageNumber) {
      applyPageSettings(currentPage, pageSettings, currentPageNumber);
    } else {
      applyPageSettings(currentPage, pageSettings, null);
    }
    
    pages.push(currentPage.outerHTML);

    return pages;
  }
    
function createNewPage(templatePage, headerWrapper, footerWrapper) {
    const newPage = templatePage.cloneNode(true);
    const newMainContent = newPage.querySelector('.main-content-area');
    if (newMainContent) {
      newMainContent.innerHTML = '';
    }
    
    return newPage;
  }

  function clonePageDecoration(sourcePageContainer, targetPageContainer) {
    const watermark = sourcePageContainer.querySelector('.watermark, [data-watermark]');
    if (watermark && !targetPageContainer.querySelector('.watermark, [data-watermark]')) {
      const clonedWatermark = watermark.cloneNode(true);
      targetPageContainer.appendChild(clonedWatermark);
    }

    const pageNum = sourcePageContainer.querySelector('.page-number, [data-page-number]');
    if (pageNum && !targetPageContainer.querySelector('.page-number, [data-page-number]')) {
      const clonedPageNum = pageNum.cloneNode(true);
      targetPageContainer.appendChild(clonedPageNum);
    }

    targetPageContainer.style.backgroundColor = sourcePageContainer.style.backgroundColor;
    targetPageContainer.style.margin = sourcePageContainer.style.margin;
    targetPageContainer.style.padding = sourcePageContainer.style.padding;
  }
</script>
  `;

    const canvasStyles = [
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
      "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
      "https://fonts.googleapis.com/icon?family=Material+Icons",
      "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
      "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
    ];

    const canvasScripts = [
      "https://code.jquery.com/jquery-3.3.1.slim.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
      "https://code.jquery.com/jquery-2.1.1.min.js",
      "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
      "https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
      "https://code.highcharts.com/stock/highstock.js",
      "https://code.highcharts.com/highcharts-3d.js",
      "https://code.highcharts.com/highcharts-more.js",
      "https://code.highcharts.com/modules/data.js",
      "https://code.highcharts.com/modules/exporting.js",
      "https://code.highcharts.com/modules/accessibility.js",
      "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
      "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
      "https://code.highcharts.com/modules/drilldown.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js",
      "https://code.jquery.com/jquery-3.6.0.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
      "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/html-docx-js/dist/html-docx.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
    ];

    const styleLinks = canvasStyles.map(url => `<link rel="stylesheet" href="${url}">`).join('\n');
    const scriptTags = canvasScripts.map(url => `<script src="${url}"></script>`).join('\n');

    const datasourceBootstrapScript = buildExportDatasourceBootstrapScript();
    const componentJs = typeof editor.getJs === "function" ? editor.getJs() : "";
    const componentScriptTag = componentJs ? `<script>${componentJs}</script>` : "";

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print Preview</title>
        ${combinedStyles}
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; }
            .page-container { background: white; }
            @media print {
                body { background: white; }
                .page-container { margin: 0; box-shadow: none; page-break-after: always; }
            }
        </style>
        ${styleLinks}
        ${datasourceBootstrapScript}
        ${paginationScript}
        ${scriptTags}
      </head>
      <body>
        ${finalBodyHTML}
        ${componentScriptTag}
      </body>
      </html>
        `;

    return fullHTML;
  }

  async function updatePreview() {
    const mode = modeSelect.value;
    const custom = customInput.value;
    const { html: filteredBodyHtml, styles: subreportStyles } = await getFilteredHtml(mode, custom);
    // Start Remove hide on print 
    const tempContainers = document.createElement("div"); 
    tempContainers.innerHTML = filteredBodyHtml;
    tempContainers.querySelectorAll('.hide-on-print').forEach(el => el.remove());
    // Hide editor-only page-break markers in the PDF preview content.
    tempContainers.querySelectorAll('.page-break').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  // End Remove hide on print
    // const finalHtml = buildFinalHtml(filteredBodyHtml, subreportStyles);
     const finalHtml = buildFinalHtml(tempContainers.innerHTML, subreportStyles);
    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    await new Promise((resolve) => {
      iframe.onload = () => {
        setTimeout(() => {
          resolve();
        }, 3000);
      };
    });
  }

  async function waitForPreviewIframeReady(timeoutMs = 15000) {
    const start = Date.now();
    const chartSelector = '[data-i_designer-type="custom_line_chart"], [data-gjs-type="custom_line_chart"], .highchart-live-areaspline';

    while (Date.now() - start < timeoutMs) {
      const previewDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (previewDoc && previewDoc.readyState === "complete") {
        const charts = Array.from(previewDoc.querySelectorAll(chartSelector));
        const allChartsReady = charts.every((chart) => {
          const text = (chart.textContent || "").trim();
          if (/Failed to load chart library|Chart could not be rendered/i.test(text)) {
            return true;
          }

          if (chart.getAttribute("data-chart-ready") === "true") {
            return true;
          }

          return !!chart.querySelector("svg, canvas, .highcharts-container, .highcharts-root");
        });

        if (!charts.length || allChartsReady) {
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async function getRenderedPreviewHtml() {
    await waitForPreviewIframeReady();

    const previewDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (!previewDoc || !previewDoc.documentElement) {
      throw new Error("Preview iframe document is not available");
    }

    return "<!DOCTYPE html>\n" + previewDoc.documentElement.outerHTML;
  }

  modeSelect.addEventListener("change", () => {
    customInput.style.display = modeSelect.value === "custom" ? "inline-block" : "none";
    updatePreview();
  });

  customInput.addEventListener("input", () => {
    updatePreview();
  });

  cancelBtn.addEventListener("click", () => {
    modal.remove();
  });

  generateBtn.addEventListener("click", async () => {
    let overlay = document.createElement("div");
    overlay.id = "pdf-loading-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      fontSize: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    });
    overlay.innerText = "Generating PDF...";
    document.body.appendChild(overlay);

    try {
      const mode = modeSelect.value;
      const custom = customInput.value;

      await updatePreview();
      const finalHtml = await getRenderedPreviewHtml();

      modal.remove();

      const { html: filteredBodyHtml, styles: subreportStyles } = await getFilteredHtml(mode, custom);
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = filteredBodyHtml;
      const remainingPageContainers = tempContainer.querySelectorAll(".page-container");
      const idsToClean = Array.from(remainingPageContainers)
        .filter(el => el.id)
        .map(el => el.id);

      let cleanedCss = editor.getCss();
      idsToClean.forEach(id => {
        const marginRegex = new RegExp(`(#${id}\\s*{[^}]*?)margin[^;]*;`, "g");
        cleanedCss = cleanedCss.replace(marginRegex, "$1");

        const boxShadowRegex = new RegExp(`(#${id}\\s*{[^}]*?)box-shadow[^;]*;`, "g");
        cleanedCss = cleanedCss.replace(boxShadowRegex, "$1");
      });

      let pageSize = null;
      let orientation = null;
      let width = null;
      let height = null;

      const pageRuleMatch = cleanedCss.match(/@page\s*{[^}]*}/);
      if (pageRuleMatch) {
        const rule = pageRuleMatch[0];

        const sizeMatch = rule.match(/size\s*:\s*([^;]+);/);
        if (sizeMatch) {
          const sizeValue = sizeMatch[1].trim();

          const standardMatch = sizeValue.match(/(A\d+)\s*(portrait|landscape)?/i);
          if (standardMatch) {
            pageSize = standardMatch[1].toUpperCase();
            orientation = (standardMatch[2] || "portrait").toLowerCase();
          } else {
            const parts = sizeValue.split(/\s+/);
            if (parts.length >= 2) {
              width = parts[0].trim();
              height = parts[1].trim();
            }
          }
        }

        cleanedCss = cleanedCss.replace(/@page\s*{[^}]*}/g, "").trim();
      }

      let hasPayload = false;
      let payload = {};

      if (pageRuleMatch) {
        if (pageSize) {
          payload = { pageSize, orientation: orientation || "portrait" };
          hasPayload = true;
        } else if (width && height) {
          payload = { width, height };
          hasPayload = true;
        }
      }

      if (hasPayload) {
      } else {
      }
 
      const elementsToRemove = tempContainer.querySelectorAll('.hide-on-print');
      elementsToRemove.forEach(el => el.remove());

      // Ensure editor-only page-break markers don't render in the generated PDF.
      tempContainer.querySelectorAll('.page-break').forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
      console.log("🚀 Final HTML being sent to PDF API");
      try {
        const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
        const debugLink = document.createElement("a");
        debugLink.href = debugUrl;
        debugLink.download = "sent_to_pdf_api.html";
        debugLink.click();
        URL.revokeObjectURL(debugUrl);
        console.log("💾 Debug copy of HTML downloaded for verification");
      } catch (err) {
        console.warn("⚠️ Could not auto-download debug HTML:", err);
      }
      const formData = new FormData();

      if (hasPayload) {
        formData.append("payload", JSON.stringify(payload));
      }

      formData.append("file", new Blob([finalHtml], { type: "text/html" }), "template.html");
      const response = await fetch(apiUrl, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const blob = await response.blob();
      const contentType = response.headers.get("Content-Type");

      if (contentType && contentType.includes("pdf")) {
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "generated.pdf";
        a.click();
        URL.revokeObjectURL(pdfUrl);
        console.log("✅ PDF download triggered successfully!");
      } else {
        console.warn("⚠️ Unexpected response type:");
        alert("Unexpected response from server, PDF not received.");
      }

    } catch (err) {
      console.error("❌ Error generating PDF:");
      alert("Failed to generate PDF");
    } finally {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });
  await updatePreview();
}

var el = document.getElementById("exportPDF");
if (el) {
  el.addEventListener("click", generatePrintDialog, true);
}


const DB_NAME = "TemplateEditorDB";
const DB_VERSION = 1;
const STORE_NAME = "pages";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

(async function () {
  const pageData = await loadFromIndexedDB("single-page");

  if (pageData) {
    applyImportedSinglePage(pageData, "indexeddb-template-load", { closeModal: false });
  }
})();


var pageName = "index";
function getInteractiveSlideshowSettingsSnapshot() {
  try {
    const slideComponents = editor.getWrapper().find('[data-slide]');
    if (!slideComponents || slideComponents.length < 2) {
      return null;
    }

    const transitionsSource = window.transitions || {};
    const settings = {
      transitions: {},
      thumbnailNames: window.thumbnailNames || {},
      slideshowSoundPath: window.slideshowSoundPath || null,
      slideMusic: {}
    };

    slideComponents.forEach((component, index) => {
      const slideIndex = index + 1;
      const attrs = component.getAttributes ? component.getAttributes() : {};
      const existingTransition = transitionsSource[slideIndex] || {};
      const transitionDuration =
        existingTransition.transitionDuration ??
        existingTransition.duration ??
        (parseFloat(attrs['data-transition-duration']) || 0);

      settings.transitions[slideIndex] = {
        type: existingTransition.type || attrs['data-transition-type'] || 'none',
        transitionDuration,
        direction: existingTransition.direction || attrs['data-transition-direction'] || 'none',
        slideTimer: existingTransition.slideTimer ?? (parseFloat(attrs['data-slide-timer']) || 0),
        isHidden: existingTransition.isHidden ?? (attrs['data-hide'] === 'true'),
        wordToHide: existingTransition.wordToHide || attrs['data-word-to-hide'] || '',
        slideInput: existingTransition.slideInput || attrs['data-slide-input'] || 'False',
        hasMusic: existingTransition.hasMusic ?? (attrs['data-has-music'] === 'true'),
        musicLoop: existingTransition.musicLoop ?? (attrs['data-music-loop'] === 'true')
      };

      if (settings.transitions[slideIndex].hasMusic && existingTransition.musicFile) {
        settings.slideMusic[slideIndex] = {
          musicFile: existingTransition.musicFile,
          musicLoop: settings.transitions[slideIndex].musicLoop
        };
      }
    });

    return Object.keys(settings.transitions).length ? settings : null;
  } catch (err) {
    console.error('Interactive slideshow settings snapshot failed:', err);
    return null;
  }
}

function buildInteractiveSlideshowSettingsScript() {
  const slideshowSettings = getInteractiveSlideshowSettingsSnapshot();
  if (!slideshowSettings) {
    return "";
  }

  const serializedSettings = JSON.stringify(slideshowSettings).replace(/<\//g, "<\\/");
  return `<script id="interactive-designer-slideshow-settings" type="application/json">${serializedSettings}</script>`;
}

function extractSavedPageImportPayload(rawHtml) {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(String(rawHtml || ""), "text/html");
  const settingsScript = parsedDoc.getElementById("interactive-designer-slideshow-settings");
  let slideshowSettings = null;

  if (settingsScript) {
    try {
      slideshowSettings = JSON.parse(settingsScript.textContent || "{}");
    } catch (err) {
      console.error("Failed to parse interactive slideshow settings from imported page:", err);
    }
    settingsScript.remove();
  }

  const cssText = Array.from(parsedDoc.querySelectorAll("head style"))
    .map((styleTag) => styleTag.textContent || "")
    .join("\n");

  const bodyHtml = parsedDoc.body && parsedDoc.body.innerHTML
    ? parsedDoc.body.innerHTML
    : String(rawHtml || "");

  return {
    bodyHtml,
    cssText,
    slideshowSettings
  };
}

function scheduleInteractiveSlideshowRestore(reason = "interactive-slideshow-restore", delay = 500) {
  window.setTimeout(() => {
    if (typeof window.restoreInteractiveSlideshow === "function") {
      try {
        window.restoreInteractiveSlideshow();
      } catch (err) {
        console.error(`Failed to restore interactive slideshow after ${reason}:`, err);
      }
    }
  }, delay);
}

function applyImportedSinglePage(rawHtml, reason = "import-single-page", options = {}) {
  const { closeModal = true } = options;
  const { bodyHtml, cssText, slideshowSettings } = extractSavedPageImportPayload(rawHtml);

  sessionStorage.setItem('single-page', JSON.stringify(rawHtml));
  window.slideshowSettings = slideshowSettings || null;
  window.__iDesignerImportingPage = true;

  if (cssText && typeof editor.setStyle === "function") {
    editor.setStyle(cssText);
  }

  editor.setComponents(bodyHtml || rawHtml);
  scheduleDatasourceRebind(reason, 250);

  if (slideshowSettings || /data-slide\s*=/.test(bodyHtml || rawHtml || "")) {
    scheduleInteractiveSlideshowRestore(reason, 500);
  }

  window.setTimeout(() => {
    window.__iDesignerImportingPage = false;
  }, 800);

  if (closeModal) {
    editor.Modal.close();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = bodyHtml || rawHtml;
  tempDiv.querySelectorAll('script').forEach(scr => {
    if (scr.id === 'interactive-designer-slideshow-settings' || scr.type === 'application/json') {
      return;
    }

    const newScript = document.createElement('script');
    if (scr.src) {
      newScript.src = scr.src;
    } else {
      newScript.textContent = scr.innerHTML;
    }
    document.body.appendChild(newScript);
  });
}

function savePage() {
  editor.Modal.setTitle("Add Page Name");
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="text" class="form-control class="popupaddbtn"" value="" placeholder="Enter page name" style="width:95%"  name="singleSavePageName" id="singleSavePageName">
  </div>  
  <input id="saveSinglePage" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open();
  var el = document.getElementById("saveSinglePage");
  el.addEventListener("click", downloadPage, true);
}

function downloadPage() {
  pageName = document.getElementById('singleSavePageName').value;
  if (pageName === null || pageName === undefined || pageName === '') {
    alert('Page name required');
    return false;
  }

  var htmlContent = getHtmlWithCurrentFormState(editor);
  var cssContent = editor.getCss();
  const slideshowSettingsScript = buildInteractiveSlideshowSettingsScript();

  htmlContent =
    "<html><head><style>" +
    cssContent + `  .navbar-div .hamburger-menu { display: none !important;  text-align: right;
      font-size: 30px; padding: 10px; color: #472e90; cursor: pointer;
    }  @media (max-width: 991px) {  .navbar-div .hamburger-menu { display: block !important; }
      .navbar-div .tab-container, .navbar-div .tab{ width:99%; text-align:center; }
     .navbar-div .tab-container{display:none}
    } 
    @media (max-width: 767px){ .navbar-div .hamburger-menu {   display: block !important; }
     .navbar-div .tab-container, .navbar-div .tab{
       width:98%; } 
    .navbar-div .tab-container{display:none}
    }` +
    "</style></head>" +
    htmlContent + slideshowSettingsScript + `<script>
    var hamburgerMenu = document.getElementById("hamburgerMenu"); 
        if(hamburgerMenu !==null){
          var tabContainer = document.querySelector(".tab-container");  
          hamburgerMenu.addEventListener("click", function() {
              if (tabContainer.style.display === "block") {
                tabContainer.style.display = "none";
              } else {
                tabContainer.style.display = "block";
              }
            });   
          function  updateView(){   
            const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0); 
            const tabContainer = document.querySelector(".tab-container");  
            if (viewportWidth >= 991) {  
              tabContainer.style.display = "block";
            } else{
              tabContainer.style.display = "none";
            } 
          }  
          window.addEventListener('resize', updateView); 
        }
    </script>` +
    "</html>";
  sessionStorage.setItem('single-page', JSON.stringify(htmlContent));
  var blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = pageName + ".html";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  editor.Modal.close();
}

// *********start resize and drag code ***********

// Keep toolbar without down arrow on component select.
const ensureUpDownArrowToolbar = (component) => {
  if (!component || !component.get || !component.set) return;

  const toolbar = (component.get('toolbar') || []).slice();
  const withoutDownArrow = toolbar.filter((it) => {
    const cls = it && it.attributes && it.attributes.class ? it.attributes.class : '';
    return it?.id !== 'tlb-arrow-down' && !cls.includes('fa-arrow-down');
  });
  component.set('toolbar', withoutDownArrow);
};

const enableResizeAndRotate = (component) => {
  component.set({
    selectable: true,
    draggable: true,
    resizable: {
      tl: 1, tc: 1, tr: 1,
      cl: 1, cr: 1,
      bl: 1, bc: 1, br: 1,
      minDim: 20,
      maxDim: 2000,
      step: 1,
      unitHeight: 'px',
      unitWidth: 'px',
      handleSize: 8,
      rotator: true,
    },
  });
};

// 1️⃣ When component is added
editor.on('component:add', (component) => {
  ensureUpDownArrowToolbar(component);
  enableResizeAndRotate(component);
});

// 2️⃣ When component is selected
editor.on('component:selected', (component) => {
  ensureUpDownArrowToolbar(component);
  enableResizeAndRotate(component);
});

// ******* END Resize and drag code ***********

editor.on('load', () => {
  const scanLinks = () => {
    const wrapper = editor.getWrapper();
    const allLinks = wrapper.find('a');

    allLinks.forEach(linkComp => {
      const href = linkComp.getAttributes().href || '';

      if (href.startsWith('#')) {
        const pageContainer = linkComp.closest('.page-container');
        if (!pageContainer) return;

        const targetId = href.slice(1);
        const target = pageContainer.find(`#${targetId}`);

        if (target && target.length > 0) {
          linkComp.setStyle({
            ...linkComp.getStyle(),
            color: 'black',
            cursor: 'text',
          });
        } else {
          const style = { ...linkComp.getStyle() };
          delete style.color;
          delete style.cursor;
          linkComp.setStyle(style);
        }
      } else {
        const style = { ...linkComp.getStyle() };
        delete style.color;
        delete style.cursor;
        linkComp.setStyle(style);
      }
    });
  };

  scanLinks();

  editor.on('component:add', scanLinks);
  editor.on('component:update', scanLinks);
  editor.on('component:remove', scanLinks);
});


// ******** Same Link Page disable code

function importSinglePages() {
  editor.Modal.setTitle('Add Page Name');
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="file" class="form-control popupinput2" value="" accept="application/html" placeholder="Enter page name" style="width:95%"  name="importSinglePageInput" id="importSinglePageInput">
  </div>  
  <input id="import-single-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open();
  var el = document.getElementById("import-single-file");
  el.addEventListener("click", importFile, true);
}

function importFile() {
  const input = document.getElementById('importSinglePageInput');
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const code = e.target.result;
      applyImportedSinglePage(code, "import-single-page");
    }
    reader.readAsText(file);
  } else {
    alert('No file selected');
  }
}

function importMultipleFiles() {
  const input = document.getElementById("importMultiplePageInput");
  const files = Array.from(input.files);

  if (!files.length) {
    alert("No files selected");
    return;
  }

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const pageData = JSON.parse(e.target.result);

        const wrapper = editor.getWrapper();
        const container = wrapper.append(
          `<div class="imported-page" data-filename="${file.name}"></div>`
        )[0];

        container.components(pageData.html);
        editor.addStyle(pageData.css);

        for (const cid in pageData.traits) {
          if (pageData.traits.hasOwnProperty(cid)) {
            const comp = wrapper.find(`#${cid}`)[0];
            if (comp) {
              pageData.traits[cid].forEach((traitData) => {
                const trait = comp.getTrait(traitData.name);
                if (trait) {
                  trait.set("value", traitData.value);
                }
              });
            }
          }
        }

        scheduleDatasourceRebind(`import-multiple-pages:${file.name}`, 250);
      } catch (err) {
        console.error(`Error parsing JSON from file ${file.name}:`);
        alert(`Invalid JSON in file: ${file.name}`);
      }
    };

    reader.readAsText(file);
  });

  editor.Modal.close();
}

function cleanDatasourceStyleValue(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function parseDatasourceBindingsFromCss(cssText) {
  const bindings = {};
  const blockRegex = /#([\w-]+)\s*\{([^{}]*)\}/g;
  let match;

  while ((match = blockRegex.exec(String(cssText || ""))) !== null) {
    const componentId = match[1];
    const blockBody = match[2] || "";
    const jsonPathMatch = blockBody.match(/(?:^|;)\s*my-input-json\s*:\s*([^;]+)\s*(?:;|$)/i);
    const fileIndexMatch = blockBody.match(/(?:^|;)\s*json-file-index\s*:\s*([^;]+)\s*(?:;|$)/i);

    if (!jsonPathMatch && !fileIndexMatch) continue;

    bindings[componentId] = {
      myInputJson: jsonPathMatch ? cleanDatasourceStyleValue(jsonPathMatch[1]) : "",
      jsonFileIndex: fileIndexMatch ? cleanDatasourceStyleValue(fileIndexMatch[1]) : "",
    };
  }

  return bindings;
}

function getStoredJsonFileNames() {
  const fromList = (localStorage.getItem("common_json_files") || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (fromList.length) return fromList;

  const derived = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === "common_json" || key === "common_json_files") continue;
    if (key.startsWith("common_json_")) {
      derived.push(key.replace("common_json_", ""));
    }
  }

  return derived;
}

function getJsonDataByFileIndex(fileIndex) {
  const normalizedIndex = String(fileIndex == null ? "0" : fileIndex).trim() || "0";

  if (normalizedIndex !== "0") {
    const storedFileNames = getStoredJsonFileNames();
    const selectedFile = storedFileNames[parseInt(normalizedIndex, 10) - 1];
    if (!selectedFile) return null;

    const storedJson =
      localStorage.getItem(`common_json_${selectedFile}`) ||
      localStorage.getItem(`common_json_${selectedFile}.json`);

    if (!storedJson) return null;

    try {
      return JSON.parse(storedJson);
    } catch (err) {
      console.warn(`Failed to parse datasource file: ${selectedFile}`, err);
      return null;
    }
  }

  const commonJsonString = localStorage.getItem("common_json");
  if (!commonJsonString) return null;

  try {
    return JSON.parse(commonJsonString);
  } catch (err) {
    console.warn("Failed to parse common_json", err);
    return null;
  }
}

function hasDatasourceTemplatePlaceholders(value) {
  return /{[^{}]+}/.test(String(value == null ? "" : value));
}

function encodeDatasourceTemplateText(value) {
  return encodeURIComponent(String(value == null ? "" : value));
}

function decodeDatasourceTemplateText(value) {
  try {
    return decodeURIComponent(String(value == null ? "" : value));
  } catch (err) {
    return String(value == null ? "" : value);
  }
}

function getComponentTemplateText(component) {
  if (!component) return "";

  const directValue = component.get ? component.get("templateText") : "";
  if (typeof directValue === "string" && directValue) {
    return directValue;
  }

  const attrs = component.getAttributes ? component.getAttributes() : {};
  const attrValue = attrs["data-template-text"];
  if (typeof attrValue === "string" && attrValue) {
    return decodeDatasourceTemplateText(attrValue);
  }

  return "";
}

function setComponentTemplateText(component, templateText) {
  if (!component) return "";

  const normalizedTemplate = String(templateText == null ? "" : templateText);

  if (!hasDatasourceTemplatePlaceholders(normalizedTemplate)) {
    if (component.set) {
      component.set("templateText", "", { silent: true });
    }
    if (component.removeAttributes) {
      component.removeAttributes("data-template-text");
    }
    return "";
  }

  if (component.set) {
    component.set("templateText", normalizedTemplate, { silent: true });
  }
  if (component.addAttributes) {
    component.addAttributes({
      "data-template-text": encodeDatasourceTemplateText(normalizedTemplate),
    });
  }

  return normalizedTemplate;
}

function getComponentTemplateSource(component) {
  return (
    getComponentTemplateText(component) ||
    component?.get?.("raw-content") ||
    component?.get?.("content") ||
    component?.view?.el?.innerHTML ||
    ""
  );
}

function isTemplateAwareTextComponent(component) {
  const componentType = component?.get?.("type");
  return ["text", "formatted-rich-text", "custom-heading"].includes(componentType);
}

function getDatasourcePathTokens(path) {
  if (path == null) return [];

  return String(path)
    .trim()
    .replace(/\[\s*(\d+)\s*\]/g, ".$1")
    .replace(/\[\s*['"]([^'"\]]+)['"]\s*\]/g, ".$1")
    .replace(/^\./, "")
    .split(".")
    .map((token) => token.trim())
    .filter(Boolean);
}

function getValueByDatasourcePath(obj, path) {
  if (obj == null || !path) return undefined;

  const tokens = getDatasourcePathTokens(path);

  let currentValue = obj;
  for (let index = 0; index < tokens.length; index++) {
    if (currentValue == null) return undefined;
    currentValue = currentValue[tokens[index]];
  }

  return currentValue;
}

function resolveValueFromDatasource(commonJson, fullPath) {
  if (!commonJson || !fullPath) return undefined;

  const tokens = getDatasourcePathTokens(fullPath);

  if (!tokens.length) return undefined;

  let remainingPath = tokens.join(".");
  let rootObject = commonJson;

  if (tokens.length > 1 && commonJson[tokens[0]] != null) {
    rootObject = commonJson[tokens[0]];
    remainingPath = tokens.slice(1).join(".");
  } else {
    const selectedLanguage = localStorage.getItem("language") || "english";
    if (commonJson[selectedLanguage] != null) {
      rootObject = commonJson[selectedLanguage];
    }
  }

  return remainingPath ? getValueByDatasourcePath(rootObject, remainingPath) : rootObject;
}

function getPlaceholderTokensFromPath(commonJson, fullPath) {
  const tokens = getDatasourcePathTokens(fullPath);
  if (!tokens.length) return [];

  let nestedTokens = tokens;
  if (tokens.length > 1 && commonJson && commonJson[tokens[0]] != null) {
    nestedTokens = tokens.slice(1);
  }

  const lastNamedToken = [...nestedTokens]
    .reverse()
    .find((token) => !/^\d+$/.test(String(token)));

  const candidates = [];

  if (lastNamedToken) {
    candidates.push(String(lastNamedToken));
  }

  const normalizedNestedPath = nestedTokens.map((token) => String(token)).join(".");
  if (normalizedNestedPath) {
    candidates.push(normalizedNestedPath);
  }

  const originalTokens = String(fullPath || "")
    .trim()
    .split(".")
    .map((token) => token.trim())
    .filter(Boolean);

  const originalNestedPath =
    originalTokens.length > 1 && commonJson && commonJson[originalTokens[0]] != null
      ? originalTokens.slice(1).join(".")
      : originalTokens.join(".");

  if (originalNestedPath) {
    candidates.push(originalNestedPath);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function getPlaceholderTokenFromPath(commonJson, fullPath) {
  return getPlaceholderTokensFromPath(commonJson, fullPath)[0] || "";
}

function getComponentDatasourceState(component, cssBindings) {
  const attrs = component && component.getAttributes ? component.getAttributes() : {};
  const componentId = component && component.getId ? component.getId() : "";
  const cssBinding = componentId ? cssBindings[componentId] : null;

  const jsonPath =
    String(component?.get?.("my-input-json") || attrs["my-input-json"] || cssBinding?.myInputJson || "").trim();

  const jsonFileIndex =
    String(
      component?.get?.("json-file-index") ||
      component?.get?.("jsonFileIndex") ||
      attrs["data-json-file-index"] ||
      cssBinding?.jsonFileIndex ||
      "0"
    )
      .trim() || "0";

  return {
    jsonPath,
    jsonFileIndex,
  };
}

function persistDatasourceStateToAttrs(component, jsonPath, jsonFileIndex) {
  if (!component || typeof component.addAttributes !== "function") return;

  const attrsToAdd = {};
  if (String(jsonPath || "").trim()) {
    attrsToAdd["my-input-json"] = String(jsonPath).trim();
  }

  if (String(jsonFileIndex || "").trim()) {
    attrsToAdd["data-json-file-index"] = String(jsonFileIndex).trim();
  }

  if (Object.keys(attrsToAdd).length) {
    component.addAttributes(attrsToAdd);
  }
}

function resolveTextContentFromDatasource(component, jsonPath, commonJson) {
  if (!commonJson || !jsonPath) return undefined;

  const rawContent = getComponentTemplateSource(component);

  const jsonPaths = String(jsonPath)
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);

  if (!jsonPaths.length) return undefined;

  if (rawContent.includes("{") && rawContent.includes("}")) {
    setComponentTemplateText(component, rawContent);
    let nextContent = rawContent;

    jsonPaths.forEach((path) => {
      const resolvedValue = resolveValueFromDatasource(commonJson, path);
      if (resolvedValue === undefined || resolvedValue === null) return;

      const placeholderTokens = getPlaceholderTokensFromPath(commonJson, path);
      if (!placeholderTokens.length) return;

      placeholderTokens.forEach((placeholderToken) => {
        const placeholder = `{${placeholderToken}}`;
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        nextContent = nextContent.replace(new RegExp(escapedPlaceholder, "g"), String(resolvedValue));
      });
    });

    return nextContent;
  }

  const firstValue = resolveValueFromDatasource(commonJson, jsonPaths[0]);
  if (firstValue === undefined || firstValue === null) return undefined;
  return String(firstValue);
}

function applyResolvedTextContent(component, content) {
  if (!component) return;

  const nextContent = String(content == null ? "" : content);
  const componentType = component.get ? component.get("type") : "";

  if (componentType === "custom-heading" && component.set) {
    component.set("content", nextContent, { silent: true });
  }

  if (typeof component.components === "function") {
    try {
      component.components(nextContent);
    } catch (err) {
    }
  }

  if (component.view && component.view.el) {
    if (componentType === "custom-heading") {
      component.view.el.textContent = nextContent;
    } else {
      component.view.el.innerHTML = nextContent;
    }
  }
}

function walkComponentTree(component, visitor) {
  if (!component) return;
  visitor(component);

  const children = typeof component.components === "function" ? component.components() : null;
  if (!children || typeof children.each !== "function") return;

  children.each((child) => walkComponentTree(child, visitor));
}

function updateComponentsWithNewJson(editor) {
  if (!editor || typeof editor.getWrapper !== "function") return 0;

  const cssBindings = parseDatasourceBindingsFromCss(editor.getCss());
  const wrapper = editor.getWrapper();
  let refreshedComponents = 0;

  walkComponentTree(wrapper, (component) => {
    const attrs = component && component.getAttributes ? component.getAttributes() : {};
    const componentType = component?.get?.("type");
    const isChartComponent =
      componentType === "custom_line_chart" ||
      attrs["data-gjs-type"] === "custom_line_chart" ||
      attrs["data-i_designer-type"] === "custom_line_chart";

    if (isChartComponent) {
      if (typeof component.restorePersistedChartState === "function") {
        component.restorePersistedChartState();
      }
      if (typeof component.refreshJsonFileTraitOptions === "function") {
        component.refreshJsonFileTraitOptions();
      }

      component.highchartsInitialized = false;
      component.trigger && component.trigger("change:script");
      refreshedComponents += 1;
      return;
    }

    if (componentType === "json-table") {
      const jsonPath = String(component.get("json-path") || "").trim();
      if (!jsonPath) return;

      if (typeof component.updateFilterColumnOptions === "function") {
        component.updateFilterColumnOptions();
      }
      if (typeof component.updateRunningTotalColumnOptions === "function") {
        component.updateRunningTotalColumnOptions();
      }
      if (typeof component.updateTableFromJson === "function") {
        component.updateTableFromJson();
      } else if (component.trigger) {
        component.trigger("change:json-path");
      }
      if (typeof component.updateTableHTML === "function") {
        component.updateTableHTML();
      }
      refreshedComponents += 1;
      return;
    }

    const { jsonPath, jsonFileIndex } = getComponentDatasourceState(component, cssBindings);
    if (!jsonPath) return;

    if (component.set) {
      component.set("my-input-json", jsonPath, { silent: true });
      component.set("json-file-index", jsonFileIndex, { silent: true });
    }
    persistDatasourceStateToAttrs(component, jsonPath, jsonFileIndex);

    if (typeof component.updateFromJsonPath === "function") {
      component.updateFromJsonPath(jsonPath);
      refreshedComponents += 1;
      return;
    }

    if (typeof component.handleJsonPathChange === "function") {
      component.handleJsonPathChange();
      if (typeof component.renderBarcodeFromConfig === "function") {
        component.renderBarcodeFromConfig();
      }
      refreshedComponents += 1;
      return;
    }

    const commonJson = getJsonDataByFileIndex(jsonFileIndex);
    const resolvedContent = resolveTextContentFromDatasource(component, jsonPath, commonJson);
    if (resolvedContent === undefined) return;

    applyResolvedTextContent(component, resolvedContent);
    refreshedComponents += 1;
  });

  return refreshedComponents;
}

let datasourceRebindTimer = null;

function scheduleDatasourceRebind(reason, delay = 150) {
  clearTimeout(datasourceRebindTimer);
  datasourceRebindTimer = setTimeout(() => {
    try {
      const refreshedCount = updateComponentsWithNewJson(editor);
      if (refreshedCount > 0) {
        console.debug(`[DataSource Rebind] ${reason}: ${refreshedCount} component(s) refreshed`);
      }
    } catch (err) {
      console.error(`[DataSource Rebind] ${reason} failed`, err);
    }
  }, Math.max(0, delay));
}

editor.on("rte:enable", (view) => {
  const component = view?.model;
  if (!isTemplateAwareTextComponent(component)) return;

  const templateText = getComponentTemplateText(component);
  if (!hasDatasourceTemplatePlaceholders(templateText)) return;

  if (view.el) {
    view.el.innerHTML = templateText;
  }
});

editor.on("rte:disable", (view) => {
  const component = view?.model;
  if (!isTemplateAwareTextComponent(component)) return;

  const editedTemplate = view?.el?.innerHTML || "";
  const hadStoredTemplate = hasDatasourceTemplatePlaceholders(getComponentTemplateText(component));
  const hasEditedTemplate = hasDatasourceTemplatePlaceholders(editedTemplate);

  if (!hadStoredTemplate && !hasEditedTemplate) return;

  if (hasEditedTemplate) {
    setComponentTemplateText(component, editedTemplate);
  } else {
    setComponentTemplateText(component, "");
  }

  const jsonPath = String(
    component?.get?.("my-input-json") ||
    component?.getAttributes?.()?.["my-input-json"] ||
    ""
  ).trim();

  if (jsonPath) {
    scheduleDatasourceRebind("rte-template-restore", 0);
  }
});

window.rebindAllDatasourceComponents = function rebindAllDatasourceComponents(reason = "manual") {
  scheduleDatasourceRebind(reason, 0);
};

window.scheduleDatasourceRebind = scheduleDatasourceRebind;
window.addEventListener("common-json-files-updated", () => {
  scheduleDatasourceRebind("common-json-files-updated", 120);
});

editor.on("load", () => {
  scheduleDatasourceRebind("editor-load", 250);
});

function uploadExcelCsv() {
  const uploadedFileName = localStorage.getItem('uploadedFileName');
  const modal = editor.Modal;
  const container = document.createElement('div');

  container.innerHTML = `
    <div style="padding: 5px;">
      <div> ${uploadedFileName ? `Already added file: ${uploadedFileName}` : 'No file added'}</div>
      <br>
      <input type="file" id="excelCsvInput" accept=".csv, .xlsx" />
      <br><br>
      <button id="uploadExcelCsvBtn" style="padding: 5px 10px;">Add</button>
    </div>
  `;

  modal.setTitle('Upload Excel/CSV (Logic) File');
  modal.setContent(container);
  modal.open();

  container.querySelector('#uploadExcelCsvBtn').onclick = () => {
    const input = container.querySelector('#excelCsvInput');
    const file = input.files[0];

    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch(`${API_BASE_URL_Video}/excel/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      })
      .then(data => {
        alert('Upload successful!');
        localStorage.setItem('uploadedFileId', data);
        localStorage.setItem('uploadedFileName', file.name);

        modal.close();
      })
      .catch(error => {
        console.error('Error uploading CSv/Excel');
        alert('Upload failed.');
      });
  };
}

let slides = [];
let transitions = {};
let clickStates = {};
let currentSlideIndex = 1;

editor.on("run:core:canvas-clear", () => {
  const thumbContainer = document.getElementById("slides-thumbnails");
  if (thumbContainer) thumbContainer.remove();
  slides = [];
  transitions = {};
  clickStates = {};
  currentSlideIndex = 1;

});

let hasChanges = false;

editor.on('update', () => {
  hasChanges = true;
});

window.addEventListener('beforeunload', function (e) {
  if (hasChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

