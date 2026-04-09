function registerCustomShapes(editor) {
  const domc = editor.DomComponents;
  const blockManager = editor.BlockManager;
  const lineIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>`;

  const rectangleIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
      <rect x="4" y="4" width="16" height="12" />
    </svg>`;

  const circleIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
      <circle cx="12" cy="12" r="8" />
    </svg>`;

  // ===== LINE COMPONENT =====
  domc.addType('line', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        resizable: true,
        attributes: { class: 'line-shape' },
        styles: `
          .line-shape {
            width: 120px;
            height: 2px;
            background: #000;
            padding: 0px;          
            border: none;
            margin: 15px;
            box-sizing: content-box; 
            cursor: pointer;
          }
        `,
        stylable: true,
      },
    },
  });
  blockManager.add('line', {
    label: 'Line',
    content: { type: 'line' },
    category: 'Drawing Tools',
    media: lineIcon,
  });

  // ===== RECTANGLE COMPONENT =====
  domc.addType('rectangle', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        resizable: true,
        attributes: { class: 'rect-shape' },
        styles: `
          .rect-shape {
            width: 120px;
            height: 80px;
            background: transparent;   
            border: 2px solid #000;    
            border-radius: 0;
            box-sizing: border-box;
          }
        `,
        stylable: true,
      },
    },
  });
  blockManager.add('rectangle', {
    label: 'Rectangle',
    content: { type: 'rectangle' },
    category: 'Drawing Tools',
    media: rectangleIcon,
  });

  // ===== CIRCLE COMPONENT =====
  domc.addType('circle', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        resizable: true,
        attributes: { class: 'circle-shape' },
        styles: `
          .circle-shape {
            width: 80px;
            height: 80px;
            background: transparent;   
            border: 2px solid #000;   
            border-radius: 50%;        
            box-sizing: border-box;
          }
        `,
        stylable: true,
      },
    },
  });
  blockManager.add('circle', {
    label: 'Circle',
    content: { type: 'circle' },
    category: 'Drawing Tools',
    media: circleIcon,
  });
}
