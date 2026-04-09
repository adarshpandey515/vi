function flowLayoutComponent(editor) {
  const domc = editor.DomComponents;
  const bm = editor.BlockManager;

  const LAYOUT = "flow-layout";
  const COL = "flow-column";
  const CUSTOM_TEXT_TYPE = "formatted-rich-text";

  let reflowTimer = null;
  const scheduleReflow = (view, delay = 80) => {
    if (reflowTimer) clearTimeout(reflowTimer);
    reflowTimer = setTimeout(() => {
      try {
        view.reflow();
      } catch (e) { }
      reflowTimer = null;
    }, delay);
  };

  const ensureIdSync = (itemEl, compModel) => {
    if (!itemEl.id) {
      itemEl.id = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
    }
    if (compModel && compModel.getAttributes) {
      const attrs = { ...compModel.getAttributes() };
      if (attrs.id !== itemEl.id) {
        attrs.id = itemEl.id;
        try {
          compModel.set({ attributes: attrs }, { silent: true });
        } catch (e) { }
      }
    }
    return itemEl.id;
  };

  const findModelByDOMId = (id) => {
    if (!id) return null;
    return (editor.getWrapper().find("#" + id) || [])[0] || null;
  };

  const cloneStyles = (sourceEl) => {
    const styles = {};
    try {
      const computed = window.getComputedStyle(sourceEl);
      const props = ['color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
        'textAlign', 'textDecoration', 'lineHeight', 'letterSpacing',
        'backgroundColor', 'padding', 'margin', 'border', 'borderRadius',
        'display', 'width', 'maxWidth', 'minWidth'];
      props.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value) styles[prop] = value;
      });
    } catch (e) { }
    return styles;
  };

  const cleanWidthStyles = (model, domEl) => {
    try {
      if (model && model.getStyle && model.setStyle) {
        const ms = { ...model.getStyle() };
        if (ms.width || ms['max-width'] || ms.maxWidth) {
          delete ms.width;
          delete ms['max-width'];
          delete ms.maxWidth;
          model.setStyle(ms, { silent: true });
        }
      }
    } catch (e) { }

    try {
      if (domEl && domEl.style) {
        domEl.style.width = '';
        domEl.style.maxWidth = '';
      }
    } catch (e) { }
  };

  const deepCloneTableElement = (sourceElement) => {
    const clone = sourceElement.cloneNode(true);
    const copyStylesToClone = (src, dest) => {
      if (!src || !dest) return;

      try {
        const srcStyle = window.getComputedStyle(src);
        const destStyle = dest.style;

        for (let i = 0; i < srcStyle.length; i++) {
          const prop = srcStyle[i];
          destStyle.setProperty(prop, srcStyle.getPropertyValue(prop));
        }
      } catch (e) { }

      const srcChildren = Array.from(src.children);
      const destChildren = Array.from(dest.children);

      for (let i = 0; i < Math.min(srcChildren.length, destChildren.length); i++) {
        copyStylesToClone(srcChildren[i], destChildren[i]);
      }
    };

    copyStylesToClone(sourceElement, clone);

    return clone;
  };

  const makeTableEditable = (tableContainer) => {
    const table = tableContainer.querySelector('table');
    if (!table) return;

    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      if (!cell.classList.contains('editable-cell')) {
        cell.classList.add('editable-cell');
      }

      cell.setAttribute('contenteditable', 'true');
      cell.style.cursor = 'text';
    });
  };

  domc.addType(COL, {
    isComponent(el) {
      return el?.classList?.contains("flow-col") ? { type: COL } : false;
    },
    model: {
      defaults: {
        name: "Flow Column",
        tagName: "div",
        attributes: { class: "flow-col" },
        style: {
          "flex-grow": "1",
          "flex-basis": "50%",
          padding: "5px",
          "box-sizing": "border-box",
          overflow: "hidden",
        },
        droppable: ".flow-content",
        removable: false,
        copyable: false,
        components: [{
          tagName: "div",
          attributes: { class: "flow-content" },
          style: {
            position: "relative",
            height: "100%",
            overflow: "visible",
          },
        }],
      },
    },
  });

  domc.addType(LAYOUT, {
    isComponent(el) {
      return el?.classList?.contains("flow-layout") ? { type: LAYOUT } : false;
    },

    model: {
      defaults: {
        name: "Flow Layout",
        tagName: "div",
        attributes: { class: "flow-layout" },
        style: {
          display: "flex",
          "flex-direction": "row",
          width: "100%",
          height: "300px",
          // Border removed as per requirements.
          border: "none",
          overflow: "hidden",
          padding: "2px"
        },
        components: [{ type: COL }, { type: COL }],
        traits: [
          { type: "number", name: "columns", label: "Columns", min: 2, max: 12, value: 2, changeProp: 1 },
          { type: "number", name: "height", label: "Height (px)", min: 100, value: 300, changeProp: 1 },
        ],
      },

      init() {
        this.listenTo(this, "change:columns", this.updateColumns);
        this.listenTo(this, "change:height", this.updateHeight);
        if (!this.get("columns")) this.set("columns", 2);
        if (!this.get("height")) this.set("height", 300);
        this.updateHeight();
      },

      updateHeight() {
        const h = parseInt(this.get("height")) || 300;
        this.addStyle({ height: h + "px" });
        if (this.view?.el) {
          this.view.el.style.height = h + "px";
          setTimeout(() => {
            if (this.view) this.view.reflow();
          }, 100);
        }
      },

      updateColumns() {
        const target = parseInt(this.get("columns")) || 2;
        const comps = this.components();
        const current = comps.length;

        if (target > current) {
          for (let i = current; i < target; i++) comps.add({ type: COL });
        } else if (target < current) {
          for (let i = current - 1; i >= target; i--) comps.at(i).remove();
        }

        const basisValue = (100 / target).toFixed(2) + '%';
        comps.each(colModel => {
          let colStyle = colModel.getStyle ? colModel.getStyle() : {};
          if (colStyle['flex-basis'] !== basisValue) {
            colStyle['flex-basis'] = basisValue;
            if (colModel.setStyle) colModel.setStyle(colStyle);
          }

          const flowModel = colModel.components().at(0);
          if (flowModel) {
            flowModel.components().each(itemModel => {
              const type = itemModel.get('type');
              if (type === CUSTOM_TEXT_TYPE || type === 'text') {
                cleanWidthStyles(itemModel, itemModel.view?.el);
              }
            });
          }
        });

        this.view?.reflow();
      },
    },

    view: {
      init() {
        const evs = ["component:drop", "component:add", "component:remove",
          "component:update", "component:style:update", "component:content:update"];
        evs.forEach((ev) => editor.on(ev, () => scheduleReflow(this, 80)));

        editor.getWrapper().on("change:components", () => scheduleReflow(this, 100));

        try {
          if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => scheduleReflow(this, 120));
          }
        } catch (e) { }
      },

      onRender() {
        scheduleReflow(this, 60);
      },

      splitTextContent(itemEl, compModel, remainPx) {
        if (!itemEl || remainPx <= 0) return null;

        let originalHTML = "";
        try {
          if (compModel && compModel.get) {
            const c = compModel.get("content");
            if (c != null && c !== undefined && String(c).trim() !== "") originalHTML = String(c);
          }
        } catch (e) { }
        if (!originalHTML) originalHTML = itemEl.innerHTML || "";

        const tokens = originalHTML.match(/(<[^>]+>|[^<\s]+[\s]*)/g) || [];
        if (tokens.length <= 1) return null;

        const flow = itemEl.closest && (itemEl.closest('.flow-content') || this.el);
        const containerWidth = flow ? flow.clientWidth : itemEl.clientWidth;

        let left = 0;
        let right = tokens.length;
        let best = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testHTML = tokens.slice(0, mid).join("");

          const temp = itemEl.cloneNode(false);
          const cs = window.getComputedStyle(itemEl);
          temp.style.cssText = cs.cssText || "";
          temp.style.width = containerWidth + "px";
          temp.style.position = "absolute";
          temp.style.visibility = "hidden";
          temp.style.height = "auto";
          temp.style.left = "0";
          temp.style.top = "0";
          temp.innerHTML = testHTML;

          (flow || document.body).appendChild(temp);
          const h = temp.offsetHeight;
          (flow || document.body).removeChild(temp);

          if (h <= remainPx) {
            best = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        if (best > 0 && best < tokens.length) {
          return {
            remainingHTML: tokens.slice(0, best).join(""),
            overflowHTML: tokens.slice(best).join(""),
          };
        }
        return null;
      },

      reflow() {
        this._reflowing = true;

        const layoutEl = this.el;
        if (!layoutEl) {
          this._reflowing = false;
          return;
        }

        const layoutRect = layoutEl.getBoundingClientRect();
        const layoutHeight = layoutRect.height;
        if (!layoutHeight) {
          this._reflowing = false;
          return;
        }

        const cols = Array.from(layoutEl.querySelectorAll(".flow-col"));
        if (!cols.length) {
          this._reflowing = false;
          return;
        }

        const layoutModel = this.model;
        const masterJson = layoutEl.querySelector(
          '[data-gjs-type="json-table"]:not([data-flow-clone])'
        );

        if (masterJson) {
          const masterTable = masterJson.querySelector("table");

          if (masterTable) {
            Array.from(
              layoutEl.querySelectorAll('[data-flow-clone="true"]')
            ).forEach(n => n.remove());

            const stateAttr = masterJson.getAttribute("data-json-state");
            if (stateAttr) {
              let jsonState;
              try {
                jsonState = JSON.parse(decodeURIComponent(stateAttr));
              } catch (e) {
                console.warn("Invalid data-json-state", e);
              }

              if (jsonState) {
                const headersMap = jsonState.headers || {};
                const keys = Object.keys(headersMap);
                const data = Array.isArray(jsonState.data) ? jsonState.data : [];

                if (keys.length && data.length) {
                  let headerH = 24;
                  let rowH = 24;
                  try {
                    const hRow = masterTable.querySelector("thead tr");
                    if (hRow) {
                      const r = hRow.getBoundingClientRect();
                      if (r.height) headerH = r.height;
                    }
                    const bRow = masterTable.querySelector("tbody tr");
                    if (bRow) {
                      const r2 = bRow.getBoundingClientRect();
                      if (r2.height) rowH = r2.height;
                    }
                  } catch (e) { }

                  if (!rowH) rowH = 24;
                  let availableHeight = layoutHeight - headerH - 4;
                  if (availableHeight < rowH) availableHeight = rowH;

                  const rowsPerColumn = Math.max(1, Math.floor(availableHeight / rowH));
                  const totalColumns = cols.length;
                  const totalRows = data.length;
                  const totalVisibleRows = rowsPerColumn * totalColumns;
                  const maxRowIndex = Math.min(totalRows, totalVisibleRows);

                  const applyRowVisibility = (table, colIndex) => {
                    const tbody = table.querySelector("tbody");
                    if (!tbody) return;
                    const rows = Array.from(tbody.querySelectorAll("tr"));
                    rows.forEach((tr, idx) => {
                      const globalIndex = idx;
                      const start = colIndex * rowsPerColumn;
                      const end = start + rowsPerColumn;

                      const shouldShow =
                        globalIndex >= start &&
                        globalIndex < end &&
                        globalIndex < maxRowIndex;

                      tr.style.display = shouldShow ? "" : "none";
                    });
                  };

                  const masterCol = masterJson.closest(".flow-col");
                  const getColIndex = (col) => cols.indexOf(col);

                  cols.forEach(col => {
                    const flow = col.querySelector(".flow-content");
                    if (!flow) return;

                    let colIndex = getColIndex(col);
                    if (colIndex < 0) return;

                    let container;
                    if (col === masterCol) {
                      container = masterJson;
                    } else {
                      container = deepCloneTableElement(masterJson);
                      container.setAttribute("data-flow-clone", "true");

                      if (container.classList) {
                        container.classList.add('flow-table-clone');
                      } else {
                        container.className += ' flow-table-clone';
                      }

                      if (container.id) container.id = container.id + "-col" + colIndex;
                      const innerTable = container.querySelector("table");
                      if (innerTable && innerTable.id) {
                        innerTable.id = innerTable.id + "-col" + colIndex;
                      }

                      makeTableEditable(container);
                      flow.appendChild(container);
                    }

                    const table = container.querySelector("table");
                    if (!table) return;

                    applyRowVisibility(table, colIndex);
                  });
                }
              }
            }
          }
        }

        const processedIds = new Set();
        for (let colIndex = 0; colIndex < cols.length; colIndex++) {
          const col = cols[colIndex];
          const flow = col.querySelector(".flow-content");
          if (!flow) continue;

          const isLastColumn = colIndex === cols.length - 1;
          const items = Array.from(flow.children);

          for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.getAttribute('data-flow-clone') === 'true') continue;
            if (item.getAttribute('data-gjs-type') === 'json-table') continue;

            const compModel = findModelByDOMId(item.id);
            const itemId = ensureIdSync(item, compModel);

            if (processedIds.has(itemId)) continue;

            const itemRect = item.getBoundingClientRect();
            const flowRect = flow.getBoundingClientRect();
            const itemTopRel = itemRect.top - flowRect.top;
            const itemHeight = itemRect.height;
            const itemBottomRel = itemTopRel + itemHeight;
            const remainPx = Math.floor(layoutHeight - itemTopRel);

            if (itemBottomRel > layoutHeight) {
              if (isLastColumn) {
                item.style.maxHeight = remainPx + 'px';
                item.style.overflow = 'hidden';
                processedIds.add(itemId);
                continue;
              }

              const nextCol = cols[colIndex + 1];
              if (!nextCol) continue;
              const nextFlow = nextCol.querySelector(".flow-content");
              if (!nextFlow) continue;

              let handled = false;

              const isTextLike = compModel &&
                ((compModel.is && compModel.is("text")) ||
                  (compModel.get && compModel.get("type") === CUSTOM_TEXT_TYPE));

              if (!handled && isTextLike && remainPx > 8) {
                try {
                  const splitRes = this.splitTextContent(item, compModel, remainPx);
                  if (splitRes) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = splitRes.remainingHTML;
                    const remainingText = tempDiv.textContent.trim();

                    if (remainingText.length < 20) {
                      handled = false;
                    } else {
                      const capturedStyles = cloneStyles(item);

                      try {
                        if (compModel?.set) compModel.set({ content: splitRes.remainingHTML }, { silent: true });
                        if (compModel?.view?.el) compModel.view.el.innerHTML = splitRes.remainingHTML;
                        else item.innerHTML = splitRes.remainingHTML;
                      } catch (e) { item.innerHTML = splitRes.remainingHTML; }

                      const newItemId = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
                      const continuationStyles = { ...capturedStyles };

                      ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                        'margin', 'marginTop', 'marginBottom'].forEach(p => continuationStyles[p] = '0');
                      delete continuationStyles.width;
                      delete continuationStyles['max-width'];
                      delete continuationStyles.maxWidth;

                      const modelConfig = {
                        type: compModel.get("type"),
                        content: splitRes.overflowHTML,
                        attributes: {
                          ...(compModel.getAttributes ? compModel.getAttributes() : {}),
                          id: newItemId,
                          'data-flow-continuation': 'true'
                        },
                        style: continuationStyles
                      };

                      if (compModel.getStyle) {
                        const baseStyle = { ...compModel.getStyle() };
                        delete baseStyle.width;
                        delete baseStyle['max-width'];
                        delete baseStyle.maxWidth;
                        modelConfig.style = { ...baseStyle, ...continuationStyles };
                      }

                      const targetColModel = layoutModel.components().at(colIndex + 1);
                      const targetFlowModel = targetColModel && targetColModel.components().at(0);
                      let newModel = null;

                      if (targetFlowModel) {
                        newModel = targetFlowModel.components().add(modelConfig, { at: 0 });
                        cleanWidthStyles(newModel, newModel.view?.el);

                        setTimeout(() => {
                          const el = newModel.view?.el;
                          if (el) {
                            Object.assign(el.style, continuationStyles);
                            cleanWidthStyles(newModel, el);
                          }
                        }, 10);
                      } else {
                        newModel = editor.Components.addComponent(modelConfig);
                        if (targetColModel) targetColModel.components().add(newModel, { at: 0 });
                        cleanWidthStyles(newModel);
                      }

                      processedIds.add(itemId);
                      processedIds.add(newModel ? newModel.getId() : newItemId);
                      editor.select(null);
                      setTimeout(() => { try { editor.select(newModel); } catch (e) { } }, 10);

                      handled = true;
                      scheduleReflow(this, 50);
                      this._reflowing = false;
                      return;
                    }
                  }
                } catch (err) {
                  console.log("Flow: partial split error", err);
                }
              }

              if (!handled) {
                try {
                  const capturedStyles = cloneStyles(item);
                  const capturedClasses = item.className;

                  nextFlow.insertBefore(item, nextFlow.firstChild);
                  Object.assign(item.style, capturedStyles);
                  item.className = capturedClasses;

                  if (compModel) {
                    const sourceColModel = layoutModel.components().at(colIndex);
                    const targetColModel = layoutModel.components().at(colIndex + 1);
                    const sourceFlowModel = sourceColModel?.components().at(0);
                    const targetFlowModel = targetColModel?.components().at(0);

                    if (sourceFlowModel && targetFlowModel) {
                      const modelStyles = compModel.getStyle ? compModel.getStyle() : {};
                      sourceFlowModel.components().remove(compModel);
                      targetFlowModel.components().add(compModel, { at: 0 });

                      if (compModel.setStyle) {
                        compModel.setStyle({ ...modelStyles, ...capturedStyles });
                      }
                      cleanWidthStyles(compModel, item);
                    }
                  }

                  handled = true;
                  processedIds.add(itemId);
                  scheduleReflow(this, 50);
                  this._reflowing = false;
                  return;
                } catch (err) {
                  console.log("Flow: move fallback failed", err);
                }
              }
            } else {
              processedIds.add(itemId);
            }
          }
        }

        this._reflowing = false;
      },
    },
  });

  bm.add("flow-layout", {
    label: "Flow Layout",
    category: "Layout",
    attributes: { class: "fa fa-columns" },
    content: { type: LAYOUT },
  });

  function cleanFlowLayoutForExport(_layoutElement) {
    // No-op: flow clones ([data-flow-clone]) must stay visible for export parity.
  }

  // Copy each .flow-layout innerHTML from the live canvas to export root.
  // This preserves runtime clones (eg. DataSourceTable second-column content)
  // that are not part of the GrapesJS serialized component tree.
  function syncFlowLayoutsFromLiveDoc(exportRoot, liveRoot) {
    if (!exportRoot || !liveRoot) return;
    try {
      const exportLayouts = exportRoot.querySelectorAll(".flow-layout");
      if (!exportLayouts.length) return;

      const liveLayoutsArr = Array.from(liveRoot.querySelectorAll(".flow-layout"));

      exportLayouts.forEach((expEl, index) => {
        let liveEl = null;
        const gjsId = expEl.getAttribute("data-gjs-id");
        if (gjsId != null && gjsId !== "") {
          liveEl =
            liveLayoutsArr.find((n) => n.getAttribute("data-gjs-id") === gjsId) || null;
        }
        if (!liveEl) {
          liveEl = liveLayoutsArr[index];
        }
        if (liveEl) {
          expEl.innerHTML = liveEl.innerHTML;
        }
      });
    } catch (e) {
      console.warn("syncFlowLayoutsFromLiveDoc:", e);
    }
  }

  function getCleanHTMLForExport(layoutElement) {
    if (!layoutElement) return "";
    const clone = layoutElement.cloneNode(true);
    return clone.innerHTML;
  }

  if (typeof window !== 'undefined') {
    window.cleanFlowLayoutForExport = cleanFlowLayoutForExport;
    window.getCleanFlowLayoutHTML = getCleanHTMLForExport;
    window.syncFlowLayoutsFromLiveDoc = syncFlowLayoutsFromLiveDoc;
  }
}
