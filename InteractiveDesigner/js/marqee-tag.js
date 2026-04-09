function marqueTag(editor) {
  editor.on("load", () => {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const styleEl = iframeDoc.createElement("style");
    styleEl.innerHTML = `
      marquee {
        border: 1px dashed #999;
        padding: 10px;
        background: #fafafa;
        font-size: 16px;
        display: block;
        white-space: nowrap;
        animation-play-state: running !important;
        will-change: transform;
        min-height: 50px;
        min-width: 200px;
        pointer-events: auto !important;
        cursor: pointer;
      } 

      .gjs-trt-trait__speed-range input[type=range] {
        width: 100%;
      }

      html, body {
        overflow: visible !important;
      }

      .gjs-cv-canvas {
        overflow: visible !important;
      }
    `;
    iframeDoc.head.appendChild(styleEl);
  });

  editor.TraitManager.addType("speed-range", {
    createInput({ trait }) {
      const el = document.createElement("div");
      el.className = "gjs-trt-trait__speed-range";

      const label = document.createElement("div");
      label.style.marginTop = "4px";
      label.style.fontSize = "12px";

      const input = document.createElement("input");
      input.type = "range";
      input.min = 1;
      input.max = 20;

      const model = trait.view && trait.view.model;

      const getSpeedValue = () => {
        if (!model) return "6";
        const attrs = model.getAttributes ? model.getAttributes() : {};
        const prop = model.get ? model.get("scrollamount") : undefined;
        return String(prop ?? attrs.scrollamount ?? "6");
      };

      const syncUI = () => {
        const value = getSpeedValue();
        input.value = value;
        label.innerText = `Speed: ${value}`;
      };

      input.oninput = () => {
        const value = String(input.value);
        label.innerText = `Speed: ${value}`;
        if (model && typeof model.set === "function") {
          model.set("scrollamount", value);
        }
        if (model && typeof model.addAttributes === "function") {
          model.addAttributes({ scrollamount: value });
        } else {
          trait.set("value", value);
        }
      };

      syncUI();

      if (model) {
        model.on("change:scrollamount", syncUI);
        model.on("change:attributes", syncUI);
      }

      el.appendChild(input);
      el.appendChild(label);
      return el;
    },
  });

  editor.DomComponents.addType("Marquee", {
    model: {
      defaults: {
        tagName: "marquee",
        name: "Marquee",
        attributes: {
          direction: "left",
          scrollamount: "6",
        },
        traits: [
          {
            type: "select",
            name: "direction",
            label: "Direction",
            options: [
              { value: "left", name: "Left" },
              { value: "right", name: "Right" },
              { value: "up", name: "Up" },
              { value: "down", name: "Down" },
            ],
            changeProp: 1,
          },
          {
            type: "speed-range",
            name: "scrollamount",
            label: "Speed",
            changeProp: 1,
          },
          {
            type: "number",
            name: "loop",
            label: "Loop Count (blank or 1 for infinite)",
            placeholder: "1",
            changeProp: 1,
          },
          {
            type: "checkbox",
            name: "pause-on-hover",
            label: "Pause on Hover",
            changeProp: 1,
            default: false,
          },
        ],
        components: [],
        droppable: true,
        editable: false,
        highlightable: true,
        stylable: true,
        style: {
          "min-height": "50px",
          "min-width": "200px",
          padding: "10px",
          display: "block",
        },
      },

      init() {
        // Restart on changes that affect marquee playback
        this.listenTo(this, "change:loop", this.handleUpdate);
        this.listenTo(this, "change:direction", this.handleUpdate);
        this.listenTo(this, "change:scrollamount", this.handleUpdate);

        // Pause on hover does not require a restart
        this.listenTo(this, "change:pause-on-hover", this.updatePauseHover);
      },

      handleUpdate() {
        const model = this;
        const view = model.view;
        if (!view) return;

        // Resolve values from props or attributes to avoid accidental defaults
        const attrs = model.getAttributes();
        const dir = model.get("direction") ?? attrs.direction ?? "left";
        const speed = model.get("scrollamount") ?? attrs.scrollamount ?? "6";
        const loopRaw = model.get("loop") ?? attrs.loop;
        const loopNum =
          loopRaw == null || loopRaw === ""
            ? NaN
            : Number.parseInt(loopRaw, 10);
        const loop = Number.isFinite(loopNum) ? String(loopNum) : "";
        const speedNum = Number.parseInt(speed, 10);

        // 1) Update model attributes
        const nextAttrs = { direction: dir, scrollamount: speed };
        const hasLoop = Number.isFinite(loopNum) && loopNum > 1;
        if (hasLoop) {
          nextAttrs.loop = loop;
        } else {
          model.removeAttributes("loop");
        }
        model.addAttributes(nextAttrs);

        // 2) Restart while preserving GrapesJS selection behavior
        const oldEl = view.el;
        const parent = oldEl.parentNode;

        if (parent) {
          const shouldHardRestart =
            typeof model.hasChanged === "function"
              ? model.hasChanged("loop")
              : true;

          if (shouldHardRestart) {
            // Recreate the marquee element to reset the loop counter
            const newEl = oldEl.cloneNode(true);

            // Copy GrapesJS internal references to keep selection working
            Object.getOwnPropertyNames(oldEl).forEach((key) => {
              if (key.indexOf("__gjs") === 0) {
                try {
                  newEl[key] = oldEl[key];
                } catch (e) {
                  // Ignore non-writable properties
                }
              }
            });

            newEl.setAttribute("direction", dir);
            newEl.setAttribute("scrollamount", speed);
            if (hasLoop) {
              newEl.setAttribute("loop", loop);
            } else {
              newEl.removeAttribute("loop");
            }

            parent.replaceChild(newEl, oldEl);

            // Rebind view and model to the new element
            if (typeof model.setEl === "function") {
              model.setEl(newEl);
            }
            view.setElement(newEl);
            view.delegateEvents();
            view.render();
          } else {
            // Soft restart for speed/direction changes
            oldEl.setAttribute("direction", dir);
            oldEl.setAttribute("scrollamount", speed);
            if (hasLoop) {
              oldEl.setAttribute("loop", loop);
            } else {
              oldEl.removeAttribute("loop");
            }

            if (
              typeof oldEl.stop === "function" &&
              typeof oldEl.start === "function"
            ) {
              oldEl.stop();
              if (
                Number.isFinite(speedNum) &&
                Object.prototype.hasOwnProperty.call(oldEl, "scrollAmount")
              ) {
                try {
                  oldEl.scrollAmount = speedNum;
                } catch (e) {
                  // Ignore if the property is read-only in this browser
                }
              }
              try {
                oldEl.scrollLeft = 0;
                oldEl.scrollTop = 0;
              } catch (e) {
                // Ignore if not supported
              }
              oldEl.start();
            }

            view.setElement(oldEl);
            view.delegateEvents();
            view.render();
          }

          setTimeout(() => {
            editor.select(model);
          }, 10);
        }
      },

      updatePauseHover() {
        const pause = this.get("pause-on-hover");
        if (pause) {
          this.addAttributes({
            onmouseover: "this.stop()",
            onmouseout: "this.start()",
          });
        } else {
          this.removeAttributes("onmouseover");
          this.removeAttributes("onmouseout");
        }
      },

      toHTML() {
        const innerHTML = this.components()
          .map((comp) => comp.toHTML())
          .join("");
        const attrs = this.getAttributes();
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ");
        return `<marquee ${attrStr}>${innerHTML}</marquee>`;
      },
    },
  });
}
