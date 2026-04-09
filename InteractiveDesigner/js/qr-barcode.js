function addQRBarcodeComponent(editor) {
  editor.on('load', () => {
    const canvasDoc = editor.Canvas.getDocument();
    if (canvasDoc && canvasDoc.head) {
      const style = canvasDoc.createElement('style');
      style.textContent = `
        [data-qr-barcode="true"] > * {
          pointer-events: none !important;
        }
      `;
      canvasDoc.head.appendChild(style);
    }
  });

  editor.BlockManager.add('qr-barcode-block', {
    label: 'QR/Barcode',
    category: 'Basic',
    attributes: { class: 'fa fa-qrcode' },
    content: {
      type: 'qr-barcode-component'
    }
  });

  editor.Commands.add('open-qr-barcode-editor', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('type') === 'qr-barcode-component') {
        showQRPopup(selected, editor);
      }
    }
  });

  editor.DomComponents.addType('qr-barcode-component', {
    isComponent: (el) => {
      if (!el || !el.getAttribute) return false;
      if (el.getAttribute('data-gjs-type') === 'qr-barcode-component') return { type: 'qr-barcode-component' };
      if (el.getAttribute('data-qr-barcode') === 'true') return { type: 'qr-barcode-component' };
      return false;
    },
    model: {
      defaults: {
        tagName: 'div',
        attributes: {
          'data-gjs-type': 'qr-barcode-component',
          'data-qr-barcode': 'true',
        },
        components: [],
        droppable: false,
        traits: [
          {
            type: 'button',
            name: 'edit-qr-barcode',
            label: 'Edit QR/Barcode',
            text: 'Edit',
            full: true,
            command: 'open-qr-barcode-editor',
          },
          {
            type: 'text',
            name: 'my-input-json',
            label: 'DataSource Path',
            placeholder: 'e.g. customer.barcode',
            changeProp: 1,
          },
        ],
        'qr-input-mode': 'custom', // 'custom' | 'json'
        'json-file-index': '0',
        'json-language': '',
        'qr-text': '',
        'qr-type': 'qr',
        'qr-width': 2,
        'qr-height': 100,
        'qr-show-text': true,
        'qr-error-correction': 'M',
      },
      init() {
        const component = this;
        this.listenTo(this, 'change:my-input-json', this.handleJsonPathChange);
        this.listenTo(this, 'change:my-input-json', this.renderBarcodeFromConfig);
        const attrs = component.getAttributes() || {};
        if (!attrs.id) {
          component.addAttributes({ id: `qr-barcode-${component.cid || 'x' + Date.now()}` });
        }
        if (attrs['data-qr-type']) {
          component.set('qr-type', attrs['data-qr-type']);
          component.set('qr-text', attrs['data-qr-text'] || '');
          component.set('qr-width', parseFloat(attrs['data-qr-width']) || 2);
          component.set('qr-height', parseInt(attrs['data-qr-height'], 10) || 100);
          component.set('qr-show-text', attrs['data-qr-show-text'] !== 'false');
          component.set('qr-error-correction', attrs['data-qr-error-correction'] || 'M');
          if (attrs['my-input-json']) component.set('my-input-json', attrs['my-input-json']);
        }
        if (attrs['data-json-file-index']) {
          component.set('json-file-index', String(attrs['data-json-file-index']));
        }
        if (attrs['data-json-language']) {
          component.set('json-language', String(attrs['data-json-language']));
        }
        if (attrs['data-qr-input-mode']) {
          component.set('qr-input-mode', String(attrs['data-qr-input-mode']));
        } else {
          // Back-compat inference
          const hasPath = String(attrs['my-input-json'] || '').trim();
          const hasText = String(attrs['data-qr-text'] || '').trim();
          if (hasPath && !hasText) component.set('qr-input-mode', 'json');
        }
        setTimeout(() => {
          const hasConfig = component.get('qr-text') || component.get('qr-type');
          const hasJsonPath = (component.get('my-input-json') || attrs['my-input-json'] || '').trim();
          if (!hasConfig && !hasJsonPath) {
            showQRPopup(component, editor);
          } else {
            this.renderBarcodeFromConfig();
          }
        }, 10);
      },
      handleJsonPathChange() {
        const path = (this.get('my-input-json') || '').trim();
        const id = (this.getAttributes() || {}).id;
        if (path) {
          this.addAttributes({ 'my-input-json': path });
          if (id) upsertMyInputJsonCss(editor, id, path);
        } else {
          this.removeAttributes('my-input-json');
        }
      },
      renderBarcodeFromConfig() {
        const attrs = this.getAttributes ? (this.getAttributes() || {}) : {};
        const inputMode = (this.get('qr-input-mode') || attrs['data-qr-input-mode'] || 'custom').toLowerCase();
        const text = this.get('qr-text') || '';
        const previewText = String(attrs['data-qr-preview-text'] || '').trim();
        const jsonPath = (this.get('my-input-json') || '').trim();
        const resolvedDynamicText =
          (inputMode === 'json' && !previewText && jsonPath) ? resolveTextFromDatasource(this, jsonPath) : '';
        const effectiveText =
          inputMode === 'json'
            ? (previewText || resolvedDynamicText)
            : text;

        if (inputMode === 'json' && jsonPath && !effectiveText) {
          this.components().reset([{
            type: 'default',
            tagName: 'div',
            selectable: false,
            layerable: false,
            style: { padding: '12px', minHeight: '60px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' },
            content: `Dynamic: ${jsonPath}`,
          }]);
          return;
        }
        if (!effectiveText) {
          this.components().reset([{
            type: 'default',
            tagName: 'div',
            selectable: false,
            layerable: false,
            style: { padding: '12px', minHeight: '60px', background: '#fef3c7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e', fontSize: '13px' },
            content: 'Click Edit to generate QR/Barcode',
          }]);
          return;
        }
        const type = this.get('qr-type') || 'qr';
        const options = {
          width: parseFloat(this.get('qr-width')) || 2,
          height: parseInt(this.get('qr-height'), 10) || 100,
          displayValue: this.get('qr-show-text') !== false,
        };
        const self = this;
        (async () => {
          try {
            let imgBase64 = '';
            if (type === 'qr') {
              imgBase64 = await generateQRCodeBase64(effectiveText, { errorCorrectionLevel: this.get('qr-error-correction') || 'M' });
            } else if (['datamatrix', 'pdf417', 'aztec'].includes(type)) {
              imgBase64 = await generate2DBarcodeBase64(effectiveText, type);
            } else {
              imgBase64 = await generateBarcodeBase64(effectiveText, type, options);
            }
            self.components().reset([{
              type: 'default',
              tagName: 'img',
              selectable: false,
              layerable: false,
              attributes: {
                src: imgBase64,
                alt: `${type.toUpperCase()} code for: ${effectiveText}`,
                style: 'max-width:100%; height:auto; padding: 7px;',
              }
            }]);
          } catch (e) {
            self.components().reset([{
              type: 'default',
              tagName: 'div',
              selectable: false,
              layerable: false,
              style: { padding: '12px', background: '#fee2e2', color: '#dc2626', fontSize: '12px' },
              content: 'Generation failed. Click Edit to retry.',
            }]);
          }
        })();
      },
    },
  });

  function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
    border: 1px solid ${type === 'error' ? '#fca5a5' : '#a7f3d0'};
    color: ${type === 'error' ? '#dc2626' : '#059669'};
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    word-wrap: break-word;
  `;

    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
    document.head.appendChild(style);

    toast.innerHTML = `<strong>${type === 'error' ? '❌ Error:' : '✅ Success:'}</strong> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
      }, 300);
    }, 4000);
  }

  function showQRPopup(component, editor) {
    const modal = editor.Modal;
    const content = document.createElement('div');
    content.innerHTML = `
    <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; background: #fff; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Generate QR/Barcode</h2>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">All industry standards supported</p>
      </div>

      <!-- Input Section -->
      <div style="margin-bottom: 20px;">
        <div style="display:flex; gap: 12px; align-items:center; margin-bottom: 10px;">
          <span style="font-weight: 600; color: #374151; font-size: 14px;">Input Source</span>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; color:#374151;">
            <input type="radio" name="qr-input-mode" id="qr-input-mode-custom" value="custom" />
            Custom Text
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; color:#374151;">
            <input type="radio" name="qr-input-mode" id="qr-input-mode-json" value="json" />
            Data Source Path
          </label>
        </div>

        <div id="qr-custom-section">
        <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
          📝 Text/Data to Encode (or use DataSource Path below for dynamic value)
        </label>
        <input type="text" id="qr-text" 
               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;" />
        </div>
      </div>

      <!-- DataSource -->
      <div id="qr-json-section" style="margin-bottom: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
        <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">DataSource File</label>
        <select id="json-file-index" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; box-sizing: border-box; margin-bottom: 12px;"></select>

        <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">DataSource Path</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="json-path" placeholder="e.g. customer.barcode"
                 style="flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; box-sizing: border-box;" />
          <button id="json-suggestion-btn" style="padding: 10px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">Suggest</button>
        </div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 12px; line-height: 1.3;">Tip: select a file and use Suggest to pick a valid path.</div>
      </div>
      
      <!-- Type Selection -->
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
          🏷️ Barcode Type
        </label>
        <select id="qr-type" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: white; box-sizing: border-box;">
          <optgroup label="🔲 2D Barcodes (High Capacity)">
            <option value="qr" selected>QR Code (Most Popular)</option>
            <option value="datamatrix">Data Matrix (Compact)</option>
            <option value="pdf417">PDF417 (Documents)</option>
            <option value="aztec">Aztec Code (Transport)</option>
          </optgroup>
          <optgroup label="📊 Linear - Numeric Only">
            <option value="upc">UPC-A (Products)</option>
            <option value="ean13">EAN-13 (International)</option>
            <option value="ean8">EAN-8 (Small Products)</option>
            <option value="upce">UPC-E (Compact)</option>
          </optgroup>
          <optgroup label="🔤 Linear - Alphanumeric">
            <option value="code128">Code 128 (Recommended)</option>
            <option value="code39">Code 39 (Standard)</option>
            <option value="code93">Code 93 (High Density)</option>
            <option value="codabar">Codabar (Libraries)</option>
            <option value="itf">ITF (Shipping)</option>
            <option value="msi">MSI Plessey (Inventory)</option>
          </optgroup>
          <optgroup label="📮 Postal Services">
            <option value="postnet">POSTNET (US Mail)</option>
            <option value="planet">PLANET (US Mail)</option>
          </optgroup>
          <optgroup label="🏭 Industry Specific">
            <option value="gs1_128">GS1-128 (Supply Chain)</option>
            <option value="pharmacode">Pharmacode (Pharmacy)</option>
          </optgroup>
        </select>
      </div>

      <!-- Advanced Options -->
      <div id="advanced-options" style="margin-bottom: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 14px;">⚙️ Advanced Options</span>
        </div>
        
        <!-- Size Controls -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              📐 Width Scale
            </label>
            <div style="position: relative;">
              <input type="range" id="barcode-width" min="1" max="5" value="2" step="0.5" 
                     style="width: 100%; height: 6px; border-radius: 3px; background: #e5e7eb; outline: none; margin-bottom: 4px;" />
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
                <span>1x</span>
                <span id="width-value" style="font-weight: 600; color: #374151;">2x</span>
                <span>5x</span>
              </div>
            </div>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              📏 Height (px)
            </label>
            <div style="position: relative;">
              <input type="range" id="barcode-height" min="40" max="200" value="100" step="10" 
                     style="width: 100%; height: 6px; border-radius: 3px; background: #e5e7eb; outline: none; margin-bottom: 4px;" />
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
                <span>40px</span>
                <span id="height-value" style="font-weight: 600; color: #374151;">100px</span>
                <span>200px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Options -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
          <div>
            <label style="display: flex; align-items: center; cursor: pointer; padding: 8px; border-radius: 6px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
              <input type="checkbox" id="show-text" checked style="margin-right: 8px; transform: scale(1.1);" />
              <span style="font-size: 13px; color: #374151; font-weight: 500;">📝 Show Text Below</span>
            </label>
          </div>
          
          <div id="qr-options" style="display: none;">
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              🛡️ Error Correction
            </label>
            <select id="qr-error-correction" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white;">
              <option value="L">Low (7%) - Basic</option>
              <option value="M" selected>Medium (15%) - Standard</option>
              <option value="Q">Quartile (25%) - Good</option>
              <option value="H">High (30%) - Best</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Format Requirements Info 
      <div id="format-info" style="margin-bottom: 20px; padding: 12px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; display: none;">
        <div style="display: flex; align-items: start; gap: 8px;">
          <span style="font-size: 16px;">💡</span>
          <div>
            <strong style="color: #92400e; font-size: 13px; display: block; margin-bottom: 4px;">Format Requirements:</strong>
            <div id="format-details" style="color: #78350f; font-size: 12px; line-height: 1.4;"></div>
          </div>
        </div>
      </div> -->
      
      <!-- Generate Button -->
      <div style="text-align: center;">
        <button id="generate-btn" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 auto; min-width: 160px;" 
               onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(0, 0, 0, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.1)'">
          <span style="font-size: 16px;">✨</span>
          Generate Code
        </button>
      </div>
    </div>
  `;

    modal.setTitle('');
    modal.setContent(content);
    modal.open();

    const typeSelect = content.querySelector('#qr-type');
    const qrOptions = content.querySelector('#qr-options');
    const widthSlider = content.querySelector('#barcode-width');
    const heightSlider = content.querySelector('#barcode-height');
    const widthValue = content.querySelector('#width-value');
    const heightValue = content.querySelector('#height-value');
    const textInput = content.querySelector('#qr-text');
    const showTextCheck = content.querySelector('#show-text');
    const qrErrorSelect = content.querySelector('#qr-error-correction');
    const fileIndexSelect = content.querySelector('#json-file-index');
    const jsonPathInput = content.querySelector('#json-path');
    const jsonSuggestionBtn = content.querySelector('#json-suggestion-btn');
    const customModeRadio = content.querySelector('#qr-input-mode-custom');
    const jsonModeRadio = content.querySelector('#qr-input-mode-json');
    const customSection = content.querySelector('#qr-custom-section');
    const jsonSection = content.querySelector('#qr-json-section');

    if (component.get('qr-text')) textInput.value = component.get('qr-text');
    if (component.get('qr-type')) typeSelect.value = component.get('qr-type');
    if (component.get('qr-width')) {
      widthSlider.value = component.get('qr-width');
      widthValue.textContent = widthSlider.value + 'x';
    }
    if (component.get('qr-height')) {
      heightSlider.value = component.get('qr-height');
      heightValue.textContent = heightSlider.value + 'px';
    }
    if (typeof component.get('qr-show-text') === 'boolean') showTextCheck.checked = component.get('qr-show-text');
    if (component.get('qr-error-correction')) qrErrorSelect.value = component.get('qr-error-correction');

    const savedMode =
      (component.get('qr-input-mode') || component.getAttributes()?.['data-qr-input-mode'] || '').toLowerCase();
    const inferredMode =
      savedMode ||
      ((component.get('my-input-json') || component.getAttributes()?.['my-input-json']) ? 'json' : 'custom');
    customModeRadio.checked = inferredMode !== 'json';
    jsonModeRadio.checked = inferredMode === 'json';

    const applyModeVisibility = () => {
      const mode = jsonModeRadio.checked ? 'json' : 'custom';
      customSection.style.display = mode === 'custom' ? 'block' : 'none';
      jsonSection.style.display = mode === 'json' ? 'block' : 'none';
      component.set('qr-input-mode', mode);
      component.addAttributes({ 'data-qr-input-mode': mode });

      const compId = component.getAttributes()?.id;
      if (mode === 'custom') {
        // Clear DataSource values when switching to Custom Text
        component.set('my-input-json', '');
        component.set('json-file-index', '0');
        component.removeAttributes('my-input-json');
        component.removeAttributes('data-json-file-index');
        component.removeAttributes('data-json-language');
        if (compId) upsertMyInputJsonCss(editor, compId, '');

        if (jsonPathInput) jsonPathInput.value = '';
        if (fileIndexSelect) fileIndexSelect.value = '0';
      } else {
        // Clear Custom Text values when switching to Data Source Path
        component.set('qr-text', '');
        component.removeAttributes('data-qr-text');
        if (textInput) textInput.value = '';
      }
    };

    customModeRadio.onchange = applyModeVisibility;
    jsonModeRadio.onchange = applyModeVisibility;
    applyModeVisibility();

    // DataSource defaults
    const fileNames = getCommonJsonFileNames();
    fileIndexSelect.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '0';
    defaultOpt.textContent = fileNames.length ? 'Select DataSource file' : 'No DataSource file found';
    fileIndexSelect.appendChild(defaultOpt);
    fileNames.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx + 1);
      opt.textContent = `${idx + 1}. ${name}`;
      fileIndexSelect.appendChild(opt);
    });

    const savedFileIndex = component.get('json-file-index') || component.getAttributes()?.['data-json-file-index'] || '0';
    fileIndexSelect.value = String(savedFileIndex);

    const savedJsonPath = (component.get('my-input-json') || component.getAttributes()?.['my-input-json'] || '').trim();
    jsonPathInput.value = savedJsonPath;

    fileIndexSelect.onchange = () => {
      const idx = String(fileIndexSelect.value || '0');
      component.set('json-file-index', idx);
      component.addAttributes({ 'data-json-file-index': idx });
    };

    jsonPathInput.oninput = () => {
      const path = String(jsonPathInput.value || '').trim();
      component.set('my-input-json', path);
    };

    jsonSuggestionBtn.onclick = () => {
      const fileIndex = String(fileIndexSelect.value || '0');
      if (fileIndex === '0') {
        showToast('Please select a DataSource file first', 'error');
        return;
      }

      openDatasourceSuggestionModal(editor, fileIndex, (language, subPath) => {
        // Keep language internally for resolving values, but only display/save the subPath
        component.set('json-language', language);
        component.addAttributes({ 'data-json-language': language });
        jsonPathInput.value = subPath;
        component.set('my-input-json', subPath);

        if (!(component.get('qr-text') || '').trim()) {
          component.renderBarcodeFromConfig && component.renderBarcodeFromConfig();
        }
      });
    };

    textInput.onfocus = () => {
      textInput.style.borderColor = '#3b82f6';
      textInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    };
    textInput.onblur = () => {
      textInput.style.borderColor = '#e5e7eb';
      textInput.style.boxShadow = 'none';
    };

    widthSlider.oninput = () => {
      widthValue.textContent = widthSlider.value + 'x';
    };

    heightSlider.oninput = () => {
      heightValue.textContent = heightSlider.value + 'px';
    };

    content.querySelector('#generate-btn').onclick = async () => {
      const mode = jsonModeRadio.checked ? 'json' : 'custom';
      const text = content.querySelector('#qr-text').value.trim();
      const type = content.querySelector('#qr-type').value;
      const jsonPath = String(jsonPathInput.value || '').trim();
      const fileIndex = String(fileIndexSelect.value || '0');

      if (mode === 'custom' && !text) {
        textInput.style.borderColor = '#ef4444';
        textInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        textInput.focus();
        showToast('Please enter text/data to encode', 'error');
        setTimeout(() => {
          textInput.style.borderColor = '#e5e7eb';
          textInput.style.boxShadow = 'none';
        }, 3000);
        return;
      }
      if (mode === 'json' && (!jsonPath || fileIndex === '0')) {
        textInput.style.borderColor = '#ef4444';
        textInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        showToast('Please select a DataSource file and path', 'error');
        setTimeout(() => {
          textInput.style.borderColor = '#e5e7eb';
          textInput.style.boxShadow = 'none';
        }, 3000);
        return;
      }

      const btn = content.querySelector('#generate-btn');
      const originalContent = btn.innerHTML;
      btn.innerHTML = '<span style="font-size: 16px;">⏳</span> Generating...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      const widthVal = parseFloat(content.querySelector('#barcode-width').value) || 2;
      const heightVal = parseInt(content.querySelector('#barcode-height').value) || 100;
      const showTextVal = content.querySelector('#show-text').checked;
      const errorCorrectionVal = content.querySelector('#qr-error-correction').value;

      component.set('qr-text', text);
      component.set('qr-type', type);
      component.set('qr-width', widthVal);
      component.set('qr-height', heightVal);
      component.set('qr-show-text', showTextVal);
      component.set('qr-error-correction', errorCorrectionVal);
      component.set('qr-input-mode', mode);
      component.addAttributes({ 'data-qr-input-mode': mode });
      component.set('json-file-index', fileIndex);
      component.set('my-input-json', jsonPath);

      const jsonPathVal = (component.get('my-input-json') || '').trim();
      const persistAttrs = {
        'data-qr-type': type,
        'data-qr-width': String(widthVal),
        'data-qr-height': String(heightVal),
        'data-qr-show-text': String(showTextVal),
        'data-qr-error-correction': errorCorrectionVal,
        'data-qr-input-mode': mode,
      };

      const compId = component.getAttributes()?.id;
      if (mode === 'custom') {
        // Persist custom text and clear datasource mapping
        persistAttrs['data-qr-text'] = text;
        component.removeAttributes('my-input-json');
        component.removeAttributes('data-json-file-index');
        component.removeAttributes('data-json-language');
        if (compId) upsertMyInputJsonCss(editor, compId, '');
      } else {
        // Persist datasource mapping and clear custom text
        component.removeAttributes('data-qr-text');
        persistAttrs['data-json-file-index'] = fileIndex;
        if (jsonPathVal) persistAttrs['my-input-json'] = jsonPathVal;
        if (compId) upsertMyInputJsonCss(editor, compId, jsonPathVal);
      }
      component.addAttributes(persistAttrs);

      try {
        const dynamicText = (mode === 'json' && jsonPathVal) ? resolveTextFromDatasource(component, jsonPathVal) : '';
        const finalText = mode === 'json' ? dynamicText : text;
        if (finalText) {
          let imgBase64 = '';
          const options = { width: widthVal, height: heightVal, displayValue: showTextVal };

          if (type === 'qr') {
            imgBase64 = await generateQRCodeBase64(finalText, { errorCorrectionLevel: errorCorrectionVal });
          } else if (['datamatrix', 'pdf417', 'aztec'].includes(type)) {
            imgBase64 = await generate2DBarcodeBase64(finalText, type);
          } else {
            imgBase64 = await generateBarcodeBase64(finalText, type, options);
          }

          component.components().reset([{
            type: 'default',
            tagName: 'img',
            selectable: false,
            layerable: false,
            attributes: {
              src: imgBase64,
              alt: `${type.toUpperCase()} code for: ${finalText}`,
              style: 'max-width:100%; height:auto; padding: 7px;'
            }
          }]);
          showToast(`${type.toUpperCase()} code generated successfully!`, 'success');
        } else {
          component.components().reset([{
            type: 'default',
            tagName: 'div',
            selectable: false,
            layerable: false,
            style: { padding: '12px', minHeight: '60px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' },
            content: `Dynamic: ${jsonPathVal}`,
          }]);
          showToast('DataSource Path set. Barcode will be generated per record at export.', 'success');
        }
        modal.close();
      } catch (error) {
        showToast(error.message, 'error');
        component.renderBarcodeFromConfig && component.renderBarcodeFromConfig();
      } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    };
  }

  function getCommonJsonFileNames() {
    const fromList = (localStorage.getItem('common_json_files') || '')
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);
    if (fromList.length) return fromList;

    const derived = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'common_json' || key === 'common_json_files') continue;
      if (key.startsWith('common_json_')) {
        derived.push(key.replace('common_json_', ''));
      }
    }
    return derived;
  }

  function getCommonJsonByFileIndex(fileIndex) {
    const idx = Number.parseInt(fileIndex, 10);
    if (!Number.isFinite(idx) || idx <= 0) return null;
    const fileNames = getCommonJsonFileNames();
    const selectedFile = fileNames[idx - 1];
    if (!selectedFile) return null;

    const jsonString =
      localStorage.getItem(`common_json_${selectedFile}`) ||
      localStorage.getItem(`common_json_${selectedFile}.json`);
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return null;
    }
  }

  function getValueByPath(obj, path) {
    if (obj == null || !path) return undefined;
    const tokens = String(path)
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .map(t => t.trim())
      .filter(Boolean);

    let cur = obj;
    for (const tok of tokens) {
      if (cur == null) return undefined;
      cur = cur[tok];
    }
    return cur;
  }

  function resolveTextFromDatasource(component, subPath) {
    const fileIndex = component.get('json-file-index') || component.getAttributes()?.['data-json-file-index'] || '0';
    const savedLanguage = component.get('json-language') || component.getAttributes()?.['data-json-language'] || localStorage.getItem('language') || 'english';
    const commonJson = getCommonJsonByFileIndex(fileIndex);
    if (!commonJson) return '';

    const fullPath = String(subPath || '').trim();
    let language = savedLanguage;
    let remainingPath = fullPath;

    if (fullPath.includes('.')) {
      const parts = fullPath.split('.').filter(Boolean);
      const candidate = parts[0];
      if (candidate && commonJson[candidate] != null) {
        language = candidate;
        remainingPath = parts.slice(1).join('.');
      }
    }

    const root = (commonJson && commonJson[language] != null) ? commonJson[language] : commonJson;
    const value = getValueByPath(root, remainingPath);
    if (value == null) return '';
    return String(value);
  }

  function extractMetaDataKeys(obj, prefix = '') {
    let keys = [];
    if (obj == null) return keys;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPrefix = `${prefix}[${index}]`;
        if (item && typeof item === 'object') {
          keys = keys.concat(extractMetaDataKeys(item, newPrefix));
        } else {
          keys.push(newPrefix);
        }
      });
      return keys;
    }

    if (typeof obj !== 'object') return keys;

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object') {
        keys = keys.concat(extractMetaDataKeys(value, newPrefix));
      } else {
        keys.push(newPrefix);
      }
    }
    return keys;
  }

  function openDatasourceSuggestionModal(editor, fileIndex, onSelect) {
    const commonJson = getCommonJsonByFileIndex(fileIndex);
    if (!commonJson || typeof commonJson !== 'object') {
      showToast('Selected DataSource file not found or invalid JSON', 'error');
      return;
    }

    const modal = editor.Modal;

    // If the selected file is language-grouped (e.g. { english: {...}, hindi: {...} }),
    // use the currently selected language, but do not show any language picker UI.
    const languagePref = localStorage.getItem('language') || 'english';
    const hasLanguageRoot =
      commonJson &&
      typeof commonJson === 'object' &&
      commonJson[languagePref] != null &&
      typeof commonJson[languagePref] === 'object';

    const rootObj = hasLanguageRoot ? commonJson[languagePref] : commonJson;

    const renderObjectList = () => {
      const topKeys =
        rootObj && typeof rootObj === 'object'
          ? Object.keys(rootObj)
          : [];

      let modalContent = `
        <div class="new-table-form">
          <div style="padding-bottom:10px">
            <input type="text" id="searchInput" placeholder="Search" style="width:100%; padding:8px;">
          </div>
          <div class="suggestion-results" style="height: 240px; overflow-y: auto; border: 1px solid #ddd; padding: 6px;">
      `;

      topKeys.forEach(key => {
        modalContent += `<div class="suggestion obj-option" data-value="${key}" style="padding:8px; cursor:pointer; border-bottom:1px solid #eee;">${key}</div>`;
      });

      modalContent += `</div></div>`;
      modal.setTitle('DataSource Suggestion');
      modal.setContent(modalContent);
      modal.open();

      const filter = (q) => {
        const query = (q || '').toLowerCase();
        document.querySelectorAll('.suggestion.obj-option').forEach(el => {
          const txt = (el.textContent || '').toLowerCase();
          el.style.display = txt.includes(query) ? 'block' : 'none';
        });
      };

      document.getElementById('searchInput').addEventListener('input', function () {
        filter(this.value);
      });

      document.querySelectorAll('.suggestion.obj-option').forEach(item => {
        item.addEventListener('click', function () {
          const topKey = this.getAttribute('data-value');
          renderKeyList(topKey);
        });
      });
    };

    const renderKeyList = (topKey) => {
      const value = rootObj ? rootObj[topKey] : undefined;
      const isObjectLike = value && typeof value === 'object';

      // If the topKey points to a primitive, selecting the object selects the key itself.
      if (!isObjectLike) {
        onSelect(languagePref, topKey);
        modal.close();
        return;
      }

      const innerKeys = extractMetaDataKeys(value);
      const fullPaths = innerKeys.length
        ? innerKeys.map(k => {
          const key = String(k);
          return key.startsWith('[') ? `${topKey}${key}` : `${topKey}.${key}`;
        })
        : [topKey];

      let modalContent = `
        <div class="new-table-form">
          <div style="padding-bottom:10px; display:flex; gap: 10px; align-items:center;">
            <button id="backBtn" style="padding:6px 10px;">← Back</button>
            <input type="text" id="searchInput" placeholder="Search" style="flex:1; padding:8px;">
          </div>
          <div class="suggestion-results" style="height: 240px; overflow-y: auto; border: 1px solid #ddd; padding: 6px;">
      `;

      fullPaths.forEach(path => {
        modalContent += `<div class="suggestion key-option" data-value="${path}" style="padding:8px; cursor:pointer; border-bottom:1px solid #eee;">${path}</div>`;
      });

      modalContent += `</div></div>`;
      modal.setContent(modalContent);

      const filter = (q) => {
        const query = (q || '').toLowerCase();
        document.querySelectorAll('.suggestion.key-option').forEach(el => {
          const txt = (el.textContent || '').toLowerCase();
          el.style.display = txt.includes(query) ? 'block' : 'none';
        });
      };

      document.getElementById('backBtn').addEventListener('click', renderObjectList);
      document.getElementById('searchInput').addEventListener('input', function () {
        filter(this.value);
      });

      document.querySelectorAll('.suggestion.key-option').forEach(item => {
        item.addEventListener('click', function () {
          const subPath = this.getAttribute('data-value');
          onSelect(languagePref, subPath);
          modal.close();
        });
      });
    };

    renderObjectList();
  }

  function upsertMyInputJsonCss(editor, id, subPath) {
    if (!id || !editor) return;

    const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const selectorRe = new RegExp(`#${escapeRegExp(id)}\\s*\\{[^}]*\\}`, 'gi');

    const css = String(editor.getCss ? editor.getCss() : '');
    const cleaned = css.replace(selectorRe, (block) => {
      const hasCustomProps = /my-input-json\s*:|json-file-index\s*:/i.test(block);
      if (!hasCustomProps) return block;

      const bodyMatch = block.match(/\{([\s\S]*)\}/);
      if (!bodyMatch) return block;

      const decls = bodyMatch[1]
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => !/^my-input-json\s*:/i.test(s) && !/^json-file-index\s*:/i.test(s));

      if (!decls.length) return '';
      return `#${id}{${decls.join(';')};}`;
    });

    const safeValue = String(subPath || '').replace(/[;{}]/g, '').trim();
    const nextCss = safeValue ? `${cleaned}\n#${id}{my-input-json:${safeValue};}` : cleaned;

    if (typeof editor.setStyle === 'function') {
      editor.setStyle(nextCss);
    } else if (typeof editor.addStyle === 'function' && safeValue) {
      // Fallback (may duplicate in older environments)
      editor.addStyle(`#${id} { my-input-json: ${safeValue}; }`);
    }
  }

  async function generateQRCodeBase64(text, options = {}) {
    if (typeof QRCode === 'undefined') {
      throw new Error('QRCode library not found. Please include qrcode.js library.');
    }

    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    return await QRCode.toDataURL(text, qrOptions);
  }

  async function generate2DBarcodeBase64(text, type) {
    if (typeof bwipjs === 'undefined') {
      throw new Error(`${type.toUpperCase()} generation requires bwip-js library. Please include it in your project.`);
    }

    const canvas = document.createElement('canvas');

    try {
      switch (type) {
        case 'datamatrix':
          canvas.width = 200;
          canvas.height = 200;
          bwipjs.toCanvas(canvas, {
            bcid: 'datamatrix',
            text: text,
            scale: 3,
            includetext: false
          });
          break;

        case 'pdf417':
          canvas.width = 300;
          canvas.height = 100;
          bwipjs.toCanvas(canvas, {
            bcid: 'pdf417',
            text: text,
            scale: 2,
            includetext: false
          });
          break;

        case 'aztec':
          canvas.width = 200;
          canvas.height = 200;
          bwipjs.toCanvas(canvas, {
            bcid: 'azteccode',
            text: text,
            scale: 3,
            includetext: false
          });
          break;

        default:
          throw new Error(`Unsupported 2D barcode type: ${type}`);
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      throw new Error(`Failed to generate ${type.toUpperCase()}: ${error.message}`);
    }
  }

  async function generateBarcodeBase64(text, format, options = {}) {
    if (typeof JsBarcode === 'undefined') {
      throw new Error('JsBarcode library not found. Please include jsbarcode.js library.');
    }

    const canvas = document.createElement('canvas');

    const formatMap = {
      'code128': 'CODE128',
      'code39': 'CODE39',
      'code93': 'CODE93',
      'ean13': 'EAN13',
      'ean8': 'EAN8',
      'upc': 'UPC',
      'upce': 'UPC',
      'itf': 'ITF14',
      'msi': 'MSI',
      'codabar': 'codabar',
      'pharmacode': 'pharmacode',
      'gs1_128': 'CODE128',
      'postnet': 'CODE128',
      'planet': 'CODE128'
    };

    const barcodeFormat = formatMap[format];

    if (!barcodeFormat) {
      throw new Error(`Unsupported barcode format: ${format}`);
    }

    try {
      if (format === 'postnet' || format === 'planet') {
        JsBarcode(canvas, text, {
          format: 'CODE128',
          width: options.width || 2,
          height: options.height || 100,
          displayValue: options.displayValue !== false,
          fontSize: 12,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          fontOptions: '',
          font: 'monospace',
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10
        });
      } else {
        JsBarcode(canvas, text, {
          format: barcodeFormat,
          width: options.width || 2,
          height: options.height || 100,
          displayValue: options.displayValue !== false,
          fontSize: 12,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          fontOptions: '',
          font: 'monospace',
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10,
          marginTop: 10,
          marginBottom: 10,
          marginLeft: 10,
          marginRight: 10
        });
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      throw new Error(`Failed to generate ${format.toUpperCase()}: ${error.message}`);
    }
  }
}
