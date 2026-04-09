class PageSetupManager {
  constructor(editor) {
    this.editor = editor;
    this.registerDynamicHeaderFooter();
    document.addEventListener("arrayDataSelected", function (event) {
      const { data, jsonPath } = event.detail;

      if (
        window.pageManagerInstance &&
        window.pageManagerInstance.handleArrayDataDistribution
      ) {
        window.pageManagerInstance.handleArrayDataDistribution(data, jsonPath);
      } else if (typeof handleArrayDataDistribution === "function") {
        handleArrayDataDistribution(data, jsonPath);
      } else {
      }
    });

    // Indexdb clear functionality when clearing canvas
    const DB_NAME = "TemplateEditorDB";
    const DB_VERSION = 1;
    const STORE_NAME = "pages";

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function clearFromIndexedDB(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }

    document.addEventListener("canvasCleared", async () => {
      localStorage.removeItem("editTemplateName");
      localStorage.removeItem("editTemplateId");
      sessionStorage.removeItem("single-page");
      localStorage.removeItem("single-page");

      try {
        await clearFromIndexedDB("pages");
      } catch (err) {}

      // Ensure no stale in-memory page content is restored after canvas clear.
      try {
        if (this.pageContents && typeof this.pageContents.clear === "function") {
          this.pageContents.clear();
        } else {
          this.pageContents = new Map();
        }
      } catch (err) {
        this.pageContents = new Map();
      }

      try {
        this.pageObservers && this.pageObservers.clear && this.pageObservers.clear();
      } catch (err) {}

      try {
        this.debounceTimers &&
          this.debounceTimers.forEach &&
          this.debounceTimers.forEach((timer) => clearTimeout(timer));
        this.debounceTimers && this.debounceTimers.clear && this.debounceTimers.clear();
      } catch (err) {}

      try {
        this.lastContentSnapshot && this.lastContentSnapshot.clear && this.lastContentSnapshot.clear();
      } catch (err) {}

      this.currentPageIndex = 0;
      this.pageBreaks = [];
      this.sharedContent = { header: null, footer: null };

      // Reset page settings so the next page-creation starts from a clean slate.
      this.pageSettings.numberOfPages = 1;
      this.pageSettings.pages = [];

      this.isInitialized = false;
      try {
        document.dispatchEvent(
          new CustomEvent("pageSetupStateChanged", { detail: { active: false } }),
        );
      } catch (err) {}
      this.updateNavbarButton();
      this.updateAddPageButton();
      this.resetInitialSetupModalInputs();

      // In case GrapesJS core clear wasn't enough for the page manager, wipe page DOM.
      try {
        const wrapper = this.editor && this.editor.getWrapper && this.editor.getWrapper();
        if (wrapper) {
          const pageComponents = wrapper.find && wrapper.find(".page-container");
          if (pageComponents && pageComponents.length) {
            pageComponents.forEach((p) => p.remove && p.remove());
          }
        }
      } catch (err) {}
    });

    this._lastAppliedHeaderText = "";
    this._lastAppliedFooterText = "";
    this._overflowAttempts = new Map();
    this._maxOverflowAttempts = 3;
    this.pageObservers = new Map();
    this.paginationInProgress = false;
    this.debounceTimers = new Map();
    this.lastContentSnapshot = new Map();
    this.contentCheckInterval = null;
    this._isProcessingOverflow = false;
    this._overflowCheckTimeout = null;
    this._componentAddHandler = null;
    this._componentUpdateHandler = null;
    this._pasteHandler = null;
    this._pageDeleteClickHandler = null;
    this.editor = editor;

    this.pageSettings = {
      autoFlow: true,
      preserveFormatting: true,
      wordWrap: true,
      lineHeight: 1.2,
      fontSize: 12,
    };
    this.pageSettings = {
      format: "a4",
      orientation: "portrait",
      numberOfPages: 1,
      pages: [],
      width: 210,
      height: 297,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      backgroundColor: "#ffffff",
      pageNumbering: {
        enabled: false,
        startFromPage: 1,
        excludedPages: [],
      },
      headerFooter: {
        headerEnabled: true,
        footerEnabled: true,
        headerHeight: 12.7,
        footerHeight: 12.7,
      },
    };
    this.isInitialized = false;
    this.currentPageIndex = 0;
    this.selectedSection = null;
    this.pageBreaks = [];

    this.sharedContent = {
      header: null,
      footer: null,
    };

    this.pageContents = new Map();

    this.pageFormats = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a2: { width: 420, height: 594 },
      a1: { width: 594, height: 841 },
      a0: { width: 841, height: 1189 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
      a5: { width: 148, height: 210 },
      custom: { width: 210, height: 297 },
    };

    this.defaultSizes = {
      header: { height: 12.7, padding: 10 },
      footer: { height: 12.7, padding: 10 },
    };

    this.sectionsSettings = {
      enabled: false,
      sections: [],
    };

    this.pageSettings.watermark = {
      watermark: {
        enabled: true,
        type: "text",
        position: "center",
        text: {
          content: "CONFIDENTIAL",
          font: "Arial",
          fontSize: 60,
          color: "red",
          opacity: 0.2,
          rotation: -30,
        },
        image: {
          url: "",
          width: 100,
          height: 100,
          opacity: 0.3,
        },
        applyToAllPages: true,
      },
    };
    this.openSuggestionJsonModal = this.openSuggestionJsonModal.bind(this);
    this.handleArrayDataDistribution =
      this.handleArrayDataDistribution.bind(this);
    this.init();
  }

  init() {
    this.createInitialSetupModal();
    this.setupEventListeners();
    this.injectPageSetupStyles();
    if (this.isInitialized) {
      this.updatePageRule();
    }
    this.addToGrapesJSSettings();
    this.setupCanvasObserver();
    this.setupContentBoundaryEnforcement();
    this.initSharedRegionSync();
    this.setupSectionSelection();
    this.addPageBreakComponent();
    this.initializeArrayDataListener();

    this.editor.on("component:add", (component) => {
      if (
        component.getAttributes &&
        component.getAttributes()["data-page-break"] === "true"
      ) {
        const parent = component.parent && component.parent();
        if (parent) {
          setTimeout(() => {
            if (this.processPendingPageBreaks) {
              this.processPendingPageBreaks();
            }
          }, 300);
        }
      }
    });
  }

  exportPageSettings() {
    const exported = {
      isInitialized: this.isInitialized,
      pageSettings: {
        format: this.pageSettings.format,
        orientation: this.pageSettings.orientation,
        numberOfPages: this.pageSettings.numberOfPages,
        width: this.pageSettings.width,
        height: this.pageSettings.height,
        margins: { ...this.pageSettings.margins },
        backgroundColor: this.pageSettings.backgroundColor,
        pages: (this.pageSettings.pages || []).map((page) => ({
          id: page.id,
          name: page.name,
          pageNumber: page.pageNumber,
          backgroundColor: page.backgroundColor,
          header: page.header ? { ...page.header } : null,
          footer: page.footer ? { ...page.footer } : null,
          pageNumber: page.pageNumber ? { ...page.pageNumber } : null,
          isSubreportPage: page.isSubreportPage || false,
          skipPageNumber: page.skipPageNumber || false,
        })),
        headerFooter: this.pageSettings.headerFooter
          ? {
              headerEnabled: this.pageSettings.headerFooter.headerEnabled,
              footerEnabled: this.pageSettings.headerFooter.footerEnabled,
              headerHeight: this.pageSettings.headerFooter.headerHeight,
              footerHeight: this.pageSettings.headerFooter.footerHeight,
              headerText: this.pageSettings.headerFooter.headerText || "",
              footerText: this.pageSettings.headerFooter.footerText || "",
              headerApplyMode:
                this.pageSettings.headerFooter.headerApplyMode || "all",
              footerApplyMode:
                this.pageSettings.headerFooter.footerApplyMode || "all",
              headerCustomPages:
                this.pageSettings.headerFooter.headerCustomPages || [],
              footerCustomPages:
                this.pageSettings.headerFooter.footerCustomPages || [],
            }
          : null,
        pageNumbering: this.pageSettings.pageNumbering
          ? {
              enabled: this.pageSettings.pageNumbering.enabled,
              startFromPage: this.pageSettings.pageNumbering.startFromPage,
              excludedPages: [
                ...(this.pageSettings.pageNumbering.excludedPages || []),
              ],
            }
          : null,
        pageNumber: this.pageSettings.pageNumber
          ? {
              enabled: this.pageSettings.pageNumber.enabled,
              startFrom: this.pageSettings.pageNumber.startFrom,
              format: this.pageSettings.pageNumber.format,
              position: this.pageSettings.pageNumber.position,
              fontSize: this.pageSettings.pageNumber.fontSize,
              fontFamily: this.pageSettings.pageNumber.fontFamily,
              color: this.pageSettings.pageNumber.color,
              backgroundColor: this.pageSettings.pageNumber.backgroundColor,
              showBorder: this.pageSettings.pageNumber.showBorder,
              rotation: this.pageSettings.pageNumber.rotation || 0,
              visibility: this.pageSettings.pageNumber.visibility,
            }
          : null,
        watermark: this.pageSettings.watermark
          ? {
              enabled: this.pageSettings.watermark.enabled,
              type: this.pageSettings.watermark.type,
              tiled: this.pageSettings.watermark.tiled,
              textPosition: this.pageSettings.watermark.textPosition,
              imagePosition: this.pageSettings.watermark.imagePosition,
              position: this.pageSettings.watermark.position,
              text: this.pageSettings.watermark.text
                ? { ...this.pageSettings.watermark.text }
                : null,
              image: this.pageSettings.watermark.image
                ? { ...this.pageSettings.watermark.image }
                : null,
              applyToAllPages: this.pageSettings.watermark.applyToAllPages,
            }
          : null,
        conditionalPageBreak: this.pageSettings.conditionalPageBreak
          ? {
              enabled: this.pageSettings.conditionalPageBreak.enabled,
              defaultDistance:
                this.pageSettings.conditionalPageBreak.defaultDistance,
              defaultUnit: this.pageSettings.conditionalPageBreak.defaultUnit,
              pageOverrides: {
                ...(this.pageSettings.conditionalPageBreak.pageOverrides || {}),
              },
            }
          : null,
        sectionConditionalPageBreak: this.pageSettings
          .sectionConditionalPageBreak
          ? {
              enabled: this.pageSettings.sectionConditionalPageBreak.enabled,
              defaultDistance:
                this.pageSettings.sectionConditionalPageBreak.defaultDistance,
              defaultUnit:
                this.pageSettings.sectionConditionalPageBreak.defaultUnit,
              sectionOverrides: {
                ...(this.pageSettings.sectionConditionalPageBreak
                  .sectionOverrides || {}),
              },
            }
          : null,
      },
      lastAppliedValues: {
        headerApplyMode: this._lastHeaderApplyMode || "all",
        footerApplyMode: this._lastFooterApplyMode || "all",
        headerCustomPageList: this._lastHeaderCustomPageList || "",
        footerCustomPageList: this._lastFooterCustomPageList || "",
        headerHeight: this._lastHeaderHeight || 12.7,
        footerHeight: this._lastFooterHeight || 12.7,
      },
    };
    return exported;
  }

  importPageSettings(savedSettings) {
    if (!savedSettings || !savedSettings.pageSettings) {
      return;
    }

    try {
      this.pageSettings = {
        ...this.pageSettings,
        ...savedSettings.pageSettings,
        margins: {
          ...this.pageSettings.margins,
          ...savedSettings.pageSettings.margins,
        },
        headerFooter: {
          ...this.pageSettings.headerFooter,
          ...savedSettings.pageSettings.headerFooter,
        },
        pageNumbering: {
          ...this.pageSettings.pageNumbering,
          ...savedSettings.pageSettings.pageNumbering,
        },
        watermark: savedSettings.pageSettings.watermark
          ? {
              ...this.pageSettings.watermark,
              ...savedSettings.pageSettings.watermark,
              text: {
                ...this.pageSettings.watermark?.text,
                ...savedSettings.pageSettings.watermark.text,
              },
              image: {
                ...this.pageSettings.watermark?.image,
                ...savedSettings.pageSettings.watermark.image,
              },
            }
          : this.pageSettings.watermark,
      };

      this.isInitialized = savedSettings.isInitialized || false;

      if (savedSettings.lastAppliedValues) {
        this._lastHeaderApplyMode =
          savedSettings.lastAppliedValues.headerApplyMode;
        this._lastFooterApplyMode =
          savedSettings.lastAppliedValues.footerApplyMode;
        this._lastHeaderCustomPageList =
          savedSettings.lastAppliedValues.headerCustomPageList;
        this._lastFooterCustomPageList =
          savedSettings.lastAppliedValues.footerCustomPageList;
        this._lastHeaderHeight = savedSettings.lastAppliedValues.headerHeight;
        this._lastFooterHeight = savedSettings.lastAppliedValues.footerHeight;
      }

      this.updateNavbarButton();
      this.updateAddPageButton();

      const existingPages = this.editor.getWrapper().find(".page-container");
      if (
        existingPages.length === 0 ||
        existingPages.length !== this.pageSettings.numberOfPages
      ) {
        this.setupEditorPages();
      }

      setTimeout(() => {
        this.updateAllPageVisuals();
      }, 300);
    } catch (error) {
      console.error("❌ Error importing page settings:");
    }
  }

  addPageBreakComponent() {
    editor.BlockManager.add("page-break", {
      label: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px;">
          <i class="fa fa-scissors" style="font-size:20px; color:white;"></i>
          <span style="font-size:10px; font-weight:bold; color:white; padding-top:10px;">Page Break</span>
        </div>
      `,
      category: "Basic",
      content:
        '<div class="page-break page-break-element" data-page-break="true" data-gjs-droppable="false" data-gjs-editable="false" ' +
        'style="margin: 20px 0; text-align: center; position: relative;">' +
        '<div style="border-top: 2px dashed red;"></div>' +
        '<span class="page-break-label" ' +
        'style="position: absolute; left: 50%; top: 0; transform: translate(-50%, -50%); ' +
        'background: white; padding: 0 12px; font-size: 12px; font-weight: 600; color: red; white-space: nowrap;">' +
        '✂ PAGE BREAK' +
        '</span>' +
        '</div>',
    });
  }

  resetInitialization() {
    this.isInitialized = false;
    this.updateNavbarButton();
    this.updateAddPageButton();
  }

  createNewPage() {
    return this.addNewPage();
  }

  // Page Break
  handlePageBreak(pageIndex) {
    if (this._processingPageBreak === pageIndex) {
      return;
    }
    this._processingPageBreak = pageIndex;

    const wrapper = this.editor.getWrapper();
    if (!wrapper) {
      this._processingPageBreak = null;
      return;
    }

    const pageComponents = wrapper.find(`[data-page-index="${pageIndex}"]`);
    if (!pageComponents.length) {
      this._processingPageBreak = null;
      return;
    }

    const pageComponent = pageComponents[0];
    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) {
      this._processingPageBreak = null;
      return;
    }

    const contentEl = contentArea.getEl();
    if (!contentEl) {
      this._processingPageBreak = null;
      return;
    }

    const pageBreakEl = contentEl.querySelector(".page-break");
    if (!pageBreakEl) {
      this._processingPageBreak = null;
      return;
    }

    let foundBreak = false;
    const allChildren = Array.from(contentArea.components());
    const afterBreak = [];

    for (let cmp of allChildren) {
      if (foundBreak) {
        afterBreak.push(cmp);
      }
      if (cmp.getEl() === pageBreakEl) {
        foundBreak = true;
      }
    }

    let nextPage = wrapper.find(`[data-page-index="${pageIndex + 1}"]`)[0];
    if (!nextPage) {
      nextPage = this.createNewPage();
    }

    if (!nextPage) {
      this._processingPageBreak = null;
      return;
    }

    const nextContentArea = nextPage.find(".main-content-area")[0];
    if (!nextContentArea) {
      this._processingPageBreak = null;
      return;
    }

    afterBreak.reverse().forEach((cmp) => {
      cmp.remove({ temporary: true });
      nextContentArea.components().add(cmp, { at: 0 });
    });

    // Keep page break element visible; do not remove it after moving content
    const breakCmp = allChildren.find((c) => c.getEl() === pageBreakEl);
    if (breakCmp) {
      // breakCmp.remove(); // Do not remove - user expects page break to stay
    }

    setTimeout(() => {
      this.mergeSplitJsonTablesOnPage(pageIndex);
      this.mergeSplitJsonTablesOnPage(pageIndex + 1);
    }, 150);

    this._processingPageBreak = null;
  }

  startPageBreakMonitoring() {
    this.editor.on("component:add", (component) => {
      if (component.getAttributes()["data-page-break"] === "true") {
        setTimeout(() => {
          this.processPendingPageBreaks();
        }, 500);
      }
    });
  }

  addPageBreakCSS() {
    const css = `
    .page-break-element {
      width: 100% !important;
      height: 30px !important;
      background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%) !important;
      border: 2px dashed #ff4757 !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 20px 0 !important;
      position: relative !important;
      cursor: move !important;
      transition: all 0.2s ease !important;
      user-select: none !important;
      z-index: 100 !important;
      box-sizing: border-box !important;
    }

    .page-break-element .page-break-label {
      color: white !important;
      font-size: 12px !important;
      font-weight: bold !important;
      letter-spacing: 1px !important;
      pointer-events: none !important;
    }

    .page-break-element:hover {
      background: linear-gradient(90deg, #ff5252 0%, #ff7979 50%, #ff5252 100%) !important;
      transform: scale(1.02) !important;
      box-shadow: 0 2px 10px rgba(255, 75, 87, 0.4) !important;
    }

    .page-break-element.gjs-selected {
      outline: 3px solid #ff4757 !important;
      outline-offset: 3px !important;
    }

    @media print {
      .page-break-element {
        display: none !important;
      }
      
      .page-break-element + * {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .print-page-break {
        page-break-before: always !important;
        break-before: page !important;
        display: none !important;
      }
    }

    .gjs-cv-canvas .page-break-element {
      min-height: 30px !important;
    }

    .gjs-frame .page-break-element {
      display: flex !important;
      visibility: visible !important;
    }
  `;

    try {
      if (this.editor && this.editor.Css) {
        this.editor.Css.add(css);
      } else if (this.editor && this.editor.CssComposer) {
        this.editor.CssComposer.add(css);
      } else {
        this.addCSSToHead(css);
      }
    } catch (error) {
      this.addCSSToHead(css);
    }
  }

  handlePageBreakInsertion(breakComponent) {
    const breakEl = breakComponent.getEl();
    const pageContainer = breakEl.closest(".page-container");
    if (!pageContainer) return;

    const editor = breakComponent.em.get("Editor");
    const domComponents = editor.DomComponents;

    const currentMain = pageContainer.querySelector(".main-content-area");
    if (!currentMain) return;

    const nodesToMove = [];
    let next = breakEl.nextSibling;
    while (next) {
      nodesToMove.push(next);
      next = next.nextSibling;
    }

    if (!nodesToMove.length) return;

    const newPage = domComponents.addComponent({
      tagName: "div",
      classes: ["page-container"],
      attributes: {
        "data-page-id": `page-${Date.now()}`,
        "data-page-index": "x",
      },
      components: [
        {
          tagName: "div",
          classes: ["page-content"],
          components: [
            { tagName: "div", classes: ["header-wrapper"], components: [] },
            {
              tagName: "div",
              classes: ["content-wrapper"],
              components: [
                {
                  tagName: "div",
                  classes: ["main-content-area"],
                  components: [],
                },
              ],
            },
            { tagName: "div", classes: ["footer-wrapper"], components: [] },
          ],
        },
      ],
    });

    const newMain = newPage.find(".main-content-area")[0];
    if (!newMain) return;
    nodesToMove.forEach((node) => {
      const comp = domComponents.getWrapper().find(`#${node.id}`)[0];
      if (comp) {
        newMain.append(comp);
      }
    });
    // Keep page break visible; do not remove after moving content
    // breakComponent.remove();

    setTimeout(() => {
      const allPages = editor.getWrapper().find(".page-container");
      allPages.forEach((pageComp, idx) => {
        const pageEl = pageComp.getEl && pageComp.getEl();
        if (pageComp === newPage || pageEl === pageContainer) {
          this.mergeSplitJsonTablesOnPage(idx);
        }
      });
    }, 150);
  }

  splitPagesByBreaks() {
    const wrapper = this.editor.getWrapper();
    const pageContainers = wrapper.find(".page-container");

    pageContainers.forEach((page, pageIndex) => {
      const mainContent = page.find(".main-content-area")[0];
      if (!mainContent) return;

      const breakComps = mainContent.find('[data-page-break="true"]');
      if (!breakComps.length) return;

      breakComps.forEach((breakComp) => {
        const breakEl = breakComp.getEl();
        let nextNodes = [];
        let sibling = breakEl.nextSibling;

        while (sibling) {
          nextNodes.push(sibling);
          sibling = sibling.nextSibling;
        }

        if (!nextNodes.length) return;

        const newPage = wrapper.append(this.buildPageSkeleton())[0];
        const newMain = newPage.find(".main-content-area")[0];

        nextNodes.forEach((node) => {
          const comp = wrapper.find(`#${node.id}`)[0];
          if (comp) newMain.append(comp);
        });

        // Keep page break visible; do not remove after moving content
        // breakComp.remove();

        this.pageSettings.numberOfPages++;

        setTimeout(() => {
          this.mergeSplitJsonTablesOnPage(pageIndex);
          const pageContainersAfterMove = wrapper.find(".page-container");
          pageContainersAfterMove.forEach((pageComp, idx) => {
            if (pageComp === newPage) {
              this.mergeSplitJsonTablesOnPage(idx);
            }
          });
        }, 150);
      });
    });
  }

  buildPageSkeleton() {
    const mmToPx = 96 / 25.4;
    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
    const marginBottomPx = Math.round(
      this.pageSettings.margins.bottom * mmToPx,
    );
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);

    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;

    return `
    <div class="page-container" data-page-id="page-${Date.now()}">
      <div class="page-content" style="height:${contentHeight}px; margin:${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px; display:flex; flex-direction:column;">
        <div class="header-wrapper"><div class="page-header-element"></div></div>
        <div class="content-wrapper" style="flex:1; display:flex; flex-direction:column;">
          <div class="main-content-area"></div>
        </div>
        <div class="footer-wrapper"><div class="page-footer-element"></div></div>
      </div>
    </div>`;
  }
  ////////////////////////////////// auto-pagtination ////////////////////////////////////////////////////

  checkAllPagesForOverflow() {
    if (this.paginationInProgress) {
      return;
    }
    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const currentPageIndex = i;
      this.handleAutoPagination(currentPageIndex);
    }
  }

  handleAutoPagination(pageIndex) {
    const pageComponent = this.editor
      .getWrapper()
      .find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    const contentEl = contentArea.getEl();
    if (!contentEl) return;

    const hasActualContent =
      contentEl.children.length > 0 &&
      Array.from(contentEl.children).some(
        (child) =>
          !child.classList.contains("page-break") &&
          (child.textContent.trim() !== "" ||
            child.querySelector("img, table, video")),
      );

    const shouldCheckPageBreak =
      pageIndex > 0 ||
      (pageIndex === 0 &&
        hasActualContent &&
        contentEl.scrollHeight > contentEl.clientHeight);

    if (shouldCheckPageBreak) {
      this.handlePageBreak(pageIndex);
    }

    if (this.paginationInProgress) return;
    this.paginationInProgress = true;

    const resetFlag = () => (this.paginationInProgress = false);
    setTimeout(resetFlag, 15000);

    try {
      let targetArea = contentArea;
      let availableHeight = contentEl.clientHeight;

      const sectionsContainer = contentArea.find(".sections-container")[0];
      const manualSectionContent = contentArea.find(".section-content")[0];

      if (manualSectionContent) {
        targetArea = manualSectionContent;
      } else if (sectionsContainer) {
        const sectionContent = sectionsContainer
          .components()
          .find((c) => c.get("name") === "Content");
        if (sectionContent) targetArea = sectionContent;
      }

      const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
      let conditionalBreakPosition = null;

      if (conditionalBreakSettings?.enabled) {
        const pageNumber = pageIndex + 1;
        const overrides = conditionalBreakSettings.pageOverrides || {};

        let distanceInMm;

        if (overrides[pageNumber]) {
          distanceInMm = this.convertToMm(
            overrides[pageNumber].distance,
            overrides[pageNumber].unit,
          );
        } else {
          distanceInMm = this.convertToMm(
            conditionalBreakSettings.defaultDistance || 50,
            conditionalBreakSettings.defaultUnit || "mm",
          );
        }

        const mmToPx = 96 / 25.4;
        const distanceInPx = Math.round(distanceInMm * mmToPx);
        conditionalBreakPosition = availableHeight - distanceInPx;
      }

      if (sectionsContainer && targetArea !== contentArea) {
        const mainContentHeight = contentEl.clientHeight;
        const bufferSpace = 20;
        // contentArea is already the page content body; subtracting header/footer again shrinks space incorrectly
        availableHeight = mainContentHeight - bufferSpace;

        if (conditionalBreakPosition !== null) {
          availableHeight = Math.min(availableHeight, conditionalBreakPosition);
        }
      } else if (conditionalBreakPosition !== null) {
        availableHeight = Math.min(availableHeight, conditionalBreakPosition);
      }

      const targetEl = targetArea.getEl();
      if (!targetEl) return resetFlag();

      targetEl.offsetHeight;
      const actualHeight = targetEl.scrollHeight;

      const isOverflowing = actualHeight > availableHeight + 10;
      if (!isOverflowing) return resetFlag();

      const components = targetArea.components();
      if (components.length === 0) return resetFlag();

      const splitSuccess = this.splitContentByHeight(
        targetArea,
        components,
        pageIndex,
        availableHeight,
      );

      if (!splitSuccess) return resetFlag();

      setTimeout(() => {
        const nextPageIndex = pageIndex + 1;

        const nextPageExists =
          nextPageIndex < this.pageSettings.pages.length &&
          this.pageSettings.pages[nextPageIndex];

        if (nextPageExists) {
          const hasSubreport = components.some(
            (comp) => comp.get("type") === "subreport",
          );

          if (hasSubreport) {
            const subreportComp = components.find(
              (comp) => comp.get("type") === "subreport",
            );
            const sharePageNumber =
              subreportComp?.getAttributes()?.sharePageNumber;

            if (sharePageNumber === false || sharePageNumber === "false") {
              const newPageSettings = this.pageSettings.pages[nextPageIndex];
              newPageSettings.isSubreportPage = true;
              newPageSettings.skipPageNumber = true;
            }
          }
        }

        resetFlag();

        setTimeout(() => {
          if (nextPageIndex < this.pageSettings.numberOfPages) {
            this.checkPageForOverflow(nextPageIndex);
          }
        }, 800);
      }, 500);
    } catch (err) {
      console.error(`❌ Error in handleAutoPagination(Page ${pageIndex})`);
      resetFlag();
    }
  }

  splitContentByHeight(contentArea, components, pageIndex, maxHeight) {
    const contentEl = contentArea.getEl();
    const componentsToKeep = [];
    const componentsToMove = [];

    let accumulatedHeight = 0;
    let splitPointFound = false;
    const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
    let conditionalBreakActive = false;
    let conditionalBreakHeight = maxHeight;

    if (conditionalBreakSettings?.enabled) {
      const pageNumber = pageIndex + 1;
      const overrides = conditionalBreakSettings.pageOverrides || {};

      let distanceInMm;

      if (overrides[pageNumber]) {
        distanceInMm = this.convertToMm(
          overrides[pageNumber].distance,
          overrides[pageNumber].unit,
        );
      } else {
        distanceInMm = this.convertToMm(
          conditionalBreakSettings.defaultDistance || 50,
          conditionalBreakSettings.defaultUnit || "mm",
        );
      }

      const mmToPx = 96 / 25.4;
      const distanceInPx = Math.round(distanceInMm * mmToPx);
      const contentAreaHeight = contentEl.clientHeight;
      conditionalBreakHeight = contentAreaHeight - distanceInPx;
      conditionalBreakActive = true;
    }

    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();
      if (!compEl) continue;
      const isSubreport =
        component.get("type") === "subreport" ||
        compEl.classList.contains("subreport-block") ||
        compEl.classList.contains("subreport-container");
      const compHeight = this.getAccurateComponentHeight(compEl);
      const effectiveMaxHeight = conditionalBreakActive
        ? conditionalBreakHeight
        : maxHeight;
      const remainingSpace = effectiveMaxHeight - accumulatedHeight;

      const componentType = component.get("type");
      const isTable =
        componentType === "table" ||
        compEl.tagName === "TABLE" ||
        compEl.querySelector("table") !== null ||
        component.find("table").length > 0;

      const isJsonTable =
        compEl.classList.contains("json-table-container") ||
        compEl.classList.contains("json-data-table");

      if (accumulatedHeight + compHeight > effectiveMaxHeight) {
        splitPointFound = true;

        if (isSubreport) {
          const subreportChildren = component.components();

          if (subreportChildren.length > 0) {
            let childrenToMove = [];
            let childAccHeight = accumulatedHeight;

            for (let j = 0; j < subreportChildren.length; j++) {
              const childComp = subreportChildren.at(j);
              const childEl = childComp.getEl();
              if (!childEl) continue;

              const childHeight = this.getAccurateComponentHeight(childEl);

              if (childAccHeight + childHeight > effectiveMaxHeight) {
                for (let k = j; k < subreportChildren.length; k++) {
                  childrenToMove.push(subreportChildren.at(k));
                }
                break;
              }

              childAccHeight += childHeight;
            }

            if (
              childrenToMove.length > 0 &&
              childrenToMove.length < subreportChildren.length
            ) {
              componentsToMove.push(...childrenToMove);
              componentsToKeep.push(component);
              accumulatedHeight = childAccHeight;
              for (let j = i + 1; j < components.length; j++) {
                componentsToMove.push(components.at(j));
              }
              break;
            }
          }

          componentsToMove.push(component);
          for (let j = i + 1; j < components.length; j++) {
            componentsToMove.push(components.at(j));
          }
          break;
        }

        if (isTable || isJsonTable) {
          const tableHeight = this.getAccurateComponentHeight(compEl);

          if (accumulatedHeight + compHeight > effectiveMaxHeight) {
            if (remainingSpace > effectiveMaxHeight * 0.15) {
              const splitResult = this.handleTableSplit(
                component,
                compEl,
                remainingSpace,
                effectiveMaxHeight,
              );
              if (splitResult.keepComponent && splitResult.keptRowCount > 0) {
                componentsToKeep.push(component);
                accumulatedHeight += this.getAccurateComponentHeight(compEl);
              }
              if (splitResult.moveComponent && splitResult.movedRowCount > 0) {
                componentsToMove.push(splitResult.moveComponent);
              }
            } else {
              componentsToMove.push(component);
            }

            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            componentsToKeep.push(component);
            accumulatedHeight += compHeight;
            continue;
          }
        } else if (conditionalBreakActive) {
          if (
            remainingSpace > effectiveMaxHeight * 0.15 &&
            component.get("type") === "formatted-rich-text"
          ) {
            const splitResult = this.splitLargeComponent(
              component,
              remainingSpace,
            );
            if (splitResult.moveComponent) {
              componentsToMove.push(splitResult.moveComponent);
            }
            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            for (let j = i; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          }
        } else {
          if (remainingSpace > maxHeight * 0.2) {
            const splitResult = this.splitLargeComponent(
              component,
              remainingSpace,
            );
            if (splitResult.moveComponent) {
              componentsToMove.push(splitResult.moveComponent);
            }
            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            for (let j = i; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          }
        }
      } else {
        componentsToKeep.push(component);
        accumulatedHeight += compHeight;
      }
    }

    if (
      !splitPointFound &&
      components.length === 1 &&
      accumulatedHeight > effectiveMaxHeight
    ) {
      const component = components.at(0);
      const compEl = component.getEl();
      const isTable =
        compEl.tagName === "TABLE" || compEl.querySelector("table") !== null;
      const isJsonTable = compEl.classList.contains("json-table-container");

      if (isTable || isJsonTable) {
        const splitResult = this.handleTableSplit(
          component,
          compEl,
          effectiveMaxHeight * 0.95,
          effectiveMaxHeight,
        );
        if (splitResult.moveComponent) {
          componentsToMove.push(splitResult.moveComponent);
        }
      } else {
        const splitResult = this.splitLargeComponent(
          component,
          effectiveMaxHeight * 0.95,
        );
        if (splitResult.moveComponent) {
          componentsToMove.push(splitResult.moveComponent);
        }
      }
    }

    if (componentsToMove.length === 0) {
      return false;
    }

    const nextPageIndex = pageIndex + 1;
    const wrapper = this.editor.getWrapper();
    let newPage = wrapper.find(`[data-page-index="${nextPageIndex}"]`)[0];

    let sourceSectionCount = null;
    const sourceSection = contentArea.closest(".sections-container");
    if (sourceSection) {
      sourceSectionCount = sourceSection.getAttributes()["data-section-count"];
    }

    if (!newPage) {
      newPage = this.addNewPage();
      this.pageSettings.numberOfPages = nextPageIndex + 1;
    }

    setTimeout(() => {
      try {
        const currentPage = wrapper.find(`[data-page-index="${pageIndex}"]`)[0];
        const newPageRef = wrapper.find(
          `[data-page-index="${nextPageIndex}"]`,
        )[0];

        if (currentPage && newPageRef) {
          const newMainContent = newPageRef.find(".main-content-area")[0];

          if (newMainContent && sourceSectionCount) {
            let existingSection = newMainContent.find(".sections-container")[0];

            if (!existingSection) {
              existingSection = this.addSectionsContainerToSpecificPage(
                nextPageIndex,
                sourceSectionCount,
              );
            }
          }

          const oldSections = currentPage.find(".sections-container")[0];
          const newSections = newPageRef.find(".sections-container")[0];

          if (oldSections && newSections) {
            const oldHeader = oldSections.find(".section-header")[0];
            const newHeader = newSections.find(".section-header")[0];

            if (oldHeader && newHeader) {
              const existingComponents = newHeader.components().length;
              if (existingComponents === 0) {
                oldHeader.components().forEach((comp) => {
                  newHeader.append(comp.clone());
                });
              }
            }
          }
        }
      } catch (err) {}
      if (!this._headerPreferenceCache) {
        this._headerPreferenceCache = new Map();
      }

      componentsToMove.forEach((comp) => {
        const copyHeaderAttr = comp.getAttributes?.()["data-copy-header"];
        if (copyHeaderAttr !== undefined) {
          const tableId =
            comp.getAttributes?.()["data-original-table-id"] || comp.getId();
          this._headerPreferenceCache.set(tableId, copyHeaderAttr === "true");
        }
      });

      setTimeout(() => {
        this.moveComponentsToPage(componentsToMove, nextPageIndex);
        setTimeout(() => {
          this.removeDuplicateRowsFromPreviousPage(pageIndex, componentsToMove);
          this.mergeSplitJsonTablesOnPage(pageIndex);
          this.mergeSplitJsonTablesOnPage(nextPageIndex);
        }, 500);
      }, 200);
    }, 700);

    return true;
  }

  removeDuplicateRowsFromPreviousPage(currentPageIndex, movedComponents) {
    if (!movedComponents || movedComponents.length === 0) {
      return;
    }

    const wrapper = this.editor.getWrapper();
    const currentPage = wrapper.find(
      `[data-page-index="${currentPageIndex}"]`,
    )[0];
    if (!currentPage) return;
    const currentContentArea = currentPage.find(".main-content-area")[0];
    if (!currentContentArea) return;
    const currentTables = currentContentArea.find(
      '[data-gjs-type="json-table"]',
    );

    currentTables.forEach((tableComp) => {
      const tableEl = tableComp.getEl();
      if (!tableEl) return;
      const tableSharedId = this.syncJsonTableSourceId(tableComp);

      const tbody = tableEl.querySelector("tbody");
      if (!tbody || !tbody.rows) return;

      const rows = Array.from(tbody.rows);
      if (rows.length === 0) return;

      const movedTableData = [];
      movedComponents.forEach((comp) => {
        const movedSharedId = this.getJsonTableSourceId(comp);
        if (tableSharedId && movedSharedId && tableSharedId !== movedSharedId) {
          return;
        }

        const compEl = comp.getEl();
        if (
          compEl &&
          (compEl.tagName === "TABLE" || compEl.querySelector("table"))
        ) {
          const movedTbody =
            compEl.querySelector("tbody") ||
            compEl.querySelector("table tbody");
          if (movedTbody && movedTbody.rows) {
            Array.from(movedTbody.rows).forEach((row) => {
              const cellData = Array.from(row.cells).map((cell) =>
                cell.textContent.trim(),
              );
              movedTableData.push(cellData);
            });
          }
        }
      });

      if (movedTableData.length === 0) return;

      const rowsToRemove = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const currentRowData = Array.from(rows[i].cells).map((cell) =>
          cell.textContent.trim(),
        );

        const isDuplicate = movedTableData.some((movedRow) => {
          if (movedRow.length !== currentRowData.length) return false;
          return movedRow.every((cell, idx) => cell === currentRowData[idx]);
        });

        if (isDuplicate) {
          rowsToRemove.push(i);
        } else {
          break;
        }
      }

      if (rowsToRemove.length > 0) {
        const tbodyComp = tableComp.find("tbody")[0];
        if (tbodyComp) {
          const rowComps = tbodyComp.components();
          rowsToRemove.forEach((rowIndex) => {
            const rowComp = rowComps.at(rowIndex);
            if (rowComp) {
              rowComp.remove();
            }
          });
        }

        rowsToRemove.forEach((rowIndex) => {
          if (tbody.rows[rowIndex]) {
            tbody.deleteRow(rowIndex);
          }
        });
      }
    });
  }

  getJsonTableDomTable(componentOrElement) {
    try {
      const el =
        componentOrElement && componentOrElement.getEl
          ? componentOrElement.getEl()
          : componentOrElement;
      if (!el) return null;
      return el.tagName === "TABLE" ? el : el.querySelector?.("table");
    } catch (error) {
      return null;
    }
  }

  getJsonTableSourceId(componentOrElement) {
    try {
      const attrs =
        componentOrElement && componentOrElement.getAttributes
          ? componentOrElement.getAttributes() || {}
          : {};

      let sharedId =
        attrs["data-source-table-id"] || attrs["data-original-table-id"] || "";

      if (!sharedId && componentOrElement && componentOrElement.getAttribute) {
        sharedId =
          componentOrElement.getAttribute("data-source-table-id") ||
          componentOrElement.getAttribute("data-original-table-id") ||
          "";
      }

      const tableEl = this.getJsonTableDomTable(componentOrElement);
      if (!sharedId && tableEl) {
        sharedId =
          tableEl.getAttribute("data-source-table-id") ||
          tableEl.getAttribute("data-original-table-id") ||
          tableEl.id ||
          "";
      }

      if (
        !sharedId &&
        componentOrElement &&
        typeof componentOrElement.getId === "function"
      ) {
        sharedId = componentOrElement.getId() || "";
      }

      return sharedId || "";
    } catch (error) {
      return "";
    }
  }

  syncJsonTableSourceId(component, fallbackId = "") {
    if (!component) return "";

    let sharedId = fallbackId || this.getJsonTableSourceId(component);
    if (!sharedId) {
      const seed =
        component.cid ||
        (typeof component.getId === "function" && component.getId()) ||
        Date.now();
      sharedId = `json-table-source-${seed}`;
    }

    try {
      component.addAttributes?.({
        "data-source-table-id": sharedId,
      });
    } catch (error) {}

    try {
      const tableEl = this.getJsonTableDomTable(component);
      if (tableEl) {
        tableEl.setAttribute("data-source-table-id", sharedId);
      }
    } catch (error) {}

    return sharedId;
  }

  mergeJsonTableStateData(targetComponent, sourceComponent) {
    const parseState = (component) => {
      try {
        const encoded = component?.getAttributes?.()["data-json-state"];
        if (!encoded) return null;
        return JSON.parse(decodeURIComponent(encoded));
      } catch (error) {
        return null;
      }
    };

    const targetState = parseState(targetComponent);
    const sourceState = parseState(sourceComponent);
    if (!targetState || !sourceState) return;

    const targetData = Array.isArray(targetState.data) ? targetState.data : [];
    const sourceData = Array.isArray(sourceState.data) ? sourceState.data : [];
    const mergedData = [...targetData, ...sourceData];

    targetState.data = mergedData;
    targetState.dataRows = mergedData.length;

    try {
      targetComponent.addAttributes?.({
        "data-json-state": encodeURIComponent(JSON.stringify(targetState)),
      });
    } catch (error) {}

    try {
      targetComponent.set?.("table-data", mergedData, { silent: true });
      targetComponent.set?.("custom-data", mergedData, { silent: true });

      if (targetState.headers) {
        targetComponent.set?.("table-headers", targetState.headers, {
          silent: true,
        });
        targetComponent.set?.("custom-headers", targetState.headers, {
          silent: true,
        });
      }
    } catch (error) {}
  }

  extractRenderedJsonTableData(component, fallbackHeaders = null) {
    const result = {
      headers: fallbackHeaders || null,
      data: [],
    };

    try {
      const tableEl = this.getJsonTableDomTable(component);
      if (!tableEl) return result;

      const stateHeaders =
        component?.get?.("custom-headers") ||
        component?.get?.("table-headers") ||
        null;

      const headerCells = Array.from(
        tableEl.querySelectorAll("thead th, thead td"),
      );
      const bodyRows = Array.from(tableEl.querySelectorAll("tbody > tr"));

      let headerMap = fallbackHeaders || stateHeaders || null;

      if (!headerMap && headerCells.length) {
        headerMap = {};
        headerCells.forEach((cell, index) => {
          const key =
            cell.getAttribute("data-column-key") ||
            `column_${index}`;
          headerMap[key] = cell.textContent.trim();
        });
      }

      const headerKeys = headerMap ? Object.keys(headerMap) : [];
      result.headers = headerMap;

      bodyRows.forEach((row) => {
        const rowObj = {};
        const cells = Array.from(row.querySelectorAll("td, th"));

        cells.forEach((cell, index) => {
          const key =
            cell.getAttribute("data-column-key") ||
            headerKeys[index] ||
            `column_${index}`;
          rowObj[key] = cell.textContent.trim();
        });

        if (Object.keys(rowObj).length) {
          result.data.push(rowObj);
        }
      });
    } catch (error) {}

    return result;
  }

  mergeJsonTableComponents(targetComponent, sourceComponent) {
    if (!targetComponent || !sourceComponent || targetComponent === sourceComponent)
      return false;

    const parseState = (component) => {
      try {
        const encoded = component?.getAttributes?.()["data-json-state"];
        if (!encoded) return null;
        return JSON.parse(decodeURIComponent(encoded));
      } catch (error) {
        return null;
      }
    };

    const targetState = parseState(targetComponent) || {};
    const sourceState = parseState(sourceComponent) || {};

    const mergedHeaders =
      targetComponent.get?.("custom-headers") ||
      targetComponent.get?.("table-headers") ||
      targetState.headers ||
      sourceComponent.get?.("custom-headers") ||
      sourceComponent.get?.("table-headers") ||
      sourceState.headers ||
      null;

    const targetRendered = this.extractRenderedJsonTableData(
      targetComponent,
      mergedHeaders,
    );
    const sourceRendered = this.extractRenderedJsonTableData(
      sourceComponent,
      mergedHeaders,
    );

    const targetData = Array.isArray(targetRendered.data)
      ? targetRendered.data
      : [];
    const sourceData = Array.isArray(sourceRendered.data)
      ? sourceRendered.data
      : [];

    const mergedData = [...targetData, ...sourceData];
    if (!mergedData.length) return false;

    const targetSharedId = this.syncJsonTableSourceId(
      targetComponent,
      this.getJsonTableSourceId(targetComponent) ||
        this.getJsonTableSourceId(sourceComponent),
    );

    const mergedState = {
      ...(targetState || {}),
      headers: targetRendered.headers || sourceRendered.headers || mergedHeaders,
      data: mergedData,
      dataRows: mergedData.length,
      styles:
        targetState.styles ||
        sourceState.styles ||
        targetComponent.get?.("table-styles-applied") ||
        null,
      highlights:
        targetState.highlights ||
        sourceState.highlights ||
        targetComponent.get?.("highlight-conditions") ||
        [],
      filter:
        targetState.filter ||
        sourceState.filter || {
          column: targetComponent.get?.("filter-column") || null,
          value: targetComponent.get?.("filter-value") || null,
        },
      meta:
        targetState.meta || sourceState.meta || {
          tableType: targetComponent.get?.("table-type") || "standard",
          caption: targetComponent.get?.("caption") || "no",
          pageLength: targetComponent.get?.("page-length") || 10,
          pagination: targetComponent.get?.("pagination") || "no",
          search: targetComponent.get?.("search") || "no",
          fileDownload: targetComponent.get?.("file-download") || "",
        },
    };

    try {
      sourceComponent.remove?.();
    } catch (error) {}

    try {
      targetComponent.set?.("_remove-header-on-build", false, { silent: true });
      targetComponent.set?.("table-headers", mergedHeaders, { silent: true });
      targetComponent.set?.("custom-headers", mergedHeaders, { silent: true });
      targetComponent.set?.("table-data", mergedData, { silent: true });
      targetComponent.set?.("custom-data", mergedData, { silent: true });
      targetComponent.set?.("show-placeholder", false, { silent: true });
      targetComponent.addAttributes?.({
        "data-source-table-id": targetSharedId,
        "data-original-table-id":
          targetComponent.getAttributes?.()["data-original-table-id"] ||
          targetSharedId,
        "data-json-state": encodeURIComponent(JSON.stringify(mergedState)),
      });
    } catch (error) {}

    try {
      if (typeof targetComponent.updateTableHTML === "function") {
        targetComponent.updateTableHTML();
      } else if (
        targetComponent.view &&
        typeof targetComponent.view.render === "function"
      ) {
        targetComponent.view.render();
      }
    } catch (error) {}

    setTimeout(() => {
      try {
        targetComponent.set?.("table-data", mergedData, { silent: true });
        targetComponent.set?.("custom-data", mergedData, { silent: true });
        if (typeof targetComponent.updateDataJsonState === "function") {
          targetComponent.updateDataJsonState();
        }
        if (
          targetComponent.get?.("table-styles-applied") &&
          typeof targetComponent.applyTableStyles === "function"
        ) {
          targetComponent.applyTableStyles();
        }
      } catch (error) {}

      try {
        const targetTableEl = this.getJsonTableDomTable(targetComponent);
        if (!targetTableEl) return;

        targetTableEl.setAttribute("data-source-table-id", targetSharedId);
        const allCells = targetTableEl.querySelectorAll("td, th");
        allCells.forEach((cell) => {
          cell.setAttribute("contenteditable", "true");
        });

        if (typeof this.reattachAllCellHandlers === "function" && targetTableEl.id) {
          this.reattachAllCellHandlers(targetTableEl.id);
        }
      } catch (error) {}
    }, 180);

    return true;
  }

  mergeSplitJsonTablesOnPage(pageIndex) {
    try {
      const wrapper = this.editor.getWrapper();
      const pageComponent = wrapper.find(`[data-page-index="${pageIndex}"]`)[0];
      if (!pageComponent) return;

      const mainContentArea = pageComponent.find(".main-content-area")[0];
      if (!mainContentArea) return;

      const orderedTables = [];
      const jsonTableComponents = mainContentArea.find('[data-gjs-type="json-table"]');
      jsonTableComponents.forEach((component) => {
        const isJsonTable =
          component?.get?.("type") === "json-table" ||
          component?.getAttributes?.()["data-gjs-type"] === "json-table" ||
          component?.getEl?.()?.classList?.contains("json-table-container");

        if (!isJsonTable) return;

        const sharedId = this.syncJsonTableSourceId(component);
        if (!sharedId) return;

        orderedTables.push({ component, sharedId });
      });

      const groupedBySharedId = new Map();
      orderedTables.forEach(({ component, sharedId }) => {
        if (!groupedBySharedId.has(sharedId)) {
          groupedBySharedId.set(sharedId, []);
        }
        groupedBySharedId.get(sharedId).push(component);
      });

      groupedBySharedId.forEach((componentsForId) => {
        if (!componentsForId || componentsForId.length < 2) return;

        const targetComponent =
          componentsForId.find((component) => {
            const attrs = component?.getAttributes?.() || {};
            return (
              attrs["data-split-table"] !== "continuation" &&
              attrs["data-continuation-table"] !== "true"
            );
          }) || componentsForId[0];

        componentsForId.forEach((component) => {
          if (component !== targetComponent) {
            this.mergeJsonTableComponents(targetComponent, component);
          }
        });
      });
    } catch (error) {}
  }

  handleTableSplit(component, compEl, remainingSpace, maxHeight) {
    let tableEl =
      compEl && compEl.tagName === "TABLE"
        ? compEl
        : compEl?.querySelector?.("table");
    const sharedTableId = this.syncJsonTableSourceId(
      component,
      this.getJsonTableSourceId(component) ||
        tableEl?.getAttribute("data-source-table-id") ||
        tableEl?.id ||
        "",
    );

    try {
      if (sharedTableId) {
        const editor = this.editor;
        const allJsonTables = editor.getWrapper().find('[data-gjs-type="json-table"]');

        allJsonTables.forEach((ct) => {
          const attrs = ct.getAttributes ? ct.getAttributes() : {};
          const isContinuation =
            attrs["data-split-table"] === "continuation" ||
            attrs["data-continuation-table"] === "true";
          const continuationSharedId = this.getJsonTableSourceId(ct);

          if (
            ct !== component &&
            isContinuation &&
            continuationSharedId === sharedTableId
          ) {
            ct.remove();
          }
        });
      }
    } catch (e) {}

    try {
      function preserveColumnWidths(sourceTable, targetTable) {
        try {
          const sourceHeaders = sourceTable.querySelectorAll("thead th");
          const targetHeaders = targetTable.querySelectorAll("thead th");

          sourceHeaders.forEach((th, index) => {
            if (targetHeaders[index]) {
              const width = window.getComputedStyle(th).width;
              targetHeaders[index].style.width = width;
              targetHeaders[index].style.minWidth = width;
              targetHeaders[index].style.maxWidth = width;
            }
          });
        } catch (err) {}
      }

      if (!tableEl) {
        return {
          keepComponent: null,
          moveComponent: component,
          keptRowCount: 0,
          movedRowCount: 0,
        };
      }

      const tbodyComp =
        component.find && component.find("tbody")
          ? component.find("tbody")[0]
          : null;
      const tbody =
        tableEl.querySelector("tbody") ||
        (tbodyComp && tbodyComp.getEl && tbodyComp.getEl());

      const domTbodyRows = tableEl.querySelectorAll
        ? Array.from(tableEl.querySelectorAll("tbody > tr"))
        : [];
      if (!tbody || domTbodyRows.length === 0) {
        return {
          keepComponent: null,
          moveComponent: component,
          keptRowCount: 0,
          movedRowCount: 0,
        };
      }

      const dtWrapper = compEl.querySelector(".dataTables_wrapper");
      const dtInfo = dtWrapper?.querySelector(".dataTables_info");
      const dtPaginate = dtWrapper?.querySelector(".dataTables_paginate");
      const dtButtons = dtWrapper?.querySelector(".dt-buttons");

      let controlsHeight = 0;
      if (dtInfo) controlsHeight += dtInfo.offsetHeight + 10;
      if (dtPaginate) controlsHeight += dtPaginate.offsetHeight + 10;
      if (dtButtons) controlsHeight += dtButtons.offsetHeight + 10;

      const rows = domTbodyRows;
      const headerHeight = tableEl.querySelector("thead")?.offsetHeight || 0;
      const footerHeight = tableEl.querySelector("tfoot")?.offsetHeight || 0;
      const availableHeight =
        remainingSpace - headerHeight - footerHeight - controlsHeight - 10;

      if (availableHeight < 100) {
        return {
          keepComponent: null,
          moveComponent: component,
          keptRowCount: 0,
          movedRowCount: 0,
        };
      }

      let accumulatedRowHeight = 0;
      let rowsToKeep = 0;
      for (let i = 0; i < rows.length; i++) {
        const rowHeight = rows[i].offsetHeight || 0;
        if (accumulatedRowHeight + rowHeight <= availableHeight) {
          accumulatedRowHeight += rowHeight;
          rowsToKeep++;
        } else {
          break;
        }
      }

      const MIN_ROWS_TO_SPLIT = 3;
      if (rowsToKeep < MIN_ROWS_TO_SPLIT) {
        return {
          keepComponent: null,
          moveComponent: component,
          keptRowCount: 0,
          movedRowCount: 0,
        };
      }

      if (rowsToKeep === rows.length) {
        return {
          keepComponent: component,
          moveComponent: null,
          keptRowCount: rowsToKeep,
          movedRowCount: 0,
        };
      }

      let dtSettings = null;
      const tableId = tableEl.id;
      try {
        if (
          tableId &&
          typeof $ !== "undefined" &&
          $.fn &&
          $.fn.DataTable &&
          $.fn.DataTable.isDataTable &&
          $.fn.DataTable.isDataTable(`#${tableId}`)
        ) {
          const dt = $(`#${tableId}`).DataTable();
          const info = dt.page ? dt.page.info() : {};
          dtSettings = {
            paging: !!info.length,
            pageLength: info.length || dt.page.len?.() || null,
            searching: dt.settings && dt.settings()[0]?.oFeatures?.bFilter,
            ordering: dt.settings && dt.settings()[0]?.aaSorting,
            buttons:
              (dt.buttons &&
                dt.buttons().container &&
                dt.buttons().context?.[0]?.inst?.s?.buttons) ||
              [],
          };
          try {
            dt.destroy();
          } catch (e) {}
        }
      } catch (err) {}

      const rowsToMoveHTML = [];
      for (let i = rowsToKeep; i < rows.length; i++) {
        rowsToMoveHTML.push(rows[i].outerHTML);
      }

      if (tbodyComp && typeof tbodyComp.components === "function") {
        const rowComponents = tbodyComp.components();
        const totalRows = rowComponents.length;
        for (let i = totalRows - 1; i >= rowsToKeep; i--) {
          const rowComp = rowComponents.at(i);
          if (rowComp) {
            try {
              rowComp.remove();
            } catch (err) {}
          }
        }
      }

      for (let i = rows.length - 1; i >= rowsToKeep; i--) {
        if (rows[i] && rows[i].parentNode) {
          try {
            rows[i].parentNode.removeChild(rows[i]);
          } catch (err) {}
        }
      }

      setTimeout(() => {
        try {
          const currentTbodyComp =
            component.find && component.find("tbody")
              ? component.find("tbody")[0]
              : null;
          if (
            currentTbodyComp &&
            typeof currentTbodyComp.components === "function"
          ) {
            const remainingRows = currentTbodyComp.components().length;
          }
          if (component.view && typeof component.view.render === "function")
            component.view.render();
        } catch (e) {}
      }, 120);

      setTimeout(() => {
        const keptEl = component.getEl();
        if (!keptEl) {
          return;
        }

        const keptTableEl = keptEl.querySelector("table") || keptEl;
        if (!keptTableEl) {
          return;
        }

        const tdCells = keptTableEl.querySelectorAll("td, th");
        tdCells.forEach((cell, i) => {
          cell.setAttribute("contenteditable", "true");
        });

        const cellComponents = component.find("td, th");
        cellComponents.forEach((cellComp, i) => {
          cellComp.addAttributes({ contenteditable: "true" });
          cellComp.set({ editable: true });
        });

        const pageSetupManager =
          editor.PageSetupManager || window.pageSetupManager;
        if (
          pageSetupManager &&
          typeof pageSetupManager.reattachAllCellHandlers === "function"
        ) {
          const keptTableId = keptTableEl.id;
          if (keptTableId) {
            pageSetupManager.reattachAllCellHandlers(keptTableId);
          } else {
          }
        }
      }, 400);

      let copyHeader = false;
      const hasThead = !!tableEl.querySelector("thead");
      if (hasThead && rowsToKeep > 0 && rowsToMoveHTML.length > 0) {
        copyHeader = confirm(
          "Do you want to repeat the table header on the next page?\n\nClick OK to include header\nClick Cancel to skip header",
        );
      }

      const continuationTableEl = tableEl.cloneNode(false);
      const continuationThead = copyHeader
        ? tableEl.querySelector("thead")?.cloneNode(true)
        : null;
      const continuationTbody = document.createElement("tbody");
      const continuationTfoot = tableEl.querySelector("tfoot")?.cloneNode(true);

      if (copyHeader && continuationThead) {
        continuationTableEl.appendChild(continuationThead);
        try {
          preserveColumnWidths(tableEl, continuationTableEl);
        } catch (err) {}
      } else {
      }

      continuationTableEl.appendChild(continuationTbody);
      if (continuationTfoot) continuationTableEl.appendChild(continuationTfoot);
      continuationTbody.innerHTML = rowsToMoveHTML.join("");
      const continuationWrapper = compEl.cloneNode(false);
      continuationWrapper.innerHTML = "";
      const newTableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      continuationTableEl.id = newTableId;
      if (sharedTableId) {
        continuationTableEl.setAttribute("data-source-table-id", sharedTableId);
      }
      continuationWrapper.appendChild(continuationTableEl);

      let modifiedState = null;
      const originalStateAttr =
        component.getAttributes && component.getAttributes()["data-json-state"];
      if (originalStateAttr) {
        try {
          const stateData = JSON.parse(decodeURIComponent(originalStateAttr));
          if (stateData && Array.isArray(stateData.data)) {
            stateData.data = stateData.data.slice(rowsToKeep);
            stateData.dataRows = stateData.data.length;
            modifiedState = encodeURIComponent(JSON.stringify(stateData));
          }
        } catch (err) {}
      }

      const preserveAllSettings = () => {
        const settings = {};
        const allSettings = [
          "table-border-style",
          "table-border-width",
          "table-border-color",
          "table-border-opacity",
          "table-bg-color",
          "table-text-color",
          "table-font-family",
          "table-text-align",
          "table-vertical-align",
          "highlight-conditions",
          "highlight-color",
          "highlight-text-color",
          "highlight-font-family",
          "cell-styles",
          "table-styles-applied",
          "filter-column",
          "filter-value",
          "json-path",
          "json-file-index",
          "name",
          "footer",
          "pagination",
          "page-length",
          "search",
          "caption",
          "caption-align",
          "file-download",
          "grouping-fields",
          "summary-fields",
          "summary-at-field",
          "sort-order",
          "top-n",
          "merge-group-cells",
          "summarize-group",
        ];

        allSettings.forEach((key) => {
          const value = component.get(key);
          if (value !== undefined && value !== null) {
            settings[key] = value;
          }
        });
        return settings;
      };

      const preservedSettings = preserveAllSettings();
      const newComponentConfig = {
        type: (component.get && component.get("type")) || "default",
        tagName: (component.get && component.get("tagName")) || "div",
        content: continuationWrapper.outerHTML,
        attributes: {
          ...component.getAttributes(),
          "data-continuation-table": "true",
          "data-original-table-id": sharedTableId || tableId || "",
          "data-source-table-id": sharedTableId || tableId || "",
          "data-rows-kept": rowsToKeep,
          "data-split-table": "continuation",
          "data-copy-header": copyHeader ? "true" : "false",
        },
        classes: [...(component.getClasses ? component.getClasses() : [])],
        style: { ...(component.getStyle ? component.getStyle() : {}) },
        ...preservedSettings,
      };

      if (modifiedState) {
        newComponentConfig.attributes["data-json-state"] = modifiedState;
      }

      const newComponent =
        this.editor.Components.addComponent(newComponentConfig);

      setTimeout(() => {
        if (!newComponent) return;
        Object.entries(preservedSettings).forEach(([key, value]) => {
          try {
            newComponent.set(key, value);
          } catch (e) {}
        });

        if (newComponent.view && newComponent.view.render) {
          newComponent.view.render();
        }
      }, 250);

      if (!copyHeader && newComponent) {
        setTimeout(() => {
          const theadComp = newComponent.find("thead")[0];
          if (theadComp) {
            theadComp.remove();
            const newTableEl = newComponent.getEl()?.querySelector("table");
            if (newTableEl) {
              const theadEl = newTableEl.querySelector("thead");
              if (theadEl) {
                theadEl.remove();
              }
            }
            if (newComponent.view && newComponent.view.render) {
              newComponent.view.render();
            }
          }
        }, 100);
      }

      if (dtSettings && tableId) {
        setTimeout(() => {
          try {
            const keptTableEl = component.getEl()?.querySelector("table");
            if (
              keptTableEl &&
              typeof $ !== "undefined" &&
              $.fn &&
              $.fn.DataTable
            ) {
              if ($.fn.DataTable.isDataTable(keptTableEl)) {
                try {
                  $(keptTableEl).DataTable().destroy();
                } catch (e) {}
              }
              $(keptTableEl).DataTable({
                paging: false,
                searching: false,
                ordering: false,
                info: false,
              });
            }
          } catch (err) {}
        }, 300);
      }

      setTimeout(() => {
        try {
          const originalTbodyComp =
            component.find && component.find("tbody")
              ? component.find("tbody")[0]
              : null;
          if (
            originalTbodyComp &&
            typeof originalTbodyComp.components === "function"
          ) {
            const rowsLeft = originalTbodyComp.components().length;
            if (rowsLeft !== rowsToKeep) {
              const allRows = originalTbodyComp.components();
              for (let i = allRows.length - 1; i >= rowsToKeep; i--) {
                try {
                  allRows.at(i).remove();
                } catch (err) {}
              }
            }
          }
        } catch (err) {}
      }, 200);

      return {
        keepComponent: component,
        moveComponent: newComponent,
        keptRowCount: rowsToKeep,
        movedRowCount: rowsToMoveHTML.length,
      };
    } catch (error) {
      return {
        keepComponent: null,
        moveComponent: component,
        keptRowCount: 0,
        movedRowCount: 0,
      };
    }
  }

  splitLargeComponent(component, availableSpace) {
    const compEl = component.getEl();

    if (!compEl || component.get("type") !== "formatted-rich-text") {
      return { keepComponent: component, moveComponent: null };
    }

    const currentHeight = compEl.scrollHeight;

    if (currentHeight <= availableSpace + 50) {
      return { keepComponent: component, moveComponent: null };
    }

    const computed = window.getComputedStyle(compEl);
    const preservedStyles = {};

    [
      "display",
      "position",
      "width",
      "margin",
      "padding",
      "border",
      "background",
      "background-color",
      "color",
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "text-align",
      "line-height",
      "letter-spacing",
      "text-decoration",
      "text-transform",
      "vertical-align",
      "white-space",
      "word-wrap",
      "word-break",
      "overflow-wrap",
    ].forEach((prop) => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== "none" && value !== "normal") {
        preservedStyles[prop] = value;
      }
    });
    // Do not carry fixed heights to overflow fragments; it can force full-page height on next page.
    delete preservedStyles.height;
    delete preservedStyles["min-height"];
    delete preservedStyles["max-height"];

    const originalHTML = compEl.innerHTML;
    const originalNodes = Array.from(compEl.childNodes);

    if (originalNodes.length === 0) {
      return { keepComponent: component, moveComponent: null };
    }

    const originalHeight = compEl.style.height;
    const originalOverflow = compEl.style.overflow;
    const originalDisplay = compEl.style.display;
    compEl.style.height = "auto";
    compEl.style.overflow = "visible";
    compEl.style.display = "block";
    compEl.offsetHeight;

    const nodesToMove = [];
    compEl.innerHTML = "";

    for (let i = 0; i < originalNodes.length; i++) {
      const node = originalNodes[i];

      compEl.appendChild(node);

      const currentContentHeight = compEl.scrollHeight;
      compEl.offsetHeight;
      if (currentContentHeight > availableSpace) {
        compEl.removeChild(node);

        if (node.nodeType === Node.TEXT_NODE) {
          const fullText = node.textContent;
          const { textToKeep, textToMove } = this._splitLongTextNode(
            fullText,
            compEl,
            availableSpace,
          );

          if (
            textToKeep &&
            textToKeep.length > 0 &&
            textToMove &&
            textToMove.length > 0
          ) {
            node.textContent = textToKeep;

            compEl.appendChild(node);
            const newNodeToMove = document.createTextNode(textToMove);
            nodesToMove.push(newNodeToMove, ...originalNodes.slice(i + 1));
            break;
          }
        }

        nodesToMove.push(node, ...originalNodes.slice(i + 1));
        break;
      }
    }
    compEl.style.height = originalHeight;
    compEl.style.overflow = originalOverflow;
    compEl.style.display = originalDisplay;
    compEl.offsetHeight;

    if (nodesToMove.length === 0) {
      compEl.innerHTML = originalHTML;
      return { keepComponent: component, moveComponent: null };
    }

    const contentThatFits = compEl.innerHTML;

    if (!contentThatFits || contentThatFits.trim() === "") {
      compEl.innerHTML = originalHTML;
      return { keepComponent: component, moveComponent: null };
    }

    component.set("content", contentThatFits);
    component.setStyle(preservedStyles);
    component.removeStyle(["height", "max-height", "min-height"]);

    let secondPartHTML = "";
    nodesToMove.forEach((node) => {
      if (node.outerHTML) {
        secondPartHTML += node.outerHTML;
      } else if (node.textContent) {
        secondPartHTML += node.textContent;
      }
    });

    if (!secondPartHTML || secondPartHTML.trim() === "") {
      return { keepComponent: component, moveComponent: null };
    }

    const newComponent = this.editor.Components.addComponent({
      type: component.get("type"),
      tagName: component.get("tagName") || "div",
      content: secondPartHTML,
      style: preservedStyles,
      attributes: { ...component.getAttributes() },
      classes: component.getClasses(),
    });

    if (newComponent.view) {
      newComponent.view.render();
    }
    return {
      keepComponent: component,
      moveComponent: newComponent,
    };
  }

  _splitLongTextNode(fullText, containerEl, availableSpace) {
    let textToKeep = "";
    const testNode = document.createTextNode("");
    const originalHeight = containerEl.style.height;
    const originalOverflow = containerEl.style.overflow;
    const originalDisplay = containerEl.style.display;
    containerEl.style.height = "auto";
    containerEl.style.overflow = "visible";
    containerEl.style.display = "block";
    containerEl.offsetHeight;
    containerEl.appendChild(testNode);

    for (let charIndex = 0; charIndex < fullText.length; charIndex++) {
      textToKeep += fullText[charIndex];
      testNode.textContent = textToKeep;
      containerEl.offsetHeight;
      if (containerEl.scrollHeight > availableSpace) {
        textToKeep = textToKeep.substring(0, textToKeep.length - 1);

        if (textToKeep.length === 0) {
          break;
        }
        break;
      }
    }

    containerEl.removeChild(testNode);
    containerEl.style.height = originalHeight;
    containerEl.style.overflow = originalOverflow;
    containerEl.style.display = originalDisplay;
    containerEl.offsetHeight;

    const textToMove = fullText.substring(textToKeep.length);

    return { textToKeep, textToMove };
  }

  findGoodBreakPoint(text, targetPosition) {
    const searchStart = Math.max(0, targetPosition - 200);
    const searchEnd = Math.min(text.length, targetPosition + 200);

    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === "." && i + 1 < text.length && text[i + 1] === " ") {
        return i + 2;
      }
    }

    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === "\n") {
        return i + 1;
      }
    }

    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === " ") {
        return i + 1;
      }
    }

    return targetPosition;
  }

  onSectionMovedToNewPage(sectionComponent, newPageIndex) {
    const sectionCount = sectionComponent.getAttributes()["data-section-count"];

    if (
      this.pageSettings.sectionConditionalPageBreak?.enabled &&
      sectionCount
    ) {
      setTimeout(() => {
        this.applySectionConditionalBreakToSection(
          sectionComponent,
          sectionCount,
          newPageIndex,
        );
      }, 300);
    }
  }

  async moveComponentsToPage(components, targetPageIndex) {
    try {
      const originalFirstComponent = components && components[0];
      const actualComponentsToMove = [];
      for (const component of components) {
        const isSubreport =
          (typeof component.get === "function" &&
            component.get("type") === "subreport") ||
          (component.getEl &&
            component.getEl()?.classList?.contains("subreport-block"));

        if (isSubreport) {
          const children = component.components && component.components();

          if (children && children.length > 0) {
            children.forEach((child) => {
              try {
                if (typeof child.addAttributes === "function") {
                  child.addAttributes({ "data-subreport-content": "true" });
                } else if (child.getAttributes && child.getAttributes()) {
                  const attrs = child.getAttributes() || {};
                  attrs["data-subreport-content"] = "true";
                  if (typeof child.addAttributes === "function")
                    child.addAttributes(attrs);
                }
              } catch (e) {}

              actualComponentsToMove.push(child);
            });

            try {
              component.components().reset();
            } catch (e) {}
          } else {
            actualComponentsToMove.push(component);
          }
        } else {
          actualComponentsToMove.push(component);
        }
      }

      const wrapper = this.editor.getWrapper();
      const targetPageComponent = wrapper.find(
        `[data-page-index="${targetPageIndex}"]`,
      )[0];
      if (!targetPageComponent) {
        return false;
      }

      let targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        return false;
      }

      let sourceSectionCount = null;
      const firstComponent = originalFirstComponent;
      if (firstComponent) {
        const sourceSection =
          firstComponent.closest &&
          firstComponent.closest(".sections-container");
        if (sourceSection) {
          sourceSectionCount =
            sourceSection.getAttributes &&
            sourceSection.getAttributes()["data-section-count"];
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      let targetSection = targetContentArea.find(".sections-container")[0];

      if (!targetSection && sourceSectionCount) {
        targetSection = targetContentArea.append({
          type: "Sections",
          attributes: {
            "data-section-count": sourceSectionCount,
          },
        })[0];

        const allPages = wrapper.find(".page-container");
        for (let page of allPages) {
          const existingSection = page.find(".sections-container")[0];
          if (existingSection) {
            const existingCount =
              existingSection.getAttributes &&
              existingSection.getAttributes()["data-section-count"];
            if (
              existingCount === sourceSectionCount &&
              existingSection !== targetSection
            ) {
              const sourceHeader = existingSection.find(".section-header")[0];
              const targetHeader = targetSection.find(".section-header")[0];

              if (sourceHeader && targetHeader) {
                targetHeader.components().reset();
                sourceHeader.components().forEach((comp) => {
                  targetHeader.append(comp.clone());
                });
              }
              break;
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      } else if (targetSection) {
        const existingCount =
          targetSection.getAttributes &&
          targetSection.getAttributes()["data-section-count"];
        if (sourceSectionCount && existingCount !== sourceSectionCount) {
          targetSection.addAttributes({
            "data-section-count": sourceSectionCount,
          });
        }
      }

      let finalTarget = targetContentArea;

      if (targetSection) {
        const sectionContent = targetSection.find(".section-content")[0];
        if (sectionContent) {
          finalTarget = sectionContent;
        } else {
          const namedContent = targetSection
            .components()
            .find(
              (c) =>
                c.get("name") === "Content" ||
                c.get("name") === "section Content",
            );
          if (namedContent) {
            finalTarget = namedContent;
          }
        }
      }

      targetContentArea = finalTarget;
      const observer = this.pageObservers.get(targetPageIndex);
      if (observer) observer.disconnect();

      let moved = 0;
      // Add overflow components at top of next page: iterate in reverse so first component ends up at top
      const componentsList = Array.from(actualComponentsToMove);
      for (let i = componentsList.length - 1; i >= 0; i--) {
        const component = componentsList[i];
        const index = i;
        if (!component) continue;

        try {
          const compEl = component.getEl && component.getEl();
          const isTable =
            compEl &&
            (compEl.tagName === "TABLE" ||
              compEl.querySelector("table") !== null ||
              compEl.classList.contains("json-table-container") ||
              compEl.classList.contains("json-data-table"));

          const isFromSubreport =
            (component.getAttributes &&
              component.getAttributes()["data-subreport-content"] === "true") ||
            false;
          if (isFromSubreport) {
          }

          if (isTable) {
            const attrs = component.getAttributes && component.getAttributes();
            const isSplitTable =
              attrs &&
              (attrs["data-split-table"] === "continuation" ||
                attrs["data-continuation-table"] === "true");

            const copyHeaderAttr = attrs && attrs["data-copy-header"];
            const shouldRemoveHeader = copyHeaderAttr === "false";

            let dtData = null;
            const tableEl =
              compEl.tagName === "TABLE"
                ? compEl
                : compEl.querySelector("table");

            if (
              !isSplitTable &&
              tableEl &&
              typeof $ !== "undefined" &&
              $.fn.DataTable &&
              $.fn.DataTable.isDataTable(tableEl)
            ) {
              const dt = $(tableEl).DataTable();
              dtData = {
                data: dt.rows().data().toArray(),
                columns: dt.settings()[0].aoColumns,
                order: dt.order(),
              };
              dt.destroy();
            }

            if (shouldRemoveHeader) {
              const theadComp =
                component.find &&
                component.find("thead") &&
                component.find("thead")[0];
              if (theadComp) {
                theadComp.remove();
              }

              if (tableEl) {
                const theadEl = tableEl.querySelector("thead");
                if (theadEl) {
                  theadEl.remove();
                }
              }
            }

            const fullHTML = component.toHTML();
            component.remove();
            const newComponent = targetContentArea.append(fullHTML)[0];
            if (newComponent) {
              try {
                targetContentArea.components().remove(newComponent);
                targetContentArea.components().add(newComponent, { at: 0 });
              } catch (e) {}
            }
            const componentType = component.get && component.get("type");
            const isSubreport = componentType === "subreport";
            const sharePageNumber =
              component.getAttributes &&
              component.getAttributes().sharePageNumber;

            if (isSubreport && sharePageNumber === false) {
              const targetPageSettings =
                this.pageSettings.pages[targetPageIndex];
              if (targetPageSettings) {
                targetPageSettings.isSubreportPage = true;
                targetPageSettings.skipPageNumber = true;
              }
            }

            setTimeout(() => {
              const newEl = newComponent.getEl && newComponent.getEl();
              if (!newEl) {
                return;
              }

              const tableEl = newEl.querySelector("table") || newEl;
              if (!tableEl) {
                return;
              }

              if (shouldRemoveHeader) {
                const theadComp =
                  newComponent.find &&
                  newComponent.find("thead") &&
                  newComponent.find("thead")[0];
                if (theadComp) {
                  theadComp.remove();
                }

                const theadEl = tableEl.querySelector("thead");
                if (theadEl) {
                  theadEl.remove();
                }

                if (newComponent.view && newComponent.view.render) {
                  newComponent.view.render();
                }
              }

              const tdCells = tableEl.querySelectorAll("td, th");
              tdCells.forEach((cell) => {
                cell.setAttribute("contenteditable", "true");
              });

              const cellComponents =
                newComponent.find && newComponent.find("td, th");
              (cellComponents || []).forEach((cellComp) => {
                try {
                  cellComp.addAttributes({ contenteditable: "true" });
                  cellComp.set({ editable: true });
                } catch (e) {}
              });

              const pageSetupManager =
                editor.PageSetupManager || window.pageSetupManager;
              if (
                pageSetupManager &&
                typeof pageSetupManager.reattachAllCellHandlers === "function"
              ) {
                const tableId = tableEl.id;
                if (tableId) {
                  pageSetupManager.reattachAllCellHandlers(tableId);
                }
              }

              if (dtData) {
                const newTableEl = newEl.querySelector("table") || newEl;
                if (newTableEl && typeof $ !== "undefined" && $.fn.DataTable) {
                  $(newTableEl).DataTable({
                    data: dtData.data,
                    columns: dtData.columns,
                    order: dtData.order,
                    paging: false,
                    searching: false,
                    info: false,
                  });
                }
              } else {
                const newTableEl = newEl.querySelector("table") || newEl;
                if (newTableEl && typeof $ !== "undefined" && $.fn.DataTable) {
                  if ($.fn.DataTable.isDataTable(newTableEl)) {
                    $(newTableEl).DataTable().destroy();
                  }
                  $(newTableEl).DataTable({
                    paging: false,
                    searching: false,
                    ordering: false,
                    info: false,
                  });
                }
              }
            }, 400);

            if (newComponent) {
              setTimeout(() => {
                const newTableEl = newComponent.getEl && newComponent.getEl();
                if (newTableEl) {
                  const allCells = newTableEl.querySelectorAll("td, th");
                  allCells.forEach((cell) => {
                    if (!cell.hasAttribute("contenteditable")) {
                      cell.setAttribute("contenteditable", "true");
                    }

                    const originalCell =
                      compEl.querySelector &&
                      compEl.querySelector(`#${cell.id}`);
                    if (originalCell) {
                      Array.from(originalCell.attributes).forEach((attr) => {
                        if (attr.name.startsWith("data-")) {
                          cell.setAttribute(attr.name, attr.value);
                        }
                      });
                    }
                  });
                }
              }, 300);

              moved++;
            }

            continue;
          }

          const clonedComponent = component.clone && component.clone();
          const fullHTML = component.toHTML && component.toHTML();
          const sourceEl = component.getEl && component.getEl();
          let computedStyles = {};
          if (sourceEl) {
            const computed = window.getComputedStyle(sourceEl);
            const stylesToCapture = [
              "display",
              "position",
              "width",
              "height",
              "margin",
              "padding",
              "border",
              "background",
              "color",
              "font-family",
              "font-size",
              "font-weight",
              "text-align",
              "line-height",
              "vertical-align",
              "flex",
              "flex-direction",
              "justify-content",
              "align-items",
              "grid",
              "grid-template-columns",
              "grid-gap",
              "overflow",
              "white-space",
              "word-wrap",
              "text-overflow",
              "box-sizing",
              "z-index",
              "opacity",
              "transform",
            ];
            stylesToCapture.forEach((prop) => {
              const value = computed.getPropertyValue(prop);
              if (value && value !== "none" && value !== "normal") {
                computedStyles[prop] = value;
              }
            });
          }

          const preservedData = {
            html: fullHTML,
            attributes: JSON.parse(
              JSON.stringify(
                (component.getAttributes && component.getAttributes()) || {},
              ),
            ),
            classes: [
              ...((component.getClasses && component.getClasses()) || []),
            ],
            style: JSON.parse(
              JSON.stringify(
                (component.getStyle && component.getStyle()) || {},
              ),
            ),
            computedStyles,
            name: component.get("name"),
            editable: component.get("editable"),
          };

          const parent = component.parent && component.parent();
          component.remove && component.remove();
          if (
            parent &&
            parent.components &&
            parent.components().length === 0 &&
            parent.getEl &&
            parent.getEl() &&
            parent.getEl().innerHTML.trim() === ""
          ) {
            parent.remove && parent.remove();
          }

          try {
            targetContentArea.components().add(clonedComponent, { at: 0 });
            moved++;
            continue;
          } catch (cloneError) {}

          try {
            const newComponent = targetContentArea.append(
              preservedData.html,
            )[0];
            if (newComponent) {
              const combinedStyles = {
                ...preservedData.computedStyles,
                ...preservedData.style,
              };
              newComponent.setStyle && newComponent.setStyle(combinedStyles);
              newComponent.addAttributes &&
                newComponent.addAttributes(preservedData.attributes);
              newComponent.setClass &&
                newComponent.setClass(preservedData.classes);
              newComponent.set &&
                newComponent.set({ editable: preservedData.editable });
              try {
                targetContentArea.components().remove(newComponent);
                targetContentArea.components().add(newComponent, { at: 0 });
              } catch (e) {}
              moved++;
            }
          } catch (reconstructError) {}
        } catch (err) {
          console.error(`❌ Error moving component ${index}:`);
        }
      }

      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 300);

      setTimeout(() => {
        const targetPage = wrapper.find(
          `[data-page-index="${targetPageIndex}"]`,
        )[0];
        if (targetPage) {
          const sectionsContainer = targetPage.find(".sections-container")[0];
          if (sectionsContainer) {
            this.onSectionMovedToNewPage(sectionsContainer, targetPageIndex);
          }
        }
      }, 500);

      setTimeout(() => {
        this.mergeSplitJsonTablesOnPage(targetPageIndex);
      }, 650);

      return moved > 0;
    } catch (error) {
      console.error("❌ Error in moveComponentsToPage:");
      return false;
    }
  }

  getAccurateComponentHeight(element) {
    if (!element) return 0;

    if (
      element.classList.contains("json-table-wrapper") ||
      element.classList.contains("json-table-container")
    ) {
      const table = element.querySelector("table");
      if (table) {
        table.offsetHeight;

        const wrapper = element.querySelector(".dataTables_wrapper");
        if (wrapper) {
          const wrapperHeight = wrapper.scrollHeight;
          const computedStyle = window.getComputedStyle(wrapper);
          const marginTop = parseFloat(computedStyle.marginTop) || 0;
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

          const buffer = 30;
          return wrapperHeight + marginTop + marginBottom + buffer;
        }

        const thead = table.querySelector("thead");
        const tbody = table.querySelector("tbody");
        const tfoot = table.querySelector("tfoot");

        let totalHeight = 0;
        if (thead) totalHeight += thead.offsetHeight;
        if (tbody) {
          Array.from(tbody.rows).forEach((row) => {
            totalHeight += row.offsetHeight;
          });
        }
        if (tfoot) totalHeight += tfoot.offsetHeight;

        const tableStyle = window.getComputedStyle(table);
        const marginTop = parseFloat(tableStyle.marginTop) || 0;
        const marginBottom = parseFloat(tableStyle.marginBottom) || 0;

        return totalHeight + marginTop + marginBottom + 30;
      }
    }

    element.offsetHeight;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const scrollHeight = element.scrollHeight;
    const offsetHeight = element.offsetHeight;
    const rectHeight = Math.ceil(rect.height);
    const contentHeight = Math.max(scrollHeight, offsetHeight, rectHeight);
    const totalHeight = contentHeight + marginTop + marginBottom;

    return totalHeight;
  }

  clearAllObservers() {
    this.pageObservers.forEach((observer, pageIndex) => {
      if (observer) {
        observer.disconnect();
      }
    });
    this.pageObservers.clear();

    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  setupPageObserver(pageIndex) {
    const pageComponent = this.editor
      .getWrapper()
      .find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;
    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;
    const contentEl = contentArea.getEl();
    if (!contentEl) return;
    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
    }

    let lastContentHeight = contentEl.scrollHeight;

    const observer = new MutationObserver((mutations) => {
      const activeEl = document.activeElement;
      const isEditing =
        activeEl &&
        (activeEl.isContentEditable ||
          ["TEXTAREA", "INPUT"].includes(activeEl.tagName));

      if (isEditing) return;

      const sectionsContainer = contentArea
        .components()
        .find((c) => c.getClasses().includes("sections-container"));

      let currentSectionContent = null;
      if (sectionsContainer) {
        currentSectionContent =
          sectionsContainer.find(".section-content")[0] ||
          sectionsContainer
            .components()
            .find((c) => c.get("name") === "Content");
      }

      const targetEl = currentSectionContent
        ? currentSectionContent.getEl()
        : contentEl;
      const currentHeight = targetEl.scrollHeight;
      const heightDiff = Math.abs(currentHeight - lastContentHeight);
      if (heightDiff < 20) return;

      lastContentHeight = currentHeight;
      const hasDOMChange = mutations.some(
        (m) =>
          m.type === "childList" &&
          (m.addedNodes.length || m.removedNodes.length),
      );
      if (!hasDOMChange) return;

      if (this.debounceTimers.has(pageIndex)) {
        clearTimeout(this.debounceTimers.get(pageIndex));
      }

      const timer = setTimeout(() => {
        if (this.paginationInProgress) return;

        observer.disconnect();
        this.handleAutoPagination(pageIndex);

        setTimeout(() => {
          const obs = this.pageObservers.get(pageIndex);
          if (obs) {
            obs.observe(contentEl, { childList: true, subtree: true });
          }
        }, 500);
      }, 500);

      this.debounceTimers.set(pageIndex, timer);
    });

    observer.observe(contentEl, { childList: true, subtree: true });

    this.pageObservers.set(pageIndex, observer);
  }
  restoreCellEditability(tableElement) {
    if (!tableElement) return;

    const allCells = tableElement.querySelectorAll("td, th");

    allCells.forEach((cell) => {
      cell.setAttribute("contenteditable", "true");
      if (!cell.hasAttribute("data-gjs-type")) {
        cell.setAttribute("data-gjs-type", "json-table-cell");
      }
      cell.style.cursor = "text";
      cell.addEventListener("mouseenter", () => {
        cell.style.outline = "1px dashed #3b97e3";
      });

      cell.addEventListener("mouseleave", () => {
        if (!cell.matches(":focus")) {
          cell.style.outline = "";
        }
      });

      cell.addEventListener("focus", () => {
        cell.style.outline = "2px solid #3b97e3";
      });

      cell.addEventListener("blur", () => {
        cell.style.outline = "";
      });
    });
  }

  checkPageForOverflow(pageIndex) {
    this.handlePageBreak(pageIndex);
    const pageComponent = this.editor
      .getWrapper()
      .find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    let targetArea = contentArea;
    let maxHeight = contentArea.getEl().clientHeight;

    const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
    let conditionalBreakPosition = null;

    if (conditionalBreakSettings?.enabled) {
      const pageNumber = pageIndex + 1;
      const overrides = conditionalBreakSettings.pageOverrides || {};

      let distanceInMm;

      if (overrides[pageNumber]) {
        distanceInMm = this.convertToMm(
          overrides[pageNumber].distance,
          overrides[pageNumber].unit,
        );
      } else {
        distanceInMm = this.convertToMm(
          conditionalBreakSettings.defaultDistance || 50,
          conditionalBreakSettings.defaultUnit || "mm",
        );
      }

      const mmToPx = 96 / 25.4;
      const distanceInPx = Math.round(distanceInMm * mmToPx);
      conditionalBreakPosition = maxHeight - distanceInPx;
    }

    const sectionsContainer = contentArea.find(".sections-container")[0];
    if (sectionsContainer) {
      let sectionContent =
        sectionsContainer.find(".section-content")[0] ||
        sectionsContainer.components().find((c) => c.get("name") === "Content");

      if (sectionContent) {
        targetArea = sectionContent;

        const mainContentHeight = contentArea.getEl().clientHeight;
        // contentArea already excludes page header/footer; use true content box height
        maxHeight = mainContentHeight - 35;
        if (conditionalBreakPosition !== null) {
          maxHeight = Math.min(maxHeight, conditionalBreakPosition);
        }
      }
    } else if (conditionalBreakPosition !== null) {
      maxHeight = Math.min(maxHeight, conditionalBreakPosition);
    }

    const contentEl = targetArea.getEl();
    if (!contentEl) return;

    contentEl.offsetHeight;
    const contentHeight = contentEl.scrollHeight;
    const hasScrollOverflow = contentHeight > maxHeight;
    const hasVisualOverflow = this.checkDeepVisualOverflow(
      contentEl,
      maxHeight,
    );
    const hasTextOverflow = this.checkTextOverflow(contentEl);
    const needsPagination =
      contentHeight > maxHeight ||
      hasScrollOverflow ||
      hasVisualOverflow ||
      hasTextOverflow;

    if (needsPagination) {
      setTimeout(() => this.handleAutoPagination(pageIndex), 100);
    } else {
    }
  }

  checkDeepVisualOverflow(container, maxHeight) {
    const containerRect = container.getBoundingClientRect();
    const allElements = container.querySelectorAll("*");

    for (let element of allElements) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > containerRect.bottom + 5) {
        return true;
      }
    }
    return false;
  }

  checkTextOverflow(container) {
    const textElements = container.querySelectorAll(
      "p, div, span, h1, h2, h3, h4, h5, h6",
    );

    for (let element of textElements) {
      if (element.scrollHeight > element.clientHeight + 2) {
        return true;
      }
    }
    return false;
  }
  triggerPaginationCheck() {
    this.paginationInProgress = false;
    this.checkForContentChanges();

    setTimeout(() => {
      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        this.checkPageForOverflow(i);
      }
    }, 200);
  }

  checkForContentChanges() {
    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const pageComponent = this.editor
        .getWrapper()
        .find(`[data-page-index="${i}"]`)[0];
      if (!pageComponent) continue;

      const contentArea = pageComponent.find(".main-content-area")[0];
      if (!contentArea) continue;

      const contentEl = contentArea.getEl();
      if (!contentEl) continue;

      const currentSnapshot = {
        innerHTML: contentEl.innerHTML,
        scrollHeight: contentEl.scrollHeight,
        childCount: contentEl.children.length,
        textLength: (contentEl.textContent || "").trim().length,
        hasOverflow: contentEl.scrollHeight > contentEl.clientHeight,
      };

      const lastSnapshot = this.lastContentSnapshot.get(i);

      const hasSignificantChange =
        !lastSnapshot ||
        lastSnapshot.childCount !== currentSnapshot.childCount ||
        Math.abs(lastSnapshot.scrollHeight - currentSnapshot.scrollHeight) >
          10 ||
        Math.abs(lastSnapshot.textLength - currentSnapshot.textLength) > 50;

      if (hasSignificantChange) {
        this.lastContentSnapshot.set(i, currentSnapshot);

        setTimeout(() => {
          this.checkPageForOverflow(i);
        }, 100);
      }
    }
  }
  ////////////////////////////////// auto-pagtination ////////////////////////////////////////////////////

  preserveAllContent() {
    if (!this.isInitialized) return;

    try {
      const deepClone = (val) => {
        if (val === null || typeof val !== "object") return val;
        try {
          if (typeof structuredClone === "function") {
            return structuredClone(val);
          }
        } catch (e) {}
        try {
          return JSON.parse(JSON.stringify(val));
        } catch (e) {
          return val;
        }
      };

      this.pageContents.clear();
      const allPageComponents = this.editor
        .getWrapper()
        .find(".page-container");

      allPageComponents.forEach((pageComponent, index) => {
        const pageContent = {
          header: null,
          footer: null,
          mainContent: [],
        };

        const headerRegion = pageComponent.find(
          '[data-shared-region="header"]',
        )[0];
        if (headerRegion) {
          const headerComponents = headerRegion.components();
          if (headerComponents.length > 0) {
            pageContent.header = {
              components: headerComponents.map((comp) => ({
                html: comp.toHTML(),
                styles: deepClone(comp.getStyle()),
                attributes: deepClone(comp.getAttributes()),
                tagName: comp.get("tagName") || "div",
                type: comp.get("type") || "default",
                content: comp.get("content") || "",
              })),
              attributes: deepClone(headerRegion.getAttributes()),
            };
          }
        }

        const footerRegion = pageComponent.find(
          '[data-shared-region="footer"]',
        )[0];
        if (footerRegion) {
          const footerComponents = footerRegion.components();
          if (footerComponents.length > 0) {
            pageContent.footer = {
              components: footerComponents.map((comp) => ({
                html: comp.toHTML(),
                styles: deepClone(comp.getStyle()),
                attributes: deepClone(comp.getAttributes()),
                tagName: comp.get("tagName") || "div",
                type: comp.get("type") || "default",
                content: comp.get("content") || "",
              })),
              attributes: deepClone(footerRegion.getAttributes()),
            };
          }
        }

        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea) {
          const mainComponents = mainContentArea.components();
          if (mainComponents.length > 0) {
            pageContent.mainContent = mainComponents.map((comp, index) => {
              const html = comp.toHTML();
              const styles = deepClone(comp.getStyle());
              const attributes = deepClone(comp.getAttributes());
              const json = comp.toJSON();
              return {
                html,
                styles,
                attributes,
                tagName: comp.get("tagName") || "div",
                type: comp.get("type") || "default",
                content: comp.get("content") || "",
                json,
              };
            });
          } else {
          }
        } else {
        }
        this.pageContents.set(index, pageContent);
      });

      this.preserveSharedContent();
    } catch (error) {}
  }

  preserveContentForModeSwitch() {
    try {
      const contentBackup = {
        headers: {},
        footers: {},
      };

      const allPages = this.editor.getWrapper().find(".page-container");

      allPages.forEach((page, index) => {
        const pageNumber = index + 1;

        const headerRegions = page.find('[data-shared-region^="header"]');
        headerRegions.forEach((headerRegion) => {
          const regionType = headerRegion.getAttributes()["data-shared-region"];
          const headerElement = headerRegion.find(".page-header-element")[0];

          if (headerElement && headerElement.components().length > 0) {
            contentBackup.headers[regionType] = {
              components: headerElement.components().map((comp) => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
                type: comp.get("type"),
                content: comp.get("content"),
              })),
              elementStyles: headerElement.getStyle(),
              elementAttributes: headerElement.getAttributes(),
            };
          }
        });

        const footerRegions = page.find('[data-shared-region^="footer"]');
        footerRegions.forEach((footerRegion) => {
          const regionType = footerRegion.getAttributes()["data-shared-region"];
          const footerElement = footerRegion.find(".page-footer-element")[0];

          if (footerElement && footerElement.components().length > 0) {
            contentBackup.footers[regionType] = {
              components: footerElement.components().map((comp) => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
                type: comp.get("type"),
                content: comp.get("content"),
              })),
              elementStyles: footerElement.getStyle(),
              elementAttributes: footerElement.getAttributes(),
            };
          }
        });
      });

      this._modeSwitchContentBackup = contentBackup;
    } catch (error) {}
  }

  restoreContentAfterModeSwitch() {
    try {
      if (!this._modeSwitchContentBackup) {
        return;
      }

      const backup = this._modeSwitchContentBackup;
      const allPages = this.editor.getWrapper().find(".page-container");

      allPages.forEach((page, index) => {
        const pageNumber = index + 1;

        const headerRegions = page.find('[data-shared-region^="header"]');
        headerRegions.forEach((headerRegion) => {
          const newRegionType =
            headerRegion.getAttributes()["data-shared-region"];
          const headerElement = headerRegion.find(".page-header-element")[0];
          if (!headerElement) return;
          let contentToRestore = null;
          if (newRegionType === "header") {
            contentToRestore =
              backup.headers["header"] ||
              backup.headers["header-even"] ||
              backup.headers["header-odd"];
          } else if (newRegionType === "header-even") {
            contentToRestore =
              backup.headers["header-even"] || backup.headers["header"];
          } else if (newRegionType === "header-odd") {
            contentToRestore =
              backup.headers["header-odd"] || backup.headers["header"];
          }

          if (contentToRestore && contentToRestore.components) {
            headerElement.components().reset();

            contentToRestore.components.forEach((compData) => {
              try {
                const newComp = headerElement.append(compData.html)[0];
                if (newComp) {
                  const currentStyle =
                    typeof newComp.getStyle === "function"
                      ? newComp.getStyle() || {}
                      : {};
                  newComp.setStyle({
                    ...(currentStyle || {}),
                    ...(compData.styles || {}),
                  });
                  newComp.addAttributes(compData.attributes || {});
                  if (compData.content) {
                    newComp.set("content", compData.content);
                  }
                }
              } catch (error) {}
            });

            if (contentToRestore.elementStyles) {
              headerElement.setStyle(contentToRestore.elementStyles);
            }
            if (contentToRestore.elementAttributes) {
              headerElement.addAttributes(contentToRestore.elementAttributes);
            }
          }
        });

        const footerRegions = page.find('[data-shared-region^="footer"]');
        footerRegions.forEach((footerRegion) => {
          const newRegionType =
            footerRegion.getAttributes()["data-shared-region"];
          const footerElement = footerRegion.find(".page-footer-element")[0];
          if (!footerElement) return;
          let contentToRestore = null;
          if (newRegionType === "footer") {
            contentToRestore =
              backup.footers["footer"] ||
              backup.footers["footer-even"] ||
              backup.footers["footer-odd"];
          } else if (newRegionType === "footer-even") {
            contentToRestore =
              backup.footers["footer-even"] || backup.footers["footer"];
          } else if (newRegionType === "footer-odd") {
            contentToRestore =
              backup.footers["footer-odd"] || backup.footers["footer"];
          }

          if (contentToRestore && contentToRestore.components) {
            footerElement.components().reset();

            contentToRestore.components.forEach((compData) => {
              try {
                const newComp = footerElement.append(compData.html)[0];
                if (newComp) {
                  const currentStyle =
                    typeof newComp.getStyle === "function"
                      ? newComp.getStyle() || {}
                      : {};
                  newComp.setStyle({
                    ...(currentStyle || {}),
                    ...(compData.styles || {}),
                  });
                  newComp.addAttributes(compData.attributes || {});
                  if (compData.content) {
                    newComp.set("content", compData.content);
                  }
                }
              } catch (error) {}
            });

            if (contentToRestore.elementStyles) {
              footerElement.setStyle(contentToRestore.elementStyles);
            }
            if (contentToRestore.elementAttributes) {
              footerElement.addAttributes(contentToRestore.elementAttributes);
            }
          }
        });
      });
      delete this._modeSwitchContentBackup;
    } catch (error) {}
  }

  restoreAllContent(options = {}) {
    if (!this.isInitialized || this.pageContents.size === 0) return;
    try {
      const allPages = this.editor.getWrapper().find(".page-container");
      const preserveStructureOnRestore = !!options.preserveStructure;
      const mergeStyles = (targetComp, incomingStyles) => {
        const currentStyle =
          typeof targetComp.getStyle === "function"
            ? targetComp.getStyle() || {}
            : {};
        const incoming =
          incomingStyles && typeof incomingStyles === "object"
            ? incomingStyles
            : {};
        const sanitizedIncoming = {};
        Object.keys(incoming).forEach((k) => {
          const v = incoming[k];
          if (v !== "" && v !== undefined && v !== null) {
            sanitizedIncoming[k] = v;
          }
        });
        targetComp.setStyle({
          ...(currentStyle || {}),
          ...(sanitizedIncoming || {}),
        });
      };
      const appendPreservedComponent = (targetRegion, compData) => {
        let newComp = null;
        try {
          if (compData && compData.html) {
            newComp = targetRegion.append(compData.html)[0];
          }
        } catch (e) {}
        if (!newComp) {
          try {
            const fallbackConfig = {
              type: compData?.type || "default",
              tagName: compData?.tagName || "div",
              content: compData?.content || "",
              attributes: compData?.attributes || {},
              style: compData?.styles || {},
            };
            newComp = targetRegion.append(fallbackConfig)[0];
          } catch (e) {}
        }
        if (newComp) {
          mergeStyles(newComp, compData?.styles);
          newComp.addAttributes(compData?.attributes || {});
          if (compData?.content && typeof newComp.set === "function") {
            newComp.set("content", compData.content);
          }
        }
        return newComp;
      };

      allPages.forEach((pageComponent, index) => {
        const preserved = this.pageContents.get(index);
        if (!preserved) return;

        const currentPageSettings = this.pageSettings.pages[index];
        const hasNewHeaderText =
          currentPageSettings?.header?.enabled &&
          currentPageSettings?.header?.text;
        const hasNewFooterText =
          currentPageSettings?.footer?.enabled &&
          currentPageSettings?.footer?.text;

        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea && preserved.mainContent?.length > 0) {
          mainContentArea.components().reset();
          preserved.mainContent.forEach((compData, index) => {
            const newComp = mainContentArea.append(compData.html)[0];
            if (newComp) {
              mergeStyles(newComp, compData.styles);
              newComp.addAttributes(compData.attributes || {});
            } else {
            }
          });
        } else {
        }

        const headerRegion = pageComponent.find(
          '[data-shared-region="header"]',
        )[0];
        if (headerRegion) {
          const isHeaderEnabled = currentPageSettings?.header?.enabled;

          if (isHeaderEnabled) {
            const shouldUseInputText =
              (!preserveStructureOnRestore && this._headerTextChanged) ||
              (hasNewHeaderText && !preserved.header?.components?.length);

            if (shouldUseInputText && hasNewHeaderText) {
              headerRegion.components().reset();

              const textComp = headerRegion.append(`
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #333;">
                ${currentPageSettings.header.text}
              </div>
            `)[0];

              if (textComp) {
                textComp.set({
                  droppable: false,
                  editable: true,
                  selectable: true,
                  draggable: false,
                  copyable: false,
                  removable: true,
                  "custom-name": "Header Text",
                });
              }
            } else if (preserved.header?.components?.length > 0) {
              headerRegion.components().reset();
              headerRegion.addAttributes(preserved.header.attributes || {});
              preserved.header.components.forEach((compData) => {
                appendPreservedComponent(headerRegion, compData);
              });
            } else {
              headerRegion.components().reset();
            }
          } else {
            headerRegion.components().reset();
          }
        }

        const footerRegion = pageComponent.find(
          '[data-shared-region="footer"]',
        )[0];
        if (footerRegion) {
          const isFooterEnabled = currentPageSettings?.footer?.enabled;

          if (isFooterEnabled) {
            const shouldUseInputText =
              (!preserveStructureOnRestore && this._footerTextChanged) ||
              (hasNewFooterText && !preserved.footer?.components?.length);

            if (shouldUseInputText && hasNewFooterText) {
              footerRegion.components().reset();

              const textComp = footerRegion.append(`
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #333;">
                ${currentPageSettings.footer.text}
              </div>
            `)[0];

              if (textComp) {
                textComp.set({
                  droppable: false,
                  editable: true,
                  selectable: true,
                  draggable: false,
                  copyable: false,
                  removable: true,
                  "custom-name": "Footer Text",
                });
              }
            } else if (preserved.footer?.components?.length > 0) {
              footerRegion.components().reset();
              footerRegion.addAttributes(preserved.footer.attributes || {});
              preserved.footer.components.forEach((compData) => {
                appendPreservedComponent(footerRegion, compData);
              });
            } else {
              footerRegion.components().reset();
            }
          } else {
            footerRegion.components().reset();
          }
        }
      });

      const currentPageSettings = this.pageSettings.pages[0];
      this._lastAppliedHeaderText = currentPageSettings?.header?.text || "";
      this._lastAppliedFooterText = currentPageSettings?.footer?.text || "";
      this._headerTextChanged = false;
      this._footerTextChanged = false;
    } catch (error) {}
  }

  hasRichHeaderFooterContent(components) {
    if (!components || components.length === 0) return false;
    if (components.length > 1) return true;
    const component = components[0];
    if (!component.html) return false;
    const html = component.html.toLowerCase();
    const hasTextArea =
      html.includes("contenteditable") || html.includes("textarea");
    const hasImage = html.includes("<img") || html.includes("image");
    const hasCustomComponent =
      html.includes("data-gjs-type") && !html.includes("text");
    const hasCustomClasses =
      component.attributes && Object.keys(component.attributes).length > 1;
    const hasComplexStyles =
      component.styles && Object.keys(component.styles).length > 3;
    return (
      hasTextArea ||
      hasImage ||
      hasCustomComponent ||
      hasCustomClasses ||
      hasComplexStyles
    );
  }

  preserveSharedContent() {
    if (!this.isInitialized) return;

    try {
      const firstPageComponent = this.editor
        .getWrapper()
        .find(".page-container")[0];
      if (!firstPageComponent) return;

      this.sharedContent = {
        header: null,
        footer: null,
      };

      const footerRegion = firstPageComponent.find(
        '[data-shared-region="footer"]',
      )[0];
      if (footerRegion) {
        const footerComponents = footerRegion.components();
        if (footerComponents.length > 0) {
          this.sharedContent.footer = {
            components: footerComponents.map((comp) => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
              type: comp.get("type"),
            })),
            styles: footerRegion.getStyle(),
            attributes: footerRegion.getAttributes(),
          };
        }
      }
    } catch (error) {}
  }

  initSharedRegionSync() {
    const editor = this.editor;
    if (!editor) return;
    if (!this._patchedGetCss) {
      const originalGetCss = editor.getCss.bind(editor);
      editor.getCss = (opts = {}) => {
        const raw = originalGetCss(opts);
        const cleaned = raw.replace(/@page\s*{[^}]*}/g, "").trim();
        const ps = this.pageSettings || {};
        const format = (ps.format || "a4").toUpperCase();
        const orientation = (ps.orientation || "portrait").toLowerCase();
        const m = ps.margins || { top: 0, right: 0, bottom: 0, left: 0 };

        const sizeValue =
          format === "CUSTOM"
            ? orientation === "landscape"
              ? `${ps.height}mm ${ps.width}mm`
              : `${ps.width}mm ${ps.height}mm`
            : `${format} ${orientation}`;

        const pageRule = `@page { size: ${sizeValue}; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }`;

        return `${pageRule}\n${cleaned}`;
      };
      this._patchedGetCss = true;
    }

    this._syncInProgress = false;

    editor.on("component:update", (model) => {
      if (this._syncInProgress) return;

      const sharedRegion = model.closest("[data-shared-region]");
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"];
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion);
        }, 50);
      }
    });

    editor.on("component:styleUpdate", (model) => {
      if (this._syncInProgress) return;

      const sharedRegion = model.closest("[data-shared-region]");
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"];
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion);
        }, 50);
      }
    });

    editor.on("component:drag:end", (model) => {
      if (this._syncInProgress) return;

      const el = model.view?.el;
      const sharedRegion = el?.closest("[data-shared-region]");

      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"];
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion);
        }, 100);
      }
    });
  }

  syncSharedRegion(regionType, sourceRegion) {
    if (
      (regionType.includes("header") && this._headerTextChanged) ||
      (regionType.includes("footer") && this._footerTextChanged)
    ) {
      return;
    }

    if (this._syncInProgress) return;
    this._syncInProgress = true;

    try {
      const allRegions = this.editor
        .getWrapper()
        .find(`[data-shared-region="${regionType}"]`);
      if (allRegions.length <= 1) {
        this._syncInProgress = false;
        return;
      }

      const sourceComponents = sourceRegion.components();
      const sourceAttributes = sourceRegion.getAttributes();

      allRegions.forEach((targetRegion) => {
        if (targetRegion === sourceRegion) return;
        targetRegion._silentSync = true;
        targetRegion.components().reset();
        sourceComponents.forEach((comp) => {
          const clonedComp = comp.clone();
          targetRegion.append(clonedComp);
        });

        const filteredAttributes = { ...sourceAttributes };
        delete filteredAttributes["data-shared-region"];
        Object.keys(filteredAttributes).forEach((key) => {
          targetRegion.addAttributes({ [key]: filteredAttributes[key] });
        });

        delete targetRegion._silentSync;
      });
    } catch (error) {
    } finally {
      this._syncInProgress = false;
    }
  }

  resetTextChangeFlags() {
    this._headerTextChanged = false;
    this._footerTextChanged = false;
  }

  setupSectionSelection() {
    this.editor.on("component:selected", (model) => {
      this.clearSectionBorders();

      const sharedRegion = model.closest("[data-shared-region]");
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"];
        this.highlightSection(regionType);
        this.selectedSection = regionType;
      } else if (model.getEl()?.closest(".main-content-area")) {
        this.highlightSection("content");
        this.selectedSection = "content";
      }
    });

    this.editor.on("component:deselected", () => {
      this.clearSectionBorders();
      this.selectedSection = null;
    });
  }

  highlightSection(sectionType) {
    const canvasBody = this.editor.Canvas.getBody();
    const pages = canvasBody.querySelectorAll(".page-container");

    pages.forEach((page) => {
      let selector = "";
      switch (sectionType) {
        case "header":
          selector = '[data-shared-region="header"]';
          break;
        case "footer":
          selector = '[data-shared-region="footer"]';
          break;
        case "content":
          selector = ".main-content-area";
          break;
      }

      if (selector) {
        const section = page.querySelector(selector);
        if (section) {
          section.style.border = "2px solid #007bff";
          section.style.boxShadow = "0 0 10px rgba(0, 123, 255, 0.3)";
        }
      }
    });
  }

  clearSectionBorders() {
    const canvasBody = this.editor.Canvas.getBody();
    const sections = canvasBody.querySelectorAll(
      "[data-shared-region], .main-content-area",
    );

    sections.forEach((section) => {
      section.style.border = "";
      section.style.boxShadow = "";
    });
  }

  setupContentBoundaryEnforcement() {
    if (!this.isInitialized) {
      return;
    }
    const pages = document.querySelectorAll(".page-container");

    pages.forEach((page, index) => {
      const pageIndex = parseInt(page.getAttribute("data-page-index") || "", 10);
      const resolvedPageIndex = Number.isFinite(pageIndex) ? pageIndex : index;

      const contentArea = page.querySelector(".main-content-area");
      if (!contentArea) return;

      const availableHeight =
        contentArea.clientHeight || this.calculateAvailableContentHeight(page);

      // Constrain rendering strictly inside the page content box.
      contentArea.style.maxHeight = `${availableHeight}px`;
      contentArea.style.overflow = "hidden";
      contentArea.style.position = contentArea.style.position || "relative";

      const observer = new MutationObserver(() => {
        this.checkContentOverflow(contentArea, resolvedPageIndex);
      });

      observer.observe(contentArea, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    this.editor.on("component:add", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries();
        }, 100);
      }
    });

    this.editor.on("component:update", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries();
        }, 100);
      }
    });

    this.editor.on("component:drag:start", (component) => {
      if (this.isInitialized) {
        this.setupDragBoundaries();
      }
    });
  }

  calculateAvailableContentHeight(pageElement) {
    if (!pageElement) return 0;
    const contentArea = pageElement.querySelector(".main-content-area");
    if (!contentArea) return 0;
    // Prefer actual layout height.
    if (contentArea.clientHeight && contentArea.clientHeight > 0) {
      return contentArea.clientHeight;
    }
    // Fallback: parse inline height.
    const h = parseFloat(contentArea.style.height);
    if (Number.isFinite(h)) return h;
    return 0;
  }

  checkContentOverflow(contentArea, pageIndex) {
    if (!contentArea) return;
    const maxHeight = contentArea.clientHeight || 0;
    if (!maxHeight) return;
    const scrollHeight = contentArea.scrollHeight || 0;
    if (scrollHeight > maxHeight + 2) {
      // Reflow pagination only inside the page content boundary.
      this.handleAutoPagination(pageIndex);
    }
  }

  enforceContentBoundaries() {
    if (!this.isInitialized) return;

    const canvasBody = this.editor.Canvas.getBody();
    const pageElements = canvasBody.querySelectorAll(".page-container");
    const allComponents = this.editor.getWrapper().components();

    allComponents.forEach((component) => {
      if (!component || !component.getEl) return;
      const componentEl = component.getEl();
      if (!componentEl || componentEl.classList.contains("page-container"))
        return;
      let isInsidePage = false;
      pageElements.forEach((pageElement) => {
        const pageRect = pageElement.getBoundingClientRect();
        const componentRect = componentEl.getBoundingClientRect();

        if (
          componentRect.left >= pageRect.left &&
          componentRect.right <= pageRect.right &&
          componentRect.top >= pageRect.top &&
          componentRect.bottom <= pageRect.bottom
        ) {
          isInsidePage = true;
        }
      });

      if (!isInsidePage) {
        component.remove();
        return;
      }
    });

    pageElements.forEach((pageElement, pageIndex) => {
      const pageContent = pageElement.querySelector(".main-content-area");
      if (pageContent) {
        const children = pageContent.querySelectorAll("*");
        children.forEach((child) => {
          const rect = child.getBoundingClientRect();
          const pageRect = pageContent.getBoundingClientRect();

          if (
            rect.right > pageRect.right ||
            rect.bottom > pageRect.bottom ||
            rect.left < pageRect.left ||
            rect.top < pageRect.top
          ) {
            const style = window.getComputedStyle(child);
            const left = Number.parseInt(style.left) || 0;
            const top = Number.parseInt(style.top) || 0;

            if (rect.right > pageRect.right) {
              child.style.left =
                Math.max(0, left - (rect.right - pageRect.right)) + "px";
            }
            if (rect.bottom > pageRect.bottom) {
              child.style.top =
                Math.max(0, top - (rect.bottom - pageRect.bottom)) + "px";
            }
            if (rect.left < pageRect.left) {
              child.style.left =
                Math.max(0, left + (pageRect.left - rect.left)) + "px";
            }
            if (rect.top < pageRect.top) {
              child.style.top =
                Math.max(0, top + (pageRect.top - rect.top)) + "px";
            }
          }
        });
      }
    });
  }

  setupStrictBoundaryEnforcement() {
    const editor = this.editor;
    editor.on("component:create", (component) => {
      if (!component || !component.getEl) return;

      const el = component.getEl();
      if (!el) return;

      const insideMain = el.closest(".main-content-area");
      const insidePage = el.closest(".page-container");

      if (!insideMain || !insidePage) {
        component.remove();
      }
    });

    editor.on("drag:drag", (dragData) => {
      const target = dragData?.target;
      if (!target) return;

      const insideMain = target.closest?.(".main-content-area");

      if (!insideMain) {
        dragData.abort = true;
      }
    });

    editor.on("canvas:drop", (data) => {
      const iframeDoc = editor.Canvas.getDocument();
      const targetEl = data?.target;

      if (!targetEl) return;

      const insideMain = targetEl.closest(".main-content-area");
      const insidePage = targetEl.closest(".page-container");

      if (!insideMain || !insidePage) {
        if (data.component) data.component.remove();
      }
    });

    editor.on("load", () => {
      const iframeBody = editor.Canvas.getBody();

      const allMainAreas = iframeBody.querySelectorAll(
        ".page-container .main-content-area",
      );
      allMainAreas.forEach((el) => {
        el.setAttribute("data-droppable", "true");
        el.style.position = "relative";
      });

      const allElems = iframeBody.querySelectorAll("body *");
      allElems.forEach((elem) => {
        if (!elem.classList.contains("main-content-area")) {
          elem.setAttribute("data-droppable", "false");
        }
      });
    });
  }

  setupCanvasObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && this.isInitialized) {
          setTimeout(() => {
            this.updateAllPageVisuals();
            this.enforceContentBoundaries();
            if (this.sectionsSettings.enabled) {
              this.updateSectionsDisplay();
            }
          }, 100);
        }
      });
    });

    this.editor.on("load", () => {
      const canvas = this.editor.Canvas.getBody();
      if (canvas) {
        observer.observe(canvas, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  setupDragBoundaries() {
    const canvasBody = this.editor.Canvas.getBody();
    const pageElements = canvasBody.querySelectorAll(
      ".page-container .main-content-area",
    );

    pageElements.forEach((pageContent) => {
      pageContent.style.position = "relative";
      pageContent.setAttribute("data-droppable", "true");
    });
  }

  injectPageSetupStyles() {
    const styles = `
      <style id="enhanced-page-setup-styles">
            @page {
        size: ${this.pageSettings.format.toUpperCase()} ${this.pageSettings.orientation};
        margin: 0;
      }
        .page-setup-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 10001;
          display: none;
          align-items: center;
          justify-content: center;
        }

        .watermark-position-option {
  /* Same styles as .position-option */
  cursor: pointer;
  padding: 8px;
  border: 1px solid #ccc;
  text-align: center;
  border-radius: 4px;
}

.watermark-position-option.selected {
  background-color: #007cba;
  color: white;
}

.watermark-text-position-option.selected{
background-color: #007cba;
  color: white;
}

.watermark-image-position-option.selected{
background-color: #007cba;
  color: white;
}

.watermark-text-position-option{
padding: 8px;
    border: 2px solid #e9ecef;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
    color: #000 !important;
}

.watermark-image-position-option{
padding: 8px;
    border: 2px solid #e9ecef;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
    color: #000 !important;
}
        
        .page-setup-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: #000 !important;
        }
        
        .page-setup-content * {
          color: #000 !important;
        }
        
        .page-setup-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .page-setup-header h2 {
          color: #333 !important;
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .page-setup-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .page-setup-section h3 {
          margin: 0 0 15px 0;
          color: #333 !important;
          font-size: 16px;
          font-weight: 600;
        }
        
        .page-setup-row {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 15px;
        }
        
        .page-setup-label {
          min-width: 120px;
          font-weight: 500;
          color: #555 !important;
        }
        
        .page-setup-control {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          color: #000 !important;
        }
        
        .page-setup-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .page-setup-custom-size {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        
        .page-setup-custom-size.active {
          display: block;
        }
        
        .page-setup-custom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
        }

        .margins-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .watermark-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .watermark-controls.active {
          display: block;
        }

        .watermark-type-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }

        .watermark-type-btn {
          padding: 8px 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .watermark-type-btn.active {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }
        
        .page-setup-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        
        .page-setup-btn-primary {
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-btn-primary:hover {
          background: #0056b3;
        }
        
        .page-setup-btn-secondary {
          background: #6c757d;
          color: white !important;
        }
        
        .page-setup-btn-secondary:hover {
          background: #545b62;
        }
        
        .page-canvas-container {
          position: relative;
          background: #f0f0f0;
          border: 2px solid #ddd;
          margin: 20px;
          overflow: visible;
        }
        
        .page-canvas {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin: 20px auto;
          position: relative;
          border: 2px solid transparent !important;
          overflow: hidden !important;
          transition: border-color 0.2s ease;
        }
        
        .page-canvas:hover {
          border-color: #007bff !important;
        }
        
        .page-canvas.selected,
        .page-canvas:focus {
          border-color: #007bff !important;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3) !important;
        }
        
        .page-indicator {
          position: absolute;
          background: rgba(0, 123, 255, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          z-index: 1000;
          pointer-events: none;
        }
        
        .page-delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        }
        
        .page-delete-btn:hover {
          background: #c82333;
        }

        .page-watermark {
          position: absolute !important;
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .page-watermark-text {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          white-space: nowrap !important;
        }

        .page-watermark-image {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }

        /* FIXED: Enhanced Header/Footer Styles with proper display */
        .header-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          display: block !important;
        }

        .footer-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          display: block !important;
        }

        .header-wrapper::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #007bff;
          z-index: 1000;
          pointer-events: none;
        }

        .footer-wrapper::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #007bff;
          z-index: 1000;
          pointer-events: none;
        }

        .page-header-element {
          position: relative !important;
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 48px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .page-header-element:hover {
          border-color: #28a745 !important;
          background: rgba(40, 167, 69, 0.05) !important;
        }
        
        .page-footer-element {
          position: relative !important;
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 48px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .page-footer-element:hover {
          border-color: #dc3545 !important;
          background: rgba(220, 53, 69, 0.05) !important;
        }

         /* FIXED: Page number positioning for print */
        .page-number-element {
          position: absolute !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 4px 8px !important;
          border-radius: 3px !important;
          font-size: 8px !important;
          color: #333 !important;
          z-index: 2000 !important;
          border: 1px solid #dee2e6 !important;
          pointer-events: none !important;
          user-select: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 20px !important;
          min-height: 20px !important;
          font-family: Arial, sans-serif !important;
        }
          
        /* Content Area Styles */
        .content-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .main-content-area {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          background: transparent !important;
          flex: 1 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .main-content-area:hover {
          border-color: #007bff !important;
          background: rgba(0, 123, 255, 0.02) !important;
        }

        /* Position Grid */
        .position-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        
        .position-option {
          padding: 8px;
          border: 2px solid #e9ecef;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          color: #000 !important;
        }
        
        .position-option:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .position-option.selected {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }

        .size-controls {
          display: block;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        /* Enhanced Page Break Styles */
        .page-break-element {
          width: 100% !important;
          height: 20px !important;
          background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%) !important;
          border: 2px dashed #ff4757 !important;
          border-radius: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: white !important;
          font-size: 12px !important;
          font-weight: bold !important;
          margin: 10px 0 !important;
          position: relative !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }

        .page-break-element:hover {
          background: linear-gradient(90deg, #ff5252 0%, #ff7979 50%, #ff5252 100%) !important;
          transform: scale(1.02) !important;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
        }

        .page-break-element::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.5);
          z-index: 1;
        }

        /* Content boundary enforcement */
        .page-content {
          overflow: hidden !important;
          position: relative !important;
        }

        .main-content-area > * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        
        @media (max-width: 768px) {
          .page-setup-content {
            padding: 20px;
            margin: 10px;
          }
          
          .page-setup-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .page-setup-label {
            min-width: auto;
          }
        }
        
        /* FIXED: Enhanced Print styles for exact positioning and proper page breaks */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .page-container {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-container:last-child {
            page-break-after: avoid !important;
          }
          
          .page-content {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .main-content-area {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            flex: 1 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide editor-only elements */
          .page-indicator,
          .header-wrapper::after,
          .footer-wrapper::before {
            display: none !important;
          }

          /* FIXED: Page breaks should trigger actual page breaks in print */
          .page-break-element {
            display: block !important;
            page-break-before: always !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            visibility: hidden !important;
          }

          .page-watermark {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            pointer-events: none !important;
            z-index: 1 !important;
          }

          .page-header-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }
          
          .page-footer-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }

          /* Ensure header and footer stay within page bounds */
          .header-wrapper {
            flex-shrink: 0 !important;
            position: relative !important;
          }

          .footer-wrapper {
            flex-shrink: 0 !important;
            position: relative !important;
          }

          .content-wrapper {
            flex: 1 !important;
            overflow: hidden !important;
          }
        }

        .page-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #bbdefb;
        }
        .page-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-info-item label {
          font-weight: 500;
          color: #1976d2 !important;
          font-size: 12px;
        }
        .page-info-value {
          font-weight: 600;
          color: #0d47a1 !important;
          font-size: 12px;
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #90caf9;
        }

        .page-numbering-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .page-numbering-controls.active {
          display: block;
        }

        /* Background color controls */
        .background-color-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          margin-top: 10px;
        }

        .color-preview {
          width: 40px;
          height: 40px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-preview:hover {
          border-color: #007bff;
          transform: scale(1.05);
        }

        /* Header/Footer Controls */
        .header-footer-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }

        .header-footer-section {
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .header-footer-section h4 {
          margin: 0 0 10px 0;
          color: #333 !important;
          font-size: 14px;
          font-weight: 600;
        }

        .size-input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .size-input-group label {
          min-width: 80px;
          font-size: 12px;
          color: #666 !important;
        }

        .size-input-group input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 12px;
        }

        /* Format and Orientation Change Section */
        .format-change-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .format-change-section h3 {
          color: #856404 !important;
          margin-bottom: 15px;
        }

        .format-change-warning {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 12px;
          color: #721c24 !important;
        }

        .format-change-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
/* Conditional Break Indicator */
.conditional-break-indicator {
  position: absolute !important;
  pointer-events: none !important;
  user-select: none !important;
  z-index: 999 !important;
}

.conditional-break-indicator span {
  pointer-events: none !important;
  user-select: none !important;
}

@media print {
  .conditional-break-indicator,
  .section-break-indicator {
    display: none !important;
    visibility: hidden !important;
  }
}
      [data-continuation-table="true"][data-copy-header="false"] thead,
    [data-split-table="continuation"][data-copy-header="false"] thead {
      display: none !important;
    }
    
    /* Ensure headers are hidden in PDF export */
    @media print {
      [data-continuation-table="true"][data-copy-header="false"] thead,
      [data-split-table="continuation"][data-copy-header="false"] thead {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    }
  }

      </style>
    `;

    if (!document.getElementById("enhanced-page-setup-styles")) {
      document.head.insertAdjacentHTML("beforeend", styles);
    }
  }

  createInitialSetupModal() {
    const modalHTML = `
      <div id="pageSetupModal" class="page-setup-modal">
        <div class="page-setup-content">
          <div class="page-setup-header">
            <h2>📄 Page Setup</h2>
          </div>
          
          <div class="page-setup-section">
            <h3>📐 Page Format & Orientation</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Format:</label>
              <select id="pageFormat" class="page-setup-control">
                <option value="a4" selected>A4 (210 × 297 mm)</option>
                <option value="a3">A3 (297 × 420 mm)</option>
                <option value="a2">A2 (420 × 594 mm)</option>
                <option value="a1">A1 (594 × 841 mm)</option>
                <option value="a0">A0 (841 × 1189 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
                <option value="legal">Legal (8.5 × 14 in)</option>
                <option value="a5">A5 (148 × 210 mm)</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>
            
            <div class="page-setup-row">
              <label class="page-setup-label">Orientation:</label>
              <select id="pageOrientation" class="page-setup-control">
                <option value="portrait" selected>Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            
            <div id="customSizeSection" class="page-setup-custom-size">
              <h4>Custom Dimensions</h4>
              <div class="page-setup-custom-row">
                <div>
                  <label>Width:</label>
                  <input type="number" id="customWidth" class="page-setup-control" value="210" min="50" max="2000">
                </div>
                <div>
                  <label>Height:</label>
                  <input type="number" id="customHeight" class="page-setup-control" value="297" min="50" max="2000">
                </div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>📄 Header & Footer</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Headers and footers are enabled by default with 1.27cm height.</p>
            <div class="header-footer-controls">
              <div class="header-footer-section">
                <h4>📋 Header Settings</h4>
                <div class="page-setup-row">
                  <label>
                    <input type="checkbox" id="headerEnabled" checked style="border: 2px solid #000 !important;"> Enable Header
                  </label>
                </div>
                <div class="size-input-group">
                  <label>Height:</label>
                  <input type="number" id="headerHeight" value="12.7" min="5" max="50" step="0.1">
                  <span style="font-size: 12px; color: #666;">mm</span>
                </div>
              </div>
              <div class="header-footer-section">
                <h4>📋 Footer Settings</h4>
                <div class="page-setup-row">
                  <label>
                    <input type="checkbox" id="footerEnabled" checked style="border: 2px solid #000 !important;"> Enable Footer
                  </label>
                </div>
                <div class="size-input-group">
                  <label>Height:</label>
                  <input type="number" id="footerHeight" value="12.7" min="5" max="50" step="0.1">
                  <span style="font-size: 12px; color: #666;">mm</span>
                </div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>🎨 Page Background</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Background Color:</label>
              <div class="background-color-controls">
                <input type="color" id="pageBackgroundColor" class="page-setup-control" value="#ffffff">
                <div class="color-preview" id="backgroundColorPreview" style="background-color: #ffffff;"></div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>📏 Page Margins (mm)</h3>
            <div class="margins-grid">
              <div>
                <label>Top:</label>
                <input type="number" id="marginTop" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Bottom:</label>
                <input type="number" id="marginBottom" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Left:</label>
                <input type="number" id="marginLeft" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Right:</label>
                <input type="number" id="marginRight" class="page-setup-control" value="0" min="0" max="50">
              </div>
            </div>
          </div>
          
          <div class="page-setup-section">
            <h3>📊 Pages</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Number of Pages:</label>
              <input type="number" id="numberOfPages" class="page-setup-control" value="1" min="1" max="100">
            </div>
          </div>
          
          <div class="page-setup-actions">
            <button id="pageSetupCancel" class="page-setup-btn page-setup-btn-secondary">Cancel</button>
            <button id="pageSetupApply" class="page-setup-btn page-setup-btn-primary">Create Pages</button>
          </div>
        </div>
      </div>
    `;

    if (!document.getElementById("pageSetupModal")) {
      document.body.insertAdjacentHTML("beforeend", modalHTML);
    }
  }

  resetInitialSetupModalInputs() {
    const modal = document.getElementById("pageSetupModal");
    if (!modal) return;

    document.getElementById("pageFormat").value = "a4";
    document.getElementById("pageOrientation").value = "portrait";
    document.getElementById("numberOfPages").value = 1;
    const bgInput = document.getElementById("pageBackgroundColor");
    if (bgInput) {
      bgInput.value = "#ffffff";
      const preview = document.getElementById("backgroundColorPreview");
      if (preview) preview.style.backgroundColor = "#ffffff";
    }

    document.getElementById("headerEnabled").checked = true;
    document.getElementById("headerHeight").value = 12.7;
    document.getElementById("footerEnabled").checked = true;
    document.getElementById("footerHeight").value = 12.7;
    document.getElementById("marginTop").value = 0;
    document.getElementById("marginBottom").value = 0;
    document.getElementById("marginLeft").value = 0;
    document.getElementById("marginRight").value = 0;
  }

  addToGrapesJSSettings() {
    const settingsPanel = this.editor.Panels.getPanel("options");

    if (settingsPanel) {
      this.updateNavbarButton();
      this.updateAddPageButton();
    }

    this.editor.Commands.add("open-page-setup", {
      run: () => this.showInitialSetup(),
    });

    this.editor.Commands.add("open-page-elements-settings", {
      run: () => this.showPageElementsSettings(),
    });

    this.editor.Commands.add("add-new-page", {
      run: () => this.addNewPage(),
    });

    this.editor.Commands.add("delete-pages", {
      run: () => this.showPageDeleteModal(),
    });
  }

  createPagesFromContent() {
    const container = document.getElementById("iemb");
    const content = document.getElementById("ibpc").innerHTML;

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      data = content.split(/\n+/).map((line) => ({ text: line }));
    }

    const pageHeight = 1123;
    const headerHeight = 60;
    const footerHeight = 60;
    const marginTop = 20,
      marginBottom = 20;
    const usableHeight =
      pageHeight - (headerHeight + footerHeight + marginTop + marginBottom);
    container.innerHTML = "";
    let currentPage = createPage();
    let currentHeight = 0;
    container.appendChild(currentPage);

    data.forEach((item, index) => {
      const block = document.createElement("div");
      block.className = "content-block";
      block.innerText = item.first_name
        ? `${item.id}. ${item.first_name} ${item.last_name} - ${item.email}`
        : item.text;

      currentPage.querySelector(".section-content").appendChild(block);

      if (block.offsetHeight + currentHeight > usableHeight) {
        currentPage = createPage();
        container.appendChild(currentPage);
        currentPage.querySelector(".section-content").appendChild(block);
        currentHeight = block.offsetHeight;
      } else {
        currentHeight += block.offsetHeight;
      }
    });
  }

  updateNavbarButton() {
    const settingsPanel = this.editor.Panels.getPanel("options");
    if (!settingsPanel) return;

    const existingSetupBtn = settingsPanel.get("buttons").get("page-setup");
    const existingSettingsBtn = settingsPanel
      .get("buttons")
      .get("page-elements-settings");

    if (existingSetupBtn) {
      settingsPanel.get("buttons").remove(existingSetupBtn);
    }
    if (existingSettingsBtn) {
      settingsPanel.get("buttons").remove(existingSettingsBtn);
    }

    if (!this.isInitialized) {
      settingsPanel.get("buttons").add({
        id: "page-setup",
        className: "fa fa-file-o",
        command: "open-page-setup",
        attributes: { title: "Setup Pages" },
      });
    } else {
      settingsPanel.get("buttons").add({
        id: "page-elements-settings",
        className: "fa fa-cogs",
        command: "open-page-elements-settings",
        attributes: { title: "Page Elements Settings" },
      });
    }
  }

  updateAddPageButton() {
    const settingsPanel = this.editor.Panels.getPanel("options");
    if (!settingsPanel) return;

    const existingAddBtn = settingsPanel.get("buttons").get("add-page");

    if (this.isInitialized && !existingAddBtn) {
      settingsPanel.get("buttons").add({
        id: "add-page",
        className: "fa fa-plus",
        command: "add-new-page",
        attributes: { title: "Add New Page" },
      });
    } else if (!this.isInitialized && existingAddBtn) {
      settingsPanel.get("buttons").remove(existingAddBtn);
    }
  }

  setupEventListeners() {
    document.addEventListener("change", (e) => {
      if (e.target.id === "pageFormat") {
        const customSection = document.getElementById("customSizeSection");
        if (customSection) {
          if (e.target.value === "custom") {
            customSection.classList.add("active");
          } else {
            customSection.classList.remove("active");
          }
        }
      }
      if (e.target.id === "enablePageNumbering") {
        const controls = document.getElementById("pageNumberingControls");
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active");
            this.updateStartFromPageOptions();
          } else {
            controls.classList.remove("active");
          }
        }
      }
      if (e.target.id === "enableWatermark") {
        const controls = document.getElementById("watermarkControls");
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active");
          } else {
            controls.classList.remove("active");
          }
        }
      }
      if (e.target.id === "numberOfPages") {
        const value = Number.parseInt(e.target.value);
        if (value > 10) {
          e.target.value = 10;
          alert(
            "⚠️ Maximum 10 pages allowed in initial creation. You can add more pages later.",
          );
        }
        this.updateStartFromPageOptions();
      }
      if (e.target.id === "pageBackgroundColor") {
        const preview = document.getElementById("backgroundColorPreview");
        if (preview) {
          preview.style.backgroundColor = e.target.value;
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("watermark-type-btn")) {
        document
          .querySelectorAll(".watermark-type-btn")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        const type = e.target.dataset.type;
        const textControls = document.getElementById("watermarkTextControls");
        const imageControls = document.getElementById("watermarkImageControls");
        if (type === "text") {
          textControls.style.display = "block";
          imageControls.style.display = "none";
        } else if (type === "image") {
          textControls.style.display = "none";
          imageControls.style.display = "block";
        } else if (type === "both") {
          textControls.style.display = "block";
          imageControls.style.display = "block";
        }
      }
      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement;
        parent
          .querySelectorAll(".position-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");
      }
      if (e.target.id === "pageSetupApply") {
        this.applyPageSetup();
      } else if (e.target.id === "pageSetupCancel") {
        this.cancelPageSetup();
      }
      if (e.target.id === "backgroundColorPreview") {
        const colorInput = document.getElementById("pageBackgroundColor");
        if (colorInput) {
          colorInput.click();
        }
      }
    });
  }

  updateStartFromPageOptions() {
    const numberOfPages =
      Number.parseInt(document.getElementById("numberOfPages")?.value) || 1;
    const startFromPageSelect = document.getElementById("startFromPage");

    if (startFromPageSelect) {
      startFromPageSelect.innerHTML = "";
      for (let i = 1; i <= numberOfPages; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Page ${i}`;
        startFromPageSelect.appendChild(option);
      }
    }
  }

  showInitialSetup() {
    const modal = document.getElementById("pageSetupModal");
    if (modal) {
      modal.style.display = "flex";
      this.updateStartFromPageOptions();

      if (this.isInitialized) {
        const bgColorInput = document.getElementById("pageBackgroundColor");
        const bgColorPreview = document.getElementById(
          "backgroundColorPreview",
        );
        if (bgColorInput && bgColorPreview) {
          bgColorInput.value = this.pageSettings.backgroundColor;
          bgColorPreview.style.backgroundColor =
            this.pageSettings.backgroundColor;
        }
      }
    } else {
      this.createInitialSetupModal();
      setTimeout(() => {
        const newModal = document.getElementById("pageSetupModal");
        if (newModal) {
          newModal.style.display = "flex";
          this.updateStartFromPageOptions();
        }
      }, 100);
    }
  }

  updatePageRule() {
    const existingStyle = document.getElementById("dynamic-page-rule");
    if (existingStyle) {
      existingStyle.remove();
    }

    const pageRule = `
    @page {
      size: ${this.pageSettings.format.toUpperCase()} ${this.pageSettings.orientation};
      margin: ${this.pageSettings.margins.top}mm ${this.pageSettings.margins.right}mm ${this.pageSettings.margins.bottom}mm ${this.pageSettings.margins.left}mm;
    }
  `;

    const styleElement = document.createElement("style");
    styleElement.id = "dynamic-page-rule";
    styleElement.innerHTML = pageRule;
    document.head.appendChild(styleElement);
  }

  applyPageSetup() {
    const format = document.getElementById("pageFormat").value;
    const orientation = document.getElementById("pageOrientation").value;
    let numberOfPages =
      Number.parseInt(document.getElementById("numberOfPages").value) || 1;

    const MAX_PAGES = 10;
    if (numberOfPages > MAX_PAGES) {
      alert(
        `⚠️ Maximum ${MAX_PAGES} pages allowed in initial creation. You requested ${numberOfPages} pages.\n\nYou can add more pages later using the "Add Page" button.`,
      );
      numberOfPages = MAX_PAGES;
      const numberOfPagesInput = document.getElementById("numberOfPages");
      if (numberOfPagesInput) {
        numberOfPagesInput.value = MAX_PAGES;
      }
    }

    const backgroundColor =
      document.getElementById("pageBackgroundColor")?.value || "#ffffff";
    const headerEnabled =
      document.getElementById("headerEnabled")?.checked !== false;
    const footerEnabled =
      document.getElementById("footerEnabled")?.checked !== false;
    const headerHeight =
      Number.parseFloat(document.getElementById("headerHeight")?.value) || 12.7;
    const footerHeight =
      Number.parseFloat(document.getElementById("footerHeight")?.value) || 12.7;

    const margins = {
      top: Number.parseFloat(document.getElementById("marginTop").value) || 0,
      bottom:
        Number.parseFloat(document.getElementById("marginBottom").value) || 0,
      left: Number.parseFloat(document.getElementById("marginLeft").value) || 0,
      right:
        Number.parseFloat(document.getElementById("marginRight").value) || 0,
    };

    const pageNumberingEnabled =
      document.getElementById("enablePageNumbering")?.checked || false;
    const startFromPage =
      Number.parseInt(document.getElementById("startFromPage")?.value) || 1;
    const watermarkEnabled =
      document.getElementById("enableWatermark")?.checked || false;
    const watermarkType =
      document.querySelector(".watermark-type-btn.active")?.dataset.type ||
      "text";
    const watermarkTextPosition =
      document.querySelector(".watermark-text-position-option.selected")
        ?.dataset.position || "center";
    const watermarkImagePosition =
      document.querySelector(".watermark-image-position-option.selected")
        ?.dataset.position || "center";

    let width, height;
    if (format === "custom") {
      width =
        Number.parseFloat(document.getElementById("customWidth").value) || 210;
      height =
        Number.parseFloat(document.getElementById("customHeight").value) || 297;
    } else {
      const dimensions = this.pageFormats[format] || this.pageFormats.a4;
      width =
        orientation === "landscape" ? dimensions.height : dimensions.width;
      height =
        orientation === "landscape" ? dimensions.width : dimensions.height;
    }

    this.pageSettings = {
      format,
      orientation,
      numberOfPages,
      width,
      height,
      margins,
      backgroundColor,
      pages: [],
      headerFooter: {
        headerEnabled,
        footerEnabled,
        headerHeight,
        footerHeight,
      },
      pageNumbering: {
        enabled: pageNumberingEnabled,
        startFromPage,
        excludedPages: Array.from(
          { length: startFromPage - 1 },
          (_, i) => i + 1,
        ),
      },
      watermark: {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: {
          content:
            document.getElementById("watermarkText")?.value || "CONFIDENTIAL",
          fontSize:
            Number.parseInt(
              document.getElementById("watermarkFontSize")?.value,
            ) || 48,
          color: document.getElementById("watermarkColor")?.value || "#cccccc",
          opacity:
            Number.parseInt(
              document.getElementById("watermarkOpacity")?.value,
            ) / 100 || 0.3,
          rotation:
            Number.parseInt(
              document.getElementById("watermarkRotation")?.value,
            ) || 0,
        },
        image: {
          url: document.getElementById("watermarkImageUrl")?.value || "",
          width:
            Number.parseInt(
              document.getElementById("watermarkImageWidth")?.value,
            ) || 200,
          height:
            Number.parseInt(
              document.getElementById("watermarkImageHeight")?.value,
            ) || 200,
          opacity:
            Number.parseFloat(
              document.getElementById("watermarkImageOpacity")?.value,
            ) / 100 || 0.3,
          rotation:
            Number.parseInt(
              document.getElementById("watermarkImageRotation")?.value,
            ) || 0,
        },
        textPosition: watermarkTextPosition,
        imagePosition: watermarkImagePosition,
        position:
          watermarkType === "text"
            ? watermarkTextPosition
            : watermarkImagePosition,
        applyToAllPages: true,
        tiled: document.getElementById("watermarkTiled")?.checked || false,
      },
    };

    this.updatePageRule();
    let created = 0;
    const batchSize = 5;

    const modal = document.getElementById("pageSetupModal");
    if (modal) modal.style.display = "none";

    const createBatch = () => {
      for (
        let i = 0;
        i < batchSize && created < numberOfPages;
        i++, created++
      ) {
        const pageIndex = created;
        this.pageSettings.pages.push({
          id: `page-${pageIndex + 1}`,
          name: `Page ${pageIndex + 1}`,
          pageNumber: pageIndex + 1,
          backgroundColor,
          header: {
            enabled: headerEnabled,
            content: "",
            height: headerHeight,
            padding: 10,
            fontSize: 12,
            color: "#333333",
            backgroundColor,
            position: "center",
          },
          footer: {
            enabled: footerEnabled,
            content: "",
            height: footerHeight,
            padding: 10,
            fontSize: 12,
            color: "#333333",
            backgroundColor,
            position: "center",
          },
          pageNumber: {
            enabled: false,
            format: "Page {n}",
            position: "bottom-right",
            fontSize: 11,
            color: "#333333",
            backgroundColor: "#ffffff",
            showBorder: true,
          },
        });
      }

      if (created < numberOfPages) {
        setTimeout(createBatch, 50);
      } else {
        this.setupEditorPages();
        this.isInitialized = true;
        try {
          document.dispatchEvent(
            new CustomEvent("pageSetupStateChanged", {
              detail: { active: true },
            }),
          );
        } catch (err) {}
        this.updateNavbarButton();
        this.updateAddPageButton();
        if (numberOfPages === MAX_PAGES) {
          setTimeout(() => {}, 500);
        }
      }
    };

    createBatch();
  }

  cancelPageSetup() {
    const modal = document.getElementById("pageSetupModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  showPageElementsSettings() {
    if (!this.isInitialized || this.pageSettings.pages.length === 0) {
      alert("Please set up pages first");
      return;
    }

    const firstPage = this.pageSettings.pages[0];
    const globalHeader = firstPage.header || {};
    const globalFooter = firstPage.footer || {};
    const globalPageNumber = firstPage.pageNumber || {};
    const headerHeight =
      this._lastHeaderHeight ??
      this.pageSettings.headerFooter.headerHeight ??
      12.7;
    const footerHeight =
      this._lastFooterHeight ??
      this.pageSettings.headerFooter.footerHeight ??
      12.7;
    const headerApplyMode = this._lastHeaderApplyMode ?? "all";
    const footerApplyMode = this._lastFooterApplyMode ?? "all";

    let pageOptions = "";
    for (let i = 1; i <= this.pageSettings.numberOfPages; i++) {
      const selected =
        this.pageSettings.pageNumbering.startFromPage === i ? "selected" : "";
      pageOptions += `<option value="${i}" ${selected}>Page ${i}</option>`;
    }

    const watermarkSettings = this.pageSettings.watermark || {
      enabled: false,
      type: "text",
      tiled: false,
      textPosition: "center",
      imagePosition: "center",
      position: "center",
      text: {
        content: "CONFIDENTIAL",
        fontSize: 48,
        color: "#000000",
        opacity: 0.3,
        rotation: 0,
      },
      image: {
        url: "",
        width: 200,
        height: 200,
        opacity: 0.3,
        rotation: 0,
      },
    };

    const watermarkText = watermarkSettings.text || {};
    const watermarkImage = watermarkSettings.image || {};
    const watermarkTextContent = watermarkText.content || "CONFIDENTIAL";
    const watermarkFontSize = watermarkText.fontSize || 48;
    const watermarkColor = watermarkText.color || "#000000";
    const watermarkOpacity = Math.round((watermarkText.opacity || 0.3) * 100);
    const watermarkRotation = watermarkText.rotation || 0;
    const watermarkImageUrl = watermarkImage.url || "";
    const watermarkImageWidth = watermarkImage.width || 200;
    const watermarkImageHeight = watermarkImage.height || 200;
    const watermarkImageOpacity = Math.round(
      (watermarkImage.opacity || 0.3) * 100,
    );
    const watermarkImageRotation = watermarkImage.rotation || 0;

    this.editor.Modal.setTitle("Word-Style Page Elements Settings");
    this.editor.Modal.setContent(`
    <div class="page-settings-content" style="color: #000 !important;">
      <div class="page-setup-section">
        <h3>📋 Page Information</h3>
        <div class="page-info-grid">
          <div class="page-info-item">
            <label>Format:</label>
            <span class="page-info-value">${this.pageSettings.format.toUpperCase()}</span>
          </div>
          <div class="page-info-item">
            <label>Orientation:</label>
            <span class="page-info-value">${this.pageSettings.orientation.charAt(0).toUpperCase() + this.pageSettings.orientation.slice(1)}</span>
          </div>
          <div class="page-info-item">
            <label>Total Pages:</label>
            <span class="page-info-value">${this.pageSettings.numberOfPages}</span>
          </div>
          <div class="page-info-item">
            <label>Dimensions:</label>
            <span class="page-info-value">${this.pageSettings.width} × ${this.pageSettings.height} mm</span>
          </div>
          <div class="page-info-item">
            <label>Margins:</label>
            <span class="page-info-value">${this.pageSettings.margins.top}/${this.pageSettings.margins.bottom}/${this.pageSettings.margins.left}/${this.pageSettings.margins.right} mm</span>
          </div>
          <div class="page-info-item">
            <label>Content Area:</label>
            <span class="page-info-value">${(this.pageSettings.width - this.pageSettings.margins.left - this.pageSettings.margins.right).toFixed(1)} × ${(this.pageSettings.height - this.pageSettings.margins.top - this.pageSettings.margins.bottom).toFixed(1)} mm</span>
          </div>
        </div>
      </div>

      <!--
      <div class="page-setup-section format-change-section">
        <h3>📐 Change Page Format & Orientation</h3>
        <div class="format-change-warning">
          <strong>⚠️ Warning:</strong> Changing format or orientation will automatically adjust content positions to maintain relative positioning. Content at center will remain centered, content at edges will be repositioned proportionally.
        </div>
        <div class="format-change-controls">
          <div>
            <label class="page-setup-label">New Format:</label>
            <select id="settingsPageFormat" class="page-setup-control">
              <option value="a4" ${this.pageSettings.format === "a4" ? "selected" : ""}>A4 (210 × 297 mm)</option>
              <option value="a3" ${this.pageSettings.format === "a3" ? "selected" : ""}>A3 (297 × 420 mm)</option>
              <option value="a2" ${this.pageSettings.format === "a2" ? "selected" : ""}>A2 (420 × 594 mm)</option>
              <option value="a1" ${this.pageSettings.format === "a1" ? "selected" : ""}>A1 (594 × 841 mm)</option>
              <option value="a0" ${this.pageSettings.format === "a0" ? "selected" : ""}>A0 (841 × 1189 mm)</option>
              <option value="letter" ${this.pageSettings.format === "letter" ? "selected" : ""}>Letter (8.5 × 11 in)</option>
              <option value="legal" ${this.pageSettings.format === "legal" ? "selected" : ""}>Legal (8.5 × 14 in)</option>
              <option value="a5" ${this.pageSettings.format === "a5" ? "selected" : ""}>A5 (148 × 210 mm)</option>
              <option value="custom" ${this.pageSettings.format === "custom" ? "selected" : ""}>Custom Size</option>
            </select>
          </div>
          <div>
            <label class="page-setup-label">New Orientation:</label>
            <select id="settingsPageOrientation" class="page-setup-control">
              <option value="portrait" ${this.pageSettings.orientation === "portrait" ? "selected" : ""}>Portrait</option>
              <option value="landscape" ${this.pageSettings.orientation === "landscape" ? "selected" : ""}>Landscape</option>
            </select>
          </div>
        </div>
        <div id="settingsCustomSizeSection" class="page-setup-custom-size ${this.pageSettings.format === "custom" ? "active" : ""}">
          <h4>Custom Dimensions</h4>
          <div class="page-setup-custom-row">
            <div>
              <label>Width:</label>
              <input type="number" id="settingsCustomWidth" class="page-setup-control" value="${this.pageSettings.width}" min="50" max="2000">
            </div>
            <div>
              <label>Height:</label>
              <input type="number" id="settingsCustomHeight" class="page-setup-control" value="${this.pageSettings.height}" min="50" max="2000">
            </div>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <strong>Preview:</strong> <span id="formatPreviewDimensions">${this.pageSettings.width} × ${this.pageSettings.height} mm</span>
        </div>
        <div style="margin-top: 15px;">
          <button id="applyFormatChange" class="page-setup-btn page-setup-btn-primary">Apply Format Change</button>
        </div>
      </div> -->

      <div class="page-setup-section">
        <h3>🎨 Page Background</h3>
        <div class="page-setup-row">
          <label class="page-setup-label">Background Color:</label>
          <div class="background-color-controls">
            <input type="color" id="settingsPageBackgroundColor" class="page-setup-control" value="${this.pageSettings.backgroundColor || "#ffffff"}">
            <div class="color-preview" id="settingsBackgroundColorPreview" style="background-color: ${this.pageSettings.backgroundColor || "#ffffff"};"></div>
          </div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">Background color will be preserved in headers, footers, and print/PDF output</p>
      </div>

     <!-- Replace the watermark section in showPageElementsSettings() -->

<div class="page-setup-section">
  <h3>💧 Page Watermark Settings</h3>

  <div class="page-setup-row">
    <label>
      <input
        type="checkbox"
        id="settingsWatermarkEnabled"
        ${watermarkSettings.enabled ? "checked" : ""}
        style="border: 2px solid #000 !important;"
      >
      Enable Watermark
    </label>
  </div>

  <div
    id="settingsWatermarkControls"
    class="watermark-controls ${watermarkSettings.enabled ? "active" : ""}"
  >

    <!-- WATERMARK TYPE -->
    <div class="page-setup-row">
      <label class="page-setup-label">Type:</label>
      <div class="watermark-type-controls">
        <div class="watermark-type-btn ${watermarkSettings.type === "text" ? "active" : ""}" data-type="text">Text</div>
        <div class="watermark-type-btn ${watermarkSettings.type === "image" ? "active" : ""}" data-type="image">Image</div>
        <div class="watermark-type-btn ${watermarkSettings.type === "both" ? "active" : ""}" data-type="both">Both</div>
      </div>
    </div>

    <!-- ================= TEXT WATERMARK ================= -->
    <div
      id="settingsWatermarkTextControls"
      style="display: ${watermarkSettings.type === "text" || watermarkSettings.type === "both" ? "block" : "none"};"
    >
      <h4 style="margin-top: 15px; color: #333;">Text Watermark</h4>

      <div class="page-setup-row">
        <label class="page-setup-label">Text:</label>
        <input
          type="text"
          id="settingsWatermarkText"
          class="page-setup-control"
          value="${watermarkTextContent}"
          placeholder="Enter watermark text"
        >
      </div>

      <div class="size-controls">
        <div>
          <label>Font Size:</label>
          <input
            type="number"
            id="settingsWatermarkFontSize"
            class="page-setup-control"
            value="${watermarkFontSize}"
            min="12"
            max="100"
          >
        </div>

        <div>
          <label>Color:</label>
          <input
            type="color"
            id="settingsWatermarkColor"
            class="page-setup-control"
            value="${watermarkColor}"
          >
        </div>

        <div>
          <label>Opacity:</label>
          <input
            type="range"
            id="settingsWatermarkOpacity"
            class="page-setup-control"
            value="${watermarkOpacity}"
            min="10"
            max="80"
          >
        </div>

        <div>
          <label>Rotation:</label>
          <input
            type="range"
            id="settingsWatermarkRotation"
            class="page-setup-control"
            value="${watermarkRotation}"
            min="-90"
            max="90"
          >
        </div>
      </div>

      <!-- TEXT POSITION -->
      <div class="page-setup-row">
        <label class="page-setup-label">Text Position:</label>
        <div class="position-grid watermark-text-position-grid">
          ${[
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]
            .map(
              (pos) => `
            <div
              class="watermark-text-position-option ${(watermarkSettings.textPosition || watermarkSettings.position) === pos ? "selected" : ""}"
              data-position="${pos}"
            >
              ${pos.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>

    <!-- ================= IMAGE WATERMARK ================= -->
    <div
      id="settingsWatermarkImageControls"
      style="display: ${watermarkSettings.type === "image" || watermarkSettings.type === "both" ? "block" : "none"};"
    >
      <h4 style="margin-top: 15px; color: #333;">Image Watermark</h4>

      <div class="page-setup-row">
        <label class="page-setup-label">Image URL:</label>
        <input
          type="url"
          id="settingsWatermarkImageUrl"
          class="page-setup-control"
          value="${watermarkImageUrl}"
          placeholder="Enter image URL"
        >
      </div>

      <div class="page-setup-row">
        <label class="page-setup-label">Or Upload Image:</label>
        <input type="file" id="settingsWatermarkImageFile" accept="image/*" class="page-setup-control">
      </div>

      <div class="size-controls">
        <div>
          <label>Width (px):</label>
          <input
            type="number"
            id="settingsWatermarkImageWidth"
            class="page-setup-control"
            value="${watermarkImageWidth}"
            min="50"
            max="500"
          >
        </div>

        <div>
          <label>Height (px):</label>
          <input
            type="number"
            id="settingsWatermarkImageHeight"
            class="page-setup-control"
            value="${watermarkImageHeight}"
            min="50"
            max="500"
          >
        </div>

        <div>
          <label>Opacity:</label>
          <input
            type="range"
            id="settingsWatermarkImageOpacity"
            class="page-setup-control"
            value="${watermarkImageOpacity}"
            min="10"
            max="80"
          >
        </div>

        <div>
          <label>Rotation:</label>
          <input
            type="range"
            id="settingsWatermarkImageRotation"
            class="page-setup-control"
            value="${watermarkImageRotation}"
            min="-90"
            max="90"
          >
        </div>
      </div>

      <!-- IMAGE POSITION -->
      <div class="page-setup-row">
        <label class="page-setup-label">Image Position:</label>
        <div class="position-grid watermark-image-position-grid">
          ${[
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]
            .map(
              (pos) => `
            <div
              class="watermark-image-position-option ${(watermarkSettings.imagePosition || watermarkSettings.position) === pos ? "selected" : ""}"
              data-position="${pos}"
            >
              ${pos.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>

    <!-- ================= TILED ================= -->
    <div class="page-setup-row">
      <label>
        <input
          type="checkbox"
          id="settingsWatermarkTiled"
          ${watermarkSettings.tiled ? "checked" : ""}
        >
        Tiled Watermark (Repeat across page)
      </label>
    </div>

  </div>
</div>

      <div class="page-setup-section">
        <h3>📏 Page Margins (mm)</h3>
        <div class="margins-grid">
          <div>
            <label>Top:</label>
            <input type="number" id="settingsMarginTop" class="page-setup-control" value="${this.pageSettings.margins.top}" min="0" max="50">
          </div>
          <div>
            <label>Bottom:</label>
            <input type="number" id="settingsMarginBottom" class="page-setup-control" value="${this.pageSettings.margins.bottom}" min="0" max="50">
          </div>
          <div>
            <label>Left:</label>
            <input type="number" id="settingsMarginLeft" class="page-setup-control" value="${this.pageSettings.margins.left}" min="0" max="50">
          </div>
          <div>
            <label>Right:</label>
            <input type="number" id="settingsMarginRight" class="page-setup-control" value="${this.pageSettings.margins.right}" min="0" max="50">
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <div class="word-style-notice" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1976d2 !important;">📝 Word-Style Headers & Footers</h4>
          <p style="margin: 0; font-size: 12px; color: #1565c0 !important;">
            <strong>All Pages:</strong> Same content on every page<br>
            <strong>Even Pages Only:</strong> Headers/footers appear only on pages 2, 4, 6...<br>
            <strong>Odd Pages Only:</strong> Headers/footers appear only on pages 1, 3, 5...<br>
            <strong>Different Odd & Even:</strong> Separate header/footer content for odd and even pages<br>
            <strong>Custom Range:</strong> Headers/footers appear only on specified pages
          </p>
        </div>
        
        <!-- Header Controls -->
        <div class="header-footer-section">
          <h4>📋 Header Settings</h4>
          <div class="page-setup-row">
            <label><input type="checkbox" id="settingsHeaderEnabled" ${this.pageSettings.headerFooter.headerEnabled ? "checked" : ""}> Enable Header</label>
          </div>
        
          <div class="size-input-group">
            <label>Height:</label>
            <input type="number" id="settingsHeaderHeight" value="${headerHeight}" min="5" max="50" step="0.1">
            <span style="font-size: 12px; color: #666;">mm</span>
          </div>
          
          <div class="page-setup-row">
            <label class="page-setup-label">Apply Header To:</label>
            <select id="headerApplyMode" class="page-setup-control">
        <option value="all" ${headerApplyMode === "all" ? "selected" : ""}>All Pages</option>
        <option value="first" ${headerApplyMode === "first" ? "selected" : ""}>First Page Only</option>
        <option value="last" ${headerApplyMode === "last" ? "selected" : ""}>Last Page Only</option>
        <option value="even" ${headerApplyMode === "even" ? "selected" : ""}>Even Pages Only (2, 4, 6...)</option>
        <option value="odd" ${headerApplyMode === "odd" ? "selected" : ""}>Odd Pages Only (1, 3, 5...)</option>
        <option value="different" ${headerApplyMode === "different" ? "selected" : ""}>Different Odd & Even Pages</option>
        <option value="custom" ${headerApplyMode === "custom" ? "selected" : ""}>Custom Range</option>
      </select>
          </div>
          
          <div class="page-setup-row custom-range" id="headerCustomRangeInputs" style="display: ${headerApplyMode === "custom" ? "block" : "none"};">
            <input type="text" id="headerCustomPageList" placeholder="e.g. 1,3,5-7" value="${this._lastHeaderCustomPageList || ""}" style="width: 100%;">
          </div>
        </div>

        <!-- Footer Controls -->
        <div class="header-footer-section">
          <h4>📋 Footer Settings</h4>
          <div class="page-setup-row">
            <label><input type="checkbox" id="settingsFooterEnabled" ${this.pageSettings.headerFooter.footerEnabled ? "checked" : ""}> Enable Footer</label>
          </div>
          
          <div class="size-input-group">
            <label>Height:</label>
            <input type="number" id="settingsFooterHeight" value="${footerHeight}" min="5" max="50" step="0.1">
            <span style="font-size: 12px; color: #666;">mm</span>
          </div>
          
          <div class="page-setup-row">
            <label class="page-setup-label">Apply Footer To:</label>
            <select id="footerApplyMode" class="page-setup-control">
        <option value="all" ${footerApplyMode === "all" ? "selected" : ""}>All Pages</option>
        <option value="first" ${footerApplyMode === "first" ? "selected" : ""}>First Page Only</option>
        <option value="last" ${footerApplyMode === "last" ? "selected" : ""}>Last Page Only</option>
        <option value="even" ${footerApplyMode === "even" ? "selected" : ""}>Even Pages Only (2, 4, 6...)</option>
        <option value="odd" ${footerApplyMode === "odd" ? "selected" : ""}>Odd Pages Only (1, 3, 5...)</option>
        <option value="different" ${footerApplyMode === "different" ? "selected" : ""}>Different Odd & Even Pages</option>
        <option value="custom" ${footerApplyMode === "custom" ? "selected" : ""}>Custom Range</option>
      </select>
          </div>
          
          <div class="page-setup-row custom-range" id="footerCustomRangeInputs" style="display: ${footerApplyMode === "custom" ? "block" : "none"};">
            <input type="text" id="footerCustomPageList" placeholder="e.g. 2,4-6,9" value="${this._lastFooterCustomPageList || ""}" style="width: 100%;">
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <h3>🔢 Page Number Settings</h3>
        <div class="page-setup-row">
          <label>
            <input type="checkbox" id="pageNumberEnabled" ${globalPageNumber.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Page Numbers
          </label>
        </div>
        <div class="page-setup-row">
          <label class="page-setup-label">Start From Page:</label>
          <select id="pageNumberStartFrom" class="page-setup-control">
            ${pageOptions}
          </select>
        </div>
        <p style="font-size: 12px; color: #666; margin: 10px 0;">Pages before the selected page will be excluded from numbering</p>
        <div class="page-setup-row">
          <label class="page-setup-label">Format:</label>
          <select id="pageNumberFormat" class="page-setup-control">
            <option value="Page {n}" ${globalPageNumber.format === "Page {n}" ? "selected" : ""}>Page {n}</option>
            <option value="{n}" ${globalPageNumber.format === "{n}" ? "selected" : ""}>{n}</option>
            <option value="{n} of {total}" ${globalPageNumber.format === "{n} of {total}" ? "selected" : ""}>{n} of {total}</option>
            <option value="- {n} -" ${globalPageNumber.format === "- {n} -" ? "selected" : ""}>- {n} -</option>
            <option value="[{n}]" ${globalPageNumber.format === "[{n}]" ? "selected" : ""}>[{n}]</option>
          </select>
        </div>
        <div class="page-setup-row">
          <label class="page-setup-label">Position:</label>
          <div class="position-grid">
            <div class="position-option ${globalPageNumber.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
            <div class="position-option ${globalPageNumber.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
            <div class="position-option ${globalPageNumber.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
            <!-- <div class="position-option ${globalPageNumber.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
            <div class="position-option ${globalPageNumber.position === "center-center" ? "selected" : ""}" data-position="center-center">Center</div>
            <div class="position-option ${globalPageNumber.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div> -->
            <div class="position-option ${globalPageNumber.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
            <div class="position-option ${globalPageNumber.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
            <div class="position-option ${globalPageNumber.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
          </div>
        </div>
        <div class="size-controls">
          <div>
            <label>Font Size:</label>
            <input type="number" id="pageNumberFontSize" class="page-setup-control" value="${globalPageNumber.fontSize || 8}" min="8" max="20">
          </div>
          <div>
            <label>Text Color:</label>
            <input type="color" id="pageNumberColor" class="page-setup-control" value="${globalPageNumber.color || "#333333"}">
          </div>
          <div>
            <label>Background:</label>
            <input type="color" id="pageNumberBackgroundColor" class="page-setup-control" value="${globalPageNumber.backgroundColor || "#ffffff"}">
          </div>
            <div>
    <label>Rotation:</label>
    <input type="range" id="pageNumberRotation" class="page-setup-control" value="${globalPageNumber.rotation || 0}" min="-90" max="90">
    <span id="pageNumberRotationValue" style="font-size: 11px; color: #666;">${globalPageNumber.rotation || 0}°</span>
  </div>
          <div>
            <label>
              <input type="checkbox" id="pageNumberShowBorder" ${globalPageNumber.showBorder ? "checked" : ""} style="border: 2px solid #000 !important;"> Show Border
            </label>
          </div>
        </div>
      </div>

<div class="page-setup-section">
  <h3>✂️ Conditional Page Break Settings</h3>
  <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
    <strong style="color: #856404;">⚠️ Important:</strong>
    <p style="margin: 5px 0 0 0; font-size: 11px; color: #856404;">
      Only ONE type of conditional break (Page-Level OR Section-Level) can be active at a time.
      Enabling one will automatically disable the other.
    </p>
  </div>
  
  <!-- PAGE-LEVEL CONDITIONAL BREAK -->
  ${this.generatePageConditionalBreakUI()}
  
  <!-- SECTION-LEVEL CONDITIONAL BREAK -->
  ${this.generateSectionConditionalBreakUI()}
</div>
      <div class="page-setup-section">
        <h3>🗑️ Page Management</h3>
        <div class="page-setup-row">
          <button id="deletePages" class="page-setup-btn page-setup-btn-secondary">Delete Pages</button>
        </div>
      </div>
      
      <div class="page-setup-actions">
        <button id="applyPageElementsSettings" class="page-setup-btn page-setup-btn-primary">Apply Word-Style Settings</button>
        <button id="resetPageElementsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
      </div>
    </div>
  `);

    this.editor.Modal.open();

    setTimeout(() => {
      this.setupPageElementsListeners();
      this.attachOverrideItemListeners();
      this.populatePageSettingsForm();

      const pageNumberSettings = this.pageSettings.pageNumber || {};
      const enabledCheckbox = document.getElementById("pageNumberEnabled");
      if (enabledCheckbox) {
        enabledCheckbox.checked = !!pageNumberSettings.enabled;
      }

      const startFromSelect = document.getElementById("pageNumberStartFrom");
      if (startFromSelect) {
        startFromSelect.value = pageNumberSettings.startFrom || 1;
      }
      const formatSelect = document.getElementById("pageNumberFormat");
      if (formatSelect) {
        formatSelect.value = pageNumberSettings.format || "Page {n}";
      }

      const fontSizeInput = document.getElementById("pageNumberFontSize");
      if (fontSizeInput) {
        const storedSize = pageNumberSettings.fontSize;
        let fontSize = 8;
        if (typeof storedSize === "number") {
          fontSize = storedSize;
        } else if (typeof storedSize === "string") {
          fontSize = parseInt(storedSize.replace("px", "")) || 8;
        }
        fontSizeInput.value = fontSize;
      }

      const colorInput = document.getElementById("pageNumberColor");
      if (colorInput) {
        colorInput.value = pageNumberSettings.color || "#333333";
      }

      const bgColorInput = document.getElementById("pageNumberBackgroundColor");
      if (bgColorInput) {
        bgColorInput.value = pageNumberSettings.backgroundColor || "#ffffff";
      }

      const borderCheckbox = document.getElementById("pageNumberShowBorder");
      if (borderCheckbox) {
        borderCheckbox.checked = !!pageNumberSettings.showBorder;
      }
      const rotationInput = document.getElementById("pageNumberRotation");
      const rotationValue = document.getElementById("pageNumberRotationValue");
      if (rotationInput && rotationValue) {
        const rotation = pageNumberSettings.rotation || 0;
        rotationInput.value = rotation;
        rotationValue.textContent = `${rotation}°`;
      }

      const savedPosition = pageNumberSettings.position || "bottom-center";
      setTimeout(() => {
        const allPositionOptions =
          document.querySelectorAll(".position-option");
        allPositionOptions.forEach((opt) => {
          opt.classList.remove("selected");
          if (opt.getAttribute("data-position") === savedPosition) {
            opt.classList.add("selected");
          }
        });
      }, 50);
    }, 100);
  }

  generateSectionConditionalBreakUI() {
    const sectionBreakSettings = this.pageSettings
      .sectionConditionalPageBreak || {
      enabled: false,
      defaultDistance: 50,
      defaultUnit: "mm",
      sectionOverrides: {},
    };

    return `
    <div class="page-setup-section">
      <h3>✂️ Section Conditional Page Break Settings</h3>
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 11px; color: #856404;">
          <strong>Note:</strong> Only one conditional break type (Page or Section) will be active at a time.
          Section breaks apply to specific section groups based on data-section-count attribute.
        </p>
      </div>
      
      <div class="page-setup-row">
        <label>
          <input type="checkbox" id="sectionConditionalBreakEnabled" 
                 ${sectionBreakSettings.enabled ? "checked" : ""} 
                 style="border: 2px solid #000 !important;"> 
          Enable Section Conditional Page Break
        </label>
      </div>

      <div id="sectionConditionalBreakControls" class="page-numbering-controls ${sectionBreakSettings.enabled ? "active" : ""}">
        
        <!-- GLOBAL DEFAULT SETTINGS -->
        <div class="page-setup-row" style="margin-bottom: 15px; padding: 15px; background: #e3f2fd; border-radius: 6px;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #1976d2;">Default Settings (for all sections without specific overrides)</strong>
            <p style="font-size: 11px; color: #666; margin: 5px 0 10px 0;">
              This will apply to all sections that don't have specific settings, including dynamically created sections.
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <label style="min-width: 120px;">Distance from Bottom:</label>
            <input type="number" id="sectionBreakDefaultDistance" class="page-setup-control" 
                   value="${sectionBreakSettings.defaultDistance || 50}" 
                   min="1" max="200" step="0.1" style="flex: 1; max-width: 120px;">
            <select id="sectionBreakDefaultUnit" class="page-setup-control" style="width: 80px;">
              <option value="mm" ${(sectionBreakSettings.defaultUnit || "mm") === "mm" ? "selected" : ""}>mm</option>
              <option value="cm" ${sectionBreakSettings.defaultUnit === "cm" ? "selected" : ""}>cm</option>
              <option value="inch" ${sectionBreakSettings.defaultUnit === "inch" ? "selected" : ""}>inch</option>
            </select>
          </div>
        </div>

        <!-- SECTION-SPECIFIC OVERRIDES -->
        <div style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #333;">Section-Specific Overrides (Optional)</strong>
            <button type="button" id="addSectionBreakOverride" class="page-setup-btn" 
                    style="padding: 5px 10px; font-size: 12px; background: #28a745; color: white;">
              <i class="fa fa-plus"></i> Add Override
            </button>
          </div>
          <p style="font-size: 11px; color: #666; margin-bottom: 10px;">
            Set different break distances for specific section groups (identified by data-section-count).
          </p>
          
          <div id="sectionBreakOverridesList" style="max-height: 300px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px; background: #f8f9fa;">
            ${this.generateSectionBreakOverrides()}
          </div>
        </div>

      </div>
    </div>
  `;
  }

  generateSectionBreakOverrides() {
    const overrides =
      this.pageSettings.sectionConditionalPageBreak?.sectionOverrides || {};

    let html = `
    <!-- Add Override Form -->
    <div id="addSectionOverrideForm" style="margin-bottom: 15px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; display: none;">
      <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">Add New Section Override</h4>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Section Count(s):</label>
        <input type="text" id="newSectionOverrideCount" class="page-setup-control" 
               placeholder="e.g., 1 or 2,5,8" style="width: 100%; font-size: 12px;">
        <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">
          Enter single section count or multiple (comma-separated)
        </p>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Distance:</label>
          <input type="number" id="newSectionOverrideDistance" class="page-setup-control" 
                 value="50" min="1" max="200" step="0.1" style="width: 100%; font-size: 12px;">
        </div>
        <div style="width: 80px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Unit:</label>
          <select id="newSectionOverrideUnit" class="page-setup-control" style="width: 100%; font-size: 12px;">
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="inch">inch</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" id="confirmAddSectionOverride" class="page-setup-btn page-setup-btn-primary" 
                style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-check"></i> Add Override
        </button>
        <button type="button" id="cancelAddSectionOverride" class="page-setup-btn page-setup-btn-secondary" 
                style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;

    if (Object.keys(overrides).length === 0) {
      html +=
        '<div id="noSectionOverridesMessage" style="text-align: center; color: #999; padding: 15px; font-size: 12px;">No section-specific overrides yet.</div>';
    } else {
      const sortedSections = Object.keys(overrides).sort(
        (a, b) => parseInt(a) - parseInt(b),
      );

      sortedSections.forEach((sectionCount) => {
        const setting = overrides[sectionCount];
        html += `
        <div class="section-break-override-item" data-section-count="${sectionCount}" 
             style="margin-bottom: 8px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #dee2e6; display: flex; align-items: center; gap: 8px;">
          <label style="min-width: 80px; font-weight: 500; color: #333; font-size: 12px;">Section ${sectionCount}:</label>
          <input type="number" 
                 class="page-setup-control section-override-distance" 
                 data-section-count="${sectionCount}"
                 value="${setting.distance}" 
                 min="1" 
                 max="200" 
                 step="0.1" 
                 style="flex: 1; max-width: 90px; font-size: 12px;">
          <select class="page-setup-control section-override-unit" 
                  data-section-count="${sectionCount}"
                  style="width: 65px; font-size: 12px;">
            <option value="mm" ${setting.unit === "mm" ? "selected" : ""}>mm</option>
            <option value="cm" ${setting.unit === "cm" ? "selected" : ""}>cm</option>
            <option value="inch" ${setting.unit === "inch" ? "selected" : ""}>inch</option>
          </select>
          <button type="button" class="remove-section-override" data-section-count="${sectionCount}" 
                  style="padding: 5px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
      });
    }

    return html;
  }

  generatePageBreakOverrides() {
    const overrides =
      this.pageSettings.conditionalPageBreak?.pageOverrides || {};

    let html = `
    <!-- Add Override Form -->
    <div id="addOverrideForm" style="margin-bottom: 15px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; display: none;">
      <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">Add New Override</h4>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Page Number(s):</label>
        <input type="text" id="newOverridePages" class="page-setup-control" placeholder="e.g., 1 or 2,5,8 or 3-7" style="width: 100%; font-size: 12px;">
        <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">
          Enter single page, multiple pages (comma-separated), or range (e.g., "3-7")
        </p>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Distance:</label>
          <input type="number" id="newOverrideDistance" class="page-setup-control" value="50" min="1" max="200" step="0.1" style="width: 100%; font-size: 12px;">
        </div>
        <div style="width: 80px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Unit:</label>
          <select id="newOverrideUnit" class="page-setup-control" style="width: 100%; font-size: 12px;">
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="inch">inch</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" id="confirmAddOverride" class="page-setup-btn page-setup-btn-primary" style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-check"></i> Add Override
        </button>
        <button type="button" id="cancelAddOverride" class="page-setup-btn page-setup-btn-secondary" style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;

    if (Object.keys(overrides).length === 0) {
      html +=
        '<div id="noOverridesMessage" style="text-align: center; color: #999; padding: 15px; font-size: 12px;">No page-specific overrides yet.</div>';
    } else {
      const sortedPages = Object.keys(overrides).sort(
        (a, b) => parseInt(a) - parseInt(b),
      );

      sortedPages.forEach((pageNum) => {
        const setting = overrides[pageNum];
        html += `
        <div class="page-break-override-item" data-page-num="${pageNum}" style="margin-bottom: 8px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #dee2e6; display: flex; align-items: center; gap: 8px;">
          <label style="min-width: 55px; font-weight: 500; color: #333; font-size: 12px;">Page ${pageNum}:</label>
          <input type="number" 
                 class="page-setup-control override-distance" 
                 data-page-num="${pageNum}"
                 value="${setting.distance}" 
                 min="1" 
                 max="200" 
                 step="0.1" 
                 style="flex: 1; max-width: 90px; font-size: 12px;">
          <select class="page-setup-control override-unit" 
                  data-page-num="${pageNum}"
                  style="width: 65px; font-size: 12px;">
            <option value="mm" ${setting.unit === "mm" ? "selected" : ""}>mm</option>
            <option value="cm" ${setting.unit === "cm" ? "selected" : ""}>cm</option>
            <option value="inch" ${setting.unit === "inch" ? "selected" : ""}>inch</option>
          </select>
          <button type="button" class="remove-override" data-page-num="${pageNum}" style="padding: 5px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
      });
    }

    return html;
  }

  confirmPageBreakOverride() {
    const pageNumbersInput = document
      .getElementById("overridePageNumbers")
      ?.value.trim();
    const distance = parseFloat(
      document.getElementById("overrideDistance")?.value,
    );
    const unit = document.getElementById("overrideUnit")?.value;

    if (!pageNumbersInput) {
      alert("Please enter page number(s)");
      return;
    }

    if (isNaN(distance) || distance <= 0) {
      alert("Please enter a valid distance");
      return;
    }

    const pageNumbers = this.parsePageNumbers(pageNumbersInput);

    if (pageNumbers.length === 0) {
      alert("Invalid page number format");
      return;
    }

    if (!this.pageSettings.conditionalPageBreak) {
      this.pageSettings.conditionalPageBreak = {};
    }
    if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
      this.pageSettings.conditionalPageBreak.pageOverrides = {};
    }

    pageNumbers.forEach((pageNum) => {
      this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
        distance: distance,
        unit: unit,
      };
    });

    this.editor.Modal.close();
    setTimeout(() => this.showPageElementsSettings(), 100);
  }

  generatePageConditionalBreakUI() {
    const conditionalBreakSettings = this.pageSettings.conditionalPageBreak || {
      enabled: false,
      defaultDistance: 50,
      defaultUnit: "mm",
      pageOverrides: {},
    };

    return `
    <div class="page-setup-section">
      <h3>✂️ Page Conditional Page Break Settings</h3>
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 11px; color: #856404;">
          <strong>Note:</strong> Only one conditional break type (Page or Section) will be active at a time.
          Page breaks apply to specific page numbers.
        </p>
      </div>
      
      <div class="page-setup-row">
        <label>
          <input type="checkbox" id="conditionalPageBreakEnabled" 
                 ${conditionalBreakSettings.enabled ? "checked" : ""} 
                 style="border: 2px solid #000 !important;"> 
          Enable Page Conditional Page Break
        </label>
      </div>

      <div id="conditionalPageBreakControls" class="page-numbering-controls" style="display: ${conditionalBreakSettings.enabled ? "block" : "none"};">
        
        <!-- GLOBAL DEFAULT SETTINGS -->
        <div class="page-setup-row" style="margin-bottom: 15px; padding: 15px; background: #e3f2fd; border-radius: 6px;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #1976d2;">Default Settings (for all pages without specific overrides)</strong>
            <p style="font-size: 11px; color: #666; margin: 5px 0 10px 0;">
              This will apply to all pages that don't have specific settings.
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <label style="min-width: 120px;">Distance from Bottom:</label>
            <input type="number" id="conditionalBreakDefaultDistance" class="page-setup-control" 
                   value="${conditionalBreakSettings.defaultDistance || 50}" 
                   min="1" max="200" step="0.1" style="flex: 1; max-width: 120px;">
            <select id="conditionalBreakDefaultUnit" class="page-setup-control" style="width: 80px;">
              <option value="mm" ${(conditionalBreakSettings.defaultUnit || "mm") === "mm" ? "selected" : ""}>mm</option>
              <option value="cm" ${conditionalBreakSettings.defaultUnit === "cm" ? "selected" : ""}>cm</option>
              <option value="inch" ${conditionalBreakSettings.defaultUnit === "inch" ? "selected" : ""}>inch</option>
            </select>
          </div>
        </div>

        <!-- PAGE-SPECIFIC OVERRIDES -->
        <div style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #333;">Page-Specific Overrides (Optional)</strong>
            <button type="button" id="addPageBreakOverride" class="page-setup-btn" 
                    style="padding: 5px 10px; font-size: 12px; background: #28a745; color: white;">
              <i class="fa fa-plus"></i> Add Override
            </button>
          </div>
          <p style="font-size: 11px; color: #666; margin-bottom: 10px;">
            Set different break distances for specific pages.
          </p>
          
          <div id="pageBreakOverridesList" style="max-height: 300px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px; background: #f8f9fa;">
            ${this.generatePageBreakOverrides()}
          </div>
        </div>

      </div>
    </div>
  `;
  }

  parsePageNumbers(input) {
    const pages = [];
    const parts = input.split(",");

    parts.forEach((part) => {
      part = part.trim();

      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && !pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    });

    return pages.sort((a, b) => a - b);
  }

  attachOverrideItemListeners() {
    document.querySelectorAll(".override-distance").forEach((input) => {
      input.removeEventListener("input", this._overrideDistanceHandler);
      this._overrideDistanceHandler = (e) => {
        const pageNum = e.target.getAttribute("data-page-num");
        const distance = parseFloat(e.target.value);

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = { pageOverrides: {} };
        }
        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides[pageNum]) {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
            unit: "mm",
          };
        }

        this.pageSettings.conditionalPageBreak.pageOverrides[pageNum].distance =
          distance;
      };
      input.addEventListener("input", this._overrideDistanceHandler);
    });

    document.querySelectorAll(".override-unit").forEach((select) => {
      select.removeEventListener("change", this._overrideUnitHandler);
      this._overrideUnitHandler = (e) => {
        const pageNum = e.target.getAttribute("data-page-num");
        const unit = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = { pageOverrides: {} };
        }
        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides[pageNum]) {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
            distance: 50,
          };
        }

        this.pageSettings.conditionalPageBreak.pageOverrides[pageNum].unit =
          unit;
      };
      select.addEventListener("change", this._overrideUnitHandler);
    });

    document.querySelectorAll(".remove-override").forEach((btn) => {
      btn.removeEventListener("click", this._removeOverrideHandler);
      this._removeOverrideHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pageNum = e.target
          .closest(".remove-override")
          .getAttribute("data-page-num");
        if (confirm(`Remove conditional break override for page ${pageNum}?`)) {
          if (this.pageSettings.conditionalPageBreak?.pageOverrides) {
            delete this.pageSettings.conditionalPageBreak.pageOverrides[
              pageNum
            ];
          }

          const overridesList = document.getElementById(
            "pageBreakOverridesList",
          );
          if (overridesList) {
            overridesList.innerHTML = this.generatePageBreakOverrides();
            setTimeout(() => this.attachOverrideItemListeners(), 100);
          }
        }
      };
      btn.addEventListener("click", this._removeOverrideHandler);
    });
  }

  setupPageElementsListeners() {
    const headerModeSelect = document.getElementById("headerApplyMode");
    const footerModeSelect = document.getElementById("footerApplyMode");
    const headerCustom = document.getElementById("headerCustomRangeInputs");
    const footerCustom = document.getElementById("footerCustomRangeInputs");
    const originalHeaderText =
      document.getElementById("settingsHeaderText")?.value || "";
    const originalFooterText =
      document.getElementById("settingsFooterText")?.value || "";

    const pageNumberInputs = [
      "pageNumberEnabled",
      "pageNumberStartFrom",
      "pageNumberFormat",
      "pageNumberFontSize",
      "pageNumberColor",
      "pageNumberBackgroundColor",
      "pageNumberShowBorder",
    ];

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement;
        if (parent.classList.contains("position-grid")) {
          this.pageSettings.pageNumber = this.pageSettings.pageNumber || {};
          this.pageSettings.pageNumber.position =
            e.target.getAttribute("data-position");
        }
      }
    });

    const headerTextInput = document.getElementById("settingsHeaderText");
    if (headerTextInput) {
      headerTextInput.addEventListener("input", (e) => {
        this._headerTextChanged = true;

        if (!this.pageSettings.pages[0].header) {
          this.pageSettings.pages[0].header = {};
        }
        this.pageSettings.pages[0].header.text = e.target.value;
      });

      headerTextInput.addEventListener("focus", () => {
        this._headerTextOriginal = headerTextInput.value;
      });

      headerTextInput.addEventListener("blur", () => {
        if (headerTextInput.value !== this._headerTextOriginal) {
          this._headerTextChanged = true;
        }
      });
    }

    const footerTextInput = document.getElementById("settingsFooterText");
    if (footerTextInput) {
      footerTextInput.addEventListener("input", (e) => {
        this._footerTextChanged = true;

        if (!this.pageSettings.pages[0].footer) {
          this.pageSettings.pages[0].footer = {};
        }
        this.pageSettings.pages[0].footer.text = e.target.value;
      });

      footerTextInput.addEventListener("focus", () => {
        this._footerTextOriginal = footerTextInput.value;
      });

      footerTextInput.addEventListener("blur", () => {
        if (footerTextInput.value !== this._footerTextOriginal) {
          this._footerTextChanged = true;
        }
      });
    }

    const pageNumberEnabled = document.getElementById("pageNumberEnabled");
    const pageNumberControls = document.getElementById("pageNumberControls");

    if (pageNumberEnabled && pageNumberControls) {
      pageNumberEnabled.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.enabled = e.target.checked;
        pageNumberControls.style.display = e.target.checked ? "block" : "none";
      });
    }

    const pageNumberStartFrom = document.getElementById("pageNumberStartFrom");
    if (pageNumberStartFrom) {
      pageNumberStartFrom.addEventListener("change", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.startFrom = value;
        }
      });
    }

    const pageNumberFormat = document.getElementById("pageNumberFormat");
    if (pageNumberFormat) {
      pageNumberFormat.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.format = e.target.value;
      });
    }

    document.querySelectorAll(".position-option").forEach((el) => {
      el.addEventListener("click", () => {
        const parent = el.parentElement;
        if (
          parent.classList.contains("position-grid") &&
          !parent.classList.contains("watermark-text-position-grid") &&
          !parent.classList.contains("watermark-image-position-grid")
        ) {
          parent
            .querySelectorAll(".position-option")
            .forEach((opt) => opt.classList.remove("selected"));
          el.classList.add("selected");

          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position =
            el.getAttribute("data-position");
        }
      });
    });

    const fontSizeInput = document.getElementById("pageNumberFontSize");
    if (fontSizeInput) {
      fontSizeInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.fontSize = value;
        }
      });
    }

    const colorInput = document.getElementById("pageNumberColor");
    if (colorInput) {
      colorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.color = e.target.value;
      });
    }

    const bgColorInput = document.getElementById("pageNumberBackgroundColor");
    if (bgColorInput) {
      bgColorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.backgroundColor = e.target.value;
      });
    }

    const borderToggle = document.getElementById("pageNumberShowBorder");
    if (borderToggle) {
      borderToggle.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.showBorder = e.target.checked;
      });
    }
    const rotationInput = document.getElementById("pageNumberRotation");
    const rotationValue = document.getElementById("pageNumberRotationValue");
    if (rotationInput && rotationValue) {
      rotationInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        rotationValue.textContent = `${value}°`;
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.rotation = value;
      });
    }
    const watermarkTextInput = document.getElementById("settingsWatermarkText");
    if (watermarkTextInput) {
      watermarkTextInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.content = e.target.value;
      });
    }

    const watermarkFontSizeInput = document.getElementById(
      "settingsWatermarkFontSize",
    );
    if (watermarkFontSizeInput) {
      watermarkFontSizeInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.text) {
            this.pageSettings.watermark.text = {};
          }
          this.pageSettings.watermark.text.fontSize = value;
        }
      });
    }

    const watermarkColorInput = document.getElementById(
      "settingsWatermarkColor",
    );
    if (watermarkColorInput) {
      watermarkColorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.color = e.target.value;
      });
    }

    const textOpacityInput = document.getElementById(
      "settingsWatermarkOpacity",
    );
    if (textOpacityInput) {
      textOpacityInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.opacity =
          parseInt(e.target.value) / 100;
      });
    }

    const textRotationInput = document.getElementById(
      "settingsWatermarkRotation",
    );
    if (textRotationInput) {
      textRotationInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.rotation = parseInt(e.target.value);
      });
    }

    const imageUrlInput = document.getElementById("settingsWatermarkImageUrl");
    if (imageUrlInput) {
      imageUrlInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.url = e.target.value;
      });
    }

    const imageWidthInput = document.getElementById(
      "settingsWatermarkImageWidth",
    );
    if (imageWidthInput) {
      imageWidthInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.image) {
            this.pageSettings.watermark.image = {};
          }
          this.pageSettings.watermark.image.width = value;
        }
      });
    }

    const imageHeightInput = document.getElementById(
      "settingsWatermarkImageHeight",
    );
    if (imageHeightInput) {
      imageHeightInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.image) {
            this.pageSettings.watermark.image = {};
          }
          this.pageSettings.watermark.image.height = value;
        }
      });
    }

    const imageOpacityInput = document.getElementById(
      "settingsWatermarkImageOpacity",
    );
    if (imageOpacityInput) {
      imageOpacityInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.opacity =
          parseInt(e.target.value) / 100;
      });
    }

    const imageRotationInput = document.getElementById(
      "settingsWatermarkImageRotation",
    );
    if (imageRotationInput) {
      imageRotationInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.rotation = parseInt(e.target.value);
      });
    }

    if (headerModeSelect && headerCustom) {
      headerModeSelect.addEventListener("change", () => {
        headerCustom.style.display =
          headerModeSelect.value === "custom" ? "block" : "none";
      });
    }

    if (footerModeSelect && footerCustom) {
      footerModeSelect.addEventListener("change", () => {
        footerCustom.style.display =
          footerModeSelect.value === "custom" ? "block" : "none";
      });
    }

    const headerHeightInput = document.getElementById("settingsHeaderHeight");
    if (headerHeightInput) {
      headerHeightInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this._lastHeaderHeight = value;
          this.pageSettings.headerFooter.headerHeight = value;
        }
      });
    }

    const footerHeightInput = document.getElementById("settingsFooterHeight");
    if (footerHeightInput) {
      footerHeightInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this._lastFooterHeight = value;
          this.pageSettings.headerFooter.footerHeight = value;
        }
      });
    }

    const headerEnabledInput = document.getElementById("settingsHeaderEnabled");
    if (headerEnabledInput) {
      headerEnabledInput.addEventListener("change", (e) => {
        this.pageSettings.headerFooter.headerEnabled = e.target.checked;
      });
    }

    const footerEnabledInput = document.getElementById("settingsFooterEnabled");
    if (footerEnabledInput) {
      footerEnabledInput.addEventListener("change", (e) => {
        this.pageSettings.headerFooter.footerEnabled = e.target.checked;
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("position-option")) {
        const selectedPosition = e.target.getAttribute("data-position");
        const parent = e.target.parentElement;

        if (
          parent.classList.contains("position-grid") &&
          !parent.classList.contains("watermark-text-position-grid") &&
          !parent.classList.contains("watermark-image-position-grid")
        ) {
          parent
            .querySelectorAll(".position-option")
            .forEach((opt) => opt.classList.remove("selected"));
          e.target.classList.add("selected");

          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position = selectedPosition;
        }
      }

      if (e.target.classList.contains("watermark-text-position-option")) {
        document
          .querySelectorAll(".watermark-text-position-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");

        this.pageSettings.watermark = this.pageSettings.watermark || {};
        this.pageSettings.watermark.textPosition =
          e.target.getAttribute("data-position");
      }

      if (e.target.classList.contains("watermark-image-position-option")) {
        document
          .querySelectorAll(".watermark-image-position-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");

        this.pageSettings.watermark = this.pageSettings.watermark || {};
        this.pageSettings.watermark.imagePosition =
          e.target.getAttribute("data-position");
      }

      if (e.target.classList.contains("watermark-type-btn")) {
        const selectedType = e.target.getAttribute("data-type");
        document
          .querySelectorAll(".watermark-type-btn")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        const textControls = document.getElementById(
          "settingsWatermarkTextControls",
        );
        const imageControls = document.getElementById(
          "settingsWatermarkImageControls",
        );

        if (textControls)
          textControls.style.display =
            selectedType === "text" || selectedType === "both"
              ? "block"
              : "none";
        if (imageControls)
          imageControls.style.display =
            selectedType === "image" || selectedType === "both"
              ? "block"
              : "none";
      }

      if (e.target.id === "settingsBackgroundColorPreview") {
        const colorInput = document.getElementById(
          "settingsPageBackgroundColor",
        );
        if (colorInput) {
          colorInput.click();
        }
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.id === "settingsPageBackgroundColor") {
        const preview = document.getElementById(
          "settingsBackgroundColorPreview",
        );
        if (preview) {
          preview.style.backgroundColor = e.target.value;
        }
      }

      if (e.target.id === "settingsWatermarkEnabled") {
        const controls = document.getElementById("settingsWatermarkControls");
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active");
          } else {
            controls.classList.remove("active");
          }
        }
      }

      if (e.target.id === "settingsPageFormat") {
        const customSection = document.getElementById(
          "settingsCustomSizeSection",
        );
        if (customSection) {
          if (e.target.value === "custom") {
            customSection.classList.add("active");
          } else {
            customSection.classList.remove("active");
          }
        }
      }
    });

    const watermarkFileInput = document.getElementById(
      "settingsWatermarkImageFile",
    );
    if (watermarkFileInput) {
      watermarkFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result;
            if (!this.pageSettings.watermark) {
              this.pageSettings.watermark = {};
            }
            if (!this.pageSettings.watermark.image) {
              this.pageSettings.watermark.image = {};
            }

            this.pageSettings.watermark.image.url = base64;

            const urlInput = document.getElementById(
              "settingsWatermarkImageUrl",
            );
            if (urlInput) {
              urlInput.value = base64;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const deletePagesBtn = document.getElementById("deletePages");
    if (deletePagesBtn) {
      deletePagesBtn.addEventListener("click", () => {
        this.editor.Modal.close();
        setTimeout(() => {
          this.showPageDeleteModal();
        }, 100);
      });
    }

    const applyBtn = document.getElementById("applyPageElementsSettings");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applyPageElementsSettings();
      });
    }

    const resetBtn = document.getElementById("resetPageElementsSettings");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetPageElementsSettings();
      });
    }

    const conditionalBreakEnabled = document.getElementById(
      "conditionalPageBreakEnabled",
    );
    const conditionalBreakControls = document.getElementById(
      "conditionalPageBreakControls",
    );
    const sectionBreakEnabled = document.getElementById(
      "sectionConditionalBreakEnabled",
    );
    const sectionBreakControls = document.getElementById(
      "sectionConditionalBreakControls",
    );

    if (conditionalBreakEnabled && conditionalBreakControls) {
      conditionalBreakEnabled.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (this.pageSettings.sectionConditionalPageBreak?.enabled) {
            const confirmSwitch = confirm(
              "Section-level conditional breaks are currently active.\n\n" +
                "Enabling page-level breaks will disable section-level breaks.\n\n" +
                "Do you want to continue?",
            );

            if (!confirmSwitch) {
              e.target.checked = false;
              return;
            }
          }

          if (!this.pageSettings.conditionalPageBreak) {
            this.pageSettings.conditionalPageBreak = {
              enabled: false,
              defaultDistance: 50,
              defaultUnit: "mm",
              pageOverrides: {},
            };
          }

          this.pageSettings.conditionalPageBreak.enabled = true;
          conditionalBreakControls.style.display = "block";

          if (sectionBreakEnabled && sectionBreakControls) {
            sectionBreakEnabled.checked = false;
            if (this.pageSettings.sectionConditionalPageBreak) {
              this.pageSettings.sectionConditionalPageBreak.enabled = false;
            }
            sectionBreakControls.style.display = "none";
          }
        } else {
          if (this.pageSettings.conditionalPageBreak) {
            this.pageSettings.conditionalPageBreak.enabled = false;
          }
          conditionalBreakControls.style.display = "none";
        }
      });
    }

    if (sectionBreakEnabled && sectionBreakControls) {
      sectionBreakEnabled.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (this.pageSettings.conditionalPageBreak?.enabled) {
            const confirmSwitch = confirm(
              "Page-level conditional breaks are currently active.\n\n" +
                "Enabling section-level breaks will disable page-level breaks.\n\n" +
                "Do you want to continue?",
            );

            if (!confirmSwitch) {
              e.target.checked = false;
              return;
            }
          }

          if (!this.pageSettings.sectionConditionalPageBreak) {
            this.pageSettings.sectionConditionalPageBreak = {
              enabled: false,
              defaultDistance: 50,
              defaultUnit: "mm",
              sectionOverrides: {},
            };
          }

          this.pageSettings.sectionConditionalPageBreak.enabled = true;
          sectionBreakControls.style.display = "block";

          if (conditionalBreakEnabled && conditionalBreakControls) {
            conditionalBreakEnabled.checked = false;
            if (this.pageSettings.conditionalPageBreak) {
              this.pageSettings.conditionalPageBreak.enabled = false;
            }
            conditionalBreakControls.style.display = "none";
          }
        } else {
          if (this.pageSettings.sectionConditionalPageBreak) {
            this.pageSettings.sectionConditionalPageBreak.enabled = false;
          }
          sectionBreakControls.style.display = "none";
        }
      });
    }

    const defaultDistance = document.getElementById(
      "conditionalBreakDefaultDistance",
    );
    if (defaultDistance) {
      defaultDistance.addEventListener("input", (e) => {
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.defaultDistance = parseFloat(
          e.target.value,
        );
      });
    }

    const defaultUnit = document.getElementById("conditionalBreakDefaultUnit");
    if (defaultUnit) {
      defaultUnit.addEventListener("change", (e) => {
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.defaultUnit = e.target.value;
      });
    }

    const addOverrideBtn = document.getElementById("addPageBreakOverride");
    if (addOverrideBtn) {
      addOverrideBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const addForm = document.getElementById("addOverrideForm");
        if (addForm) {
          if (addForm.style.display === "none" || !addForm.style.display) {
            addForm.style.display = "block";
            document.getElementById("newOverridePages").value = "";
            document.getElementById("newOverrideDistance").value = "50";
            document.getElementById("newOverrideUnit").value = "mm";
          } else {
            addForm.style.display = "none";
          }
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (
        e.target.id === "confirmAddOverride" ||
        e.target.closest("#confirmAddOverride")
      ) {
        e.preventDefault();
        e.stopPropagation();

        const pagesInput = document
          .getElementById("newOverridePages")
          ?.value.trim();
        const distance = parseFloat(
          document.getElementById("newOverrideDistance")?.value,
        );
        const unit = document.getElementById("newOverrideUnit")?.value;

        if (!pagesInput) {
          alert("Please enter page number(s)");
          return;
        }

        if (isNaN(distance) || distance <= 0) {
          alert("Please enter a valid distance");
          return;
        }

        const pageNumbers = this.parsePageNumbers(pagesInput);

        if (pageNumbers.length === 0) {
          alert(
            "Invalid page number format. Use formats like: 5, or 2,5,8, or 3-7",
          );
          return;
        }

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {
            enabled: true,
            defaultDistance: 50,
            defaultUnit: "mm",
            pageOverrides: {},
          };
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        pageNumbers.forEach((pageNum) => {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
            distance: distance,
            unit: unit,
          };
        });

        const overridesList = document.getElementById("pageBreakOverridesList");
        if (overridesList) {
          overridesList.innerHTML = this.generatePageBreakOverrides();

          setTimeout(() => {
            this.attachOverrideItemListeners();
          }, 100);
        }

        const addForm = document.getElementById("addOverrideForm");
        if (addForm) {
          addForm.style.display = "none";
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (
        e.target.id === "cancelAddOverride" ||
        e.target.closest("#cancelAddOverride")
      ) {
        e.preventDefault();
        const addForm = document.getElementById("addOverrideForm");
        if (addForm) {
          addForm.style.display = "none";
        }
      }
    });

    const conditionalBreakApplyMode = document.getElementById(
      "conditionalBreakApplyMode",
    );
    if (conditionalBreakApplyMode) {
      conditionalBreakApplyMode.addEventListener("change", (e) => {
        const mode = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.applyMode = mode;

        const globalSettings = document.getElementById("globalBreakSettings");
        const perPageSettings = document.getElementById("perPageBreakSettings");

        if (globalSettings) {
          globalSettings.style.display = mode === "all" ? "block" : "none";
        }
        if (perPageSettings) {
          perPageSettings.style.display = mode === "perPage" ? "block" : "none";
        }
      });
    }

    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("per-page-break-unit")) {
        const pageId = e.target.getAttribute("data-page-id");
        const unit = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        if (!this.pageSettings.conditionalPageBreak.perPageSettings) {
          this.pageSettings.conditionalPageBreak.perPageSettings = {};
        }
        if (!this.pageSettings.conditionalPageBreak.perPageSettings[pageId]) {
          this.pageSettings.conditionalPageBreak.perPageSettings[pageId] = {};
        }

        this.pageSettings.conditionalPageBreak.perPageSettings[pageId].unit =
          unit;
      }
    });

    this.setupSectionConditionalBreakListeners();
  }

  preserveHeaderFooterContent() {
    try {
      const firstPage = this.editor
        .getWrapper()
        .find('[data-page-index="0"]')[0];
      if (!firstPage) return;

      const headerElement = firstPage.find(".page-header-element")[0];
      if (headerElement && headerElement.components().length > 0) {
        this._originalHeaderComponents = headerElement
          .components()
          .map((comp) => ({
            html: comp.toHTML(),
            styles: comp.getStyle(),
            attributes: comp.getAttributes(),
            type: comp.get("type"),
          }));
      }

      const footerElement = firstPage.find(".page-footer-element")[0];
      if (footerElement && footerElement.components().length > 0) {
        this._originalFooterComponents = footerElement
          .components()
          .map((comp) => ({
            html: comp.toHTML(),
            styles: comp.getStyle(),
            attributes: comp.getAttributes(),
            type: comp.get("type"),
          }));
      }
    } catch (error) {}
  }
  setupSectionConditionalBreakListeners() {
    const sectionBreakEnabled = document.getElementById(
      "sectionConditionalBreakEnabled",
    );
    const sectionBreakControls = document.getElementById(
      "sectionConditionalBreakControls",
    );
    const pageBreakEnabled = document.getElementById(
      "conditionalPageBreakEnabled",
    );

    if (sectionBreakEnabled && sectionBreakControls) {
      sectionBreakEnabled.addEventListener("change", (e) => {
        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {};
        }
        this.pageSettings.sectionConditionalPageBreak.enabled =
          e.target.checked;

        if (e.target.checked) {
          sectionBreakControls.classList.add("active");
          sectionBreakControls.style.display = "block";

          if (pageBreakEnabled) {
            pageBreakEnabled.checked = false;
            if (this.pageSettings.conditionalPageBreak) {
              this.pageSettings.conditionalPageBreak.enabled = false;
            }
          }
        } else {
          sectionBreakControls.classList.remove("active");
          sectionBreakControls.style.display = "none";
        }
      });
    }

    if (pageBreakEnabled) {
      pageBreakEnabled.addEventListener("change", (e) => {
        if (e.target.checked && sectionBreakEnabled) {
          sectionBreakEnabled.checked = false;
          if (this.pageSettings.sectionConditionalPageBreak) {
            this.pageSettings.sectionConditionalPageBreak.enabled = false;
          }
        }
      });
    }

    const defaultDistance = document.getElementById(
      "sectionBreakDefaultDistance",
    );
    if (defaultDistance) {
      defaultDistance.addEventListener("input", (e) => {
        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {};
        }
        this.pageSettings.sectionConditionalPageBreak.defaultDistance =
          parseFloat(e.target.value);
      });
    }

    const defaultUnit = document.getElementById("sectionBreakDefaultUnit");
    if (defaultUnit) {
      defaultUnit.addEventListener("change", (e) => {
        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {};
        }
        this.pageSettings.sectionConditionalPageBreak.defaultUnit =
          e.target.value;
      });
    }

    const addOverrideBtn = document.getElementById("addSectionBreakOverride");
    if (addOverrideBtn) {
      addOverrideBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const addForm = document.getElementById("addSectionOverrideForm");
        if (addForm) {
          if (addForm.style.display === "none" || !addForm.style.display) {
            addForm.style.display = "block";
            document.getElementById("newSectionOverrideCount").value = "";
            document.getElementById("newSectionOverrideDistance").value = "50";
            document.getElementById("newSectionOverrideUnit").value = "mm";
          } else {
            addForm.style.display = "none";
          }
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (
        e.target.id === "confirmAddSectionOverride" ||
        e.target.closest("#confirmAddSectionOverride")
      ) {
        e.preventDefault();
        e.stopPropagation();

        const countsInput = document
          .getElementById("newSectionOverrideCount")
          ?.value.trim();
        const distance = parseFloat(
          document.getElementById("newSectionOverrideDistance")?.value,
        );
        const unit = document.getElementById("newSectionOverrideUnit")?.value;

        if (!countsInput) {
          alert("⚠️ Please enter section count(s)");
          return;
        }

        if (isNaN(distance) || distance <= 0) {
          alert("⚠️ Please enter a valid distance greater than 0");
          return;
        }

        const sectionCounts = countsInput
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c && !isNaN(parseInt(c, 10)))
          .map((c) => parseInt(c, 10));

        if (sectionCounts.length === 0) {
          alert(
            "⚠️ Invalid section count format. Please use numbers separated by commas (e.g., 1, 2, 3)",
          );
          return;
        }

        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {
            enabled: true,
            defaultDistance: 50,
            defaultUnit: "mm",
            sectionOverrides: {},
          };
        }

        if (!this.pageSettings.sectionConditionalPageBreak.sectionOverrides) {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides = {};
        }

        sectionCounts.forEach((count) => {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
            count
          ] = {
            distance: distance,
            unit: unit,
          };
        });

        const overridesList = document.getElementById(
          "sectionBreakOverridesList",
        );
        if (overridesList) {
          overridesList.innerHTML = this.generateSectionBreakOverrides();
          setTimeout(() => {
            this.attachSectionOverrideItemListeners();
          }, 100);
        }
        const addForm = document.getElementById("addSectionOverrideForm");
        if (addForm) addForm.style.display = "none";
      }
    });

    document.addEventListener("click", (e) => {
      if (
        e.target.id === "cancelAddSectionOverride" ||
        e.target.closest("#cancelAddSectionOverride")
      ) {
        e.preventDefault();
        const addForm = document.getElementById("addSectionOverrideForm");
        if (addForm) addForm.style.display = "none";
      }
    });

    this.attachSectionOverrideItemListeners();
  }

  attachSectionOverrideItemListeners() {
    document.querySelectorAll(".section-override-distance").forEach((input) => {
      input.removeEventListener("input", this._sectionOverrideDistanceHandler);
      this._sectionOverrideDistanceHandler = (e) => {
        const sectionCount = e.target.getAttribute("data-section-count");
        const distance = parseFloat(e.target.value);

        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {
            sectionOverrides: {},
          };
        }
        if (!this.pageSettings.sectionConditionalPageBreak.sectionOverrides) {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides = {};
        }

        if (
          !this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
            sectionCount
          ]
        ) {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
            sectionCount
          ] = { unit: "mm" };
        }

        this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
          sectionCount
        ].distance = distance;
      };
      input.addEventListener("input", this._sectionOverrideDistanceHandler);
    });

    document.querySelectorAll(".section-override-unit").forEach((select) => {
      select.removeEventListener("change", this._sectionOverrideUnitHandler);
      this._sectionOverrideUnitHandler = (e) => {
        const sectionCount = e.target.getAttribute("data-section-count");
        const unit = e.target.value;

        if (!this.pageSettings.sectionConditionalPageBreak) {
          this.pageSettings.sectionConditionalPageBreak = {
            sectionOverrides: {},
          };
        }
        if (!this.pageSettings.sectionConditionalPageBreak.sectionOverrides) {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides = {};
        }

        if (
          !this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
            sectionCount
          ]
        ) {
          this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
            sectionCount
          ] = { distance: 50 };
        }

        this.pageSettings.sectionConditionalPageBreak.sectionOverrides[
          sectionCount
        ].unit = unit;
      };
      select.addEventListener("change", this._sectionOverrideUnitHandler);
    });

    document.querySelectorAll(".remove-section-override").forEach((btn) => {
      btn.removeEventListener("click", this._removeSectionOverrideHandler);
      this._removeSectionOverrideHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sectionCount = e.target
          .closest(".remove-section-override")
          .getAttribute("data-section-count");

        if (
          confirm(
            `Remove conditional break override for section ${sectionCount}?`,
          )
        ) {
          if (this.pageSettings.sectionConditionalPageBreak?.sectionOverrides) {
            delete this.pageSettings.sectionConditionalPageBreak
              .sectionOverrides[sectionCount];
          }

          const overridesList = document.getElementById(
            "sectionBreakOverridesList",
          );
          if (overridesList) {
            overridesList.innerHTML = this.generateSectionBreakOverrides();
            setTimeout(() => this.attachSectionOverrideItemListeners(), 100);
          }
        }
      };
      btn.addEventListener("click", this._removeSectionOverrideHandler);
    });
  }

  applySectionConditionalBreaks() {
    if (!this.pageSettings.sectionConditionalPageBreak?.enabled) {
      this.removeAllSectionConditionalBreaks();
      return;
    }

    const allPages = this.editor.getWrapper().find(".page-container");
    let sectionsFound = 0;

    allPages.forEach((pageComponent, pageIndex) => {
      const sectionsContainer = pageComponent.find(".sections-container")[0];

      if (!sectionsContainer) {
        return;
      }

      const sectionCount =
        sectionsContainer.getAttributes()["data-section-count"];

      if (!sectionCount || sectionCount === "undefined") {
        return;
      }

      sectionsFound++;
      this.applySectionConditionalBreakToSection(
        sectionsContainer,
        sectionCount,
        pageIndex,
      );
    });

    if (sectionsFound === 0) {
    }
  }

  applySectionConditionalBreakToSection(
    sectionsContainer,
    sectionCount,
    pageIndex,
  ) {
    const sectionContent = sectionsContainer.find(".section-content")[0];
    if (!sectionContent) {
      return;
    }

    // Get settings
    const overrides =
      this.pageSettings.sectionConditionalPageBreak.sectionOverrides || {};
    let distance, unit;

    if (overrides[sectionCount]) {
      distance = overrides[sectionCount].distance;
      unit = overrides[sectionCount].unit;
    } else {
      distance =
        this.pageSettings.sectionConditionalPageBreak.defaultDistance || 50;
      unit = this.pageSettings.sectionConditionalPageBreak.defaultUnit || "mm";
    }

    const distanceInMm = this.convertToMm(distance, unit);
    const mmToPx = 96 / 25.4;
    const distanceInPx = Math.round(distanceInMm * mmToPx);
    const mainContentArea = sectionsContainer.closest(".main-content-area");
    const mainContentEl = mainContentArea?.getEl();

    if (!mainContentEl) {
      return;
    }

    const totalPageContentHeight = mainContentEl.clientHeight || 1023;
    const sectionHeader = sectionsContainer.find(".section-header")[0];
    const sectionFooter = sectionsContainer.find(".section-footer")[0];
    const headerHeight = sectionHeader?.getEl()
      ? this.getAccurateComponentHeight(sectionHeader.getEl())
      : 0;
    const footerHeight = sectionFooter?.getEl()
      ? this.getAccurateComponentHeight(sectionFooter.getEl())
      : 0;
    const availableHeightForContent =
      totalPageContentHeight - distanceInPx - headerHeight - footerHeight - 20;

    sectionContent.addStyle({
      "max-height": `${availableHeightForContent}px`,
      height: `${availableHeightForContent}px`,
      "min-height": `${availableHeightForContent}px`,
      overflow: "hidden",
      "box-sizing": "border-box",
    });

    if (sectionContent.view && sectionContent.view.render) {
      sectionContent.view.render();
    }

    this.addSectionBreakIndicator(
      mainContentEl,
      distanceInPx,
      sectionCount,
      pageIndex,
    );
  }

  addSectionBreakIndicator(
    mainContentEl,
    distanceInPx,
    sectionCount,
    pageIndex,
  ) {
    if (!mainContentEl) return;

    const existingIndicators = mainContentEl.querySelectorAll(
      `.section-break-indicator[data-section-count="${sectionCount}"]`,
    );
    if (existingIndicators) {
      existingIndicators.forEach((ind) => ind.remove());
    }

    const label = `Section ${sectionCount} Break Zone (${distanceInPx}px from page bottom)`;
    const indicatorHTML = `
    <div class="section-break-indicator" 
         data-section-count="${sectionCount}"
         data-page-number="${pageIndex + 1}"
         style="
           position: absolute;
           bottom: ${distanceInPx}px;
           left: 0;
           right: 0;
           height: 2px;
           border-top: 2px dashed #4caf50;
           z-index: 999;
           pointer-events: none;
           background: rgba(76, 175, 80, 0.1);
         ">
      <span style="
        position: absolute;
        right: 5px;
        top: -22px;
        background: #4caf50;
        color: white;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        z-index: 1000;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${label}</span>
    </div>
  `;

    mainContentEl.style.position = "relative";
    mainContentEl.insertAdjacentHTML("beforeend", indicatorHTML);
  }
  removeAllSectionConditionalBreaks() {
    const allPages = this.editor.getWrapper().find(".page-container");

    allPages.forEach((pageComponent) => {
      const sectionsContainer = pageComponent.find(".sections-container")[0];
      if (!sectionsContainer) return;

      const sectionContent = sectionsContainer.find(".section-content")[0];
      if (!sectionContent) return;

      sectionContent.addStyle({
        "max-height": "",
        height: "",
        "min-height": "845px",
        overflow: "hidden",
      });

      const contentEl = sectionContent.getEl();
      if (contentEl) {
        const indicators = contentEl.querySelectorAll(
          ".section-break-indicator",
        );
        indicators.forEach((ind) => ind.remove());
      }
    });
  }
  applyPageElementsSettings() {
    try {
      this.preserveHeaderFooterContent && this.preserveHeaderFooterContent();

      if (this.pageSettings.sectionConditionalPageBreak?.enabled) {
        this.removeAllSectionConditionalBreaks &&
          this.removeAllSectionConditionalBreaks();

        setTimeout(() => {
          this.applySectionConditionalBreaks &&
            this.applySectionConditionalBreaks();
        }, 1000);
      } else {
        this.removeAllSectionConditionalBreaks &&
          this.removeAllSectionConditionalBreaks();
      }

      const conditionalBreakEnabled =
        document.getElementById("conditionalPageBreakEnabled")?.checked ||
        false;
      const conditionalBreakDefaultDistance =
        parseFloat(
          document.getElementById("conditionalBreakDefaultDistance")?.value,
        ) || 50;
      const conditionalBreakDefaultUnit =
        document.getElementById("conditionalBreakDefaultUnit")?.value || "mm";

      const pageOverrides = {};
      const overrideItems =
        document.querySelectorAll(".page-break-override-item") || [];
      overrideItems.forEach((item) => {
        const pageNum = item.getAttribute("data-page-num");
        const distanceInput = item.querySelector(".override-distance");
        const unitSelect = item.querySelector(".override-unit");

        if (distanceInput && unitSelect && pageNum) {
          pageOverrides[pageNum] = {
            distance: parseFloat(distanceInput.value) || 0,
            unit: unitSelect.value || conditionalBreakDefaultUnit,
          };
        }
      });

      this.pageSettings.conditionalPageBreak = {
        enabled: conditionalBreakEnabled,
        defaultDistance: conditionalBreakDefaultDistance,
        defaultUnit: conditionalBreakDefaultUnit,
        pageOverrides: pageOverrides,
      };

      const marginTop = Math.max(
        0,
        parseFloat(document.getElementById("settingsMarginTop")?.value) || 0,
      );
      const marginBottom = Math.max(
        0,
        parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0,
      );
      const marginLeft = Math.max(
        0,
        parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0,
      );
      const marginRight = Math.max(
        0,
        parseFloat(document.getElementById("settingsMarginRight")?.value) || 0,
      );
      const newBackgroundColor =
        document.getElementById("settingsPageBackgroundColor")?.value ||
        "#ffffff";

      delete this._lastAppliedBackgroundColor;

      this.pageSettings.backgroundColor = newBackgroundColor;
      if (Array.isArray(this.pageSettings.pages)) {
        this.pageSettings.pages.forEach((page) => {
          page.backgroundColor = newBackgroundColor;
        });
      }

      const headerEnabled =
        document.getElementById("settingsHeaderEnabled")?.checked !== false;
      const headerHeight = Math.max(
        5,
        Math.min(
          50,
          parseFloat(document.getElementById("settingsHeaderHeight")?.value) ||
            12.7,
        ),
      );
      const headerApplyMode =
        document.getElementById("headerApplyMode")?.value || "all";
      const headerCustomPageList =
        document.getElementById("headerCustomPageList")?.value || "";
      const headerText =
        document.getElementById("settingsHeaderText")?.value || "";

      const footerEnabled =
        document.getElementById("settingsFooterEnabled")?.checked !== false;
      const footerHeight = Math.max(
        5,
        Math.min(
          50,
          parseFloat(document.getElementById("settingsFooterHeight")?.value) ||
            12.7,
        ),
      );
      const footerApplyMode =
        document.getElementById("footerApplyMode")?.value || "all";
      const footerCustomPageList =
        document.getElementById("footerCustomPageList")?.value || "";
      const footerText =
        document.getElementById("settingsFooterText")?.value || "";

      const pageNumberEnabled =
        document.getElementById("pageNumberEnabled")?.checked || false;
      const pageNumberStartFrom = parseInt(
        document.getElementById("pageNumberStartFrom")?.value || "1",
        10,
      );
      const pageNumberFormat =
        document.getElementById("pageNumberFormat")?.value || "Page {n}";
      const pageNumberPosition =
        document.querySelector(".position-option.selected")?.dataset
          ?.position || "bottom-center";
      const storedPageNumber = this.pageSettings.pageNumber || {};
      const pageNumberFontSizeInputValue = parseInt(
        document.getElementById("pageNumberFontSize")?.value || "",
        10,
      );
      const pageNumberFontSize =
        !Number.isNaN(pageNumberFontSizeInputValue)
          ? pageNumberFontSizeInputValue
          : storedPageNumber.fontSize || 8;
      const pageNumberColor =
        document.getElementById("pageNumberColor")?.value ||
        storedPageNumber.color ||
        "#333333";
      const pageNumberBackgroundColor =
        document.getElementById("pageNumberBackgroundColor")?.value ||
        storedPageNumber.backgroundColor ||
        "#ffffff";
      const pageNumberShowBorder =
        typeof document.getElementById("pageNumberShowBorder")?.checked === "boolean"
          ? document.getElementById("pageNumberShowBorder").checked
          : typeof storedPageNumber.showBorder !== "undefined"
            ? storedPageNumber.showBorder
            : false;

      const watermarkEnabled =
        document.getElementById("settingsWatermarkEnabled")?.checked || false;
      const watermarkType =
        document.querySelector(".watermark-type-btn.active")?.dataset?.type ||
        "text";
      const watermarkTiled =
        document.getElementById("settingsWatermarkTiled")?.checked || false;

      const watermarkTextContent =
        document.getElementById("settingsWatermarkText")?.value ||
        "CONFIDENTIAL";
      const watermarkFontSize =
        parseInt(document.getElementById("settingsWatermarkFontSize")?.value) ||
        36;
      const watermarkColor =
        document.getElementById("settingsWatermarkColor")?.value || "#000000";
      const watermarkOpacity =
        parseInt(
          document.getElementById("settingsWatermarkOpacity")?.value,
          10,
        ) / 100 || 0.4;
      const watermarkRotation =
        parseInt(
          document.getElementById("settingsWatermarkRotation")?.value,
          10,
        ) || 0;
      const watermarkTextPosition =
        document.querySelector(".watermark-text-position-option.selected")
          ?.dataset?.position || "center";

      const watermarkImageUrl =
        document.getElementById("settingsWatermarkImageUrl")?.value || "";
      const watermarkImageWidth =
        parseInt(
          document.getElementById("settingsWatermarkImageWidth")?.value,
          10,
        ) || 200;
      const watermarkImageHeight =
        parseInt(
          document.getElementById("settingsWatermarkImageHeight")?.value,
          10,
        ) || 200;
      const watermarkImageOpacity =
        parseInt(
          document.getElementById("settingsWatermarkImageOpacity")?.value,
          10,
        ) / 100 || 0.4;
      const watermarkImageRotation =
        parseInt(
          document.getElementById("settingsWatermarkImageRotation")?.value,
          10,
        ) || 0;
      const watermarkImagePosition =
        document.querySelector(".watermark-image-position-option.selected")
          ?.dataset?.position || "center";

      const headerCustomPages = this.parsePageList
        ? this.parsePageList(headerCustomPageList)
        : [];
      const footerCustomPages = this.parsePageList
        ? this.parsePageList(footerCustomPageList)
        : [];

      const pageNumberRotation = parseInt(
        document.getElementById("pageNumberRotation")?.value || "0",
        10,
      );

      this._lastHeaderApplyMode = headerApplyMode;
      this._lastFooterApplyMode = footerApplyMode;
      this._lastHeaderCustomPageList = headerCustomPageList;
      this._lastFooterCustomPageList = footerCustomPageList;
      this._lastHeaderCustomPages = headerCustomPages;
      this._lastFooterCustomPages = footerCustomPages;
      this.pageSettings.headerFooter = this.pageSettings.headerFooter || {};
      this.pageSettings.headerFooter.headerApplyMode = headerApplyMode;
      this.pageSettings.headerFooter.footerApplyMode = footerApplyMode;
      this.pageSettings.headerFooter.headerCustomPages = headerCustomPages;
      this.pageSettings.headerFooter.footerCustomPages = footerCustomPages;

      this.pageSettings.headerFooter = {
        headerEnabled,
        footerEnabled,
        headerHeight,
        footerHeight,
        headerText,
        footerText,
        headerApplyMode,
        footerApplyMode,
        headerCustomPages,
        footerCustomPages,
      };

      this.pageSettings.margins = {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight,
      };

      this.pageSettings.backgroundColor = newBackgroundColor;
      this.updatePageRule && this.updatePageRule();

      // Page number settings saved to pageSettings
      this.pageSettings.pageNumber = {
        enabled: pageNumberEnabled,
        startFrom: pageNumberStartFrom,
        format: pageNumberFormat,
        position: pageNumberPosition,
        fontSize: pageNumberFontSize,
        fontFamily: storedPageNumber.fontFamily || "Arial",
        color: pageNumberColor,
        backgroundColor: pageNumberBackgroundColor,
        showBorder: pageNumberShowBorder,
        rotation: pageNumberRotation,
        visibility: storedPageNumber.visibility || "all",
      };

      // Watermark saved to pageSettings
      this.pageSettings.watermark = {
        enabled: watermarkEnabled,
        type: watermarkType,
        tiled: watermarkTiled,
        textPosition: watermarkTextPosition,
        imagePosition: watermarkImagePosition,
        text: {
          content: watermarkTextContent,
          fontSize: watermarkFontSize,
          color: watermarkColor,
          opacity: watermarkOpacity,
          rotation: watermarkRotation,
        },
        image: {
          url: watermarkImageUrl,
          width: watermarkImageWidth,
          height: watermarkImageHeight,
          opacity: watermarkImageOpacity,
          rotation: watermarkImageRotation,
        },
      };

      if (conditionalBreakEnabled) {
        const settingsToLog = {
          enabled: this.pageSettings.conditionalPageBreak.enabled,
          defaultDistance:
            this.pageSettings.conditionalPageBreak.defaultDistance,
          defaultUnit: this.pageSettings.conditionalPageBreak.defaultUnit,
          pageOverrides: this.pageSettings.conditionalPageBreak.pageOverrides,
        };

        setTimeout(() => {
          this.removeAllConditionalPageBreaks &&
            this.removeAllConditionalPageBreaks();

          setTimeout(() => {
            this.insertConditionalPageBreaksToAllPages &&
              this.insertConditionalPageBreaksToAllPages();

            setTimeout(() => {
              const allPages =
                (this.editor &&
                  this.editor.getWrapper &&
                  this.editor.getWrapper().find(".page-container")) ||
                [];
              allPages.forEach((page, idx) => {
                try {
                  const indicator =
                    (page.find &&
                      page.find(
                        '.conditional-break-indicator[data-conditional="true"]',
                      )[0]) ||
                    null;
                  if (indicator) {
                    const pageNum = idx + 1;
                    const override =
                      this.pageSettings.conditionalPageBreak.pageOverrides?.[
                        pageNum
                      ];
                  }
                } catch (err) {}
              });
            }, 500);
          }, 200);
        }, 500);
      } else {
        this.removeAllConditionalPageBreaks &&
          this.removeAllConditionalPageBreaks();
      }

      this.updateIndividualPageSettings && this.updateIndividualPageSettings();
      this.applyBackgroundColorToPages &&
        this.applyBackgroundColorToPages(newBackgroundColor);
      const allPages =
        (this.editor &&
          this.editor.getWrapper &&
          this.editor.getWrapper().find(".page-container")) ||
        [];
      allPages.forEach((pageComponent, index) => {
        try {
          const pageEl = pageComponent.getEl && pageComponent.getEl();
          const pageSettings =
            this.pageSettings.pages && this.pageSettings.pages[index];
          if (pageEl && pageSettings) {
            this.updateSinglePageVisuals &&
              this.updateSinglePageVisuals(pageEl, pageSettings, index);
          }
        } catch (err) {}
      });

      // Refresh all existing pages with current rules and then re-run pagination.
      this.updateAllPageVisuals && this.updateAllPageVisuals();
      this.triggerPaginationCheck && this.triggerPaginationCheck();

      try {
        this.editor &&
          this.editor.Modal &&
          this.editor.Modal.close &&
          this.editor.Modal.close();
      } catch (err) {}
    } catch (err) {
      console.error("❌ Error in applyPageElementsSettings:");
      try {
        alert("Failed to apply settings.");
      } catch (e) {}
    }
  }

  convertToMm(value, unit) {
    switch (unit) {
      case "cm":
        return value * 10;
      case "inch":
        return value * 25.4;
      case "mm":
      default:
        return value;
    }
  }
  insertConditionalPageBreaksToAllPages() {
    if (!this.pageSettings.conditionalPageBreak?.enabled) {
      return;
    }

    const allPages = this.editor.getWrapper().find(".page-container");

    allPages.forEach((pageComponent, index) => {
      this.insertConditionalPageBreakToPage(pageComponent, index);
    });
  }
  insertConditionalPageBreakToPage(pageComponent, pageIndex) {
    if (!this.pageSettings.conditionalPageBreak?.enabled) return;

    const mainContentArea = pageComponent.find(".main-content-area")[0];
    if (!mainContentArea) return;

    const mainContentAreaEl = mainContentArea.view.el;
    const existingIndicators = mainContentAreaEl.querySelectorAll(
      ".conditional-break-indicator",
    );
    existingIndicators.forEach((ind) => ind.remove());
    const pageNumber = pageIndex + 1;
    const overrides =
      this.pageSettings.conditionalPageBreak.pageOverrides || {};
    let distance, unit;

    if (overrides[pageNumber]) {
      distance = overrides[pageNumber].distance;
      unit = overrides[pageNumber].unit;
    } else {
      distance = this.pageSettings.conditionalPageBreak.defaultDistance || 50;
      unit = this.pageSettings.conditionalPageBreak.defaultUnit || "mm";
    }

    const distanceInMm = this.convertToMm(distance, unit);
    const mmToPx = 96 / 25.4;
    const distanceInPx = Math.round(distanceInMm * mmToPx);

    const contentEl = mainContentArea.getEl();
    if (!contentEl) return;

    const contentHeight = contentEl.clientHeight;
    const breakPosition = contentHeight - distanceInPx;

    if (breakPosition <= 0 || breakPosition >= contentHeight) {
      return;
    }

    const allBreaks = mainContentArea.find(
      '.page-break:not([data-conditional="true"])',
    );
    if (allBreaks.length > 0) {
      return;
    }

    const label = overrides[pageNumber]
      ? `Override: ${distance}${unit}`
      : `Default: ${distance}${unit}`;

    const visualIndicatorHTML = `
    <div class="conditional-break-indicator" 
         data-conditional="true"
         data-page-number="${pageNumber}"
         style="
           position: absolute;
           bottom: ${distanceInPx}px;
           left: 0;
           right: 0;
           height: 2px;
           border-top: 2px dashed ${overrides[pageNumber] ? "#4caf50" : "#ff6b6b"};
           z-index: 999;
           pointer-events: none;
           background: rgba(${overrides[pageNumber] ? "76, 175, 80" : "255, 107, 107"}, 0.05);
         ">
      <span style="
        position: absolute;
        right: 0;
        top: -20px;
        background: ${overrides[pageNumber] ? "#4caf50" : "#ff6b6b"};
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        z-index: 100;
        white-space: nowrap;
      ">Conditional Break (P${pageNumber}): ${label}</span>
    </div>
  `;

    const pageContent = pageComponent.find(".page-content")[0];
    if (!pageContent) return;

    const pageContentEl = pageContent.view.el;
    pageContentEl.insertAdjacentHTML("beforeend", visualIndicatorHTML);
  }
  removeAllConditionalPageBreaks() {
    const allPages = this.editor.getWrapper().find(".page-container");

    allPages.forEach((pageComponent) => {
      const pageContent = pageComponent.find(".page-content")[0];
      if (pageContent) {
        const conditionalIndicators = pageContent.find(
          '.conditional-break-indicator[data-conditional="true"]',
        );
        conditionalIndicators.forEach((ind) => ind.remove());
      }

      const mainContentArea = pageComponent.find(".main-content-area")[0];
      if (mainContentArea) {
        const conditionalBreaks = mainContentArea.find(
          '[data-conditional="true"]',
        );
        conditionalBreaks.forEach((br) => br.remove());
      }
    });
  }

  populatePageSettingsForm() {
    try {
      const marginTopInput = document.getElementById("settingsMarginTop");
      const marginBottomInput = document.getElementById("settingsMarginBottom");
      const marginLeftInput = document.getElementById("settingsMarginLeft");
      const marginRightInput = document.getElementById("settingsMarginRight");

      if (marginTopInput)
        marginTopInput.value = this.pageSettings.margins.top || 0;
      if (marginBottomInput)
        marginBottomInput.value = this.pageSettings.margins.bottom || 0;
      if (marginLeftInput)
        marginLeftInput.value = this.pageSettings.margins.left || 0;
      if (marginRightInput)
        marginRightInput.value = this.pageSettings.margins.right || 0;

      const bgColorInput = document.getElementById(
        "settingsPageBackgroundColor",
      );
      const bgColorPreview = document.getElementById(
        "settingsBackgroundColorPreview",
      );
      if (bgColorInput) {
        bgColorInput.value = this.pageSettings.backgroundColor || "#ffffff";
        if (bgColorPreview) {
          bgColorPreview.style.backgroundColor =
            this.pageSettings.backgroundColor || "#ffffff";
        }
      }

      const headerEnabledInput = document.getElementById(
        "settingsHeaderEnabled",
      );
      const headerHeightInput = document.getElementById("settingsHeaderHeight");
      if (headerEnabledInput)
        headerEnabledInput.checked =
          this.pageSettings.headerFooter?.headerEnabled !== false;
      if (headerHeightInput)
        headerHeightInput.value =
          this.pageSettings.headerFooter?.headerHeight || 12.7;

      const footerEnabledInput = document.getElementById(
        "settingsFooterEnabled",
      );
      const footerHeightInput = document.getElementById("settingsFooterHeight");
      if (footerEnabledInput)
        footerEnabledInput.checked =
          this.pageSettings.headerFooter?.footerEnabled !== false;
      if (footerHeightInput)
        footerHeightInput.value =
          this.pageSettings.headerFooter?.footerHeight || 12.7;

      const pageNumberEnabled = document.getElementById("pageNumberEnabled");
      if (pageNumberEnabled) {
        pageNumberEnabled.checked =
          this.pageSettings.pageNumber?.enabled || false;
      }
    } catch (error) {
      console.error("❌ Error populating settings form:");
    }
  }

  applyConditionalHeaderFooterContent() {
    try {
      const allPageComponents = this.editor
        .getWrapper()
        .find(".page-container");

      allPageComponents.forEach((pageComponent, index) => {
        const pageSettings = this.pageSettings.pages[index];
        if (!pageSettings) {
          return;
        }
        const pageNumber = index + 1;
        const headerRegion = pageComponent.find(
          '[data-shared-region="header"]',
        )[0];
        if (headerRegion) {
          const headerElement = headerRegion.find(".page-header-element")[0];
          if (headerElement) {
            const shouldShowHeaderContent =
              pageSettings.header?.shouldShowContent !== false;
            headerRegion.addStyle({
              display: shouldShowHeaderContent ? "block" : "none",
            });
            headerElement.addStyle({
              visibility: shouldShowHeaderContent ? "visible" : "hidden",
              opacity: shouldShowHeaderContent ? "1" : "0",
              "pointer-events": shouldShowHeaderContent ? "auto" : "none",
            });
          }
        }

        const footerRegion = pageComponent.find(
          '[data-shared-region="footer"]',
        )[0];
        if (footerRegion) {
          const footerElement = footerRegion.find(".page-footer-element")[0];
          if (footerElement) {
            const shouldShowFooterContent =
              pageSettings.footer?.shouldShowContent !== false;
            footerRegion.addStyle({
              display: shouldShowFooterContent ? "block" : "none",
            });
            footerElement.addStyle({
              visibility: shouldShowFooterContent ? "visible" : "hidden",
              opacity: shouldShowFooterContent ? "1" : "0",
              "pointer-events": shouldShowFooterContent ? "auto" : "none",
            });
          }
        }
      });
    } catch (error) {
      console.error("❌ Error applying conditional header/footer content:");
    }
  }

  parsePageList(pageListString) {
    if (!pageListString || pageListString.trim() === "") {
      return [];
    }

    const pages = [];
    const parts = pageListString.split(",");

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes("-")) {
        const [start, end] = trimmedPart
          .split("-")
          .map((num) => parseInt(num.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
              pages.push(i);
            }
          }
        }
      } else {
        const pageNum = parseInt(trimmedPart, 10);
        if (!isNaN(pageNum) && !pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  }

  updateIndividualPageSettings() {
    try {
      const totalPages = this.pageSettings.pages.length;
      const headerApplyMode = this._lastHeaderApplyMode || "all";
      const footerApplyMode = this._lastFooterApplyMode || "all";
      const headerCustomPages = this._lastHeaderCustomPages || [];
      const footerCustomPages = this._lastFooterCustomPages || [];

      for (let i = 0; i < this.pageSettings.pages.length; i++) {
        const pageSettings = this.pageSettings.pages[i];
        const pageNumber = i + 1;
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === this.pageSettings.numberOfPages;

        if (!pageSettings.header) pageSettings.header = {};
        if (!pageSettings.footer) pageSettings.footer = {};

        let shouldShowHeaderContent = false;
        if (headerApplyMode === "all") {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "first" && isFirstPage) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "last" && isLastPage) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "even" && pageNumber % 2 === 0) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "odd" && pageNumber % 2 !== 0) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "different") {
          shouldShowHeaderContent = true;
        } else if (
          headerApplyMode === "custom" &&
          headerCustomPages.includes(pageNumber)
        ) {
          shouldShowHeaderContent = true;
        }

        let shouldShowFooterContent = false;
        if (footerApplyMode === "all") {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "first" && isFirstPage) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "last" && isLastPage) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "even" && pageNumber % 2 === 0) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "odd" && pageNumber % 2 !== 0) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "different") {
          shouldShowFooterContent = true;
        } else if (
          footerApplyMode === "custom" &&
          footerCustomPages.includes(pageNumber)
        ) {
          shouldShowFooterContent = true;
        }

        pageSettings.header.shouldShowContent = shouldShowHeaderContent;
        pageSettings.footer.shouldShowContent = shouldShowFooterContent;
      }
    } catch (error) {}
  }

  applyBackgroundColorToPages(backgroundColor, specificPages = null) {
    const allPageComponents = this.editor.getWrapper().find(".page-container");

    allPageComponents.forEach((pageComponent, index) => {
      if (specificPages && !specificPages.includes(index + 1)) return;

      pageComponent.addStyle({
        background: backgroundColor,
        "background-color": backgroundColor,
      });

      const pageContentComponent = pageComponent.find(".page-content")[0];
      if (pageContentComponent) {
        pageContentComponent.addStyle({
          "background-color": backgroundColor,
        });
      }

      const headerComponent = pageComponent.find(".header-wrapper")[0];
      if (headerComponent) {
        headerComponent.addStyle({
          "background-color": backgroundColor,
        });

        const headerElement = headerComponent.find(".page-header-element")[0];
        if (headerElement) {
          headerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          });
        }
      }

      const footerComponent = pageComponent.find(".footer-wrapper")[0];
      if (footerComponent) {
        footerComponent.addStyle({
          "background-color": backgroundColor,
        });

        const footerElement = footerComponent.find(".page-footer-element")[0];
        if (footerElement) {
          footerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          });
        }
      }
    });
  }

  resetPageElementsSettings() {
    this.preserveAllContent();

    this.pageSettings.margins = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    this.pageSettings.backgroundColor = "#ffffff";
    this.pageSettings.headerFooter = {
      headerEnabled: true,
      footerEnabled: true,
      headerHeight: 12.7,
      footerHeight: 12.7,
    };

    this.pageSettings.pageNumbering = {
      enabled: false,
      startFromPage: 1,
      excludedPages: [],
    };

    this.pageSettings.watermark = {
      enabled: false,
      type: "text",
      text: {
        content: "CONFIDENTIAL",
        font: "Arial",
        fontSize: 60,
        color: "red",
        opacity: 0.2,
        rotation: -30,
      },
      image: {
        url: "",
        width: 100,
        height: 100,
        opacity: 0.3,
      },
      position: "center",
      applyToAllPages: true,
      tiled: false,
    };

    this.pageSettings.pages.forEach((page) => {
      page.backgroundColor = "#ffffff";
      page.header = {
        enabled: true,
        content: "",
        height: 12.7,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      };
      page.footer = {
        enabled: true,
        content: "",
        height: 12.7,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      };
      page.pageNumber = {
        enabled: false,
        format: "Page {n}",
        position: "bottom-right",
        fontSize: 11,
        color: "#333333",
        backgroundColor: "#ffffff",
        showBorder: true,
      };
    });

    this.setupEditorPages();

    setTimeout(() => {
      this.restoreAllContent();
      this.updateAllPageVisuals();
    }, 300);

    this.editor.Modal.close();
  }
  startContentMonitoring() {
    if (this.contentCheckInterval) {
      clearInterval(this.contentCheckInterval);
    }

    this.contentCheckInterval = setInterval(() => {
      if (!this.paginationInProgress) {
        this.checkForContentChanges();
      }
    }, 3000);
  }
  setupEditorPages() {
    try {
      const wrapper = this.editor.getWrapper();
      this.clearAllObservers && this.clearAllObservers();

      const mmToPx = 96 / 25.4;
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
      const marginBottomPx = Math.round(
        this.pageSettings.margins.bottom * mmToPx,
      );
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
      const marginRightPx = Math.round(
        this.pageSettings.margins.right * mmToPx,
      );
      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;
      const defaultHeaderHeight = Math.round(
        (this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx,
      );
      const defaultFooterHeight = Math.round(
        (this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx,
      );
      const mainContentAreaHeight =
        contentHeight - defaultHeaderHeight - defaultFooterHeight;

      const hasExistingContent =
        this.pageContents && typeof this.pageContents.size !== "undefined"
          ? this.pageContents.size > 0
          : false;
      if (!hasExistingContent) {
        try {
          wrapper.components().reset();
        } catch (err) {}
      } else {
        try {
          const pageContainers =
            (wrapper.find && wrapper.find(".page-container")) || [];
          (pageContainers || []).forEach(
            (page) => page.remove && page.remove(),
          );
        } catch (err) {}
      }

      for (let i = 0; i < (this.pageSettings.numberOfPages || 0); i++) {
        const pageData =
          (this.pageSettings.pages && this.pageSettings.pages[i]) || {};
        const pageNumber = i + 1;
        const isEvenPage = pageNumber % 2 === 0;
        const isOddPage = pageNumber % 2 !== 0;
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === this.pageSettings.numberOfPages;
        const headerApplyMode =
          this.pageSettings.headerFooter?.headerApplyMode ||
          this._lastHeaderApplyMode ||
          "all";
        const footerApplyMode =
          this.pageSettings.headerFooter?.footerApplyMode ||
          this._lastFooterApplyMode ||
          "all";
        const headerCustomPages =
          this.pageSettings.headerFooter?.headerCustomPages ||
          this._lastHeaderCustomPages ||
          [];
        const footerCustomPages =
          this.pageSettings.headerFooter?.footerCustomPages ||
          this._lastFooterCustomPages ||
          [];

        let headerRegionType = "header";
        let footerRegionType = "footer";
        let headerCondition = "all";
        let footerCondition = "all";
        let headerLabel = "";
        let footerLabel = "";

        // ----- HEADER LOGIC -----
        if (headerApplyMode === "all") {
          headerCondition = "all";
          headerLabel = "Header";
        } else if (headerApplyMode === "first") {
          headerCondition = isFirstPage ? "first" : "hidden";
          headerLabel = isFirstPage
            ? "First Page Header"
            : "Header (Hidden - First Page Only)";
        } else if (headerApplyMode === "last") {
          headerCondition = isLastPage ? "last" : "hidden";
          headerLabel = isLastPage
            ? "Last Page Header"
            : "Header (Hidden - Last Page Only)";
        } else if (headerApplyMode === "even") {
          headerCondition = isEvenPage ? "even" : "hidden";
          headerLabel = isEvenPage
            ? "Even Page Header (Pages 2, 4, 6...)"
            : "Header (Hidden - Even Pages Only)";
        } else if (headerApplyMode === "odd") {
          headerCondition = isOddPage ? "odd" : "hidden";
          headerLabel = isOddPage
            ? "Odd Page Header (Pages 1, 3, 5...)"
            : "Header (Hidden - Odd Pages Only)";
        } else if (headerApplyMode === "different") {
          headerCondition = isEvenPage ? "even" : "odd";
          headerLabel = isEvenPage ? "Even Page Header" : "Odd Page Header";
        } else if (headerApplyMode === "custom") {
          const pageIsInCustomList =
            Array.isArray(headerCustomPages) &&
            headerCustomPages.includes(pageNumber);
          headerCondition = pageIsInCustomList ? "custom" : "hidden";
          headerLabel = pageIsInCustomList
            ? `Custom Header (Page ${pageNumber})`
            : "Header (Hidden - Custom Range)";
        }

        // ----- FOOTER LOGIC -----
        if (footerApplyMode === "all") {
          footerCondition = "all";
          footerLabel = "Footer";
        } else if (footerApplyMode === "first") {
          footerCondition = isFirstPage ? "first" : "hidden";
          footerLabel = isFirstPage
            ? "First Page Footer"
            : "Footer (Hidden - First Page Only)";
        } else if (footerApplyMode === "last") {
          footerCondition = isLastPage ? "last" : "hidden";
          footerLabel = isLastPage
            ? "Last Page Footer"
            : "Footer (Hidden - Last Page Only)";
        } else if (footerApplyMode === "even") {
          footerCondition = isEvenPage ? "even" : "hidden";
          footerLabel = isEvenPage
            ? "Even Page Footer (Pages 2, 4, 6...)"
            : "Footer (Hidden - Even Pages Only)";
        } else if (footerApplyMode === "odd") {
          footerCondition = isOddPage ? "odd" : "hidden";
          footerLabel = isOddPage
            ? "Odd Page Footer (Pages 1, 3, 5...)"
            : "Footer (Hidden - Odd Pages Only)";
        } else if (footerApplyMode === "different") {
          footerCondition = isEvenPage ? "even" : "odd";
          footerLabel = isEvenPage ? "Even Page Footer" : "Odd Page Footer";
        } else if (footerApplyMode === "custom") {
          const pageIsInCustomList =
            Array.isArray(footerCustomPages) &&
            footerCustomPages.includes(pageNumber);
          footerCondition = pageIsInCustomList ? "custom" : "hidden";
          footerLabel = pageIsInCustomList
            ? `Custom Footer (Page ${pageNumber})`
            : "Footer (Hidden - Custom Range)";
        }

        const headerDisplayStyle =
          headerCondition === "hidden" ? "display: none;" : "";
        const footerDisplayStyle =
          footerCondition === "hidden" ? "display: none;" : "";

        const pageHTML = `
        <div class="page-container" data-page-id="${pageData.id || `page-${pageNumber}`}" data-page-index="${i}">
          <div class="page-content" style="
            height: ${contentHeight}px; 
            margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
            position: relative;
            overflow: hidden;
            background-color: ${pageData.backgroundColor || this.pageSettings.backgroundColor};
            display: flex;
            flex-direction: column;
          ">
            <div class="header-wrapper" data-shared-region="${headerRegionType}" data-condition="${headerCondition}" style="
              width: 100%;
              height: ${defaultHeaderHeight}px;
              flex-shrink: 0;
              ${headerDisplayStyle}
            ">
              <div class="page-header-element" style="
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
              "></div>
            </div>
            <div class="content-wrapper" style="
              flex: 1;
              display: flex;
              flex-direction: column;
              height: ${mainContentAreaHeight}px;
            ">
              <div class="main-content-area" style="
                width: 100%;
                height: 100%;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
                overflow: hidden;
                position: relative;
              "></div>
            </div>
            <div class="footer-wrapper" data-shared-region="${footerRegionType}" data-condition="${footerCondition}" style="
              width: 100%;
              height: ${defaultFooterHeight}px;
              flex-shrink: 0;
              ${footerDisplayStyle}
            ">
              <div class="page-footer-element" style="
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
              "></div>
            </div>
          </div>
        </div>`;

        const appended = wrapper.append && wrapper.append(pageHTML);
        const pageComponent = appended && appended[0];
        if (!pageComponent) {
          continue;
        }

        try {
          pageComponent.addStyle &&
            pageComponent.addStyle({
              width: `${totalPageWidth}px`,
              height: `${totalPageHeight}px`,
              background:
                pageData.backgroundColor || this.pageSettings.backgroundColor,
              margin: "20px auto",
              "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
              border: "2px solid transparent",
              position: "relative",
              "page-break-after": "always",
              overflow: "hidden",
              "box-sizing": "border-box",
              transition: "border-color 0.2s ease",
              "-webkit-print-color-adjust": "exact",
              "color-adjust": "exact",
              "print-color-adjust": "exact",
            });
        } catch (err) {}

        // Page content component
        const pageContentComponent =
          pageComponent.find && pageComponent.find(".page-content")[0];
        if (pageContentComponent) {
          try {
            pageContentComponent.addStyle &&
              pageContentComponent.addStyle({
                overflow: "hidden",
                position: "relative",
                "box-sizing": "border-box",
                display: "flex",
                "flex-direction": "column",
                height: `${contentHeight}px`,
                "background-color":
                  pageData.backgroundColor || this.pageSettings.backgroundColor,
                "-webkit-print-color-adjust": "exact",
                "color-adjust": "exact",
                "print-color-adjust": "exact",
              });
          } catch (err) {}
        }

        const headerElement =
          pageComponent.find && pageComponent.find(".page-header-element")[0];
        if (headerElement && typeof headerElement.set === "function") {
          try {
            headerElement.set({
              droppable: true,
              editable: true,
              selectable: true,
              draggable: false,
              copyable: false,
              removable: false,
              "custom-name": headerLabel,
            });
          } catch (err) {}
        }

        const mainContentArea =
          pageComponent.find && pageComponent.find(".main-content-area")[0];
        if (mainContentArea && typeof mainContentArea.set === "function") {
          try {
            mainContentArea.set({
              droppable: true,
              editable: true,
              selectable: true,
              "custom-name": "Content Area",
            });
          } catch (err) {}
        }

        const footerElement =
          pageComponent.find && pageComponent.find(".page-footer-element")[0];
        if (footerElement && typeof footerElement.set === "function") {
          try {
            footerElement.set({
              droppable: true,
              editable: true,
              selectable: true,
              draggable: false,
              copyable: false,
              removable: false,
              "custom-name": footerLabel,
            });
          } catch (err) {}
        }

        try {
          this.setupPageObserver && this.setupPageObserver(i);
        } catch (err) {}
      }
      this.setupSectionsContainerListener &&
        this.setupSectionsContainerListener();
      this.setupCanvasScrolling && this.setupCanvasScrolling();

      setTimeout(() => {
        try {
          this.restoreAllContent && this.restoreAllContent();
          this.startContentMonitoring && this.startContentMonitoring();
          this.setupStrictBoundaryEnforcement &&
            this.setupStrictBoundaryEnforcement();
        } catch (err) {}
      }, 100);
    } catch (error) {}
  }

  /////////////////////////////////////// daynamic section added from here //////////////////////////////////////////////////////////////////////
  setupSectionsContainerListener() {
    this.editor.off("component:add.sections");
    this.editor.on("component:add.sections", (component) => {
      const isSectionsComponent =
        component.get("name") === "Sections" ||
        component.get("type") === "Sections" ||
        component.getClasses().includes("sections-container");

      if (isSectionsComponent) {
        const currentCount = component.getAttributes()["data-section-count"];
        const needsCount =
          !currentCount || currentCount === "" || currentCount === "undefined";

        if (needsCount) {
          setTimeout(() => {
            const wrapper = this.editor.getWrapper();
            const allPages = wrapper.find(".page-container");
            let targetPageIndex = 0;
            let foundPage = false;
            let parent = component.parent();
            while (parent && !foundPage) {
              if (
                parent.getClasses &&
                parent.getClasses().includes("page-container")
              ) {
                const pageId = parent.getAttributes()["data-page-index"];
                if (pageId !== undefined) {
                  targetPageIndex = parseInt(pageId);
                  foundPage = true;
                }
              }
              parent = parent.parent();
            }

            if (!foundPage) {
              allPages.forEach((page, idx) => {
                const sections = page.find(".sections-container");
                sections.forEach((sec) => {
                  if (sec === component || sec.getId() === component.getId()) {
                    targetPageIndex = idx;
                    foundPage = true;
                  }
                });
              });
            }
            this.addSectionsContainerToSpecificPage(targetPageIndex, null);
          }, 200);
        } else {
        }
      }
    });
  }
  checkAndAddSections() {
    const sectionsRequiredBlocks = [
      "column1",
      "column2",
      "column3",
      "column3-7",
      "text",
      "separator",
      "Sections",
      "link",
      "image",
      "video",
      "videoIn",
      "map",
    ];

    const allPages = this.editor.getWrapper().find(".page-container");
    let foundRequiredBlock = false;

    allPages.forEach((pageComponent, pageIndex) => {
      const allComponents = pageComponent.find("*");

      allComponents.forEach((component) => {
        const blockType = component.get("type") || "";
        const customName = component.get("custom-name") || "";
        const tagName = component.get("tagName") || "";

        if (
          sectionsRequiredBlocks.some(
            (block) =>
              blockType.toLowerCase().includes(block.toLowerCase()) ||
              customName.toLowerCase().includes(block.toLowerCase()) ||
              tagName.toLowerCase().includes(block.toLowerCase()),
          )
        ) {
          foundRequiredBlock = true;
        }
      });
    });

    if (foundRequiredBlock) {
      this.addSectionsContainerToSpecificPage();
    }
  }

  onSectionAdded(sectionComponent, pageIndex) {
    const sectionCount = sectionComponent.getAttributes()["data-section-count"];

    if (
      this.pageSettings.sectionConditionalPageBreak?.enabled &&
      sectionCount
    ) {
      setTimeout(() => {
        this.applySectionConditionalBreakToSection(
          sectionComponent,
          sectionCount,
          pageIndex,
        );
      }, 300);
    }
  }

  addSectionsContainerToSpecificPage(pageIndex, sourceSectionCount = null) {
    try {
      const wrapper = this.editor.getWrapper();
      const allPages = wrapper.find(".page-container");

      if (pageIndex < 0 || pageIndex >= allPages.length) {
        pageIndex = 0;
      }

      const pageComponent = allPages[pageIndex];
      if (!pageComponent) {
        return;
      }

      const mainContentArea = pageComponent.find(".main-content-area")[0];
      if (!mainContentArea) {
        return;
      }

      const existingSections = mainContentArea.find(".sections-container");
      if (sourceSectionCount === null) {
        const unassignedSections = existingSections.filter((sec) => {
          const count = sec.getAttributes()["data-section-count"];
          return !count || count === "" || count === "undefined";
        });

        if (unassignedSections.length === 0 && existingSections.length > 0) {
          return existingSections[0];
        }

        let highestCount = 0;
        allPages.forEach((page) => {
          const sections = page.find(".sections-container");
          sections.forEach((section) => {
            const count = parseInt(
              section.getAttributes()["data-section-count"] || "0",
            );
            if (count > highestCount) highestCount = count;
          });
        });

        const newSectionCount = String(highestCount + 1);
        if (unassignedSections.length > 0) {
          const sectionToUpdate = unassignedSections[0];
          sectionToUpdate.addAttributes({
            "data-section-count": newSectionCount,
          });
          setTimeout(() => {
            if (this.pageSettings.sectionConditionalPageBreak?.enabled) {
              this.applySectionConditionalBreakToSection(
                sectionToUpdate,
                newSectionCount,
                pageIndex,
              );
            }
          }, 500);
          return sectionToUpdate;
        }

        const newSection = mainContentArea.append({
          type: "Sections",
          attributes: {
            "data-section-count": newSectionCount,
          },
        })[0];
        this.editor.trigger("change:canvasOffset");
        return newSection;
      } else {
        const matchingSections = existingSections.filter(
          (sec) =>
            sec.getAttributes()["data-section-count"] === sourceSectionCount,
        );

        if (matchingSections.length > 0) {
          return matchingSections[0];
        }

        const newSection = mainContentArea.append({
          type: "Sections",
          attributes: {
            "data-section-count": sourceSectionCount,
          },
        })[0];

        this.onSectionAdded(newSection, pageIndex);
        setTimeout(() => {
          if (this.pageSettings.sectionConditionalPageBreak?.enabled) {
            this.applySectionConditionalBreaks();
          }
        }, 1000);
        this.editor.trigger("change:canvasOffset");
        return newSection;
      }
    } catch (error) {
      console.error("Error adding section to specific page:");
    }
  }

  cleanupSectionsListener() {
    if (this._sectionsCheckInterval) {
      clearInterval(this._sectionsCheckInterval);
      this._sectionsCheckInterval = null;
    }

    this.editor.off("component:add.sections");
    this.editor.off("component:create.sections");
    this.editor.off("block:drag:start.sections");
    this.editor.off("block:drag:stop.sections");
    this.editor.off("canvas:drop.sections");
  }

  forceSectionsToAllPages() {
    this.addSectionsContainerToSpecificPage();
  }

  shouldHaveSectionsContainer() {
    const sectionsRequiredBlocks = [
      "column1",
      "column2",
      "column3",
      "column3-7",
      "text",
      "separator",
      "Sections",
      "link",
      "image",
      "video",
      "videoIn",
      "map",
    ];

    const allPages = this.editor.getWrapper().find(".page-container");

    for (let pageComponent of allPages) {
      const allComponents = pageComponent.find("*");

      for (let component of allComponents) {
        const blockType =
          component.get("type") || component.get("custom-name") || "";

        if (
          sectionsRequiredBlocks.includes(blockType) ||
          sectionsRequiredBlocks.some((block) =>
            blockType.toLowerCase().includes(block.toLowerCase()),
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /////////////////////////////////////// daynamic section ended from here //////////////////////////////////////////////////////////////////////

  setupCanvasScrolling() {
    const canvasContainer = this.editor.Canvas.getElement();
    if (canvasContainer) {
      canvasContainer.style.height = "calc(100vh - 120px)";
      canvasContainer.style.background = "#f0f0f0";
    }

    const rightPanel = document.querySelector(".gjs-pn-panels-right");
    if (rightPanel) {
      rightPanel.style.position = "fixed";
      rightPanel.style.right = "0";
      rightPanel.style.top = "0";
      rightPanel.style.height = "100vh";
      rightPanel.style.overflow = "auto";
      rightPanel.style.zIndex = "1000";
    }
  }

  updateAllPageVisuals() {
    this.pageSettings.pages.forEach((page, index) => {
      const canvasBody = this.editor.Canvas.getBody();
      const pageElement = canvasBody.querySelector(
        `[data-page-index="${index}"]`,
      );
      if (pageElement) {
        this.updateSinglePageVisuals(pageElement, page, index);
        this.setupPageObserver(index);
      }
    });
    this.setupStrictBoundaryEnforcement();
  }
  parsePositionStyles(styleString) {
    const styles = {};
    const rules = styleString.split(";").filter((r) => r.trim());

    rules.forEach((rule) => {
      const [property, value] = rule.split(":").map((s) => s.trim());
      if (property && value) {
        styles[property] = value;
      }
    });

    return styles;
  }
  updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
    const allPages = this.editor.getWrapper().find(".page-container");
    const pageComponent = allPages.find(
      (p) =>
        p.getAttributes &&
        p.getAttributes()["data-page-id"] === pageSettings.id,
    );
    if (!pageComponent) return;
    const pageContentComponent = pageComponent.find(".page-content")[0];
    if (!pageContentComponent) return;
    const sectionsContainer = pageComponent.find(".sections-container")[0];
    const sectionHeader = sectionsContainer
      ? sectionsContainer.find(".section-header")[0]
      : null;
    const sectionContent = sectionsContainer
      ? sectionsContainer.find(".section-content")[0]
      : null;
    const sectionFooter = sectionsContainer
      ? sectionsContainer.find(".section-footer")[0]
      : null;

    let preservedHeaderHeight = null;
    let preservedContentHeight = null;
    let preservedFooterHeight = null;

    if (sectionsContainer) {
      if (sectionHeader) {
        const headerEl = sectionHeader.getEl && sectionHeader.getEl();
        if (headerEl) {
          preservedHeaderHeight =
            headerEl.style.height || window.getComputedStyle(headerEl).height;
        }
      }

      if (sectionContent) {
        const contentEl = sectionContent.getEl && sectionContent.getEl();
        if (contentEl) {
          preservedContentHeight =
            contentEl.style.height || window.getComputedStyle(contentEl).height;
        }
      }

      if (sectionFooter) {
        const footerEl = sectionFooter.getEl && sectionFooter.getEl();
        if (footerEl) {
          preservedFooterHeight =
            footerEl.style.height || window.getComputedStyle(footerEl).height;
        }
      }
    }

    const checkCustomRange = (range, pageNum) => {
      if (!range) return false;
      return range.split(",").some((part) => {
        const trimmed = part.trim();
        if (!trimmed) return false;
        if (trimmed.includes("-")) {
          const [start, end] = trimmed
            .split("-")
            .map((n) => parseInt(n.trim(), 10));
          if (Number.isNaN(start) || Number.isNaN(end)) return false;
          return pageNum >= start && pageNum <= end;
        } else {
          const n = parseInt(trimmed, 10);
          return !Number.isNaN(n) && n === pageNum;
        }
      });
    };

      const shouldApply = (mode, range, pageNum) => {
      const totalPages = this.pageSettings.numberOfPages || 1;
      if (mode === "all") return true;
      if (mode === "first") return pageNum === 1;
      if (mode === "last") return pageNum === totalPages;
      if (mode === "even") return pageNum % 2 === 0;
      if (mode === "odd") return pageNum % 2 !== 0;
      if (mode === "different") return true;
      if (mode === "custom") return checkCustomRange(range, pageNum);
      return true;
    };

    const existingIndicator = pageElement.querySelector(".page-indicator");
    if (existingIndicator) existingIndicator.remove();

    const indicator = document.createElement("div");
    indicator.className = "page-indicator";
    indicator.textContent = pageSettings.name || `Page ${pageIndex + 1}`;
    pageElement.appendChild(indicator);
    const mmToPx = 96 / 25.4;
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
    const marginBottomPx = Math.round(
      this.pageSettings.margins.bottom * mmToPx,
    );
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);
    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;
    const defaultHeaderHeight = Math.round(
      (this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx,
    );
    const defaultFooterHeight = Math.round(
      (this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx,
    );
    const mainContentHeight =
      contentHeight - defaultHeaderHeight - defaultFooterHeight;

    pageContentComponent.addStyle({
      display: "flex",
      "flex-direction": "column",
      height: `${contentHeight}px`,
      width: `${contentWidth}px`,
      position: "relative",
      "background-color":
        pageSettings.backgroundColor || this.pageSettings.backgroundColor,
      overflow: "hidden",
      "box-sizing": "border-box",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
      "color-adjust": "exact",
    });

    const existingHeaderWrapper = pageComponent.find(".header-wrapper")[0];
    if (existingHeaderWrapper) {
      existingHeaderWrapper.addStyle({
        width: "100%",
        height: `${defaultHeaderHeight}px`,
        "flex-shrink": "0",
        direction: "ltr",
      });
    }

    const existingContentWrapper = pageComponent.find(".content-wrapper")[0];
    if (existingContentWrapper) {
      existingContentWrapper.addStyle({
        flex: "1",
        display: "flex",
        "flex-direction": "column",
        height: `${mainContentHeight}px`,
        overflow: "hidden",
      });

      const existingMainContentArea =
        existingContentWrapper.find(".main-content-area")[0];
      if (existingMainContentArea) {
        existingMainContentArea.addStyle({
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative",
        });
      }
    }

    const existingFooterWrapper = pageComponent.find(".footer-wrapper")[0];
    if (existingFooterWrapper) {
      existingFooterWrapper.addStyle({
        width: "100%",
        height: `${defaultFooterHeight}px`,
        "flex-shrink": "0",
      });
    }

    try {
      const headerComp = pageComponent.find(".section-header")[0];
      if (headerComp) {
        const mode =
          (headerComp.getTrait &&
            headerComp.getTrait("headerApplyMode") &&
            headerComp.getTrait("headerApplyMode").getValue()) ||
          "all";
        const range =
          (headerComp.getTrait &&
            headerComp.getTrait("headerCustomRange") &&
            headerComp.getTrait("headerCustomRange").getValue()) ||
          "";
        const apply = shouldApply(mode, range, pageIndex + 1);
        const hEl = headerComp.getEl && headerComp.getEl();
        if (hEl) hEl.style.display = apply ? "block" : "none";
      }

      const footerComp = pageComponent.find(".section-footer")[0];
      if (footerComp) {
        const mode =
          (footerComp.getTrait &&
            footerComp.getTrait("footerApplyMode") &&
            footerComp.getTrait("footerApplyMode").getValue()) ||
          "all";
        const range =
          (footerComp.getTrait &&
            footerComp.getTrait("footerCustomRange") &&
            footerComp.getTrait("footerCustomRange").getValue()) ||
          "";
        const apply = shouldApply(mode, range, pageIndex + 1);
        const fEl = footerComp.getEl && footerComp.getEl();
        if (fEl) fEl.style.display = apply ? "block" : "none";
      }
    } catch (err) {}

    setTimeout(() => {
      const headerApplyMode =
        this.pageSettings.headerFooter?.headerApplyMode ||
        this._lastHeaderApplyMode ||
        "all";
      const footerApplyMode =
        this.pageSettings.headerFooter?.footerApplyMode ||
        this._lastFooterApplyMode ||
        "all";
      const headerCustomPages =
        this.pageSettings.headerFooter?.headerCustomPages ||
        this._lastHeaderCustomPages ||
        [];
      const footerCustomPages =
        this.pageSettings.headerFooter?.footerCustomPages ||
        this._lastFooterCustomPages ||
        [];

      const pageNumber = pageIndex + 1;
      const isFirstPage = pageNumber === 1;
      const isLastPage = pageNumber === this.pageSettings.numberOfPages;
      let shouldShowHeaderContent = false;
      let shouldShowFooterContent = false;

      if (headerApplyMode === "all") {
        shouldShowHeaderContent = true;
      } else if (headerApplyMode === "first") {
        shouldShowHeaderContent = isFirstPage;
      } else if (headerApplyMode === "last") {
        shouldShowHeaderContent = isLastPage;
      } else if (headerApplyMode === "even") {
        shouldShowHeaderContent = pageNumber % 2 === 0;
      } else if (headerApplyMode === "odd") {
        shouldShowHeaderContent = pageNumber % 2 !== 0;
      } else if (headerApplyMode === "different") {
        shouldShowHeaderContent = true;
      } else if (headerApplyMode === "custom") {
        shouldShowHeaderContent = headerCustomPages.includes(pageNumber);
      }

      if (footerApplyMode === "all") {
        shouldShowFooterContent = true;
      } else if (footerApplyMode === "first") {
        shouldShowFooterContent = isFirstPage;
      } else if (footerApplyMode === "last") {
        shouldShowFooterContent = isLastPage;
      } else if (footerApplyMode === "even") {
        shouldShowFooterContent = pageNumber % 2 === 0;
      } else if (footerApplyMode === "odd") {
        shouldShowFooterContent = pageNumber % 2 !== 0;
      } else if (footerApplyMode === "different") {
        shouldShowFooterContent = true;
      } else if (footerApplyMode === "custom") {
        shouldShowFooterContent = footerCustomPages.includes(pageNumber);
      }

      // Non-destructive header/footer visibility: keep component content/styles intact.
      const headerEnabled =
        this.pageSettings.headerFooter?.headerEnabled !== false;
      const footerEnabled =
        this.pageSettings.headerFooter?.footerEnabled !== false;
      const showHeaderRegion = headerEnabled && shouldShowHeaderContent;
      const showFooterRegion = footerEnabled && shouldShowFooterContent;

      const visibleHeaderHeight = showHeaderRegion ? defaultHeaderHeight : 0;
      const visibleFooterHeight = showFooterRegion ? defaultFooterHeight : 0;
      const calculatedMainHeight = Math.max(
        0,
        contentHeight - visibleHeaderHeight - visibleFooterHeight,
      );

      const headerWrapperLite = pageComponent.find(".header-wrapper")[0];
      if (headerWrapperLite) {
        headerWrapperLite.addStyle({
          display: showHeaderRegion ? "block" : "none",
          height: `${visibleHeaderHeight}px`,
        });
      }
      const footerWrapperLite = pageComponent.find(".footer-wrapper")[0];
      if (footerWrapperLite) {
        footerWrapperLite.addStyle({
          display: showFooterRegion ? "block" : "none",
          height: `${visibleFooterHeight}px`,
        });
      }
      const contentWrapperLite = pageComponent.find(".content-wrapper")[0];
      if (contentWrapperLite) {
        contentWrapperLite.addStyle({
          height: `${calculatedMainHeight}px`,
          overflow: "hidden",
        });
        const mainContentLite = contentWrapperLite.find(".main-content-area")[0];
        if (mainContentLite) {
          mainContentLite.addStyle({
            height: "100%",
            overflow: "hidden",
          });
        }
      }

      const sectionHeaderLite = pageComponent.find(".section-header")[0];
      if (sectionHeaderLite) {
        sectionHeaderLite.addStyle({
          display: showHeaderRegion ? "block" : "none",
          height: `${visibleHeaderHeight}px`,
          "min-height": `${visibleHeaderHeight}px`,
        });
      }
      const sectionFooterLite = pageComponent.find(".section-footer")[0];
      if (sectionFooterLite) {
        sectionFooterLite.addStyle({
          display: showFooterRegion ? "block" : "none",
          height: `${visibleFooterHeight}px`,
          "min-height": `${visibleFooterHeight}px`,
        });
      }
      const sectionContentLite = pageComponent.find(".section-content")[0];
      if (sectionContentLite) {
        sectionContentLite.addStyle({
          height: `${calculatedMainHeight}px`,
          "min-height": `${calculatedMainHeight}px`,
          "max-height": `${calculatedMainHeight}px`,
          overflow: "hidden",
        });
      }

      this.refreshPageNumberForPage &&
        this.refreshPageNumberForPage(pageComponent, pageIndex);

      this.updateIndividualPageSettings &&
        this.updateIndividualPageSettings();
      return;

      const headerWrapper = pageComponent.find(".header-wrapper")[0];
      if (headerWrapper) {
        try {
          headerWrapper.addStyle({ display: "" });
        } catch (e) {
          const hwEl = headerWrapper.getEl && headerWrapper.getEl();
          if (hwEl) hwEl.style.display = "";
        }

        const headerElement = headerWrapper.find(".page-header-element")[0];
        if (headerElement) {
          const headerStoreKey = `_preservedHeaderHtml_page_${pageNumber}`;
          const domEl =
            (headerElement.view && headerElement.view.el) ||
            (headerElement.getEl && headerElement.getEl());

          if (shouldShowHeaderContent) {
            try {
              if (this[headerStoreKey]) {
                if (domEl) {
                  domEl.innerHTML = this[headerStoreKey];
                }
                try {
                  headerElement.components().reset();
                  headerElement.append(this[headerStoreKey]);
                } catch (err) {}
              } else {
                if (
                  this._originalHeaderComponents &&
                  this._originalHeaderComponents.length
                ) {
                  headerElement.components().reset();
                  this._originalHeaderComponents.forEach((compData) => {
                    try {
                      headerElement.append(compData.html);
                    } catch (err) {
                      console.warn(err);
                    }
                  });
                } else {
                }
              }

              if (domEl) {
                domEl.style.height = "";
                domEl.style.minHeight = "";
                domEl.style.opacity = "";
                domEl.style.visibility = "";
                domEl.style.pointerEvents = "";
              }

              try {
                const prevStyle =
                  (headerElement.get && headerElement.get("style")) || {};
                if (prevStyle) {
                  delete prevStyle.height;
                  delete prevStyle.minHeight;
                  headerElement.set && headerElement.set("style", prevStyle);
                }
                headerElement.addStyle &&
                  headerElement.addStyle({
                    opacity: "1",
                    visibility: "visible",
                    pointerEvents: "auto",
                    display: "flex",
                  });
              } catch (err) {}

              if (domEl)
                domEl.removeAttribute &&
                  domEl.removeAttribute("data-header-hidden");
            } catch (err) {}
          } else {
            try {
              if (!this[headerStoreKey]) {
                try {
                  if (domEl) {
                    this[headerStoreKey] = domEl.innerHTML;
                  } else {
                    let fallbackHtml = "";
                    try {
                      const childModels =
                        (headerElement.components &&
                          headerElement.components().models) ||
                        [];
                      for (let i = 0; i < childModels.length; i++) {
                        const c = childModels[i];
                        if (typeof c.toHTML === "function")
                          fallbackHtml += c.toHTML();
                        else if (c.view && c.view.el)
                          fallbackHtml += c.view.el.outerHTML;
                      }
                    } catch (err) {}
                    this[headerStoreKey] = fallbackHtml || "";
                  }
                } catch (err) {
                  this[headerStoreKey] = this[headerStoreKey] || "";
                }
              } else {
              }

              let measuredHeight = "48px";
              if (domEl) {
                const rect =
                  domEl.getBoundingClientRect && domEl.getBoundingClientRect();
                if (rect && rect.height && rect.height > 0) {
                  measuredHeight = Math.ceil(rect.height) + "px";
                } else {
                  const cs =
                    window.getComputedStyle && window.getComputedStyle(domEl);
                  if (cs && cs.height && cs.height !== "0px")
                    measuredHeight = cs.height;
                }
              } else {
                const compStyle =
                  (headerElement.getStyle && headerElement.getStyle()) ||
                  (headerElement.get && headerElement.get("style")) ||
                  {};
                if (compStyle && (compStyle.height || compStyle.minHeight))
                  measuredHeight = compStyle.height || compStyle.minHeight;
              }

              try {
                headerElement.components().reset();
              } catch (err) {}

              if (domEl) {
                domEl.innerHTML = "";
                domEl.style.height = measuredHeight;
                domEl.style.minHeight = measuredHeight;
                domEl.style.opacity = "0";
                domEl.style.visibility = "hidden";
                domEl.style.pointerEvents = "none";
                domEl.setAttribute &&
                  domEl.setAttribute("data-header-hidden", "true");
              } else {
                try {
                  headerElement.addStyle &&
                    headerElement.addStyle({
                      height: measuredHeight,
                      minHeight: measuredHeight,
                      opacity: "0",
                      visibility: "hidden",
                      pointerEvents: "none",
                    });
                } catch (err) {}
              }

              setTimeout(() => {
                const list = headerWrapper.find(".page-header-element")[0];
                if (!list) {
                } else {
                  const domListEl =
                    list.el ||
                    (list.view && list.view.el) ||
                    (list.getEl && list.getEl()) ||
                    list;
                  try {
                    const childCount =
                      domListEl && domListEl.childNodes
                        ? domListEl.childNodes.length
                        : 0;

                    if (childCount > 0) {
                      while (
                        domListEl.childNodes &&
                        domListEl.childNodes.length
                      ) {
                        domListEl.removeChild(domListEl.firstChild);
                      }
                    } else {
                    }
                  } catch (err) {}

                  if (typeof list.components === "function") {
                    try {
                      const compColl = list.components();
                      const compCount =
                        (typeof compColl.length === "number" &&
                          compColl.length) ||
                        (compColl.models && compColl.models.length) ||
                        0;
                      if (typeof compColl.reset === "function") {
                        compColl.reset();
                      }
                    } catch (err) {}
                  }
                }
              }, 500);
            } catch (err) {}
          }
        }
      }

      const footerWrapper = pageComponent.find(".footer-wrapper")[0];
      if (footerWrapper) {
        try {
          footerWrapper.addStyle({ display: "" });
        } catch (e) {
          const fwEl = footerWrapper.getEl && footerWrapper.getEl();
          if (fwEl) fwEl.style.display = "";
        }

        const footerElement = footerWrapper.find(".page-footer-element")[0];
        if (footerElement) {
          if (shouldShowFooterContent) {
            try {
              footerElement.components().reset();
            } catch (err) {}

            if (
              this._originalFooterComponents &&
              this._originalFooterComponents.length > 0
            ) {
              this._originalFooterComponents.forEach((compData) => {
                try {
                  const appended = footerElement.append(compData.html);
                  const newComp = Array.isArray(appended)
                    ? appended[0]
                    : appended;
                  if (newComp && newComp.setStyle) {
                    newComp.setStyle(compData.styles || {});
                    newComp.addAttributes &&
                      newComp.addAttributes(compData.attributes || {});
                  }
                } catch (err) {}
              });
            }

            try {
              footerElement.addStyle &&
                footerElement.addStyle({
                  opacity: "1",
                  visibility: "visible",
                  display: "flex",
                });
            } catch (err) {}
          } else {
            try {
              footerElement.components().reset();
              footerElement.addStyle &&
                footerElement.addStyle({
                  opacity: "0",
                  visibility: "hidden",
                });
            } catch (err) {}
          }
        }
      }
      try {
        const existingPageNumbers =
          pageComponent.find(".page-number-element") || [];
        if (existingPageNumbers.forEach)
          existingPageNumbers.forEach((pn) => pn.remove && pn.remove());
      } catch (err) {}

      if (this.pageSettings.pageNumber?.enabled) {
        const settings = this.pageSettings.pageNumber;
        const format = settings.format || "Page {n}";
        const position = settings.position || "bottom-center";
        const rotation = settings.rotation || 0;
        const startFrom = settings.startFrom || 1;
        const shouldShowNumber = this.shouldShowPageNumberForPage
          ? this.shouldShowPageNumberForPage(pageIndex, startFrom)
          : {
              show: true,
              displayNumber: pageNumber,
              totalPages: this.pageSettings.numberOfPages,
            };

        if (shouldShowNumber && shouldShowNumber.show) {
          const displayNumber = format
            .replace("{n}", shouldShowNumber.displayNumber)
            .replace("{total}", shouldShowNumber.totalPages.toString());

          const positionStyles = this.getPageNumberPositionStylesWithRotation
            ? this.getPageNumberPositionStylesWithRotation(position, rotation)
            : "";

          const pageNumberHTML = `
          <div class="page-number-element" style="
            position: absolute;
            font-family: ${settings.fontFamily || "Arial"};
            font-size: ${settings.fontSize || 8}px;
            color: ${settings.color || "#333333"};
            background-color: ${settings.backgroundColor || "transparent"};
            border: ${settings.showBorder ? "1px solid " + (settings.color || "#333333") : "none"};
            padding: ${settings.showBorder ? "2px 6px" : "2px"};
            border-radius: 3px;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            ${positionStyles}
          ">${displayNumber}</div>
        `;

          const pageContent = pageComponent.find(".page-content")[0];
          if (pageContent) {
            try {
              pageContent.append(pageNumberHTML);
            } catch (err) {
              const pcDom =
                (pageContent.view && pageContent.view.el) ||
                (pageContent.getEl && pageContent.getEl && pageContent.getEl());
              if (pcDom && pcDom.insertAdjacentHTML) {
                pcDom.insertAdjacentHTML("beforeend", pageNumberHTML);
              }
            }
          }
        } else {
        }
      }
    }, 1000);

    if (sectionsContainer) {
      setTimeout(() => {
        try {
          if (sectionHeader && preservedHeaderHeight) {
            sectionHeader.addStyle({
              height: preservedHeaderHeight,
              "min-height": preservedHeaderHeight,
            });
          }

          if (sectionContent && preservedContentHeight) {
            sectionContent.addStyle({
              height: preservedContentHeight,
              "min-height": preservedContentHeight,
              flex: "1",
            });
          }

          if (sectionFooter && preservedFooterHeight) {
            sectionFooter.addStyle({
              height: preservedFooterHeight,
              "min-height": preservedFooterHeight,
            });
          }
        } catch (err) {}
      }, 100);
    }
    this.addWatermarkToPage &&
      this.addWatermarkToPage(pageContentComponent, pageIndex);
  }

  calculateTiledGrid(watermark) {
    const mmToPx = 3.78;
    const pageWidthPx = this.pageSettings.width * mmToPx;
    const pageHeightPx = this.pageSettings.height * mmToPx;

    let tileWidth, tileHeight;

    if (watermark.type === "text" || watermark.type === "both") {
      const fontSize = watermark.text.fontSize || 48;
      const textContent = watermark.text.content || "CONFIDENTIAL";
      const rotation = Math.abs(watermark.text.rotation || 0);

      const estimatedTextWidth = fontSize * 0.6 * textContent.length;
      const estimatedTextHeight = fontSize * 1.2;

      if (rotation !== 0) {
        const radians = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        tileWidth = estimatedTextWidth * cos + estimatedTextHeight * sin;
        tileHeight = estimatedTextWidth * sin + estimatedTextHeight * cos;
      } else {
        tileWidth = estimatedTextWidth;
        tileHeight = estimatedTextHeight;
      }
    }

    if (watermark.type === "image" || watermark.type === "both") {
      const imageWidth = watermark.image.width || 200;
      const imageHeight = watermark.image.height || 200;

      if (watermark.type === "both") {
        tileWidth = Math.max(tileWidth || 0, imageWidth);
        tileHeight = Math.max(tileHeight || 0, imageHeight);
      } else {
        tileWidth = imageWidth;
        tileHeight = imageHeight;
      }
    }

    const paddingX = tileWidth * 0.2;
    const paddingY = tileHeight * 0.2;
    const effectiveTileWidth = tileWidth + paddingX;
    const effectiveTileHeight = tileHeight + paddingY;
    const cols = Math.max(1, Math.floor(pageWidthPx / effectiveTileWidth));
    const rows = Math.max(1, Math.floor(pageHeightPx / effectiveTileHeight));

    return {
      cols,
      rows,
      totalTiles: cols * rows,
      tileWidth,
      tileHeight,
      effectiveTileWidth,
      effectiveTileHeight,
    };
  }

  removeWatermarksFromPage(pageContentComponent) {
    if (!pageContentComponent || typeof pageContentComponent.find !== "function") {
      return;
    }

    const existingWatermarks = pageContentComponent.find(".page-watermark");
    existingWatermarks.forEach((wm) => wm.remove && wm.remove());
  }

  addWatermarkToPage(pageContentComponent, pageIndex) {
    this.removeWatermarksFromPage(pageContentComponent);

    if (!this.pageSettings.watermark?.enabled) {
      return;
    }

    const watermark = this.pageSettings.watermark;

    let watermarkContent = "";
    let positionStyles = "";

    const getAbsolutePosition = (position) => {
      switch (position) {
        case "top-left":
          return "top: 20px; left: 20px;";
        case "top-center":
          return "top: 20px; left: 50%; transform: translateX(-50%);";
        case "top-right":
          return "top: 20px; right: 20px;";
        case "center-left":
          return "top: 50%; left: 20px; transform: translateY(-50%);";
        case "center":
          return "top: 50%; left: 50%; transform: translate(-50%, -50%);";
        case "center-right":
          return "top: 50%; right: 20px; transform: translateY(-50%);";
        case "bottom-left":
          return "bottom: 20px; left: 20px;";
        case "bottom-center":
          return "bottom: 20px; left: 50%; transform: translateX(-50%);";
        case "bottom-right":
          return "bottom: 20px; right: 20px;";
        default:
          return "top: 50%; left: 50%; transform: translate(-50%, -50%);";
      }
    };

    if (watermark.tiled) {
      const gridInfo = this.calculateTiledGrid(watermark);
      let tileContent = "";
      if (watermark.type === "text" || watermark.type === "both") {
        tileContent += `
        <div class="page-watermark-text-tile" style="
          font-family: ${watermark.text.font || "Arial"}, sans-serif !important;
          font-size: ${watermark.text.fontSize}px !important;
          color: ${watermark.text.color} !important;
          opacity: ${watermark.text.opacity} !important;
          transform: rotate(${watermark.text.rotation}deg) !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          user-select: none !important;
          pointer-events: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        ">${watermark.text.content}</div>
      `;
      }

      if (
        (watermark.type === "image" || watermark.type === "both") &&
        watermark.image.url
      ) {
        tileContent += `
        <img class="page-watermark-image-tile" src="${watermark.image.url}" style="
          width: ${watermark.image.width}px !important;
          height: ${watermark.image.height}px !important;
          opacity: ${watermark.image.opacity || 0.4} !important;
          transform: rotate(${watermark.image.rotation || 0}deg) !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
          display: block !important;
          margin: 0 auto !important;
        "/>
      `;
      }

      let tiledContent = "";
      for (let i = 0; i < gridInfo.totalTiles; i++) {
        tiledContent += `
        <div class="watermark-tile" style="
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        ">${tileContent}</div>
      `;
      }

      watermarkContent = tiledContent;
      positionStyles = `
      display: grid !important;
      grid-template-columns: repeat(${gridInfo.cols}, 1fr) !important;
      grid-template-rows: repeat(${gridInfo.rows}, 1fr) !important;
      gap: 10px !important;
      width: 100% !important;
      height: 100% !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    `;

      if (watermarkContent) {
        const watermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark tiled" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
          ${positionStyles}
        ">${watermarkContent}</div>
      `)[0];

        watermarkGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        });
      }
    } else {
      if (watermark.type === "text" || watermark.type === "both") {
        const textPosition =
          watermark.textPosition || watermark.position || "center";

        const absTextPos = getAbsolutePosition(textPosition);

        const textWatermarkContent = `
        <div class="page-watermark-text" style="
          font-family: ${watermark.text.font || "Arial"}, sans-serif !important;
          font-size: ${watermark.text.fontSize}px !important;
          color: ${watermark.text.color} !important;
          opacity: ${watermark.text.opacity} !important;
          transform: rotate(${watermark.text.rotation}deg) !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          user-select: none !important;
          pointer-events: none !important;
        ">${watermark.text.content}</div>
      `;

        const textWatermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark page-watermark-text-container single" style="
          position: absolute !important;
          ${absTextPos}
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
        ">${textWatermarkContent}</div>
      `)[0];

        textWatermarkGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        });
      }

      if (
        (watermark.type === "image" || watermark.type === "both") &&
        watermark.image.url
      ) {
        const imagePosition =
          watermark.imagePosition || watermark.position || "center";
        const absImgPos = getAbsolutePosition(imagePosition);
        const imageWatermarkContent = `
        <img class="page-watermark-image" src="${watermark.image.url}" style="
          width: ${watermark.image.width}px !important;
          height: ${watermark.image.height}px !important;
          opacity: ${watermark.image.opacity || 0.4} !important;
          transform: rotate(${watermark.image.rotation || 0}deg) !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
        " onerror="console.error('Failed to load watermark image:', this.src); this.style.display='none';" />
      `;

        const imageWatermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark page-watermark-image-container single" style="
          position: absolute !important;
          ${absImgPos}
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
        ">${imageWatermarkContent}</div>
      `)[0];

        imageWatermarkGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        });
      }
    }
  }

  getPageNumberPositionStyles(position) {
    const positions = {
      "top-left": "top: 10px; left: 10px;",
      "top-center": "top: 10px; left: 50%; transform: translateX(-50%);",
      "top-right": "top: 10px; right: 10px;",
      "center-left": "top: 50%; left: 10px; transform: translateY(-50%);",
      "center-center": "top: 50%; left: 50%; transform: translate(-50%, -50%);",
      "center-right": "top: 50%; right: 10px; transform: translateY(-50%);",
      "bottom-left": "bottom: 10px; left: 10px;",
      "bottom-center": "bottom: 10px; left: 50%; transform: translateX(-50%);",
      "bottom-right": "bottom: 10px; right: 10px;",
    };

    return positions[position] || positions["bottom-center"];
  }

  getPageNumberPositionStylesWithRotation(position, rotation) {
    let styles = "";

    if (position.includes("top")) {
      styles += "top: 10px; ";
    } else if (position.includes("bottom")) {
      styles += "bottom: 10px; ";
    } else {
      styles += "top: 50%; ";
    }

    if (position.includes("left")) {
      styles += "left: 10px; ";
    } else if (position.includes("right")) {
      styles += "right: 10px; ";
    } else {
      styles += "left: 50%; ";
    }

    let transformValue = "";

    if (position.includes("center")) {
      const needsHorizontalCenter =
        !position.includes("left") && !position.includes("right");
      const needsVerticalCenter =
        !position.includes("top") && !position.includes("bottom");

      if (needsHorizontalCenter && needsVerticalCenter) {
        transformValue = `translate(-50%, -50%) rotate(${rotation}deg)`;
      } else if (needsHorizontalCenter) {
        transformValue = `translateX(-50%) rotate(${rotation}deg)`;
      } else if (needsVerticalCenter) {
        transformValue = `translateY(-50%) rotate(${rotation}deg)`;
      } else {
        transformValue = `rotate(${rotation}deg)`;
      }
    } else {
      transformValue = `rotate(${rotation}deg)`;
    }

    styles += `transform: ${transformValue}; transform-origin: center center;`;

    return styles;
  }

  shouldShowPageNumberForPage(pageIndex, startFrom) {
    const pageSettings = this.pageSettings.pages[pageIndex];

    if (pageSettings?.skipPageNumber === true) {
      return { show: false, displayNumber: 0, totalPages: 0 };
    }

    let displayNumber = 0;
    let totalPages = 0;

    for (let i = startFrom - 1; i < this.pageSettings.pages.length; i++) {
      const ps = this.pageSettings.pages[i];
      if (ps?.skipPageNumber !== true) {
        totalPages++;
        if (i < pageIndex) {
          displayNumber++;
        } else if (i === pageIndex) {
          displayNumber++;
        }
      }
    }

    if (pageIndex < startFrom - 1) {
      return { show: false, displayNumber: 0, totalPages };
    }

    return {
      show: true,
      displayNumber,
      totalPages,
    };
  }

  refreshPageNumberForPage(pageComponent, pageIndex) {
    if (!pageComponent || typeof pageComponent.find !== "function") {
      return;
    }

    try {
      const existingPageNumbers = pageComponent.find(".page-number-element") || [];
      if (existingPageNumbers.forEach) {
        existingPageNumbers.forEach((pn) => pn.remove && pn.remove());
      }
    } catch (err) {}

    if (!this.pageSettings.pageNumber?.enabled) {
      return;
    }

    const settings = this.pageSettings.pageNumber;
    const format = settings.format || "Page {n}";
    const position = settings.position || "bottom-center";
    const rotation = settings.rotation || 0;
    const startFrom = settings.startFrom || 1;
    const pageNumber = pageIndex + 1;
    const shouldShowNumber = this.shouldShowPageNumberForPage
      ? this.shouldShowPageNumberForPage(pageIndex, startFrom)
      : {
          show: true,
          displayNumber: pageNumber,
          totalPages: this.pageSettings.numberOfPages,
        };

    if (!shouldShowNumber || !shouldShowNumber.show) {
      return;
    }

    const displayNumber = format
      .replace("{n}", shouldShowNumber.displayNumber)
      .replace("{total}", shouldShowNumber.totalPages.toString());

    const positionStyles = this.getPageNumberPositionStylesWithRotation
      ? this.getPageNumberPositionStylesWithRotation(position, rotation)
      : "";

    const pageNumberHTML = `
        <div class="page-number-element" style="
            position: absolute;
            font-family: ${settings.fontFamily || "Arial"};
            font-size: ${settings.fontSize || 8}px;
            color: ${settings.color || "#333333"};
            background-color: ${settings.backgroundColor || "transparent"};
            border: ${settings.showBorder ? "1px solid " + (settings.color || "#333333") : "none"};
            padding: ${settings.showBorder ? "2px 6px" : "2px"};
            border-radius: 3px;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            ${positionStyles}
        ">${displayNumber}</div>
    `;

    const pageContent = pageComponent.find(".page-content")[0];
    if (pageContent) {
      try {
        pageContent.append(pageNumberHTML);
      } catch (err) {
        const pcDom =
          (pageContent.view && pageContent.view.el) ||
          (pageContent.getEl && pageContent.getEl && pageContent.getEl());
        if (pcDom && pcDom.insertAdjacentHTML) {
          pcDom.insertAdjacentHTML("beforeend", pageNumberHTML);
        }
      }
    }
  }

  removeAllPageNumbers() {
    const pages = this.editor.getWrapper().find(".page-container");
    pages.forEach((pageComponent) => {
      const pageNumbers = pageComponent.find(".page-number-element");
      pageNumbers.forEach((element) => element.remove());
    });
  }

  showPageDeleteModal() {
    if (this.pageSettings.numberOfPages <= 1) {
      alert("Cannot delete the last page");
      return;
    }

    let pageListHTML = "";
    this.pageSettings.pages.forEach((page, index) => {
      const isExcluded = this.pageSettings.pageNumbering.excludedPages.includes(
        index + 1,
      );
      const pageNumberInfo = this.shouldShowPageNumber(index)
        ? `Page # ${this.getActualPageNumber(index)}`
        : "Excluded from numbering";

      pageListHTML += `
        <div class="page-delete-item" data-page-index="${index}">
          <div class="page-delete-info">
            <div class="page-delete-icon">
              <i class="fa fa-file-text-o"></i>
            </div>
            <div class="page-delete-details">
              <div class="page-delete-name">${page.name}</div>
              <div class="page-delete-meta">
                ${page.header.enabled ? '<span class="feature-tag">Header</span>' : ""}
                ${page.footer.enabled ? '<span class="feature-tag">Footer</span>' : ""}
                ${page.pageNumber.enabled ? '<span class="feature-tag">Page #</span>' : ""}
                ${this.pageSettings.watermark.enabled ? '<span class="feature-tag">Watermark</span>' : ""}
                <span class="feature-tag ${isExcluded ? "excluded" : "numbered"}">${pageNumberInfo}</span>
              </div>
            </div>
          </div>
          <button class="page-delete-btn-item" data-page-index="${index}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
    });

    this.editor.Modal.setTitle("🗑️ Delete Pages");
    this.editor.Modal.setContent(`
      <div class="page-delete-modal-content" style="color: #000 !important;">
        <div class="delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <p>Select a page to delete. Page numbering will be automatically adjusted.</p>
        </div>
        <div class="page-delete-list">
          ${pageListHTML}
        </div>
        <div class="page-setup-actions" style="margin-top: 20px;">
          <button id="cancelPageDelete" class="page-setup-btn page-setup-btn-secondary">
            <i class="fa fa-times"></i> Cancel
          </button>
        </div>
      </div>
      <style>
        .delete-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .delete-warning i {
          color: #856404;
          font-size: 18px;
        }
        .delete-warning p {
          margin: 0;
          color: #856404 !important;
          font-weight: 500;
        }
        .page-delete-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }
        .page-delete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 10px;
          background: white;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .page-delete-item:hover {
          border-color: #dc3545;
          box-shadow: 0 4px 8px rgba(220,53,69,0.15);
        }
        .page-delete-item:last-child {
          margin-bottom: 0;
        }
        .page-delete-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
        }
        .page-delete-icon {
          width: 40px;
          height: 40px;
          background: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }
        .page-delete-details {
          flex: 1;
        }
        .page-delete-name {
          font-weight: 600;
          color: #333 !important;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .page-delete-meta {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .feature-tag {
          background: #e3f2fd;
          color: #1976d2 !important;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }
        .feature-tag.excluded {
          background: #ffcdd2;
          color: #d32f2f !important;
          border-color: #ef9a9a;
        }
        .feature-tag.numbered {
          background: #c8e6c9;
          color: #388e3c !important;
          border-color: #a5d6a7;
        }
        .page-delete-btn-item {
          background: #f8d7da;
          color: #721c24;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .page-delete-btn-item:hover {
          background: #f5c6cb;
        }
      </style>
    `);

    this.editor.Modal.open();

    setTimeout(() => {
      this.setupPageDeleteListeners();
    }, 100);
  }

  shouldShowPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1;
    return (
      !this.pageSettings.pageNumbering.excludedPages.includes(pageNumber) &&
      this.pageSettings.pageNumbering.enabled
    );
  }

  setupPageDeleteListeners() {
    // Prevent attaching duplicate document click handlers each time the modal opens.
    if (this._pageDeleteClickHandler) return;

    this._pageDeleteClickHandler = (e) => {
      const deleteBtn = e.target.closest(".page-delete-btn-item");
      if (deleteBtn) {
        const pageIndex = Number.parseInt(deleteBtn.dataset.pageIndex, 10);
        if (!isNaN(pageIndex)) {
          this.deletePage(pageIndex);
        }
        return;
      }

      const cancelBtn = e.target.closest("#cancelPageDelete");
      if (cancelBtn) {
        this.editor.Modal.close();
      }
    };

    document.addEventListener("click", this._pageDeleteClickHandler);
  }

  deletePage(pageIndex) {
    if (this.pageSettings.numberOfPages <= 1) {
      alert("Cannot delete the last page");
      return;
    }

    // Guard against stale/out-of-range indexes (can happen with async DOM rebuild).
    if (
      !Number.isInteger(pageIndex) ||
      pageIndex < 0 ||
      pageIndex >= this.pageSettings.pages.length
    ) {
      return;
    }

    this.pageSettings.pages.splice(pageIndex, 1);
    this.pageSettings.numberOfPages--;
    const deletedPageNumber = pageIndex + 1;
    if (
      this.pageSettings.pageNumbering.excludedPages.includes(deletedPageNumber)
    ) {
      this.pageSettings.pageNumbering.excludedPages =
        this.pageSettings.pageNumbering.excludedPages.filter(
          (p) => p !== deletedPageNumber,
        );
    } else {
      this.pageSettings.pageNumbering.excludedPages =
        this.pageSettings.pageNumbering.excludedPages.map((p) =>
          p > deletedPageNumber ? p - 1 : p,
        );
    }

    this.pageSettings.pageNumbering.startFromPage = Math.min(
      this.pageSettings.pageNumbering.startFromPage,
      this.pageSettings.numberOfPages,
    );

    // Non-destructive delete path:
    // remove only selected page component from current DOM and avoid full setupEditorPages rebuild.
    // This preserves existing header/footer structures (including semantic tagName like <header>)
    // and prevents style loss on untouched pages.
    const pageComponents = this.editor.getWrapper().find(".page-container");
    const targetPage = pageComponents[pageIndex];
    if (targetPage && typeof targetPage.remove === "function") {
      targetPage.remove();
    }

    // Keep page metadata consistent after deletion.
    this.pageSettings.pages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
      if (!p.name || /^Page\s+\d+$/i.test(String(p.name).trim())) {
        p.name = `Page ${idx + 1}`;
      }
    });

    // Reindex live page containers and refresh visuals/layout without rebuilding all pages.
    this.updateAllPageIndicesAndLabels();
    this.updateAllPageVisuals();
    if (typeof this.applyConditionalHeaderFooterContent === "function") {
      this.applyConditionalHeaderFooterContent();
    }
    if (typeof this.triggerPaginationCheck === "function") {
      this.triggerPaginationCheck();
    }

    // Refresh preserved snapshot to match current live pages.
    this.preserveAllContent();

    this.editor.Modal.close();

    setTimeout(() => {
      if (this.editor.Modal.isOpen && this.editor.Modal.isOpen()) {
        this.showPageDeleteModal();
      }
    }, 500);
  }

  updateAllPageIndicesAndLabels() {
    const allPages = this.editor.getWrapper().find(".page-container");
    allPages.forEach((pageComponent, newIndex) => {
      pageComponent.addAttributes({ "data-page-index": newIndex });
      // Only update page index; do not change header/footer content so other pages' content stays the same on delete
    });
  }

  addNewPage() {
    if (!this.isInitialized) {
      return null;
    }
    try {
      const originalPaginationState = this.paginationInProgress;
      this.paginationInProgress = true;
      const newPageIndex = this.pageSettings.numberOfPages;
      const newPageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const lastPageSettings =
        this.pageSettings.pages[newPageIndex - 1] || null;
      this.pageSettings.numberOfPages++;

      const newPageSettings = {
        id: newPageId,
        name: `Page ${newPageIndex + 1}`,
        pageNumber: newPageIndex + 1,
        backgroundColor: this.pageSettings.backgroundColor || "#ffffff",
        margins: { ...this.pageSettings.margins },
        header: {
          enabled: this.pageSettings.headerFooter?.headerEnabled !== false,
          height: this.pageSettings.headerFooter?.headerHeight || 12.7,
          text: this.pageSettings.headerFooter?.headerText || "",
          content: lastPageSettings?.header?.content || "",
          shouldShowContent: true,
          padding: 10,
          fontSize: 12,
          color: "#333333",
          backgroundColor: this.pageSettings.backgroundColor || "#ffffff",
          position: "center",
        },
        footer: {
          enabled: this.pageSettings.headerFooter?.footerEnabled !== false,
          height: this.pageSettings.headerFooter?.footerHeight || 12.7,
          text: this.pageSettings.headerFooter?.footerText || "",
          content: lastPageSettings?.footer?.content || "",
          shouldShowContent: true,
          padding: 10,
          fontSize: 12,
          color: "#333333",
          backgroundColor: this.pageSettings.backgroundColor || "#ffffff",
          position: "center",
        },
        pageNumber: this.pageSettings.pageNumber
          ? {
              enabled: this.pageSettings.pageNumber.enabled || false,
              format: this.pageSettings.pageNumber.format || "Page {n}",
              position: this.pageSettings.pageNumber.position || "bottom-right",
              fontSize: this.pageSettings.pageNumber.fontSize || 11,
              color: this.pageSettings.pageNumber.color || "#333333",
              backgroundColor:
                this.pageSettings.pageNumber.backgroundColor || "#ffffff",
              showBorder: this.pageSettings.pageNumber.showBorder !== false,
              rotation: this.pageSettings.pageNumber.rotation || 0,
            }
          : {
              enabled: false,
              format: "Page {n}",
              position: "bottom-right",
              fontSize: 11,
              color: "#333333",
              backgroundColor: "#ffffff",
              showBorder: true,
              rotation: 0,
            },
        isSubreportPage: false,
        skipPageNumber: false,
      };

      this.pageSettings.pages.push(newPageSettings);
      const mmToPx = 96 / 25.4;
      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
      const marginBottomPx = Math.round(
        this.pageSettings.margins.bottom * mmToPx,
      );
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
      const marginRightPx = Math.round(
        this.pageSettings.margins.right * mmToPx,
      );
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;
      const defaultHeaderHeight = Math.round(
        newPageSettings.header.height * mmToPx,
      );
      const defaultFooterHeight = Math.round(
        newPageSettings.footer.height * mmToPx,
      );
      const mainContentAreaHeight =
        contentHeight - defaultHeaderHeight - defaultFooterHeight;
      const pageNumber = newPageIndex + 1;
      const headerApplyMode =
        this.pageSettings.headerFooter?.headerApplyMode ||
        this._lastHeaderApplyMode ||
        "all";
      const footerApplyMode =
        this.pageSettings.headerFooter?.footerApplyMode ||
        this._lastFooterApplyMode ||
        "all";

      let headerDisplay = "";
      let footerDisplay = "";

      if (headerApplyMode === "all") {
        headerDisplay = "";
      } else if (headerApplyMode === "first") {
        headerDisplay = "display: none;";
      } else if (headerApplyMode === "last") {
        headerDisplay =
          pageNumber === this.pageSettings.numberOfPages
            ? ""
            : "display: none;";
      } else if (headerApplyMode === "even") {
        headerDisplay = pageNumber % 2 === 0 ? "" : "display: none;";
      } else if (headerApplyMode === "odd") {
        headerDisplay = pageNumber % 2 !== 0 ? "" : "display: none;";
      } else if (headerApplyMode === "custom") {
        const headerCustomPages =
          this.pageSettings.headerFooter?.headerCustomPages || [];
        headerDisplay = headerCustomPages.includes(pageNumber)
          ? ""
          : "display: none;";
      }

      if (footerApplyMode === "all") {
        footerDisplay = "";
      } else if (footerApplyMode === "first") {
        footerDisplay = "display: none;";
      } else if (footerApplyMode === "last") {
        footerDisplay =
          pageNumber === this.pageSettings.numberOfPages
            ? ""
            : "display: none;";
      } else if (footerApplyMode === "even") {
        footerDisplay = pageNumber % 2 === 0 ? "" : "display: none;";
      } else if (footerApplyMode === "odd") {
        footerDisplay = pageNumber % 2 !== 0 ? "" : "display: none;";
      } else if (footerApplyMode === "custom") {
        const footerCustomPages =
          this.pageSettings.headerFooter?.footerCustomPages || [];
        footerDisplay = footerCustomPages.includes(pageNumber)
          ? ""
          : "display: none;";
      }

      const pageHTML = `
      <div class="page-container" data-page-id="${newPageId}" data-page-index="${newPageIndex}">
        <div class="page-content" style="
          height: ${contentHeight}px;
          margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
          position: relative;
          overflow: hidden;
          background-color: ${newPageSettings.backgroundColor};
          display: flex;
          flex-direction: column;
        ">
          <div class="header-wrapper" data-shared-region="header" style="
            width: 100%;
            height: ${defaultHeaderHeight}px;
            flex-shrink: 0;
            ${headerDisplay}
          ">
            <div class="page-header-element" style="
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
            "></div>
          </div>
          <div class="content-wrapper" style="
            flex: 1;
            display: flex;
            flex-direction: column;
            height: ${mainContentAreaHeight}px;
          ">
            <div class="main-content-area" style="
              width: 100%;
              height: 100%;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
              overflow: hidden;
              position: relative;
            "></div>
          </div>
          <div class="footer-wrapper" data-shared-region="footer" style="
            width: 100%;
            height: ${defaultFooterHeight}px;
            flex-shrink: 0;
            ${footerDisplay}
          ">
            <div class="page-footer-element" style="
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
            "></div>
          </div>
        </div>
      </div>`;

      const pageComponent = this.editor.getWrapper().append(pageHTML)[0];
      pageComponent.addStyle({
        width: `${totalPageWidth}px`,
        height: `${totalPageHeight}px`,
        background: newPageSettings.backgroundColor,
        margin: "20px auto",
        "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "2px solid transparent",
        position: "relative",
        "page-break-after": "always",
        overflow: "hidden",
        "box-sizing": "border-box",
        transition: "border-color 0.2s ease",
      });

      const headerElement = pageComponent.find(".page-header-element")[0];
      if (headerElement) {
        headerElement.set({
          droppable: true,
          editable: true,
          selectable: true,
          draggable: false,
          copyable: false,
          removable: false,
          "custom-name": "Header",
        });
      }

      const mainContentArea = pageComponent.find(".main-content-area")[0];
      if (mainContentArea) {
        mainContentArea.set({
          droppable: true,
          editable: true,
          selectable: true,
          "custom-name": "Content Area",
        });
      }

      const footerElement = pageComponent.find(".page-footer-element")[0];
      if (footerElement) {
        footerElement.set({
          droppable: true,
          editable: true,
          selectable: true,
          draggable: false,
          copyable: false,
          removable: false,
          "custom-name": "Footer",
        });
      }

      try {
        const existingPages = this.editor.getWrapper().find(".page-container");
        for (let i = existingPages.length - 2; i >= 0; i--) {
          const existingPage = existingPages[i];
          const existingHeader = existingPage.find(
            '[data-shared-region="header"] .page-header-element',
          )[0];

          if (existingHeader && existingHeader.components().length > 0) {
            const newHeader = pageComponent.find(".page-header-element")[0];
            if (newHeader) {
              existingHeader.components().forEach((comp) => {
                newHeader.append(comp.clone());
              });
            }
            break;
          }
        }

        for (let i = existingPages.length - 2; i >= 0; i--) {
          const existingPage = existingPages[i];
          const existingFooter = existingPage.find(
            '[data-shared-region="footer"] .page-footer-element',
          )[0];

          if (existingFooter && existingFooter.components().length > 0) {
            const newFooter = pageComponent.find(".page-footer-element")[0];
            if (newFooter) {
              existingFooter.components().forEach((comp) => {
                newFooter.append(comp.clone());
              });
            }
            break;
          }
        }
      } catch (e) {}

      const pageContentComponent = pageComponent.find(".page-content")[0];
      if (pageContentComponent) {
        this.addWatermarkToPage(pageContentComponent, newPageIndex);
      }

      if (this.pageSettings.pageNumber?.enabled) {
        setTimeout(() => {
          this.renderPageNumberForPage(pageComponent, newPageIndex);
        }, 100);
      }

      setTimeout(() => {
        this.paginationInProgress = originalPaginationState;
        this.setupPageObserver(newPageIndex);
      }, 500);

      if (this.pageSettings.conditionalPageBreak?.enabled) {
        setTimeout(() => {
          this.insertConditionalPageBreakToPage(pageComponent, newPageIndex);
        }, 500);
      }

      return pageComponent;
    } catch (error) {
      console.error("❌ Error creating new page:");
      this.paginationInProgress = false;
      return null;
    }
  }

  renderPageNumberForPage(pageComponent, pageIndex) {
    this.refreshPageNumberForPage(pageComponent, pageIndex);
  }

  destroy() {
    this.clearAllObservers();

    if (this.contentCheckInterval) {
      clearInterval(this.contentCheckInterval);
    }

    if (this.inputDebounceTimer) {
      clearTimeout(this.inputDebounceTimer);
    }

    this.paginationInProgress = false;
  }

  getUsableHeight(contentArea) {
    const el = contentArea.view.el;
    const pageContainer = el.closest(".sections-container");
    const totalHeight = pageContainer ? pageContainer.clientHeight : 1123;
    const header = pageContainer.querySelector(".section-header");
    const footer = pageContainer.querySelector(".section-footer");
    const headerH = header ? header.clientHeight : 0;
    const footerH = footer ? footer.clientHeight : 0;
    const topMargin = parseInt(pageContainer.dataset.marginTop || 0, 10);
    const bottomMargin = parseInt(pageContainer.dataset.marginBottom || 0, 10);
    return totalHeight - (headerH + footerH + topMargin + bottomMargin);
  }

  createPagesFromEditor(editor) {
    const wrapper = editor.getWrapper();

    const pageBlocks = wrapper.find('[data-gjs-type="Sections"]');
    if (!pageBlocks.length) {
      alert("⚠️ No Sections block found.");
      return;
    }

    const firstPage = pageBlocks[0];
    const contentArea = firstPage.find(".section-content")[0];

    if (!contentArea) {
      alert("⚠️ No content area found.");
      return;
    }

    let rawContent = "";
    contentArea.components().forEach((cmp) => {
      if (cmp.get("type") === "text" || cmp.get("tagName") === "textarea") {
        rawContent += cmp.get("content") || cmp.view.el.innerText || "";
      }
    });

    if (!rawContent.trim()) {
      alert("⚠️ Content area is empty.");
      return;
    }

    let data;
    try {
      data = JSON.parse(rawContent);
    } catch (e) {
      data = rawContent.split(/\n+/).map((line) => ({ text: line }));
    }

    contentArea.components().reset();
    let usableHeight = getUsableHeight(contentArea);
    let currentPage = firstPage;
    let currentContentArea = contentArea;
    let currentHeight = 0;

    data.forEach((item) => {
      const block = document.createElement("div");
      block.className = "content-block";
      block.innerText = item.first_name
        ? `${item.id}. ${item.first_name} ${item.last_name} - ${item.email}`
        : item.text;

      currentContentArea.view.el.appendChild(block);
      const blockHeight = block.offsetHeight || 20;

      if (currentHeight + blockHeight > usableHeight) {
        currentPage = editor.addComponents({
          type: "Sections",
          content: "",
        })[0];

        currentContentArea = currentPage.find(".section-content")[0];
        currentContentArea.view.el.appendChild(block);
        usableHeight = getUsableHeight(currentContentArea);
        currentHeight = blockHeight;
      } else {
        currentHeight += blockHeight;
      }
    });

    alert("✅ Pages created successfully!");
  }

  //////////////////////////////////section header workiing code from here///////////////////////////////////////

  _originalHeaderContent = "";
  _originalFooterContent = "";

  registerDynamicHeaderFooter() {
    this.editor.Components.addType("Sections", {
      model: {
        defaults: {
          tagName: "div",
          name: "Sections",
          attributes: {
            class: "sections-container",
          },
          selectable: true,
          highlightable: true,
          stylable: true,

          traits: [
            {
              type: "select",
              label: "Apply To Header",
              name: "headerApplyMode",
              options: [
                { id: "all", label: "All" },
                { id: "even", label: "Even" },
                { id: "odd", label: "Odd" },
                { id: "allhide", label: "Hide" },
                { id: "custom", label: "Custom" },
              ],
              default: "all",
              changeProp: 1,
            },
            {
              type: "text",
              label: "Header Custom Range",
              name: "headerCustomRange",
              placeholder: "e.g. 2,4-6",
              changeProp: 1,
              visible: false,
            },
            {
              type: "select",
              label: "Apply To Footer",
              name: "footerApplyMode",
              options: [
                { id: "all", label: "All" },
                { id: "even", label: "Even" },
                { id: "odd", label: "Odd" },
                { id: "allhide", label: "Hide" },
                { id: "custom", label: "Custom" },
              ],
              default: "all",
              changeProp: 1,
            },
            {
              type: "text",
              label: "Footer Custom Range",
              name: "footerCustomRange",
              placeholder: "e.g. 1,3-5",
              changeProp: 1,
              visible: false,
            },
          ],

          components: [
            {
              tagName: "div",
              name: "Header",
              attributes: {
                class: "section-header gjs-editor-header",
                "data-gjs-name": "Header",
              },
              style: {
                padding: "5px",
                "min-height": "80px",
                position: "relative",
                top: "0px !important",
                left: "0px !important",
              },
            },
            {
              tagName: "div",
              name: "section Content",
              attributes: {
                class: "section-content gjs-editor-content",
                "data-gjs-name": "Content",
              },
              style: {
                flex: "1",
                padding: "5px",
                position: "relative",
                "min-height": "845px",
              },
            },
            {
              tagName: "div",
              name: "Footer",
              attributes: {
                class: "section-footer gjs-editor-footer",
                "data-gjs-name": "Footer",
              },
              style: {
                padding: "5px",
                "min-height": "60px",
                position: "relative",
                top: "0px !important",
                left: "0px !important",
              },
            },
          ],

          style: {
            display: "flex",
            "flex-direction": "column",
            width: "100%",
            height: "100%",
          },
        },
      },
    });

    this.editor.on("component:update", (component) => {
      const parent = component.parent();
      if (!parent) return;

      const parentName = parent.get("name");

      if (parentName === "Header") {
        const content = component.get("content");
        if (content && content.trim()) {
          this._originalHeaderContent = content;
        }
      }

      if (parentName === "Footer") {
        const content = component.get("content");
        if (content && content.trim()) {
          this._originalFooterContent = content;
        }
      }
    });

    this.editor.on("trait:update", ({ trait, component }) => {
      if (this._silentSync) return;

      const componentName = component.get("name");
      const traitName = trait.get("name");
      if (componentName === "Sections") {
        if (traitName === "headerApplyMode") {
          const mode = trait.getValue();
          component
            .getTrait("headerCustomRange")
            .set("visible", mode === "custom");
        }

        if (traitName === "footerApplyMode") {
          const mode = trait.getValue();
          component
            .getTrait("footerCustomRange")
            .set("visible", mode === "custom");
        }
      }

      if (
        componentName === "Sections" &&
        (traitName === "headerApplyMode" || traitName === "headerCustomRange")
      ) {
        const rteComp = component.find(
          '[data-gjs-type="formatted-rich-text"]',
        )[0];
        if (rteComp) {
          const content = rteComp.get("content");
          if (content && content.trim()) {
            const sectionContainer = component.closest(".sections-container");
            if (sectionContainer) {
              const sectionCount =
                sectionContainer.getAttributes()["data-section-count"];
              this[`_originalHeaderContent_${sectionCount}`] = content;
            }
          }
        }

        const mode = component.getTrait("headerApplyMode").getValue();
        const range = component.getTrait("headerCustomRange")?.getValue() || "";

        this._silentSync = true;
        try {
          this.syncHeaderTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => this.updateAllSectionHeadersFooters(), 100);
      }
      if (
        componentName === "Sections" &&
        (traitName === "footerApplyMode" || traitName === "footerCustomRange")
      ) {
        const rteComp = component.components().at(0);
        if (rteComp) {
          const content = rteComp.get("content");
          if (content && content.trim()) {
            const sectionContainer = component.closest(".sections-container");
            if (sectionContainer) {
              const sectionCount =
                sectionContainer.getAttributes()["data-section-count"];
              this[`_originalFooterContent_${sectionCount}`] = content;
            }
          }
        }

        const mode = component.getTrait("footerApplyMode").getValue();
        const range = component.getTrait("footerCustomRange")?.getValue() || "";

        this._silentSync = true;
        try {
          this.syncFooterTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => this.updateAllSectionHeadersFooters(), 100);
      }
    });
  }

  syncHeaderTraitsAcrossPages(sourceComponent, newMode, newRange) {
    const sourceSection = sourceComponent.closest(".sections-container");
    if (!sourceSection) return;

    const sourceSectionCount =
      sourceSection.getAttributes()["data-section-count"];
    if (!sourceSectionCount) return;
    const allPages = this.editor.getWrapper().find(".page-container");
    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find(".sections-container")[0];
      if (!sectionContainer) return;
      const targetSectionCount =
        sectionContainer.getAttributes()["data-section-count"];
      if (targetSectionCount !== sourceSectionCount) {
        return;
      }

      const headerComp = sectionContainer
        .components()
        .find((c) => c.get("name") === "Header");
      if (!headerComp) return;

      headerComp.set("headerApplyMode", newMode);
      headerComp.set("headerCustomRange", newRange);
      const modeTrait = headerComp.getTrait("headerApplyMode");
      const rangeTrait = headerComp.getTrait("headerCustomRange");

      if (modeTrait) {
        modeTrait.set("value", newMode);
        if (modeTrait.view) {
          modeTrait.view.model.set("value", newMode);
          modeTrait.view.render();
        }
      }

      if (rangeTrait) {
        rangeTrait.set("value", newRange);
        if (rangeTrait.view) {
          rangeTrait.view.model.set("value", newRange);
          rangeTrait.view.render();
        }
      }
    });
  }

  syncFooterTraitsAcrossPages(sourceComponent, newMode, newRange) {
    const sourceSection = sourceComponent.closest(".sections-container");
    if (!sourceSection) return;
    const sourceSectionCount =
      sourceSection.getAttributes()["data-section-count"];
    if (!sourceSectionCount) return;
    const allPages = this.editor.getWrapper().find(".page-container");

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find(".sections-container")[0];
      if (!sectionContainer) return;

      const targetSectionCount =
        sectionContainer.getAttributes()["data-section-count"];
      if (targetSectionCount !== sourceSectionCount) {
        return;
      }

      const footerComp = sectionContainer
        .components()
        .find((c) => c.get("name") === "Footer");
      if (!footerComp) return;

      footerComp.set("footerApplyMode", newMode);
      footerComp.set("footerCustomRange", newRange);

      const modeTrait = footerComp.getTrait("footerApplyMode");
      const rangeTrait = footerComp.getTrait("footerCustomRange");

      if (modeTrait) {
        modeTrait.set("value", newMode);
        if (modeTrait.view) {
          modeTrait.view.model.set("value", newMode);
          modeTrait.view.render();
        }
      }

      if (rangeTrait) {
        rangeTrait.set("value", newRange);
        if (rangeTrait.view) {
          rangeTrait.view.model.set("value", newRange);
          rangeTrait.view.render();
        }
      }
    });
  }

  checkSectionApplyMode(pageNumber, mode, customRange) {
    if (mode === "all") {
      return true;
    }
    if (mode === "allhide") {
      return false;
    }

    if (mode === "even") {
      return pageNumber % 2 === 0;
    }
    if (mode === "odd") {
      return pageNumber % 2 !== 0;
    }

    if (mode === "custom" && customRange) {
      const ranges = customRange
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const range of ranges) {
        if (range.includes("-")) {
          const [startStr, endStr] = range.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);

          if (
            !isNaN(start) &&
            !isNaN(end) &&
            pageNumber >= start &&
            pageNumber <= end
          ) {
            return true;
          }
        } else {
          const singlePage = parseInt(range, 10);
          if (!isNaN(singlePage) && pageNumber === singlePage) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  }

  updateSectionHeader(pageComponent, pageIndex) {
    const sectionContainer = pageComponent.find(".sections-container")[0];
    if (!sectionContainer) return;
    const sectionCount = sectionContainer.getAttributes()["data-section-count"];
    const headerComp = sectionContainer
      .components()
      .find((c) => c.get("name") === "Header");
    if (!headerComp) return;
    const mode =
      headerComp.get("headerApplyMode") ||
      headerComp.getTrait("headerApplyMode")?.getValue() ||
      "all";
    const range =
      headerComp.get("headerCustomRange") ||
      headerComp.getTrait("headerCustomRange")?.getValue() ||
      "";
    const show = this.checkSectionApplyMode(mode, range, pageIndex);
    let rteComp = headerComp.find('[data-gjs-type="formatted-rich-text"]')[0];
    if (!rteComp) {
      rteComp = headerComp.append({
        tagName: "div",
        attributes: { "data-gjs-type": "formatted-rich-text" },
        content: "",
      })[0];
    }

    if (rteComp) {
      const headerContentKey = `_originalHeaderContent_${sectionCount}`;
      const storedContent = this[headerContentKey];

      if (show && storedContent) {
        rteComp.set("content", storedContent);
      } else if (show) {
        const existingContent = rteComp.get("content");
        if (!existingContent || existingContent.trim() === "") {
          rteComp.set("content", `Header for page ${pageIndex + 1}`);
        }
      } else {
        rteComp.set("content", "");
      }

      if (rteComp.view) rteComp.view.render();
    }
    headerComp.getEl().style.display = show ? "block" : "none";
  }

  updateSectionFooter(pageComponent, pageIndex) {
    const sectionContainer = pageComponent.find(".sections-container")[0];
    if (!sectionContainer) return;
    const footerComp = sectionContainer
      .components()
      .find((c) => c.get("name") === "Footer");
    if (!footerComp) return;
    const mode = footerComp.get("footerApplyMode") || "all";
    const range = footerComp.get("footerCustomRange") || "";
    const show = this.checkSectionApplyMode(mode, range, pageIndex);
    footerComp.getEl().style.display = "block";

    const rteComp = footerComp.components().at(0);
    if (rteComp) {
      if (show) {
        const sourceContent =
          this._lastSectionFooterContent || `Footer for page ${pageIndex + 1}`;
        rteComp.set("content", sourceContent);
      } else {
        rteComp.set("content", "");
      }
      if (rteComp.view) rteComp.view.render();
    }

    if (show) {
      this._lastSectionFooterContent =
        footerComp.components().at(0)?.get("content") || "";
    }
  }

  getPxValue(style, key, defaultVal) {
    const val = style[key];
    if (val && typeof val === "string" && val.endsWith("px")) {
      return parseFloat(val);
    }
    return defaultVal;
  }

  updateAllSectionHeadersFooters() {
    const HEADER_DEFAULT_MIN_HEIGHT = 80;
    const FOOTER_DEFAULT_MIN_HEIGHT = 60;
    const CONTENT_DEFAULT_MIN_HEIGHT = 845;
    const wrapper = this.editor.getWrapper();
    const selectedComponent = this.editor.getSelected();
    if (!selectedComponent || selectedComponent.get("name") !== "Sections") {
      return;
    }

    const sectionCountToTarget =
      selectedComponent.getAttributes()["data-section-count"];
    const headerMode = selectedComponent.getTrait("headerApplyMode").getValue();
    const headerRange =
      selectedComponent.getTrait("headerCustomRange")?.getValue() || "";
    const footerMode = selectedComponent.getTrait("footerApplyMode").getValue();
    const footerRange =
      selectedComponent.getTrait("footerCustomRange")?.getValue() || "";
    const allMatchingSections = wrapper.find(
      `.sections-container[data-section-count="${sectionCountToTarget}"]`,
    );
    allMatchingSections.forEach((sectionComponent, index) => {
      const pageNumber = index + 1;
      const headerComponent = sectionComponent.find(".section-header")[0];
      const footerComponent = sectionComponent.find(".section-footer")[0];
      const contentComponent = sectionComponent.find(".section-content")[0];
      if (!contentComponent) return;

      let contentCompensationHeight = 0;
      if (headerComponent) {
        const isHeaderVisible = this.checkSectionApplyMode(
          pageNumber,
          headerMode,
          headerRange,
        );
        const headerHeightPx = this.getPxValue(
          headerComponent.getStyle(),
          "min-height",
          HEADER_DEFAULT_MIN_HEIGHT,
        );

        if (isHeaderVisible) {
          headerComponent.set({
            style: {
              ...headerComponent.getStyle(),
              display: "",
            },
          });
        } else {
          contentCompensationHeight += headerHeightPx;
          headerComponent.set({
            style: { display: "none" },
          });
        }
      }

      if (footerComponent) {
        const isFooterVisible = this.checkSectionApplyMode(
          pageNumber,
          footerMode,
          footerRange,
        );
        const footerHeightPx = this.getPxValue(
          footerComponent.getStyle(),
          "min-height",
          FOOTER_DEFAULT_MIN_HEIGHT,
        );

        if (isFooterVisible) {
          footerComponent.set({
            style: {
              ...footerComponent.getStyle(),
              display: "",
            },
          });
        } else {
          contentCompensationHeight += footerHeightPx;
          footerComponent.set({
            style: { display: "none" },
          });
        }
      }

      const newMinHeight =
        CONTENT_DEFAULT_MIN_HEIGHT + contentCompensationHeight;
      const currentContentStyles = contentComponent.getStyle();
      contentComponent.set("style", {
        ...currentContentStyles,
        "min-height": `${newMinHeight}px`,
      });
    });
  }

  /////////////////////////////////////////section header footer code end here////////////////////////////////////////////

  // //////////////////////////////////////////////daynamic header footer from json//////////////////////

  setupJsonSuggestionButton() {
    const jsonSector = document.querySelector(".i_designer-sm-sector__JSON");
    if (!jsonSector) return;

    const jsonPathInput = jsonSector.querySelector(".i_designer-fields");
    if (!jsonPathInput) return;

    const button = document.createElement("button");
    button.innerHTML = "Json Suggestion";
    button.id = "json-suggestion-btn";
    button.style.marginLeft = "0px";
    jsonPathInput.parentNode.appendChild(button);

    button.addEventListener("click", () => this.openSuggestionJsonModal());
  }

  openSuggestionJsonModal() {
    const commonJson = JSON.parse(localStorage.getItem("common_json"));
    const customLanguage = localStorage.getItem("custom_language") || "english";
    const metaDataKeys = this.extractMetaDataKeys(commonJson[customLanguage]);

    let modalContent = `
            <div class="new-table-form">
                <div style="padding-bottom:10px">
                    <input type="text" id="searchInput" placeholder="Search json">
                </div>
                <div class="suggestion-results" style="height: 200px; overflow: auto;">
        `;
    metaDataKeys.forEach((key) => {
      modalContent += `<div class="suggestion" data-value="${key}">${key}</div>`;
    });
    modalContent += `</div></div>`;

    this.editor.Modal.setTitle("Json Suggestion");
    this.editor.Modal.setContent(modalContent);
    this.editor.Modal.open();

    document
      .getElementById("searchInput")
      .addEventListener("input", function () {
        filterSuggestions(this.value);
      });

    document.querySelectorAll(".suggestion").forEach((item) => {
      item.addEventListener("click", () => {
        const selectedValue = item.getAttribute("data-value");
        const selectedData = this.getNestedValue(
          commonJson[customLanguage],
          selectedValue,
        ); // <-- use 'this.'

        if (Array.isArray(selectedData)) {
          const arrayEvent = new CustomEvent("arrayDataSelected", {
            detail: { data: selectedData, jsonPath: selectedValue },
          });
          document.dispatchEvent(arrayEvent);
        } else {
          const inputField = document.querySelector(
            ".i_designer-sm-property__my-input-json input",
          );
          if (inputField) {
            inputField.value = selectedValue;
            inputField.dispatchEvent(
              new Event("change", { bubbles: true, cancelable: true }),
            );
          }
        }

        this.editor.Modal.close();
      });
    });
  }

  initializeArrayDataListener() {
    document.addEventListener("arrayDataSelected", (event) => {
      const { data, jsonPath } = event.detail;
      if (typeof this.handleArrayDataDistribution === "function") {
        this.handleArrayDataDistribution(data, jsonPath);
      } else {
      }
    });
  }

  handleArrayDataDistribution(arrayData, jsonPath) {
    const currentPageCount = this.pageSettings.numberOfPages || 1;
    const requiredPages = arrayData.length;

    if (requiredPages > currentPageCount) {
      this.createAdditionalPages(requiredPages - currentPageCount);
    }

    arrayData.forEach((item, index) => {
      this.insertDataIntoPageHeader(item, index, jsonPath);
    });

    this.updateAllPagesAfterDataInsertion(requiredPages);
  }

  insertDataIntoPageHeader(data, pageIndex, jsonPath) {
    const allPages = this.editor.getWrapper().find(".page-container");
    const targetPage = allPages[pageIndex];
    if (!targetPage) return;
    const headerSection = targetPage.find(
      '.section-header[data-gjs-name="Header"]',
    )[0];
    if (!headerSection) return;
    const richTextComponent = headerSection.find(
      '[data-gjs-type="formatted-rich-text"]',
    )[0];
    if (!richTextComponent) return;

    let contentToInsert = "";
    if (Array.isArray(data)) {
      const item = data[pageIndex];
      if (typeof item === "object") {
        contentToInsert = Object.entries(item)
          .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
          .join("<br>");
      } else {
        contentToInsert = String(item);
      }
    } else if (typeof data === "object") {
      if (jsonPath === "analytics_pie") {
        const pieData = data.series?.[0]?.data || [];
        const pieItem = pieData[pageIndex];
        if (pieItem) {
          contentToInsert = `<strong>${pieItem.name}:</strong> ${pieItem.y}`;
        }
      } else {
        contentToInsert = JSON.stringify(data, null, 2);
      }
    } else {
      contentToInsert = String(data);
    }
    richTextComponent.components(contentToInsert);
  }

  createAdditionalPages(additionalPagesCount) {
    const allPages = this.editor.getWrapper().find(".page-container");
    const firstPage = allPages[0];
    if (!firstPage) return;

    for (let i = 0; i < additionalPagesCount; i++) {
      const newPageIndex = this.pageSettings.numberOfPages + i;
      const newPageId = `page-${Date.now()}-${newPageIndex}`;
      const newPageSettings = {
        ...this.pageSettings.pages[0],
        id: newPageId,
        name: `Page ${newPageIndex + 1}`,
      };
      this.pageSettings.pages.push(newPageSettings);
      this.pageSettings.numberOfPages += 1;
      const newPageClone = firstPage.clone();
      newPageClone.setAttributes({ "data-page-id": newPageId });
      const lastPage = allPages.at(-1);
      lastPage.parent().append(newPageClone);
    }
  }

  updateAllPagesAfterDataInsertion(pageCount) {
    const allPages = this.editor.getWrapper().find(".page-container");
    for (let i = 0; i < pageCount; i++) {
      const pageElement = allPages[i];
      const pageSettings = this.pageSettings.pages[i];
      if (
        pageElement &&
        pageSettings &&
        typeof this.updateSinglePageVisuals === "function"
      ) {
        this.updateSinglePageVisuals(pageElement.getEl(), pageSettings, i);
      }
    }
  }

  extractMetaDataKeys(jsonObj) {
    if (!jsonObj || typeof jsonObj !== "object") return [];
    return Object.keys(jsonObj);
  }

  getNestedValue(obj, path) {
    if (!obj || !path) return null;
    const keys = path.split(".");
    let result = obj;
    for (let key of keys) {
      if (result[key] === undefined) return undefined;
      result = result[key];
    }
    return result;
  }
  //////////////////////////////////////////////////////daynamic header footer from json///////////////////////////
}
