function customSections(editor) {
  editor.on("load", () => {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const styleEl = iframeDoc.createElement("style");
    styleEl.innerHTML = `
      .gjs-editor-header,
      .gjs-editor-content,
      .gjs-editor-footer {
        position: relative;
        border: 1px dashed #999 !important;
        transition: border 0.1s ease;
      }

      .gjs-editor-header::before,
      .gjs-editor-content::before,
      .gjs-editor-footer::before {
        content: attr(data-gjs-name);
        position: absolute;
        left: 0;
        top: -14px;
        font-size: 11px;
        font-weight: bold;
        background: #f0f0f0;
        color: #444;
        padding: 1px 5px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10;
      }

            .gjs-editor-header::before {
        content: attr(data-gjs-name);
        position: absolute;
        left: 0;
        top: -2px;
        font-size: 11px;
        font-weight: bold;
        background: #f0f0f0;
        color: #444;
        padding: 1px 5px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10;
      }

      .sections-container:hover {
        outline: 2px dashed #aaa;
        outline-offset: -3px;
        cursor: pointer;
      }

      .movable-active {
        outline: 2px dashed #007bff !important;
        cursor: move !important;
      }

      .gjs-resizer-c {
        position: absolute !important;
        z-index: 1000 !important;
      }

      @media print {
        .gjs-editor-header::before,
        .gjs-editor-content::before,
        .gjs-editor-footer::before,
        .gjs-editor-header,
        .gjs-editor-content,
        .gjs-editor-footer {
          border: none !important;
          content: none !important;
        }
      }
    `;
    iframeDoc.head.appendChild(styleEl);
  });

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let selectedComponent = null;

  function isInsideSection(component) {
    let parent = component.parent();
    while (parent) {
      const el = parent.getEl();
      if (
        el &&
        (el.classList.contains("gjs-editor-header") ||
          el.classList.contains("gjs-editor-content") ||
          el.classList.contains("gjs-editor-footer"))
      ) {
        return { isInside: true, section: parent, sectionEl: el };
      }
      parent = parent.parent();
    }
    return { isInside: false };
  }

  function attachMovableBehavior(component) {
    const el = component.getEl();
    if (!el) return;

    if (!el.dataset.moveMode) el.dataset.moveMode = "off";

    el.ondblclick = (e) => {
      e.stopPropagation();
      const mode = el.dataset.moveMode === "on" ? "off" : "on";
      el.dataset.moveMode = mode;

      if (mode === "on") {
        el.classList.add("movable-active");
        el.dataset.prevWidth = el.style.width || "";
        el.style.width = el.offsetWidth + "px";
      } else {
        el.classList.remove("movable-active");
        if (el.dataset.prevWidth !== undefined)
          el.style.width = el.dataset.prevWidth;
      }
    };

    el.onmousedown = (e) => {
      if (el.dataset.moveMode !== "on") return;
      if (
        e.target.classList.contains("gjs-resizer-h") ||
        e.target.closest(".gjs-resizer-c")
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      isDragging = true;

      const parentEl = el.closest(
        ".gjs-editor-header, .gjs-editor-content, .gjs-editor-footer"
      );
      if (!parentEl) return;

      el.style.position = "absolute";
      const elRect = el.getBoundingClientRect();
      startX = e.clientX - elRect.left;
      startY = e.clientY - elRect.top;

      document.onmousemove = (ev) => {
        if (!isDragging) return;

        const parentRect = parentEl.getBoundingClientRect();
        const newX = ev.clientX - parentRect.left - startX;
        const newY = ev.clientY - parentRect.top - startY;

        const parentWidth = parentRect.width;
        const parentHeight = parentRect.height;

        const newLeftPercent = (newX / parentWidth) * 100;
        const newTopPercent = (newY / parentHeight) * 100;

        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;
        const maxLeftPercent = 100 - (elWidth / parentWidth) * 100;
        const maxTopPercent = 100 - (elHeight / parentHeight) * 100;

        const clampedLeft = Math.max(0, Math.min(newLeftPercent, maxLeftPercent));
        const clampedTop = Math.max(0, Math.min(newTopPercent, maxTopPercent));

        const compId = component.getId();
        const selector = `#${compId}`;
        const cssRule =
          editor.CssComposer.getRule(selector) ||
          editor.CssComposer.add([selector]);

        cssRule.addStyle({
          position: "absolute",
          left: `${clampedLeft}%`,
          top: `${clampedTop}%`,
        });
      };

      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  editor.on("component:add", (component) => {
    const sectionInfo = isInsideSection(component);
    if (sectionInfo.isInside) {
      setTimeout(() => {
        if (component.getStyle("position") !== "absolute") {
          component.addStyle({
            position: "relative",
            display: "block",
            margin: "10px 0",
            width: "auto",
            top: "auto",
            left: "auto",
          });
        }
      }, 50);
    }
  });

  editor.on("component:selected", (component) => {
    const sectionInfo = isInsideSection(component);
    if (sectionInfo.isInside) {
      selectedComponent = component;
      attachMovableBehavior(component);
    }
  });

  editor.on("component:deselected", (component) => {
    if (selectedComponent === component) {
      isDragging = false;
      selectedComponent = null;
    }
  });
}
