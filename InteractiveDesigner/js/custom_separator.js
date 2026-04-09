function customSeparator(editor) {
  const DL = (window && window.DesignerLogger) ? window.DesignerLogger : {
    info: (m, c) => console.log(m, c || ''),
    warn: (m, c) => console.warn(m, c || ''),
    error: (m, c) => console.error(m, c || ''),
    success: (m, c) => console.log(m, c || ''),
    debug: (m, c) => console.log(m, c || ''),
    event: (m, c) => console.log(m, c || ''),
    try(fn, ctx, onError) { try { return fn(); } catch (err) { console.error(err); if (onError) onError(err); } }
  };

  editor.Components.addType("separator", {
    model: {
      defaults: {
        tagName: "hr",
        name: "Separator",
        traits: [
          {
            type: "select",
            label: "Line Style",
            name: "border-style",
            changeProp: 1,
            options: [
              { value: "solid", name: "Solid" },
              { value: "dashed", name: "Dashed" },
              { value: "dotted", name: "Dotted" },
            ],
            default: "solid",
          },
          {
            type: "color",
            label: "Color",
            name: "border-color",
            changeProp: 1,
            default: "#000000",
          },
          {
            type: "number",
            label: "Thickness",
            name: "border-width-custom",
            placeholder: "e.g. 1",
            changeProp: 1,
            default: 1,
          },
          {
            type: "text",
            label: "Width",
            name: "width",
            placeholder: "100%, 400px",
            changeProp: 1,
            default: "100%",
          },
          {
            type: "select",
            label: "Alignment",
            name: "margin",
            options: [
              { value: "10px auto", name: "Center" },
              { value: "10px 0 10px auto", name: "Right" },
              { value: "10px auto 10px 0", name: "Left" },
            ],
            changeProp: 1,
            default: "10px auto",
          },
        ],
        style: {
          "border-top": "1px solid #000000",
          "width": "100%",
          "margin": "5px auto",
          "display": "block",
          "padding": "2.5px",
        },
      },

      init() {
        const compId = (this.getId && this.getId()) || this.cid || null;
        DL.event('separator added', {
          id: compId,
          initial: {
            borderStyle: this.get("border-style") || "solid",
            borderColor: this.get("border-color") || "#000000",
            borderWidth: this.get("border-width-custom") || 1,
            width: this.get("width") || "100%",
            margin: this.get("margin") || "5px auto"
          }
        });

        const traitNames = [
          "border-style",
          "border-color",
          "border-width-custom",
          "width",
          "margin",
        ];

        traitNames.forEach((tName) => {
          this.listenTo(this, "change:" + tName, () => {
            DL.info('separator settings changed', {
              id: compId,
              trait: tName,
              value: this.get(tName)
            });
          });
        });

        this.listenTo(
          this,
          "change:border-style change:border-color change:border-width-custom change:width change:margin",
          this.updateStyle
        );
      },

      updateStyle() {
        const compId = (this.getId && this.getId()) || this.cid || null;
        let borderStyle = this.get("border-style") || "solid";
        let borderColor = this.get("border-color") || "#000000";
        let borderWidth = this.get("border-width-custom");
        let width = this.get("width") || "100%";
        let margin = this.get("margin") || "5px auto";
        let numericWidth = Number(borderWidth);

        if (Number.isNaN(numericWidth)) {
          DL.warn('separator thickness should be in number', { id: compId, received: borderWidth, fallback: 1 });
          numericWidth = 1;
        }
        if (numericWidth < 0) {
          DL.warn('separator thickness should not be negative', { id: compId, received: borderWidth, coercedTo: Math.abs(numericWidth) });
          numericWidth = Math.abs(numericWidth);
        }
        if (numericWidth > 20) {
          DL.warn('separator thickness is too large', { id: compId, received: borderWidth, cappedTo: 20 });
          numericWidth = 20;
        }

        const allowedStyles = ['solid', 'dashed', 'dotted'];
        if (!allowedStyles.includes(borderStyle)) {
          DL.warn('separator:validation:style:invalid', { id: compId, received: borderStyle, fallback: 'solid' });
          borderStyle = 'solid';
        }

        const isHex = typeof borderColor === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(borderColor);
        if (!isHex) {
          DL.warn('separator:validation:color:invalid', { id: compId, received: borderColor, fallback: '#000000' });
          borderColor = '#000000';
        }

        if (typeof width !== 'string' || !/(%|px|rem|vw)$/.test(width)) {
          DL.warn('separator:validation:width:invalid', { id: compId, received: width, fallback: '100%' });
          width = '100%';
        }

        if (typeof margin !== 'string' || margin.trim() === '') {
          DL.warn('separator:validation:margin:invalid', { id: compId, received: margin, fallback: '10px auto' });
          margin = '10px auto';
        }

        const borderTop = `${numericWidth}px ${borderStyle} ${borderColor}`;

        DL.debug('separator style changed', {
          id: compId,
          apply: { borderTop, width, margin }
        });

        DL.try(() => {
          this.addStyle({
            "border-top": borderTop,
            "width": width,
            "margin": margin,
            "display": "block",
          });
        }, { id: compId, phase: 'addStyle' }, (err) => {
          DL.error('separator:style:apply:failed', { id: compId, error: String(err) });
        });
      },
    },
  });
}