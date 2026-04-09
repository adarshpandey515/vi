function customVideoIn(editor) {
  let globalSlideSpacing = {
    padding: "",
    margin: ""
  };

  function getVideoInteractiveSlideComponents() {
    return editor.getWrapper().find('[data-slide]') || [];
  }

  function getSlideSpacingValue(slide, propertyName) {
    if (!slide) {
      return "";
    }

    const inlineStyle = typeof slide.getStyle === "function" ? slide.getStyle() : null;
    if (inlineStyle && inlineStyle[propertyName]) {
      return inlineStyle[propertyName];
    }

    const el = typeof slide.getEl === "function" ? slide.getEl() : null;
    if (!el || typeof window.getComputedStyle !== "function") {
      return "";
    }

    const computedValue = window.getComputedStyle(el)[propertyName];
    if (!computedValue || computedValue === "0px" || computedValue === "0px 0px 0px 0px") {
      return "";
    }

    return computedValue;
  }

  function syncGlobalSpacingFromSlides() {
    const [firstSlide] = getVideoInteractiveSlideComponents();
    globalSlideSpacing = {
      padding: getSlideSpacingValue(firstSlide, "padding"),
      margin: getSlideSpacingValue(firstSlide, "margin")
    };
  }

  function applyGlobalSpacingToAllSlides(nextSpacing = {}) {
    const slides = getVideoInteractiveSlideComponents();
    if (!slides.length) {
      return;
    }

    globalSlideSpacing = {
      ...globalSlideSpacing,
      ...nextSpacing
    };

    slides.forEach((slide) => {
      const nextStyle = {
        ...(typeof slide.getStyle === "function" ? slide.getStyle() : {})
      };

      ["padding", "margin"].forEach((propertyName) => {
        if (!Object.prototype.hasOwnProperty.call(nextSpacing, propertyName)) {
          return;
        }

        const propertyValue = nextSpacing[propertyName];
        if (propertyValue) {
          nextStyle[propertyName] = propertyValue;
        } else {
          delete nextStyle[propertyName];
        }
      });

      if (typeof slide.setStyle === "function") {
        slide.setStyle(nextStyle);
      } else if (typeof slide.addStyle === "function") {
        slide.addStyle(nextStyle);
      }

      const el = typeof slide.getEl === "function" ? slide.getEl() : null;
      if (el) {
        if (Object.prototype.hasOwnProperty.call(nextSpacing, "padding")) {
          el.style.padding = nextSpacing.padding || "";
        }
        if (Object.prototype.hasOwnProperty.call(nextSpacing, "margin")) {
          el.style.margin = nextSpacing.margin || "";
        }
      }
    });
  }

  function openAllSlidesSpacingModal() {
    syncGlobalSpacingFromSlides();

    editor.Modal.setTitle("All Slide Spacing");
    editor.Modal.setContent(`
      <div>
        <p style="margin-bottom: 12px; color: #fff;">
        Margin and padding entered here will be applied to all slides at once.
        </p>
        <label for="allSlidesPaddingInput">Padding</label>
        <input
          type="text"
          id="allSlidesPaddingInput"
          class="form-control"
          placeholder="e.g. 20px"
          value="${String(globalSlideSpacing.padding || "").replace(/"/g, '&quot;')}"
          style="margin-top: 6px;"
        />

        <label for="allSlidesMarginInput" style="margin-top: 12px;">Margin</label>
        <input
          type="text"
          id="allSlidesMarginInput"
          class="form-control"
          placeholder="e.g. 10px auto"
          value="${String(globalSlideSpacing.margin || "").replace(/"/g, '&quot;')}"
          style="margin-top: 6px;"
        />

        <div style="margin-top: 14px; display: flex; gap: 10px;">
          <button id="applyAllSlidesSpacingBtn" class="btn btn-primary">Apply</button>
          <button id="clearAllSlidesSpacingBtn" class="btn btn-secondary">Clear</button>
        </div>
      </div>
    `);
    editor.Modal.open();

    setTimeout(() => {
      const applyBtn = document.getElementById("applyAllSlidesSpacingBtn");
      const clearBtn = document.getElementById("clearAllSlidesSpacingBtn");

      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          const paddingValue = document.getElementById("allSlidesPaddingInput")?.value?.trim() || "";
          const marginValue = document.getElementById("allSlidesMarginInput")?.value?.trim() || "";

          applyGlobalSpacingToAllSlides({
            padding: paddingValue,
            margin: marginValue
          });
          editor.Modal.close();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          applyGlobalSpacingToAllSlides({
            padding: "",
            margin: ""
          });
          editor.Modal.close();
        });
      }
    }, 100);
  }

  function restoreExistingSlideshow() {
    const iframe = document.querySelector('#editor iframe');
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;

    if (!iframeDoc) {
      return false;
    }

    const slideElements = iframeDoc.querySelectorAll('[data-slide]');

    if (!slideElements || slideElements.length < 2) {
      return false;
    }

    if (document.getElementById('slides-thumbnails')) {
      return false;
    }

    const firstSlide = slideElements[0];
    const computed = getComputedStyle(firstSlide);
    const width = computed.width;
    const height = computed.height;

    slides = [];
    transitions = {};
    clickStates = {};
    thumbnailNames = {};
    currentSlideIndex = 1;
    window.presentationState = {
      currentSlideIndex: 1,
      slides: []
    };

    if (window.slideshowSettings) {
      if (window.slideshowSettings.thumbnailNames) {
        thumbnailNames = window.slideshowSettings.thumbnailNames;
        window.thumbnailNames = thumbnailNames;
      }

      if (window.slideshowSettings.slideshowSoundPath) {
        window.slideshowSoundPath = window.slideshowSettings.slideshowSoundPath;
        slideshowSoundPath = window.slideshowSettings.slideshowSoundPath;
      }

      if (window.slideshowSettings.transitions) {
        Object.keys(window.slideshowSettings.transitions).forEach(key => {
          const savedTrans = window.slideshowSettings.transitions[key];
          transitions[key] = {
            type: savedTrans.type || 'none',
            transitionDuration: savedTrans.transitionDuration || savedTrans.duration || 0,
            direction: savedTrans.direction || 'none',
            slideTimer: savedTrans.slideTimer || 0,
            isHidden: savedTrans.isHidden || false,
            wordToHide: savedTrans.wordToHide || '',
            slideInput: savedTrans.slideInput || 'False',
            hasMusic: savedTrans.hasMusic || false,
            musicLoop: savedTrans.musicLoop || false,
            musicFile: null
          };

          if (window.slideshowSettings.slideMusic && window.slideshowSettings.slideMusic[key]) {
            transitions[key].musicFile = window.slideshowSettings.slideMusic[key].musicFile;
            transitions[key].hasMusic = true;
            transitions[key].musicLoop = window.slideshowSettings.slideMusic[key].musicLoop;
          }
        });
      }
    }

    const allComponents = editor.getWrapper().find('[data-slide]');
    if (allComponents.length === 0) {
      return false;
    }

    allComponents.forEach((component, index) => {
      const slideIndex = index + 1;
      const attrs = component.getAttributes();

      slides.push(component);
      if (!transitions[slideIndex]) {
        transitions[slideIndex] = {
          type: attrs['data-transition-type'] || 'none',
          transitionDuration: parseFloat(attrs['data-transition-duration']) || 0,
          direction: attrs['data-transition-direction'] || 'none',
          slideTimer: parseFloat(attrs['data-slide-timer']) || 0,
          isHidden: attrs['data-hide'] === 'true',
          wordToHide: attrs['data-word-to-hide'] || '',
          slideInput: attrs['data-slide-input'] || 'False',
          hasMusic: attrs['data-has-music'] === 'true',
          musicLoop: attrs['data-music-loop'] === 'true',
          musicFile: null
        };
      }

      clickStates[slideIndex] = false;

      const el = component.getEl();
      if (el) {
        el.style.display = slideIndex === 1 ? 'block' : 'none';
      }
    });

    window.presentationState.slides = slides;
    window.transitions = transitions;
    window.thumbnailNames = thumbnailNames;
    syncGlobalSpacingFromSlides();

    createThumbnailContainer(slideElements.length, width, height);
    editor.select(slides[0]);
    return true;
  }
  window.restoreInteractiveSlideshow = restoreExistingSlideshow;

  function shouldPromptForVideoInteractiveSetup() {
    if (document.getElementById('slides-thumbnails')) {
      return false;
    }

    const wrapperSlides = editor.getWrapper().find('[data-slide]');
    if (wrapperSlides && wrapperSlides.length >= 2) {
      return false;
    }

    const iframe = document.querySelector('#editor iframe');
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    const renderedSlides = iframeDoc?.querySelectorAll?.('[data-slide]');
    if (renderedSlides && renderedSlides.length >= 2) {
      return false;
    }

    return true;
  }

  function maybeInitializeInteractiveVideo(model) {
    if (window.__iDesignerImportingPage) {
      return;
    }

    const componentType = model.get("type");
    const componentTagName = model.get("tagName");

    if (componentType === "videoIn" ||
      (componentTagName === "video") ||
      model.get("attributes")?.['data-i_designer-type'] === "videoIn") {
      if (shouldPromptForVideoInteractiveSetup()) {
        askNumberOfPages();
      } else {
        setTimeout(() => {
          if (!document.getElementById('slides-thumbnails')) {
            restoreExistingSlideshow();
          }
        }, 120);
      }
    }
  }

  setTimeout(() => {
    restoreExistingSlideshow();
  }, 1000);

  editor.on("component:add", (model) => {
    maybeInitializeInteractiveVideo(model);
  });

  editor.on("component:mount", (model) => {
    maybeInitializeInteractiveVideo(model);
  });

  function askNumberOfPages() {
    editor.Modal.setTitle("Enter Number of Pages");
    editor.Modal.setContent(`
      <div>
        <label for="customPageCount">How many pages do you want?</label>
        <input type="number" id="customPageCount" class="form-control" min="1" placeholder="Enter a number" style="margin-top: 10px;" />
        
        <button id="confirmPageCount" class="btn btn-primary" style="margin-top: 15px;">Next</button>
      </div>
    `);

    editor.Modal.open();

    setTimeout(() => {
      const confirmBtn = document.getElementById("confirmPageCount");
      if (confirmBtn) {
        confirmBtn.addEventListener("click", handlePageSelection);
      }
    }, 100);
  }

  function handlePageSelection() {
    const numPages = parseInt(document.getElementById("customPageCount").value);

    if (isNaN(numPages) || numPages <= 0) {
      alert("Please enter a valid number of pages.");
      return;
    }

    askCanvasSize(numPages);
  }

  function askCanvasSize(numPages) {
    editor.Modal.setTitle("Select Canvas Size");
    editor.Modal.setContent(`
      <div>
        <label for="canvasSizeSelect">Choose Canvas Size:</label>
        <select id="canvasSizeSelect" class="form-control">
          <option value="A4">A4 (595px x 842px)</option>
          <option value="720p">720p (1280px x 720px)</option>
          <option value="custom">Custom Size</option>
        </select>

        <div id="customSizeInputs" style="display:none; margin-top: 10px;">
          <label for="customWidth">Width:</label>
          <input type="text" id="customWidth" class="form-control" placeholder="Enter width (e.g., 800px)" />

          <label for="customHeight" style="margin-top: 10px;">Height:</label>
          <input type="text" id="customHeight" class="form-control" placeholder="Enter height (e.g., 600px)" />
        </div>

        <button id="confirmCanvasSize" class="btn btn-primary" style="margin-top: 15px;">Confirm</button>
      </div>
    `);

    editor.Modal.open();

    setTimeout(() => {
      const sizeSelect = document.getElementById("canvasSizeSelect");
      const confirmBtn = document.getElementById("confirmCanvasSize");

      if (sizeSelect) {
        sizeSelect.addEventListener("change", handleSizeChange);
      }

      if (confirmBtn) {
        confirmBtn.addEventListener("click", () => handleCanvasSelection(numPages));
      }
    }, 100);
  }

  function handleSizeChange() {
    const selectedSize = document.getElementById("canvasSizeSelect").value;
    const customInputs = document.getElementById("customSizeInputs");

    if (selectedSize === "custom") {
      customInputs.style.display = "block";
    } else {
      customInputs.style.display = "none";
    }
  }

  function handleCanvasSelection(numPages) {
    const selectedSize = document.getElementById("canvasSizeSelect").value;
    let width, height;

    switch (selectedSize) {
      case "A4":
        width = "595px";
        height = "840px";
        break;
      case "720p":
        width = "1280px";
        height = "720px";
        break;
      case "custom":
        width = document.getElementById("customWidth").value;
        height = document.getElementById("customHeight").value;
        if (!isValidSize(width) || !isValidSize(height)) {
          alert("Invalid custom size. Please enter valid dimensions.");
          return;
        }
        break;
      default:
        alert("Invalid option. Using default A4 size.");
        width = "595px";
        height = "842px";
    }

    createSlides(numPages, width, height);
    editor.Modal.close();
  }

  function isValidSize(size) {
    return size && size.match(/^\d+(px|%)$/);
  }

  let transitions = {};
  let thumbnailNames = {};
  let clickStates = {};
  window.presentationState = {
    currentSlideIndex: 1,
    slides: [],
  }

  let currentSlideIndex = window.presentationState.currentSlideIndex;
  let slides = window.presentationState.slides;

  const activeStyle = document.createElement('style');
  activeStyle.innerHTML = `
  .thumbnail.active-thumbnail {
    transform: scale(1.2) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25) !important;
    border-color: #007bff;
  }
  .thumbnail.dragging-thumbnail {
    opacity: 0.55;
    transform: scale(0.95) !important;
  }
  .thumbnail.drop-before {
    border-left: 4px solid #007bff !important;
  }
  .thumbnail.drop-after {
    border-right: 4px solid #007bff !important;
  }
`;
  document.head.appendChild(activeStyle);

  function getDefaultTransitionConfig() {
    return {
      type: "none",
      transitionDuration: 0,
      duration: 0,
      direction: "none",
      slideTimer: 0,
      isHidden: false,
      wordToHide: "",
      slideInput: "False",
      hasMusic: false,
      musicFile: null,
      musicLoop: false
    };
  }

  function normalizeTransitionConfig(transition = {}) {
    const normalized = {
      ...getDefaultTransitionConfig(),
      ...transition
    };

    if (normalized.transitionDuration == null || Number.isNaN(normalized.transitionDuration)) {
      normalized.transitionDuration = normalized.duration || 0;
    }

    if (normalized.duration == null || Number.isNaN(normalized.duration)) {
      normalized.duration = normalized.transitionDuration || 0;
    }

    return normalized;
  }

  function moveSlideModelWithinCanvas(draggedSlide, targetSlide, insertBefore) {
    if (!draggedSlide || !targetSlide || draggedSlide === targetSlide) {
      return;
    }

    const sourceParent = typeof draggedSlide.parent === "function" ? draggedSlide.parent() : null;
    const targetParent = typeof targetSlide.parent === "function" ? targetSlide.parent() : null;

    if (!sourceParent || sourceParent !== targetParent || typeof sourceParent.components !== "function") {
      return;
    }

    const collection = sourceParent.components();
    const draggedPosition = collection.indexOf(draggedSlide);
    let targetPosition = collection.indexOf(targetSlide);

    if (draggedPosition < 0 || targetPosition < 0) {
      return;
    }

    if (draggedPosition < targetPosition) {
      targetPosition -= 1;
    }

    if (!insertBefore) {
      targetPosition += 1;
    }

    if (typeof draggedSlide.move === "function") {
      draggedSlide.move(sourceParent, { at: targetPosition });
      return;
    }

    const draggedId = typeof draggedSlide.getId === "function"
      ? draggedSlide.getId()
      : draggedSlide.getAttributes?.().id;
    const cssComposer = editor && editor.CssComposer;
    const idRule = draggedId && cssComposer && typeof cssComposer.getIdRule === "function"
      ? cssComposer.getIdRule(draggedId)
      : null;
    const idRuleStyle = idRule && typeof idRule.getStyle === "function"
      ? { ...idRule.getStyle() }
      : null;

    collection.remove(draggedSlide);
    collection.add(draggedSlide, { at: targetPosition });

    if (draggedId && idRuleStyle && cssComposer && typeof cssComposer.setRule === "function") {
      cssComposer.setRule(`#${draggedId}`, idRuleStyle);
    }
  }

  function createSlides(numPages, width, height) {
    window.presentationState.slides = slides;

    for (let i = 1; i <= numPages; i++) {
      let slide = editor.Components.addComponent({
        tagName: "div",
        attributes: {
          "data-slide": i,
          "data-transition-type": "none",
          "data-transition-duration": "0",
          "data-transition-direction": "none",
          "data-slide-input": "False",
        },
        content: ``,
        style: {
          width,
          height,
          border: "1px solid #ccc",
          textAlign: "center",
          lineHeight: height,
          backgroundColor: "#f4f4f4",
          display: i === 1 ? "block" : "none",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          ...(globalSlideSpacing.padding ? { padding: globalSlideSpacing.padding } : {}),
          ...(globalSlideSpacing.margin ? { margin: globalSlideSpacing.margin } : {}),
        },
      });

      transitions[i] = getDefaultTransitionConfig();
      slides.push(slide);
    }
    createThumbnailContainer(numPages, width, height);
  }

  function createThumbnailContainer(numPages, width, height) {
    const existingContainer = document.getElementById('slides-thumbnails');
    if (existingContainer) {
      existingContainer.remove();
    }

    const slidesContainer = document.createElement("div");
    slidesContainer.id = "slides-thumbnails";
    slidesContainer.style.position = "sticky";
    slidesContainer.style.bottom = "0";
    slidesContainer.style.left = "0";
    slidesContainer.style.width = "82.9%";
    slidesContainer.style.zIndex = "999";
    slidesContainer.style.display = "flex";
    slidesContainer.style.overflowX = "auto";
    slidesContainer.style.background = "#f9f9f9";
    slidesContainer.style.padding = "10px 15px";
    slidesContainer.style.border = "1px solid #ccc";
    slidesContainer.style.alignItems = "center";
    let draggedThumbnail = null;
    const blurEffect = document.createElement('style');
    blurEffect.innerHTML = `
      .thumbnail::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png') center center no-repeat;
        background-size: cover;
        filter: blur(1.5px);
        z-index: -1;
      }
    `;
    if (!document.getElementById('thumbnail-blur-style')) {
      blurEffect.id = 'thumbnail-blur-style';
      document.head.appendChild(blurEffect);
    }

    function getThumbnailElements() {
      return Array.from(slidesContainer.querySelectorAll(".thumbnail"));
    }

    function clearThumbnailDropIndicators() {
      getThumbnailElements().forEach((thumb) => {
        thumb.classList.remove("drop-before", "drop-after");
      });
    }

    function captureSlideMetadata() {
      const metadata = new Map();

      slides.forEach((slide, index) => {
        metadata.set(slide, {
          transition: normalizeTransitionConfig(transitions[index + 1]),
          clickState: !!clickStates[index + 1],
          thumbnailName: thumbnailNames[index + 1],
          style: typeof slide.getStyle === "function" ? { ...slide.getStyle() } : null
        });
      });

      return metadata;
    }

    function rebuildSlideState(metadata = captureSlideMetadata()) {
      const nextTransitions = {};
      const nextClickStates = {};
      const nextThumbnailNames = {};

      slides.forEach((slide, index) => {
        const slideIndex = index + 1;
        const previousState = metadata.get(slide) || {};
        const transition = normalizeTransitionConfig(previousState.transition);

        nextTransitions[slideIndex] = transition;
        nextClickStates[slideIndex] = !!previousState.clickState;

        if (previousState.thumbnailName) {
          nextThumbnailNames[slideIndex] = previousState.thumbnailName;
        }

        if (previousState.style && typeof slide.setStyle === "function") {
          slide.setStyle(previousState.style, { silent: true });
        }

        slide.addAttributes({
          "data-slide": slideIndex
        });
      });

      transitions = nextTransitions;
      clickStates = nextClickStates;
      thumbnailNames = nextThumbnailNames;
      window.transitions = transitions;
      window.thumbnailNames = thumbnailNames;
      window.presentationState.slides = slides;

      slides.forEach((_, index) => {
        updateSlideAttributes(index + 1);
      });
    }

    function createDeleteButton(thumbnail) {
      const deleteBtn = document.createElement("div");
      deleteBtn.innerHTML = "&times;";
      deleteBtn.className = "delete-btn";
      deleteBtn.style.position = "absolute";
      deleteBtn.style.top = "1px";
      deleteBtn.style.right = "4px";
      deleteBtn.style.fontSize = "23px";
      deleteBtn.style.color = "#000000";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.zIndex = "10";
      deleteBtn.title = "Delete Slide";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this slide?")) return;

        const index = parseInt(thumbnail.getAttribute("data-slide-index"), 10);
        const activeSlide = slides[currentSlideIndex - 1];
        const removedSlide = slides[index - 1];
        const metadata = captureSlideMetadata();

        if (!removedSlide) {
          return;
        }

        metadata.delete(removedSlide);
        removedSlide.remove();
        slides.splice(index - 1, 1);
        thumbnail.remove();
        rebuildSlideState(metadata);

        if (!slides.length) {
          currentSlideIndex = 1;
          window.presentationState.currentSlideIndex = currentSlideIndex;
          return;
        }

        if (activeSlide && slides.includes(activeSlide)) {
          currentSlideIndex = slides.indexOf(activeSlide) + 1;
        } else {
          currentSlideIndex = Math.min(index, slides.length);
        }

        renderThumbnails();
        window.presentationState.currentSlideIndex = currentSlideIndex;
        switchSlide(currentSlideIndex);
      });

      return deleteBtn;
    }

    function createThumbnail(slideIndex) {
      const thumbnail = document.createElement("div");
      thumbnail.innerText = thumbnailNames[slideIndex] || `Page ${slideIndex}`;
      thumbnail.classList.add("thumbnail");
      thumbnail.setAttribute("data-slide-index", slideIndex);
      thumbnail.style.width = "80px";
      thumbnail.style.height = "60px";
      thumbnail.style.border = "1px solid #888";
      thumbnail.style.cursor = "pointer";
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.position = "relative";
      thumbnail.style.fontSize = "16px";
      thumbnail.style.fontWeight = "bold";
      thumbnail.style.color = "#333";
      thumbnail.style.borderRadius = "6px";
      thumbnail.style.marginRight = "10px";
      thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      thumbnail.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
      thumbnail.style.backgroundSize = "cover";
      thumbnail.style.backgroundPosition = "center";
      thumbnail.draggable = true;

      clickStates[slideIndex] = clickStates[slideIndex] || false;
      thumbnail.appendChild(createDeleteButton(thumbnail));

      thumbnail.addEventListener("mouseenter", () => {
        thumbnail.style.transform = "scale(1.1)";
        thumbnail.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
      });

      thumbnail.addEventListener("mouseleave", () => {
        thumbnail.style.transform = "scale(1)";
        thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      });

      thumbnail.addEventListener("click", () => {
        const index = parseInt(thumbnail.getAttribute("data-slide-index"), 10);
        if (currentSlideIndex === index) {
          askTransitionSettings(index);
        } else {
          editor.Modal.close();
          switchSlide(index);
        }
        clickStates[index] = !clickStates[index];
      });

      thumbnail.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const liveSlideIndex = parseInt(thumbnail.getAttribute("data-slide-index"), 10);
        const currentName = thumbnailNames[liveSlideIndex] || `Page ${liveSlideIndex}`;

        const input = document.createElement("input");
        input.type = "text";
        input.value = currentName;
        input.style.width = "70px";
        input.style.textAlign = "center";
        input.style.fontSize = "14px";
        input.style.fontWeight = "bold";
        input.style.border = "1px solid #007bff";
        input.style.borderRadius = "3px";

        const existingDeleteBtn = thumbnail.querySelector('.delete-btn');
        thumbnail.innerHTML = "";
        thumbnail.appendChild(input);
        input.focus();
        input.select();

        const saveEdit = () => {
          const latestSlideIndex = parseInt(thumbnail.getAttribute("data-slide-index"), 10);
          const newName = input.value.trim() || `Page ${latestSlideIndex}`;
          thumbnailNames[latestSlideIndex] = newName;
          thumbnail.innerHTML = newName;

          if (existingDeleteBtn) {
            thumbnail.appendChild(existingDeleteBtn);
          }
        };

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keypress", (evt) => {
          if (evt.key === "Enter") {
            saveEdit();
          }
        });
      });

      thumbnail.addEventListener("dragstart", (e) => {
        draggedThumbnail = thumbnail;
        thumbnail.classList.add("dragging-thumbnail");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", thumbnail.getAttribute("data-slide-index") || "");
      });

      thumbnail.addEventListener("dragover", (e) => {
        if (!draggedThumbnail || draggedThumbnail === thumbnail) {
          return;
        }

        e.preventDefault();
        clearThumbnailDropIndicators();
        const rect = thumbnail.getBoundingClientRect();
        const insertBefore = e.clientX < rect.left + rect.width / 2;
        thumbnail.classList.add(insertBefore ? "drop-before" : "drop-after");
      });

      thumbnail.addEventListener("dragleave", () => {
        thumbnail.classList.remove("drop-before", "drop-after");
      });

      thumbnail.addEventListener("drop", (e) => {
        e.preventDefault();
        clearThumbnailDropIndicators();

        if (!draggedThumbnail || draggedThumbnail === thumbnail) {
          return;
        }

        const fromIndex = parseInt(draggedThumbnail.getAttribute("data-slide-index"), 10);
        const targetIndex = parseInt(thumbnail.getAttribute("data-slide-index"), 10);

        if (!fromIndex || !targetIndex || fromIndex === targetIndex) {
          return;
        }

        const rect = thumbnail.getBoundingClientRect();
        const insertBefore = e.clientX < rect.left + rect.width / 2;
        const targetSlide = slides[targetIndex - 1];
        const activeSlide = slides[currentSlideIndex - 1];
        const metadata = captureSlideMetadata();
        const [movedSlide] = slides.splice(fromIndex - 1, 1);

        if (!movedSlide) {
          return;
        }

        let destinationIndex = insertBefore ? targetIndex - 1 : targetIndex;
        if (fromIndex - 1 < destinationIndex) {
          destinationIndex -= 1;
        }

        slides.splice(destinationIndex, 0, movedSlide);
        moveSlideModelWithinCanvas(movedSlide, targetSlide, insertBefore);
        rebuildSlideState(metadata);

        if (activeSlide && slides.includes(activeSlide)) {
          currentSlideIndex = slides.indexOf(activeSlide) + 1;
        } else {
          currentSlideIndex = destinationIndex + 1;
        }

        renderThumbnails();
        window.presentationState.currentSlideIndex = currentSlideIndex;
        switchSlide(currentSlideIndex);
      });

      thumbnail.addEventListener("dragend", () => {
        clearThumbnailDropIndicators();
        if (draggedThumbnail) {
          draggedThumbnail.classList.remove("dragging-thumbnail");
        }
        draggedThumbnail = null;
      });

      return thumbnail;
    }

    let addSlideBtn = document.createElement("div");
    addSlideBtn.innerText = "+";
    addSlideBtn.style.width = "60px";
    addSlideBtn.style.height = "60px";
    addSlideBtn.style.display = "flex";
    addSlideBtn.style.alignItems = "center";
    addSlideBtn.style.justifyContent = "center";
    addSlideBtn.style.fontSize = "32px";
    addSlideBtn.style.color = "#007bff";
    addSlideBtn.style.border = "2px dashed #007bff";
    addSlideBtn.style.borderRadius = "8px";
    addSlideBtn.style.cursor = "pointer";
    addSlideBtn.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
    addSlideBtn.title = "Add New Slide";
    addSlideBtn.addEventListener("mouseenter", () => {
      addSlideBtn.style.transform = "scale(1.1)";
    });
    addSlideBtn.addEventListener("mouseleave", () => {
      addSlideBtn.style.transform = "scale(1)";
    });

    function renderThumbnails() {
      getThumbnailElements().forEach((thumb) => thumb.remove());

      slides.forEach((_, index) => {
        const thumbnail = createThumbnail(index + 1);
        if (index + 1 === currentSlideIndex) {
          thumbnail.classList.add("active-thumbnail");
        }
        slidesContainer.insertBefore(thumbnail, addSlideBtn);
      });
    }

    addSlideBtn.addEventListener("click", () => {
      const newIndex = slides.length + 1;
      const slide = editor.Components.addComponent({
        tagName: "div",
        attributes: {
          "data-slide": newIndex,
          "data-transition-type": "none",
          "data-transition-duration": "0",
          "data-transition-direction": "none",
          "data-slide-input": "False",
        },
        content: ``,
        style: {
          width,
          height,
          border: "1px solid #ccc",
          textAlign: "center",
          lineHeight: height,
          backgroundColor: "#f4f4f4",
          display: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          ...(globalSlideSpacing.padding ? { padding: globalSlideSpacing.padding } : {}),
          ...(globalSlideSpacing.margin ? { margin: globalSlideSpacing.margin } : {}),
        },
      });

      transitions[newIndex] = getDefaultTransitionConfig();
      slides.push(slide);
      clickStates[newIndex] = false;
      window.presentationState.slides = slides;
      renderThumbnails();
    });

    slidesContainer.appendChild(addSlideBtn);
    renderThumbnails();
    document.body.appendChild(slidesContainer);

    const iframe = document.querySelector("iframe.i_designer-frame");
    if (iframe) {
      iframe.style.height = "89.16%";
      iframe.style.margin = "0";
    }
    document.body.style.overflow = "hidden";

    const videoInComponent = editor.getWrapper().find('[data-i_designer-type="videoIn"]');
    if (videoInComponent.length > 0 || slides.length > 0) {
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.className = "btn btn-success";
      downloadBtn.style.marginLeft = "65px";
      downloadBtn.style.padding = "12px 24px";
      downloadBtn.style.fontSize = "16px";
      downloadBtn.style.borderRadius = "8px";
      downloadBtn.style.backgroundColor = "#28a745";
      downloadBtn.style.color = "#fff";
      downloadBtn.style.border = "none";
      downloadBtn.style.cursor = "pointer";
      downloadBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease";
      const previewBtn = document.createElement("button");
      previewBtn.textContent = "Preview";
      previewBtn.className = "btn btn-warning";
      previewBtn.style.marginLeft = "15px";
      previewBtn.style.padding = "12px 24px";
      previewBtn.style.fontSize = "16px";
      previewBtn.style.borderRadius = "8px";
      previewBtn.style.backgroundColor = "#ff9800";
      previewBtn.style.color = "#fff";
      previewBtn.style.border = "none";
      previewBtn.style.cursor = "pointer";
      previewBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease";
      const spacingBtn = document.createElement("button");
      spacingBtn.textContent = "All Slide Spacing";
      spacingBtn.className = "btn btn-secondary";
      spacingBtn.style.marginLeft = "15px";
      spacingBtn.style.padding = "12px 24px";
      spacingBtn.style.fontSize = "16px";
      spacingBtn.style.borderRadius = "8px";
      spacingBtn.style.backgroundColor = "#6c757d";
      spacingBtn.style.color = "#fff";
      spacingBtn.style.border = "none";
      spacingBtn.style.cursor = "pointer";
      spacingBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease";
      const checkboxContainer = document.createElement("div");
      checkboxContainer.style.display = "inline-flex";
      checkboxContainer.style.alignItems = "center";
      checkboxContainer.style.marginLeft = "20px";
      const thumbnailCheckbox = document.createElement("input");
      thumbnailCheckbox.type = "checkbox";
      thumbnailCheckbox.id = "hideThumbnails";
      thumbnailCheckbox.style.marginRight = "8px";
      thumbnailCheckbox.style.cursor = "pointer";
      const checkboxLabel = document.createElement("label");
      checkboxLabel.htmlFor = "hideThumbnails";
      checkboxLabel.textContent = "Hide Thumbnails";
      checkboxLabel.style.cursor = "pointer";
      checkboxLabel.style.fontSize = "14px";
      checkboxLabel.style.color = "#333";
      checkboxContainer.appendChild(thumbnailCheckbox);
      checkboxContainer.appendChild(checkboxLabel);
      slidesContainer.appendChild(checkboxContainer);
      slidesContainer.appendChild(downloadBtn);
      slidesContainer.appendChild(previewBtn);
      slidesContainer.appendChild(spacingBtn);
      const uploadSoundBtn = document.createElement("button");
      uploadSoundBtn.textContent = "Upload Sound";
      uploadSoundBtn.className = "btn btn-info";
      uploadSoundBtn.style.marginLeft = "20px";
      uploadSoundBtn.style.padding = "12px 24px";
      uploadSoundBtn.style.fontSize = "16px";
      uploadSoundBtn.style.borderRadius = "8px";
      uploadSoundBtn.style.backgroundColor = "#17a2b8";
      uploadSoundBtn.style.color = "#fff";
      uploadSoundBtn.style.border = "none";
      uploadSoundBtn.style.cursor = "pointer";
      uploadSoundBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease";
      uploadSoundBtn.addEventListener("mouseenter", () => {
        uploadSoundBtn.style.backgroundColor = "#138496";
        uploadSoundBtn.style.transform = "scale(1.05)";
      });

      uploadSoundBtn.addEventListener("mouseleave", () => {
        uploadSoundBtn.style.backgroundColor = "#17a2b8";
        uploadSoundBtn.style.transform = "scale(1)";
      });

      uploadSoundBtn.onclick = () => {
        askForSoundFile();
      };

      slidesContainer.appendChild(uploadSoundBtn);

      downloadBtn.onclick = () => {
        const hideThumbnails = document.getElementById("hideThumbnails").checked;
        generateInteractiveSlideshowHTML(hideThumbnails);
      };

      previewBtn.onclick = async () => {
        const hideThumbnails = document.getElementById("hideThumbnails").checked;
        const previewWindow = window.open("", "interactiveSlideshowPreview", "width=1400,height=900,scrollbars=yes,resizable=yes");

        if (!previewWindow) {
          alert("Preview popup was blocked. Please allow popups and try again.");
          return;
        }

        previewWindow.document.open();
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Preparing Preview...</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #111827;
                color: #ffffff;
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            <div>Preparing interactive slideshow preview...</div>
          </body>
          </html>
        `);
        previewWindow.document.close();

        await previewInteractiveSlideshowHTML(hideThumbnails, previewWindow);
      };

      spacingBtn.onclick = () => {
        openAllSlidesSpacingModal();
      };

      downloadBtn.addEventListener("mouseenter", () => {
        downloadBtn.style.backgroundColor = "#218838";
        downloadBtn.style.transform = "scale(1.05)";
      });

      downloadBtn.addEventListener("mouseleave", () => {
        downloadBtn.style.backgroundColor = "#28a745";
        downloadBtn.style.transform = "scale(1)";
      });

      previewBtn.addEventListener("mouseenter", () => {
        previewBtn.style.backgroundColor = "#f57c00";
        previewBtn.style.transform = "scale(1.05)";
      });

      previewBtn.addEventListener("mouseleave", () => {
        previewBtn.style.backgroundColor = "#ff9800";
        previewBtn.style.transform = "scale(1)";
      });

      spacingBtn.addEventListener("mouseenter", () => {
        spacingBtn.style.backgroundColor = "#5a6268";
        spacingBtn.style.transform = "scale(1.05)";
      });

      spacingBtn.addEventListener("mouseleave", () => {
        spacingBtn.style.backgroundColor = "#6c757d";
        spacingBtn.style.transform = "scale(1)";
      });
    }
  }

  function switchSlide(index) {
    slides.forEach((slide, i) => {
      let el = slide.getEl();
      if (el) el.style.display = i + 1 === index ? "block" : "none";
    });
    currentSlideIndex = index;
    window.presentationState.currentSlideIndex = currentSlideIndex;
    const selectedSlide = slides[index - 1];
    if (selectedSlide) {
      editor.select(selectedSlide);
    }

    const allThumbnails = document.querySelectorAll(".thumbnail");
    allThumbnails.forEach((thumb) => {
      const idx = parseInt(thumb.getAttribute("data-slide-index"));
      thumb.classList.toggle("active-thumbnail", idx === index);
    });
  }

  function askTransitionSettings(slideIndex) {
    const transition = transitions[slideIndex] || {
      type: "none",
      duration: 0,
      direction: "none",
      slideTimer: 0,
      isHidden: false,
      wordToHide: "",
      slideInput: "False",
      hasMusic: false,
      musicFile: null,
      musicLoop: false
    };

    const slide = slides[slideIndex - 1];
    const slideEl = slide?.view?.el;
    const video = slideEl?.querySelector("video");
    const hasInputs = !!slideEl?.querySelector("input, select, textarea, [contenteditable='true']");

    editor.Modal.setTitle(`Transition for Slide ${slideIndex}`);
    editor.Modal.setContent(`
    <div>
      <label for="transitionType">Transition Type:</label>
      <select id="transitionType" class="form-control">
        <option value="none" ${transition.type === "none" ? "selected" : ""}>None</option>
        <option value="fade" ${transition.type === "fade" ? "selected" : ""}>Fade</option>
        <option value="slide" ${transition.type === "slide" ? "selected" : ""}>Slide</option>
        <option value="zoom" ${transition.type === "zoom" ? "selected" : ""}>Zoom</option>
      </select>

      <label for="transitionDuration" style="margin-top: 10px;">Transition Duration (seconds):</label>
      <input type="number" id="transitionDuration" class="form-control" min="0" step="0.1" value="${transition.duration || 0}" /><br>

      <label for="slideTimer" style="margin-top: 10px;">Slide Timer (seconds):</label>
      <input type="number" id="slideTimer" class="form-control" min="0" step="0.1" value="${transition.slideTimer || 0}" />

      <div id="directionField" style="display:${transition.type === "slide" ? "block" : "none"}; margin-top: 10px;">
        <label for="transitionDirection">Direction:</label>
        <select id="transitionDirection" class="form-control">
          <option value="left" ${transition.direction === "left" ? "selected" : ""}>Left</option>
          <option value="right" ${transition.direction === "right" ? "selected" : ""}>Right</option>
          <option value="up" ${transition.direction === "up" ? "selected" : ""}>Up</option>
          <option value="down" ${transition.direction === "down" ? "selected" : ""}>Down</option>
        </select>
      </div>

      <label for="hideSlide" style="margin-top: 10px;">
        <input type="checkbox" id="hideSlide" ${transition.isHidden ? "checked" : ""} />
        Hide Slide in Downloaded Slideshow
      </label>

      <div id="wordToHideDiv" style="display:${transition.isHidden ? "block" : "none"}; margin-top: 10px;">
        <label for="wordToHide">Enter word to hide this slide:</label>
        <input type="text" id="wordToHide" class="form-control" value="${transition.wordToHide || ""}" />
      </div>

      ${hasInputs ? `
        <label style="margin-top: 10px;">
          <input type="checkbox" id="stopOnInput" ${transition.slideInput === "True" ? "checked" : ""} />
          Stop on Input Fields
        </label>
      ` : ""}
      <hr style="margin: 20px 0;">
      <h5>Slide Music</h5>
      
      <label for="addMusic" style="margin-top: 10px;">
        <input type="checkbox" id="addMusic" ${transition.hasMusic ? "checked" : ""} />
        Add Music to This Slide
      </label>

      <div id="musicOptions" style="display:${transition.hasMusic ? "block" : "none"}; margin-top: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <label for="musicFile">Select Audio File:</label>
        <input type="file" id="musicFile" class="form-control" accept="audio/*" style="margin-top: 5px;" />
        
        <div style="margin-top: 10px;">
          <label>Playback Mode:</label><br>
          <label style="margin-right: 15px;">
            <input type="radio" name="musicMode" value="single" ${!transition.musicLoop ? "checked" : ""} />
            Play Once
          </label>
          <label>
            <input type="radio" name="musicMode" value="loop" ${transition.musicLoop ? "checked" : ""} />
            Loop
          </label>
        </div>

        ${transition.musicFile ? `
          <div style="margin-top: 10px;">
            <small style="color: green;">✓ Music file already selected</small>
            <button type="button" id="testMusic" class="btn btn-sm btn-secondary" style="margin-left: 10px;">Test</button>
            <button type="button" id="removeMusic" class="btn btn-sm btn-danger" style="margin-left: 5px;">Remove</button>
          </div>
        ` : ""}
      </div>


      <div id="videoWarning" style="color:red;display:none;margin-top:10px;"></div>

      <button id="saveTransition" class="btn btn-primary" style="margin-top: 15px;">Save</button>
    </div>
  `);

    editor.Modal.open();

    document.getElementById("hideSlide").addEventListener("change", (e) => {
      document.getElementById("wordToHideDiv").style.display = e.target.checked ? "block" : "none";
    });

    document.getElementById("transitionType").addEventListener("change", (e) => {
      document.getElementById("directionField").style.display = e.target.value === "slide" ? "block" : "none";
    });

    document.getElementById("addMusic").addEventListener("change", (e) => {
      document.getElementById("musicOptions").style.display = e.target.checked ? "block" : "none";
    });

    const testMusicBtn = document.getElementById("testMusic");
    if (testMusicBtn) {
      testMusicBtn.addEventListener("click", () => {
        if (transition.musicFile) {
          const testAudio = new Audio(`data:audio/mp3;base64,${transition.musicFile}`);
          testAudio.volume = 0.5;
          testAudio.play().catch(e => console.log("Test audio failed:"));
          setTimeout(() => {
            testAudio.pause();
            testAudio.currentTime = 0;
          }, 3000);
        }
      });
    }

    const removeMusicBtn = document.getElementById("removeMusic");
    if (removeMusicBtn) {
      removeMusicBtn.addEventListener("click", () => {
        transition.musicFile = null;
        transition.hasMusic = false;
        document.getElementById("addMusic").checked = false;
        document.getElementById("musicOptions").style.display = "none";
        alert("Music removed from this slide.");
      });
    }

    const slideTimerInput = document.getElementById("slideTimer");
    const warning = document.getElementById("videoWarning");
    let videoDuration = 0;
    let timerAlreadyValid = !isNaN(transition.slideTimer) && transition.slideTimer > 0;

    if (video) {
      const updateIfValid = () => {
        if (!isNaN(video.duration) && isFinite(video.duration) && video.duration > 0) {
          videoDuration = video.duration;
          if (!timerAlreadyValid || parseFloat(slideTimerInput.value) <= videoDuration) {
            slideTimerInput.value = videoDuration.toFixed(1);
          }
          slideTimerInput.min = videoDuration.toFixed(1);
          warning.style.display = "block";
          warning.innerText = `This slide contains a video of ${videoDuration.toFixed(1)}s. Slide timer must be ≥ video length.`;
        }
      };

      if (video.readyState >= 1) {
        updateIfValid();
      } else {
        video.addEventListener("loadedmetadata", updateIfValid);
        try {
          video.play().then(() => video.pause()).catch(() => { });
        } catch (e) { }
      }
    }

    document.getElementById("saveTransition").addEventListener("click", () => {
      const slideTimer = parseFloat(slideTimerInput.value);
      if (video && videoDuration > 0 && slideTimer < videoDuration) {
        alert(`Slide timer must be at least ${videoDuration.toFixed(1)} seconds due to embedded video.`);
        return;
      }
      saveTransition(slideIndex, hasInputs);
    });
  }

  function saveTransition(slideIndex, hasInputs) {
    const type = document.getElementById("transitionType").value;
    let transitionDuration = parseFloat(document.getElementById("transitionDuration").value);
    let slideTimer = parseFloat(document.getElementById("slideTimer").value);
    const direction = type === "slide" ? document.getElementById("transitionDirection").value : "none";
    const isHidden = document.getElementById("hideSlide").checked;
    const wordToHide = document.getElementById("wordToHide").value.trim();
    const inputCheckbox = document.getElementById("stopOnInput");
    const slideInput = hasInputs && inputCheckbox?.checked ? "True" : "False";
    const hasMusic = document.getElementById("addMusic").checked;
    const musicLoop = hasMusic ? document.querySelector('input[name="musicMode"]:checked').value === "loop" : false;
    const musicFileInput = document.getElementById("musicFile");

    if (isNaN(transitionDuration)) transitionDuration = 0;
    if (isNaN(slideTimer)) slideTimer = 0;
    if (hasMusic && musicFileInput.files.length > 0) {
      const file = musicFileInput.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const base64String = e.target.result.split(',')[1];
        transitions[slideIndex] = {
          type,
          transitionDuration,
          direction,
          slideTimer,
          isHidden,
          wordToHide: wordToHide || "",
          slideInput,
          hasMusic,
          musicFile: base64String,
          musicLoop
        };

        window.transitions = transitions;
        updateSlideAttributes(slideIndex);
        editor.Modal.close();
        switchSlide(currentSlideIndex);
      };

      reader.readAsDataURL(file);
    } else {
      transitions[slideIndex] = {
        type,
        transitionDuration,
        direction,
        slideTimer,
        isHidden,
        wordToHide: wordToHide || "",
        slideInput,
        hasMusic,
        musicFile: hasMusic ? (transitions[slideIndex].musicFile || null) : null,
        musicLoop
      };

      window.transitions = transitions;

      updateSlideAttributes(slideIndex);
      editor.Modal.close();
      switchSlide(currentSlideIndex);
    }
  }

  function updateSlideAttributes(slideIndex) {
    const slide = slides[slideIndex - 1];
    const transition = transitions[slideIndex];

    if (slide) {
      slide.addAttributes({
        "data-transition-type": transition.type,
        "data-transition-duration": transition.transitionDuration,
        "data-transition-direction": transition.direction,
        "data-slide-timer": transition.slideTimer,
        "data-hide": transition.isHidden ? "true" : "false",
        "data-word-to-hide": transition.wordToHide || "",
        "data-slide-input": transition.slideInput,
        "data-has-music": transition.hasMusic ? "true" : "false",
        "data-music-loop": transition.musicLoop ? "true" : "false"
      });
    }
  }

  let slideshowSoundPath = null;

  function askForSoundFile() {
    editor.Modal.setTitle("Add Background Sound");
    editor.Modal.setContent(`
    <div>
      <label for="soundFilePath">Sound File Path (.mp3):</label>
      <input type="text" id="soundFilePath" class="form-control" placeholder="Enter local file path or server URL" value="${slideshowSoundPath || ''}" style="margin-top: 10px;" />
      <small class="form-text text-muted">Example: ./sounds/background.mp3 or https://example.com/audio.mp3</small>
      
      <div style="margin-top: 15px;">
        <button id="testSound" class="btn btn-secondary" style="margin-right: 10px;">Test Sound</button>
        <button id="removeSoundBtn" class="btn btn-danger" style="margin-right: 10px;">Remove Sound</button>
        <button id="confirmSound" class="btn btn-primary">Confirm</button>
      </div>
    </div>
  `);

    editor.Modal.open();

    document.getElementById("testSound").addEventListener("click", () => {
      const soundPath = document.getElementById("soundFilePath").value.trim();
      if (soundPath) {
        const testAudio = new Audio(soundPath);
        testAudio.volume = 0.5;
        testAudio.play().catch(e => {
          alert("Cannot play audio. Please check the file path.");
        });

        setTimeout(() => {
          testAudio.pause();
          testAudio.currentTime = 0;
        }, 3000);
      } else {
        alert("Please enter a sound file path first.");
      }
    });

    document.getElementById("removeSoundBtn").addEventListener("click", () => {
      slideshowSoundPath = null;
      window.slideshowSoundPath = null;
      document.getElementById("soundFilePath").value = "";
      alert("Background sound removed.");
    });

    document.getElementById("confirmSound").addEventListener("click", () => {
      const soundPath = document.getElementById("soundFilePath").value.trim();
      if (soundPath) {
        slideshowSoundPath = soundPath;
        window.slideshowSoundPath = soundPath;
        alert("Background sound added successfully!");
      } else {
        slideshowSoundPath = null;
        window.slideshowSoundPath = null;
      }
      editor.Modal.close();
    });
  }

  function extractInteractiveLoadingConfig(editorHtml, iframeDoc) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorHtml || "", "text/html");
    const loaderEl =
      iframeDoc?.getElementById("interactive-designer-loader") ||
      doc.getElementById("interactive-designer-loader");
    const loaderScript =
      iframeDoc?.getElementById("interactive-designer-script-loader") ||
      doc.getElementById("interactive-designer-script-loader");

    if (!loaderEl && !loaderScript) {
      return null;
    }

    const styleCandidates = [];
    if (loaderEl?.getAttribute("style")) {
      styleCandidates.push(loaderEl.getAttribute("style"));
    }
    if (loaderEl?.style?.cssText) {
      styleCandidates.push(loaderEl.style.cssText);
    }
    if (loaderEl?.style?.background) {
      styleCandidates.push(loaderEl.style.background);
    }
    if (loaderEl && iframeDoc?.defaultView?.getComputedStyle) {
      const computedStyle = iframeDoc.defaultView.getComputedStyle(loaderEl);
      if (computedStyle?.background) {
        styleCandidates.push(computedStyle.background);
      }
      if (computedStyle?.backgroundImage) {
        styleCandidates.push(computedStyle.backgroundImage);
      }
      if (computedStyle?.backgroundColor && computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
        styleCandidates.push(computedStyle.backgroundColor);
      }
    }

    const scriptText = loaderScript?.textContent || "";
    if (scriptText) {
      styleCandidates.push(scriptText);
    }

    let gifDataUrl = null;
    let backgroundColor = localStorage.getItem("page-load-color") || "#472e90";

    styleCandidates.some((styleText) => {
      if (!styleText) {
        return false;
      }

      const gifMatch = styleText.match(/url\((["']?)(data:image\/gif;base64,[^"')]+)\1\)/i);
      if (gifMatch?.[2]) {
        gifDataUrl = gifMatch[2];
      }

      if (!backgroundColor || backgroundColor === "No" || backgroundColor === "#472e90") {
        const colorMatch = styleText.match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\))/i);
        if (colorMatch?.[1]) {
          backgroundColor = colorMatch[1];
        }
      }

      return !!gifDataUrl;
    });

    if (!gifDataUrl && scriptText) {
      const fallbackGifMatch = scriptText.match(/url\((data:image\/gif;base64,[^)]+)\)/i);
      if (fallbackGifMatch?.[1]) {
        gifDataUrl = fallbackGifMatch[1];
      }
    }

    if (!gifDataUrl) {
      return null;
    }

    return {
      gifDataUrl,
      backgroundColor: backgroundColor && backgroundColor !== "No" ? backgroundColor : "#472e90",
      durationMs: 10000
    };
  }

  async function buildInteractiveSlideshowHTML(hideThumbnails = false) {
    const uploadedId = localStorage.getItem('uploadedFileId');
    const iframe = document.querySelector('#editor iframe');
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    const slideElements = iframeDoc?.querySelectorAll('[data-slide]');

    if (!slideElements?.length) {
      alert('No slides found!');
      return null;
    }

    const slideData = [];
    const editorHtml = editor.getHtml();
    const editorCss = editor.getCss();
    const loadingConfig = extractInteractiveLoadingConfig(editorHtml, iframeDoc);

    const styles = (editor.canvas && editor.canvas.styles) || [];
    const scripts = (editor.canvas && editor.canvas.scripts) || [];

    for (let i = 0; i < slideElements.length; i++) {
      const el = slideElements[i];
      const slideIndex = i + 1;

      slideElements.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none');
      await new Promise(r => setTimeout(r, 800));
      const computed = getComputedStyle(el);
      const width = parseFloat(computed.width);
      const height = parseFloat(computed.height);
      const img = encodeURIComponent(el.innerHTML);
      const transition = parseFloat(el.getAttribute("data-transition-duration")) || 0;
      const display = parseFloat(el.getAttribute("data-slide-timer")) || 1;
      const type = el.getAttribute("data-transition-type") || "fade";
      const dir = el.getAttribute("data-transition-direction") || "left";
      const backgroundColor = computed.backgroundColor || "#fff";
      const isHidden = el.getAttribute("data-hide") === "true";
      const wordToHide = el.getAttribute("data-word-to-hide") || "";
      const slideInput = el.getAttribute("data-slide-input");
      const hasMusic = el.getAttribute("data-has-music") === "true";
      const musicLoop = el.getAttribute("data-music-loop") === "true";
      const musicFile = hasMusic ? transitions[slideIndex]?.musicFile : null;
      const videoElement = el.querySelector('video');
      const hasVideo = videoElement !== null;
      let videoSrc = null;

      if (hasVideo) {
        videoSrc = videoElement.getAttribute('src') ||
          (videoElement.querySelector('source') ? videoElement.querySelector('source').getAttribute('src') : null);
      }

      if (isHidden && !wordToHide) {
        continue;
      }

      if (isHidden && wordToHide) {
        const jsonDataString = localStorage.getItem("common_json");
        const jsonData = JSON.parse(jsonDataString || "{}");
        const custom_language = localStorage.getItem("language") || "english";
        const divs = el.querySelectorAll("div[id]");
        let matchFound = false;

        divs.forEach((div) => {
          const divId = div.id;
          const styleContent = editor.getCss();
          const regex = new RegExp(`#${divId}\\s*{[^}]*my-input-json:\\s*([^;]+);`, "i");
          const match = regex.exec(styleContent);

          if (match) {
            const jsonKey = match[1].trim();
            const value = jsonData?.[custom_language]?.[jsonKey];
            if (typeof value === "string" && value.includes(wordToHide)) {
              matchFound = true;
            }
          }
        });

        if (matchFound) {
          continue;
        }
      }

      slideData.push({
        img,
        width,
        height,
        transition,
        display,
        type,
        dir,
        backgroundColor,
        hasVideo,
        videoSrc,
        slideInput,
        hasMusic,
        musicFile,
        musicLoop
      });
    }

    const totalDuration = slideData.reduce((acc, s) => acc + s.transition + s.display, 0);
    const containsTable = editorHtml.includes('<table');
    const tableInitializationScript = containsTable ?
      `<script> 
          $(document).ready(function() { 
            $('table').DataTable({ 
              dom: 'Bfrtip', 
              buttons: ['copy', 'csv', 'excel', 'pdf', 'print'] 
            }); 
          }); 
        </script>` : '';


    const dragDropScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const buttons = document.querySelectorAll('[data-custom-input-button="true"]');
        buttons.forEach(button => {
          button.setAttribute('draggable', 'true');
          button.style.cursor = 'grab';
          button.addEventListener('dragstart', function(e) {
            const buttonData = {
              name: this.getAttribute('name') || '',
              value: this.getAttribute('value') || this.innerText,
              type: 'custom-button'
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(buttonData));
            e.dataTransfer.effectAllowed = 'copy';
            this.style.opacity = '0.7';
          });     
          button.addEventListener('dragend', function(e) {
            this.style.opacity = '';
          });
          button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.2s ease';
          });
          button.addEventListener('mouseleave', function() {
            this.style.transform = '';
          });
        });

        const dropzones = document.querySelectorAll('[data-custom-dropzone="true"]');
        dropzones.forEach(dropzone => {
          dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          });
          
          dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            
            try {
              const data = e.dataTransfer.getData('text/plain');
              let buttonInfo = JSON.parse(data);
              var dropzoneName = this.getAttribute('name');
              var buttonName = buttonInfo.name;

              if (buttonName !== dropzoneName) {
                alert('Error: Button name "' + buttonName + '" does not match dropzone name "' + dropzoneName + '"');
                return;
              }
              
              if (buttonInfo && buttonInfo.value) {
                this.value = buttonInfo.value;
                this.setAttribute('value', buttonInfo.value);
                this.dispatchEvent(new Event('change', { bubbles: true }));
                this.dispatchEvent(new Event('input', { bubbles: true }));
              }
            } catch (error) {
            }
          });
        });
      });
    </script>
    `;

    const headContent = [
      `<style>${editorCss}</style>`,
      ...styles.map(url => `<link rel="stylesheet" href="${url}">`),
      ...scripts.map(url => `<script src="${url}"></script>`),
      dragDropScript,
      tableInitializationScript
    ].join('');
    const fullHTML = `<!DOCTYPE html> 
    <html lang="en"> 
    <head> 
  <meta charset="UTF-8" /> 
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui"/>
  <title>Interactive Slideshow</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-fullscreen">
  ${headContent}
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"> 
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"> 
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css"> 
      <link rel="stylesheet" href="https://cdn.datatables.net/v/bs4/dt-1.13.2/datatables.min.css"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> 
      <link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"> 
      <link rel="stylesheet" href="https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"> 
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script> 
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script> 
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script> 
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script> 
      <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script> 
      <script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script> 
      <script src="https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js"></script> 
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js"></script> 
      <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js"></script> 
      <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js"></script> 
      <script src="https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js"></script> 
      <script src="https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js"></script> 
      <script src="https://code.highcharts.com/highcharts.js"></script> 
      <script src="https://code.highcharts.com/modules/drilldown.js"></script> 
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          document.addEventListener('submit', function(e) {
            var form = e.target;
            if (form.tagName === 'FORM') {
              e.preventDefault();
              
              var action = form.getAttribute('action');
              var method = form.getAttribute('method') || 'GET';
              var formData = new FormData(form);
              var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
              var originalText = '';
              if (submitBtn) {
                originalText = submitBtn.textContent || submitBtn.value;
                if (submitBtn.tagName === 'BUTTON') {
                  submitBtn.textContent = 'Sending...';
                } else {
                  submitBtn.value = 'Sending...';
                }
                submitBtn.disabled = true;
              }

              var data = {};
              formData.forEach(function(value, key) {
                data[key] = value;
              });

              if (action) {
                var xhr = new XMLHttpRequest();
                xhr.open(method.toUpperCase(), action, true);
                
                xhr.onload = function() {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                      var response = JSON.parse(xhr.responseText);
                      handleFormResponse(form, response);
                    } catch (e) {
                    }

                    form.dispatchEvent(new CustomEvent('formSubmitSuccess', {
                      detail: { response: xhr.responseText }
                    }));
                  } else {
                    alert('Form submission failed. Please try again.');
                    
                    form.dispatchEvent(new CustomEvent('formSubmitError', {
                      detail: { status: xhr.status, response: xhr.responseText }
                    }));
                  }

                  if (submitBtn) {
                    if (submitBtn.tagName === 'BUTTON') {
                      submitBtn.textContent = originalText;
                    } else {
                      submitBtn.value = originalText;
                    }
                    submitBtn.disabled = false;
                  }
                };
                
                xhr.onerror = function() {
                  alert('Network error. Please check your connection.');
                  if (submitBtn) {
                    if (submitBtn.tagName === 'BUTTON') {
                      submitBtn.textContent = originalText;
                    } else {
                      submitBtn.value = originalText;
                    }
                    submitBtn.disabled = false;
                  }
                };
                
                if (method.toUpperCase() === 'POST') {
                  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                  xhr.send(new URLSearchParams(data).toString());
                } else {
                  var params = new URLSearchParams(data).toString();
                  xhr.open('GET', action + (action.includes('?') ? '&' : '?') + params, true);
                  xhr.send();
                }
              }
            }
          });

          function handleFormResponse(form, response) {
            try {
              const formKey = form.getAttribute('id') || form.getAttribute('action') || 'global-form-response';
              sessionStorage.setItem('formResponse', JSON.stringify(response));
            } catch (e) {
            }
          }
        });
      </script>
<style> 
html, body { 
  margin: 0; 
  padding: 0; 
  background: #FFFFFF; 
  width: 100vw; 
  height: 100vh;
  overflow: hidden; 
  font-family: 'Roboto', sans-serif;
  position: fixed;
}

#slideshow-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

${loadingConfig ? `
#interactive-slideshow-loader {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: ${loadingConfig.backgroundColor} url('${loadingConfig.gifDataUrl}') no-repeat center center;
  background-size: min(320px, 42vw);
  opacity: 1;
  transition: opacity 0.45s ease;
}

#interactive-slideshow-loader.hidden {
  opacity: 0;
  pointer-events: none;
}
` : ''}

.slide {
  position: absolute;
  top: 50%; 
  left: 50%; 
  display: none; 
  opacity: 0; 
  transform: translate(-50%, -50%); 
  transition: opacity 0.5s ease, transform 0.5s ease;
  transform-origin: center center;
  overflow: hidden;
  will-change: transform, opacity;
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.slide > * {
  max-width: 100%;
  height: auto;
}

.slide img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Optimize video rendering on mobile */
.slide video {
  pointer-events: none;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
  display: block;
  will-change: transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.slide form,
.slide div {
  max-width: 100%;
  overflow: hidden;
}

.slide input,
.slide textarea,
.slide select,
.slide button {
  max-width: 100%;
  font-size: 1em;
}

.slide * {
  box-sizing: border-box;
  max-width: 100%;
}

.slide video::-webkit-media-controls {
  display: none !important;
}
      
      .slide video::-webkit-media-controls-panel {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-play-button {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-start-playback-button {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-timeline {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-current-time-display {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-time-remaining-display {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-mute-button {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-volume-slider {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-fullscreen-button {
        display: none !important;
      }
      
      .slide video::-webkit-media-controls-picture-in-picture-button {
        display: none !important;
      }
      
.controls { 
  position: fixed;
  bottom: 15px; 
  left: 50%; 
  transform: translateX(-50%); 
  display: flex; 
  gap: 15px; 
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
} 
      
      .controls.visible {
        opacity: 1;
      }
      
      .controls button { 
        width: 55px;
        height: 55px;
        font-size: 20px; 
        background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
        color: white; 
        border: none; 
        border-radius: 50%; 
        cursor: pointer; 
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2),
                    inset 0 2px 2px rgba(255,255,255,0.1);
      } 
      
      .controls button:hover {
        background: linear-gradient(145deg, #333333, #222222);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.25),
        inset 0 2px 2px rgba(255,255,255,0.1);
      }
      
      .controls button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      
      .controls button i {
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
#progressContainer { 
  position: fixed;
  bottom: 0; 
  left: 0; 
  width: 100vw;
  height: 10px; 
  background: rgba(0,0,0,0.3); 
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease, height 0.2s ease;
  z-index: 5;
}
      
      #progressContainer.visible {
        opacity: 1;
      }
      
      #progressContainer:hover {
        height: 16px;
      }
      
      #progressBar { 
        height: 100%; 
        width: 0%; 
        background: linear-gradient(90deg, #ff3636, #ff5252);
        box-shadow: 0 0 8px rgba(255,50,50,0.5);
        transition: width 0.2s linear; 
        position: relative; 
        z-index: 1; 
      } 
      
      #progressBar::after {
        content: '';
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        background: #ff3636;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255,50,50,0.8);
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      #progressContainer:hover #progressBar::after {
        opacity: 1;
      }
      
      .marker { 
        position: absolute; 
        top: 0; 
        bottom: 0; 
        width: 3px; 
        background-color: white; 
        z-index: 2;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      } 
      

#timeLabel { 
  position: fixed;
  bottom: 20px; 
  right: 20px; 
  font-size: 14px; 
  color: #fff; 
  background: rgba(0,0,0,0.7);
  padding: 6px 10px;
  border-radius: 20px;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: 0;
  transition: opacity 0.3s ease;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  z-index: 10;
}  
      
      #timeLabel.visible {
        opacity: 1;
      }

#thumbnailContainer {
  position: fixed;
  bottom: 85px;
  left: 50%;
  transform: translateX(-50%);
  width: 90vw;
  max-width: 1200px;
  height: 90px;
  display: ${hideThumbnails ? 'none' : 'flex'}; 
  overflow-x: auto;
  padding: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) transparent;
  z-index: 4;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
}

      
      #thumbnailContainer::-webkit-scrollbar {
        height: 6px;
      }
      
      #thumbnailContainer::-webkit-scrollbar-track {
        background: transparent;
      }
      
      #thumbnailContainer::-webkit-scrollbar-thumb {
        background-color: rgba(255,255,255,0.3);
        border-radius: 6px;
      }
      
      #thumbnailContainer.visible {
        opacity: 1;
      }
      
      .thumbnail {
        min-width: 120px;
        height: 70px;
        margin: 0 6px;
        background-color: #000;
        background-image: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png');
        background-size: cover;
        background-position: center;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease, border-color 0.2s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }
      
      .thumbnail:hover {
        transform: scale(1.08);
        border-color: rgba(255,255,255,0.7);
      }
      
      .thumbnail.active {
        border: 3px solid #ff3636;
        box-shadow: 0 0 15px rgba(255, 50, 50, 0.5);
      }

      .thumbnail-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        color: white;
        font-size: 16px;
        padding: 5px 0;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      }

      @media (max-width: 768px) {
  .controls button {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
  
  #thumbnailContainer {
    bottom: 75px;
    height: 70px;
  }
  
  .thumbnail {
    min-width: 100px;
    height: 60px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  #thumbnailContainer {
    bottom: 65px;
    height: 60px;
  }
  
  .thumbnail {
    min-width: 80px;
    height: 50px;
  }
}
      </style> 
    </head> 
    <body> 
  ${loadingConfig ? `<div id="interactive-slideshow-loader" aria-hidden="true"></div>` : ''}
  <div id="slideshow-container">
    ${slideData.map((s, i) => `<div class="slide" id="slide-${i}" data-original-width="${s.width}" data-original-height="${s.height}" style="background-color:${s.backgroundColor};"> 
      ${decodeURIComponent(s.img)} 
    </div>`).join('')}
  </div>

  <div id="thumbnailContainer">
    ${slideData.map((s, i) => {
      const slideIndex = i + 1;
      const displayName = thumbnailNames[slideIndex] || `Slide ${slideIndex}`;
      return `<div class="thumbnail" id="thumb-${i}" onclick="jumpToSlide(${i})">
        <div class="thumbnail-label">${displayName}</div>
      </div>`;
    }).join('')}
  </div>

  ${slideshowSoundPath ? `<audio id="backgroundAudio" loop preload="auto"><source src="${slideshowSoundPath}" type="audio/mpeg"></audio>` : ''}
  
  <div class="controls"> 
    <button onclick="togglePlay()" id="playBtn"><i class="fas fa-pause"></i></button> 
  </div> 
  <div id="progressContainer" onclick="seek(event)"> 
    <div id="progressBar"></div> 
  </div> 
  <div id="timeLabel">00:00 / 00:00</div>
      
      <script> 
      const slides = [...document.querySelectorAll('.slide')];
    const thumbnails = [...document.querySelectorAll('.thumbnail')];
    const slideData = ${JSON.stringify(slideData)};
    // Handle tab visibility changes
let wasPlayingBeforeHidden = false;

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Tab is hidden
    wasPlayingBeforeHidden = playing;
    if (playing) {
      togglePlay();
    }
    
    // Stop all audio
    if (currentSlideAudio && !currentSlideAudio.paused) {
      currentSlideAudio.pause();
    }
    if (backgroundAudio && !backgroundAudio.paused) {
      backgroundAudio.pause();
    }
    
    // Pause all videos
    if (currentVideo && !currentVideo.paused) {
      currentVideo.pause();
    }
  } else {
    // Tab is visible again
    if (wasPlayingBeforeHidden) {
      setTimeout(() => {
        if (!playing) {
          togglePlay();
        }
      }, 100);
    }
  }
});

// Handle window blur (when clicking links)
window.addEventListener('blur', function() {
  if (playing) {
    wasPlayingBeforeHidden = true;
    togglePlay();
  }
});

window.addEventListener('focus', function() {
  if (wasPlayingBeforeHidden && !playing) {
    setTimeout(() => {
      togglePlay();
    }, 100);
    wasPlayingBeforeHidden = false;
  }
});
    const totalTime = ${totalDuration};
    const progressBar = document.getElementById("progressBar");
    const timeLabel = document.getElementById("timeLabel");
    const ID = ${uploadedId};
    const initialLoader = document.getElementById('interactive-slideshow-loader');
    const initialLoaderDuration = ${loadingConfig ? loadingConfig.durationMs : 0};
    let currentSlideAudio = null;
    let slideAudioStarted = false;

    function setupSlideAudio() {
      if (currentSlideAudio) {
        currentSlideAudio.pause();
        currentSlideAudio.currentTime = 0;
        currentSlideAudio = null;
        slideAudioStarted = false;
      }

      if (slideData[current].hasMusic && slideData[current].musicFile) {
        currentSlideAudio = new Audio(\`data:audio/mp3;base64,\${slideData[current].musicFile}\`);
        currentSlideAudio.volume = 0.7;
        currentSlideAudio.loop = slideData[current].musicLoop;
        
        // If we're in display phase and playing, start the audio
        if (playing && phase === 'display') {
          slideAudioStarted = true;
          currentSlideAudio.play().catch(e => console.log('Slide audio play failed:'));
        }
      }
    }

    function startSlideAudio() {
      if (currentSlideAudio && !slideAudioStarted && playing) {
        slideAudioStarted = true;
        currentSlideAudio.currentTime = 0;
        currentSlideAudio.play().catch(e => console.log('Slide audio play failed:'));
      }
    }

    function pauseSlideAudio() {
      if (currentSlideAudio && !currentSlideAudio.paused) {
        currentSlideAudio.pause();
      }
    }

    function resumeSlideAudio() {
      if (currentSlideAudio && slideAudioStarted && currentSlideAudio.paused) {
        currentSlideAudio.play().catch(e => console.log('Slide audio resume failed:'));
      }
    }

    function stopSlideAudio() {
      if (currentSlideAudio) {
        currentSlideAudio.pause();
        currentSlideAudio.currentTime = 0;
        slideAudioStarted = false;
      }
    }

    const backgroundAudio = document.getElementById('backgroundAudio');
    let backgroundAudioStarted = false;
      let currentVideo = null;
      let videoSyncMode = false;
      let videoStartTime = 0;
      let slideDisplayStartTime = 0
      let videoLoading = false;
      let videoLoadTimeout = null;
      let waitingForInput = false;
      let inputValidationListener = null;

      const progressContainer = document.getElementById("progressContainer"); 
      let accumulated = 0; 
      for (let i = 0; i < slideData.length - 1; i++) { 
        accumulated += slideData[i].transition + slideData[i].display; 
        const pct = (accumulated / totalTime) * 100; 
        const marker = document.createElement('div'); 
        marker.className = 'marker'; 
        marker.style.left = pct + '%'; 
        progressContainer.appendChild(marker); 
      } 
      
      let current = 0; 
      let phase = 'transition'; 
      let remaining = slideData[0].transition; 
      let elapsed = 0; 
      let playing = true; 
      let last = null; 
      let rafId; 

      function startBackgroundAudio() {
        if (backgroundAudio && !backgroundAudioStarted) {
          backgroundAudio.volume = 0.3; // Set volume to 30%
          backgroundAudio.currentTime = 0;
          backgroundAudio.play().catch(e => {
          });
          backgroundAudioStarted = true;
        }
      }
      
      function pauseBackgroundAudio() {
        if (backgroundAudio) {
          backgroundAudio.pause();
        }
      }
      
      function resumeBackgroundAudio() {
        if (backgroundAudio && backgroundAudioStarted) {
          backgroundAudio.play().catch(e => {
          });
        }
      }
      
      function stopBackgroundAudio() {
        if (backgroundAudio) {
          backgroundAudio.pause();
          backgroundAudio.currentTime = 0;
          backgroundAudioStarted = false;
        }
      }
      
      function format(t) { 
        const m = Math.floor(t / 60).toString().padStart(2, '0'); 
        const s = Math.floor(t % 60).toString().padStart(2, '0'); 
        return m + ':' + s; 
      } 
      
      function updateProgressUI() { 
        const percent = (elapsed / totalTime) * 100; 
        progressBar.style.width = percent + '%'; 
        timeLabel.textContent = format(elapsed) + ' / ' + format(totalTime); 
        
        thumbnails.forEach((thumb, i) => {
          thumb.classList.toggle('active', i === current);
        });
      } 
      
      function getCurrentSlideVideo() {
        const slideElement = slides[current];
        return slideElement ? slideElement.querySelector('video') : null;
      }
      
      function setupVideoSync() {
      if (currentVideo) {
        currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
        currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
        currentVideo.removeEventListener('ended', onVideoEnded);
        currentVideo.removeEventListener('contextmenu', preventContextMenu);
        currentVideo.removeEventListener('canplay', onVideoCanPlay);
        currentVideo.removeEventListener('waiting', onVideoWaiting);
        currentVideo.removeEventListener('error', onVideoError);
        currentVideo.removeEventListener('play', onVideoPlay);
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
      
      currentVideo = getCurrentSlideVideo();
      
      if (currentVideo && slideData[current].hasVideo) {
        videoSyncMode = true;
        videoLoading = false;

        if (videoLoadTimeout) {
          clearTimeout(videoLoadTimeout);
          videoLoadTimeout = null;
        }

        currentVideo.addEventListener('loadedmetadata', onVideoLoaded);
        currentVideo.addEventListener('timeupdate', onVideoTimeUpdate);
        currentVideo.addEventListener('ended', onVideoEnded);
        currentVideo.addEventListener('contextmenu', preventContextMenu);
        currentVideo.addEventListener('canplay', onVideoCanPlay);
        currentVideo.addEventListener('waiting', onVideoWaiting);
        currentVideo.addEventListener('error', onVideoError);
        currentVideo.addEventListener('play', onVideoPlay);
currentVideo.setAttribute('controls', false);
currentVideo.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
currentVideo.setAttribute('disablePictureInPicture', true);
currentVideo.setAttribute('playsinline', '');
currentVideo.setAttribute('webkit-playsinline', '');
currentVideo.setAttribute('x5-playsinline', '');
currentVideo.setAttribute('x5-video-player-type', 'h5');
currentVideo.setAttribute('x5-video-player-fullscreen', 'false');
currentVideo.setAttribute('preload', 'auto');
currentVideo.muted = false;
currentVideo.currentTime = 0;

if (playing && phase === 'display') {
  const playPromise = currentVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.log('Video autoplay prevented, will retry on user interaction');
    });
  }
}
}
    }
      
      function preventContextMenu(event) {
        event.preventDefault();
      }
      
      function onVideoLoaded() {
      if (currentVideo) {
        currentVideo.currentTime = 0;

        if (playing && phase === 'display') {
          requestAnimationFrame(() => {
            currentVideo.play().catch(e => console.log('Video play failed:'));
          });
        }
      }
    }
      
      function onVideoTimeUpdate() {
        if (!playing || !videoSyncMode || !currentVideo || phase !== 'display') return;
        
        const videoTime = currentVideo.currentTime;
        const slideDisplayTime = slideDisplayStartTime + videoTime;
        const tolerance = 0.1;
        const expectedTime = elapsed - (getCurrentSlideStartTime() + slideData[current].transition);
        
        if (Math.abs(videoTime - expectedTime) > tolerance) {
          const targetVideoTime = Math.max(0, expectedTime);
          if (targetVideoTime <= currentVideo.duration) {
            currentVideo.currentTime = targetVideoTime;
          }
        }
      }
      
      function onVideoEnded() {
      }

      function onVideoCanPlay() {
      videoLoading = false;
      hideLoadingIndicator();
      if (videoLoadTimeout) {
        clearTimeout(videoLoadTimeout);
        videoLoadTimeout = null;
      }

      if (playing && phase === 'display') {
        requestAnimationFrame(() => {
          currentVideo.play().catch(e => console.log('Video play failed:'));
        });
      }
    }

    function onVideoWaiting() {
      videoLoading = true;
      showLoadingIndicator();
    }

    function onVideoError(e) {
      videoLoading = false;
      hideLoadingIndicator();

      if (videoLoadTimeout) {
        clearTimeout(videoLoadTimeout);
        videoLoadTimeout = null;
      }

    if (playing) {
      togglePlay();
      alert('Video failed to load. Slideshow paused.');
    }
    }

    function onVideoPlay() {
    if (!playing && currentVideo && !currentVideo.paused) {
      playing = true;
      document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause"></i>';
      if (!rafId) {
        last = null;
        rafId = requestAnimationFrame(run);
      }
    }
    }

    function showLoadingIndicator() {
    let loader = document.getElementById('videoLoader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'videoLoader';
      loader.innerHTML = '<div class="spinner"></div><div>Loading video...</div>';
      loader.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
      \`;
      document.body.appendChild(loader);

      const style = document.createElement('style');
      style.textContent = \`
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      \`;
      document.head.appendChild(style);
    }
    loader.style.display = 'block';
    }

    function hideLoadingIndicator() {
    const loader = document.getElementById('videoLoader');
    if (loader) {
      loader.style.display = 'none';
    }
    }
    
    function getCurrentSlideStartTime() {
      let time = 0;
      for (let i = 0; i < current; i++) {
        time += slideData[i].transition + slideData[i].display;
      }
      return time;
    }
    
    function syncVideoToSlideTime() {
    if (!playing || !videoSyncMode || !currentVideo || phase !== 'display') return;
    
    const slideStartTime = getCurrentSlideStartTime() + slideData[current].transition;
    const videoTime = elapsed - slideStartTime;
    
    if (videoTime >= 0 && videoTime <= currentVideo.duration) {
      const timeDiff = Math.abs(currentVideo.currentTime - videoTime);
      if (timeDiff > 0.1) { // Only sync if difference is significant
        currentVideo.currentTime = videoTime;
      }
    }
    }
    
    function checkInputValidation() {
      if (!slideData[current].slideInput) return true;
      const slideElement = slides[current];
      const Inputs = slideElement.querySelectorAll('input, textarea, select');

      for (let input of Inputs) {
        if (!input.value.trim()) {
          return false;
        }
      }
      
      return true;
    }

      function populateFormFromSessionStorage() {
    const slideElement = slides[current];
    const forms = slideElement.querySelectorAll('form');
    const storedDataStr = sessionStorage.getItem('formResponse');
    if (!storedDataStr) return;

    let storedData;
    try {
      storedData = JSON.parse(storedDataStr);
    } catch (err) {
      return;
    }

    forms.forEach(form => {
      const method = form.getAttribute('method')?.toLowerCase() || '';
      const action = form.getAttribute('action') || '';
      if (method === 'get' && action === '') {
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
          const key = input.name;
          if (!key) return;

          const value = storedData[key];
          if (value === undefined || value === null) return;

          if (input.type === 'checkbox') {
            input.checked = value === 'true';
          } else if (input.type === 'radio') {
            if (input.value === value) {
              input.checked = true;
            }
          } else {
            input.value = value;
          }
        });
      }
    });
    
    }
    
    function setupInputValidation() {
      if (slideData[current].slideInput === "False") return;
      
      const slideElement = slides[current];
      const submitButton = slideElement.querySelector('button[type="submit"], input[type="submit"]');
      const Inputs = slideElement.querySelectorAll('input, textarea, select');
      
      if (submitButton && Inputs.length > 0) {
        waitingForInput = true;

        if (inputValidationListener) {
          submitButton.removeEventListener('click', inputValidationListener);
        }

        inputValidationListener = function(event) {
          if (checkInputValidation()) {
            waitingForInput = false;
            if (!playing) {
              togglePlay();
            }
            submitButton.removeEventListener('click', inputValidationListener);
            inputValidationListener = null;
          }
        };
        
        submitButton.addEventListener('click', inputValidationListener);

        if (playing) {
          togglePlay();
        }
      }
    }

function showSlide(index) {
  slides.forEach((s, i) => { 
    if (i === index) {
      // Hide first to force recalculation
      s.style.display = 'none';
      
      // Force browser to acknowledge the change
      void s.offsetHeight;
      
      s.style.display = 'block';
      
      // Calculate responsive dimensions
      const originalWidth = parseFloat(s.getAttribute('data-original-width'));
      const originalHeight = parseFloat(s.getAttribute('data-original-height'));
      const aspectRatio = originalWidth / originalHeight;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportAspect = viewportWidth / viewportHeight;
      
      let scale;
      
      if (aspectRatio > viewportAspect) {
        // Slide is wider than viewport
        scale = (viewportWidth * 0.95) / originalWidth;
      } else {
        // Slide is taller than viewport
        scale = (viewportHeight * 0.95) / originalHeight;
      }
      
      // Ensure minimum scale for very large slides
      scale = Math.min(scale, 1);
      
      // Set slide dimensions to original size
      s.style.width = originalWidth + 'px';
      s.style.height = originalHeight + 'px';
      
      // Always center properly
      s.style.position = 'absolute';
      s.style.top = '50%';
      s.style.left = '50%';
      
      // Store scale BEFORE applying transform
      s.setAttribute('data-current-scale', scale);
      
      const { type, dir } = slideData[i]; 
      if (type === 'zoom') { 
        s.style.transform = \`translate(-50%, -50%) scale(\${0.8 * scale})\`; 
      } else if (type === 'slide') { 
        let tx = 0, ty = 0, dist = 100; 
        if (dir === 'left') tx = -dist; 
        if (dir === 'right') tx = dist; 
        if (dir === 'up') ty = -dist; 
        if (dir === 'down') ty = dist; 
        s.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%)) scale(\${scale})\`; 
      } else { 
        s.style.transform = \`translate(-50%, -50%) scale(\${scale})\`; 
      }
      
      // Force another repaint
      void s.offsetHeight;
    } else {
      s.style.display = 'none'; 
      s.style.opacity = 0; 
    }
  }); 

  populateFormFromSessionStorage();
  setupVideoSync();
  setupSlideAudio();

  const slideVideos = slides[index].querySelectorAll('video');
  slideVideos.forEach(video => {
    video.setAttribute('controls', false);
    video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
    video.setAttribute('disablePictureInPicture', true);
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'auto');
    video.addEventListener('contextmenu', preventContextMenu);
  });

  setupBackButtonNavigation(index);
}
  
function renderTransition(progress) { 
  const slide = slides[current];
  let scale = parseFloat(slide.getAttribute('data-current-scale'));
  
  const currentScale = ensureProperScale(current);
  if (Math.abs(scale - currentScale) > 0.01 || !scale) {
    scale = currentScale;
  }
  
  const { type, dir } = slideData[current]; 
  
  if (type === 'fade') { 
    slide.style.opacity = progress; 
    slide.style.transform = \`translate(-50%, -50%) scale(\${scale})\`; 
  } else if (type === 'zoom') { 
    slide.style.opacity = 1; 
    const zoomScale = (0.8 + 0.2 * progress) * scale;
    slide.style.transform = \`translate(-50%, -50%) scale(\${zoomScale})\`; 
  } else if (type === 'slide') { 
    slide.style.opacity = 1; 
    let tx = 0, ty = 0; 
    const dist = 100; 
    if (dir === 'left') tx = -dist * (1 - progress); 
    if (dir === 'right') tx = dist * (1 - progress); 
    if (dir === 'up') ty = -dist * (1 - progress); 
    if (dir === 'down') ty = dist * (1 - progress); 
    slide.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%)) scale(\${scale})\`; 
  } else {
    slide.style.opacity = progress;
    slide.style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
  }
}
    
    function setupBackButtonNavigation(slideIndex) {
      const slideElement = slides[slideIndex];
      const backButtons = slideElement.querySelectorAll('button[navigate-to-slide]');
      
      backButtons.forEach(button => {
        button.removeEventListener('click', handleBackButtonClick);
        button.addEventListener('click', handleBackButtonClick);
      });
    }

    function handleBackButtonClick(event) {
      event.preventDefault();
      event.stopPropagation();
      const targetSlide = event.target.getAttribute('navigate-to-slide');
      
      if (targetSlide) {
        const slideIndex = parseInt(targetSlide) - 1;
        if (slideIndex >= 0 && slideIndex < slideData.length) {
          jumpToSlide(slideIndex);
        } else {
        }
      } else {
      }
    }
function ensureProperScale(slideIndex) {
  const slide = slides[slideIndex];
  if (!slide) return;
  
  const originalWidth = parseFloat(slide.getAttribute('data-original-width'));
  const originalHeight = parseFloat(slide.getAttribute('data-original-height'));
  const aspectRatio = originalWidth / originalHeight;
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportAspect = viewportWidth / viewportHeight;
  
  let scale;
  
  if (aspectRatio > viewportAspect) {
    scale = (viewportWidth * 0.95) / originalWidth;
  } else {
    scale = (viewportHeight * 0.95) / originalHeight;
  }
  
  scale = Math.min(scale, 1);
  slide.setAttribute('data-current-scale', scale);
  
  return scale;
}

function run(timestamp) {
  if (!last) last = timestamp;
  const delta = (timestamp - last) / 1000;
  last = timestamp;

  if (waitingForInput || videoLoading) {
    if (playing) rafId = requestAnimationFrame(run);
    return;
  }

  remaining -= delta;
  elapsed += delta;
  updateProgressUI();

  if (phase === 'transition') {
    const full = slideData[current].transition;

    if (full > 0) {
      const progress = Math.min(1, Math.max(0, 1 - remaining / full));
      renderTransition(progress);
    } else {
      phase = 'display';
      remaining = slideData[current].display;

      const scale =
        parseFloat(slides[current].getAttribute('data-current-scale')) || 1;

      slides[current].style.opacity = 1;
      slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;

      startSlideAudio();

      if (videoSyncMode && currentVideo && playing) {
        currentVideo.currentTime = 0;
        requestAnimationFrame(() => {
          currentVideo.play().catch(() => {});
        });
      }

      setupInputValidation();
    }
  }

  else if (phase === 'display') {
    syncVideoToSlideTime();
  }

  if (remaining <= 0) {
    if (phase === 'transition') {
      phase = 'display';
      remaining = slideData[current].display;

      const scale =
        parseFloat(slides[current].getAttribute('data-current-scale')) || 1;

      slides[current].style.opacity = 1;
      slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;

      startSlideAudio();

      if (videoSyncMode && currentVideo && playing) {
        currentVideo.currentTime = 0;
        requestAnimationFrame(() => {
          currentVideo.play().catch(() => {});
        });
      }

      setupInputValidation();
    } else {
      if (current === slideData.length - 1) {
        playing = false;
        document.getElementById("playBtn").innerHTML =
          '<i class="fas fa-play"></i>';

        if (currentVideo) currentVideo.pause();

        stopBackgroundAudio();
        stopSlideAudio();
        return;
      }

      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }

      stopSlideAudio();
      current++;
      phase = 'transition';
      remaining = slideData[current].transition;

      showSlide(current);

      if (slideData[current].transition === 0) {
        phase = 'display';
        remaining = slideData[current].display;

        const scale =
          parseFloat(slides[current].getAttribute('data-current-scale')) || 1;

        slides[current].style.opacity = 1;
        slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;

        startSlideAudio();

        if (videoSyncMode && currentVideo && playing) {
          currentVideo.currentTime = 0;
          requestAnimationFrame(() => {
            currentVideo.play().catch(() => {});
          });
        }

        setupInputValidation();
      }
    }
  }

  if (playing) rafId = requestAnimationFrame(run);
}

    function togglePlay() {
      if (waitingForInput && !playing) {
        return;
      }
      
      playing = !playing;
      const btn = document.getElementById("playBtn");
      
      if (playing) {
        btn.innerHTML = '<i class="fas fa-pause"></i>';
        last = null;
        rafId = requestAnimationFrame(run);

        if (!backgroundAudioStarted) {
          startBackgroundAudio();
        } else {
          resumeBackgroundAudio();
        }

        if (phase === 'display' && currentVideo && videoSyncMode) {
          currentVideo.play().catch(e => console.log('Video play failed:'));
        }
          resumeSlideAudio();
      } else {
        btn.innerHTML = '<i class="fas fa-play"></i>';
        if (rafId) cancelAnimationFrame(rafId);

        if (!waitingForInput) {
          pauseBackgroundAudio();
          pauseSlideAudio();
        }

        if (currentVideo) {
          currentVideo.pause();
        }
      }
    }
    
    function seek(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const targetTime = percent * totalTime;

      let acc = 0;
      for (let i = 0; i < slideData.length; i++) {
        const slideEnd = acc + slideData[i].transition + slideData[i].display;
        if (targetTime <= slideEnd) {
          if (currentVideo) {
            currentVideo.pause();
            currentVideo.currentTime = 0;
            currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
            currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
            currentVideo.removeEventListener('ended', onVideoEnded);
            currentVideo.removeEventListener('contextmenu', preventContextMenu);
            currentVideo.removeEventListener('canplay', onVideoCanPlay);
            currentVideo.removeEventListener('waiting', onVideoWaiting);
            currentVideo.removeEventListener('error', onVideoError);
            currentVideo.removeEventListener('play', onVideoPlay);
          }

          const wasWaitingForInput = waitingForInput;
          waitingForInput = false;
          if (inputValidationListener) {
            const oldSlideElement = slides[current];
            const oldSubmitButton = oldSlideElement.querySelector('button[type="submit"], input[type="submit"]');
            if (oldSubmitButton) {
              oldSubmitButton.removeEventListener('click', inputValidationListener);
            }
            inputValidationListener = null;
          }
          
          current = i;
          const slideStart = acc;
          const slideTime = targetTime - slideStart;
          
          if (slideTime < slideData[i].transition) {
            phase = 'transition';
            remaining = slideData[i].transition - slideTime;
            showSlide(current);
            const progress = slideTime / slideData[i].transition;
            renderTransition(progress);
} else {
  phase = 'display';
  remaining = slideData[i].display - (slideTime - slideData[i].transition);
  showSlide(current);
  const scale = parseFloat(slides[current].getAttribute('data-current-scale')) || 1;
  slides[current].style.opacity = 1;
  slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
  if (videoSyncMode && currentVideo && playing) {
    const videoTime = slideTime - slideData[current].transition;
    if (videoTime >= 0 && videoTime <= currentVideo.duration) {
      currentVideo.currentTime = videoTime;
      currentVideo.play().catch(e => console.log('Video play failed:'));
    }
  }
  setupSlideAudio();
  setupInputValidation();
}

          if (wasWaitingForInput && playing) {
            resumeBackgroundAudio();
            resumeSlideAudio();
          }
          
          elapsed = targetTime;
          updateProgressUI();

          if (playing && !rafId) {
            last = null;
            rafId = requestAnimationFrame(run);
          }
          break;
        }
        acc = slideEnd;
      }
    } 
    function jumpToSlide(index) {
      if (index < 0 || index >= slideData.length) return;

      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
        currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
        currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
        currentVideo.removeEventListener('ended', onVideoEnded);
        currentVideo.removeEventListener('contextmenu', preventContextMenu);
        currentVideo.removeEventListener('canplay', onVideoCanPlay);
        currentVideo.removeEventListener('waiting', onVideoWaiting);
        currentVideo.removeEventListener('error', onVideoError);
        currentVideo.removeEventListener('play', onVideoPlay);
      }

      const wasWaitingForInput = waitingForInput;
      waitingForInput = false;
      if (inputValidationListener) {
        const oldSlideElement = slides[current];
        const oldSubmitButton = oldSlideElement.querySelector('button[type="submit"], input[type="submit"]');
        if (oldSubmitButton) {
          oldSubmitButton.removeEventListener('click', inputValidationListener);
        }
        inputValidationListener = null;
      }

      let targetTime = 0;
      for (let i = 0; i < index; i++) {
        targetTime += slideData[i].transition + slideData[i].display;
      }
      
      current = index;
      phase = 'transition';
      remaining = slideData[index].transition;
      elapsed = targetTime;

      showSlide(current);
      setupSlideAudio();

if (slideData[index].transition === 0) {
  phase = 'display';
  remaining = slideData[index].display;
  const scale = parseFloat(slides[current].getAttribute('data-current-scale')) || 1;
  slides[current].style.opacity = 1;
  slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;

  if (videoSyncMode && currentVideo && playing) {
    currentVideo.currentTime = 0;
    requestAnimationFrame(() => {
      currentVideo.play().catch(e => console.log('Video play failed:'));
    });
  }
  setupInputValidation();
} else {
  renderTransition(0);
}

      if (wasWaitingForInput && playing) {
        resumeBackgroundAudio();
        resumeSlideAudio();
      }
      
      updateProgressUI();

      if (playing && !rafId) {
        last = null;
        rafId = requestAnimationFrame(run);
      }
    } 

let resizeTimeout;
let isResizing = false;

window.addEventListener('resize', function() {
  if (!isResizing) {
    isResizing = true;
  }
  
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (current >= 0 && current < slides.length) {
      showSlide(current);
      
      if (phase === 'display') {
        const scale = parseFloat(slides[current].getAttribute('data-current-scale')) || 1;
        slides[current].style.opacity = 1;
        slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
      } else if (phase === 'transition') {
        const full = slideData[current].transition;
        if (full > 0) {
          const progress = 1 - (remaining / full);
          renderTransition(progress);
        }
      }
    }
    isResizing = false;
  }, 150);
});

window.addEventListener('orientationchange', function() {
  setTimeout(() => {
    if (current >= 0 && current < slides.length) {
      showSlide(current);
      
      if (phase === 'display') {
        const scale = parseFloat(slides[current].getAttribute('data-current-scale')) || 1;
        slides[current].style.opacity = 1;
        slides[current].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
      }
    }
  }, 500);
});
    let mouseTimeout;
    let isMouseMoving = false;
    
    function showUI() {
    if (initialLoader && document.body.contains(initialLoader)) {
      return;
    }
    document.querySelector('.controls').classList.add('visible');
    document.getElementById('progressContainer').classList.add('visible');
    document.getElementById('timeLabel').classList.add('visible');

    const thumbnailContainer = document.getElementById('thumbnailContainer');
    if (thumbnailContainer && thumbnailContainer.style.display !== 'none') {
      thumbnailContainer.classList.add('visible');
    }
    
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(hideUI, 3000);
    }
    
    function hideUI() {
      if (!isMouseMoving) {
        document.querySelector('.controls').classList.remove('visible');
        document.getElementById('progressContainer').classList.remove('visible');
        document.getElementById('timeLabel').classList.remove('visible');
        document.getElementById('thumbnailContainer').classList.remove('visible');
      }
    }

    function startInitialLoaderIfNeeded() {
      if (!initialLoader) {
        showUI();
        return;
      }

      hideUI();
      window.setTimeout(() => {
        initialLoader.classList.add('hidden');
        window.setTimeout(() => {
          initialLoader.remove();
          showUI();
        }, 450);
      }, initialLoaderDuration || 10000);
    }

    function hideAllVideoControls() {
      slides.forEach(slide => {
        const videos = slide.querySelectorAll('video');
        videos.forEach(video => {
          video.setAttribute('controls', false);
          video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
          video.setAttribute('disablePictureInPicture', true);
          video.style.pointerEvents = 'none';
          video.addEventListener('contextmenu', event => event.preventDefault());
          video.addEventListener('mouseenter', () => {
            video.setAttribute('controls', false);
          });
          
          video.addEventListener('mouseover', () => {
            video.setAttribute('controls', false);
          });
          
          video.addEventListener('focus', () => {
            video.blur();
          });
          
          video.addEventListener('keydown', event => {
            event.preventDefault();
          });
        });
      });
    }

    document.addEventListener('mousemove', () => {
      isMouseMoving = true;
      showUI();
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseMoving = false;
        hideUI();
      }, 3000);
    });
    
    document.addEventListener('mouseenter', showUI);
    document.addEventListener('mouseleave', () => {
      isMouseMoving = false;
      hideUI();
    });
    
    window.jumpToSlide = jumpToSlide; 

function init() {
    playing = false;
    document.getElementById("playBtn").innerHTML = '<i class="fas fa-play"></i>';
    hideAllVideoControls();
    
    showSlide(0);
    
    setTimeout(() => {
      const scale = ensureProperScale(0);
      if (slideData[0].transition === 0) {
        slides[0].style.opacity = 1;
        slides[0].style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
      } else {
        renderTransition(0);
      }
    }, 10);
    
    updateProgressUI();
    setupBackButtonNavigation(0);
    startInitialLoaderIfNeeded();
}

let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
  touchStartY = e.touches[0].clientY;
  showUI();
}, { passive: true });

document.addEventListener('touchend', function(e) {
  const touchEndY = e.changedTouches[0].clientY;
  const diff = Math.abs(touchEndY - touchStartY);
  
  if (diff < 10) {
    showUI();
  }
}, { passive: true });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    </script> 
    </body> 
    </html>`;

    return fullHTML;
  }

  async function generateInteractiveSlideshowHTML(hideThumbnails = false) {
    const fullHTML = await buildInteractiveSlideshowHTML(hideThumbnails);

    if (!fullHTML) {
      return;
    }

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interactive_slideshow.html';
    a.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function previewInteractiveSlideshowHTML(hideThumbnails = false, previewWindow = null) {
    const fullHTML = await buildInteractiveSlideshowHTML(hideThumbnails);

    if (!fullHTML) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      return;
    }

    let targetWindow = previewWindow;
    if (!targetWindow || targetWindow.closed) {
      targetWindow = window.open("", "interactiveSlideshowPreview", "width=1400,height=900,scrollbars=yes,resizable=yes");
    }

    if (!targetWindow) {
      alert("Preview popup was blocked. Please allow popups and try again.");
      return;
    }

    targetWindow.document.open();
    targetWindow.document.write(fullHTML);
    targetWindow.document.close();
    targetWindow.focus();
  }
}
