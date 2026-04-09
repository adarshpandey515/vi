function jsontablecustom(editor) {
    editor.on('load', () => {
  const canvasDoc = editor.Canvas.getDocument();
  const style = canvasDoc.createElement('style');
  style.innerHTML = `
    table.dataTable thead th,
    table.dataTable thead td {
      border-bottom: none !important;
    }
    /* Let clicks pass through to json-table so it gets selected instead of default child */
    .json-table-placeholder,
    .json-table-wrapper {
      pointer-events: none !important;
    }
  `;
  canvasDoc.head.appendChild(style);
});

    editor.on('load', () => {
        const iframe = editor.getContainer().querySelector('iframe');
        if (iframe && iframe.contentDocument) {
            const head = iframe.contentDocument.head;

            const datatableCSS = document.createElement('link');
            datatableCSS.rel = 'stylesheet';
            datatableCSS.href = 'https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap4.min.css';
            head.appendChild(datatableCSS);

            const buttonsCSS = document.createElement('link');
            buttonsCSS.rel = 'stylesheet';
            buttonsCSS.href = 'https://cdn.datatables.net/buttons/2.2.2/css/buttons.dataTables.min.css';
            head.appendChild(buttonsCSS);

            const formulaScript = document.createElement('script');
            formulaScript.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
            head.appendChild(formulaScript);

            const jqueryScript = document.createElement('script');
            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            head.appendChild(jqueryScript);

            jqueryScript.onload = () => {
                const datatableScript = document.createElement('script');
                datatableScript.src = 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js';
                head.appendChild(datatableScript);

                const buttonsScript = document.createElement('script');
                buttonsScript.src = 'https://cdn.datatables.net/buttons/2.2.2/js/dataTables.buttons.min.js';
                head.appendChild(buttonsScript);

                const exportScripts = [
                    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js',
                    'https://cdn.datatables.net/buttons/2.2.2/js/buttons.html5.min.js',
                    'https://cdn.datatables.net/buttons/2.2.2/js/buttons.print.min.js'
                ];

                exportScripts.forEach(src => {
                    const script = document.createElement('script');
                    script.src = src;
                    head.appendChild(script);
                });
            };
        }
    });

    function applyHighlighting(tableId, conditions, highlightColor) {
        try {
            const canvasBody = editor.Canvas.getBody();
            const table = canvasBody.querySelector(`#${tableId}`);
            if (!table) return;
            const wrapper = editor.DomComponents.getWrapper();
            const prev = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
            prev.forEach(td => {
                td.style.backgroundColor = '';
                td.style.color = '';
                td.style.fontFamily = '';
                td.removeAttribute('data-highlighted');

                const id = td.id;
                if (id) {
                    const comp = wrapper.find(`#${id}`)[0];
                    if (comp) {
                        comp.removeStyle('background-color');
                        comp.removeStyle('color');
                        comp.removeStyle('font-family');
                    }
                }
            });

            if (conditions && conditions.length > 0) {
                const bodyCells = table.querySelectorAll('tbody td');
                bodyCells.forEach(td => {
                    const div = td.querySelector('div');
                    const val = div ? div.textContent.trim() : td.textContent.trim();

                    const shouldHighlight = conditions.some(condition =>
                        evaluateCondition(val, condition)
                    );

                    if (shouldHighlight) {
                        td.setAttribute('data-highlighted', 'true');

                        const id = td.id;
                        if (id) {
                            const comp = wrapper.find(`#${id}`)[0];
                            if (comp) {
                                const styles = {
                                    'background-color': bgColor,
                                    'box-sizing': 'border-box',
                                };
                                if (textColor) styles.color = textColor;
                                if (fontFamily) styles['font-family'] = fontFamily;
                                if (fontSize) styles['font-size'] = fontSize + 'px';

                                comp.addStyle(styles);
                            }
                        }
                    }
                });
            }

        } catch (err) {
            console.warn('Error applying highlighting:');
        }
    }
    function evaluateCondition(cellValue, condition) {
        const value = String(cellValue || '').trim();

        switch (condition.type) {
            case 'contains':
                return condition.caseSensitive ?
                    value.includes(condition.value) :
                    value.toLowerCase().includes(condition.value.toLowerCase());

            case 'starts-with':
                return condition.caseSensitive ?
                    value.startsWith(condition.value) :
                    value.toLowerCase().startsWith(condition.value.toLowerCase());

            case 'ends-with':
                return condition.caseSensitive ?
                    value.endsWith(condition.value) :
                    value.toLowerCase().endsWith(condition.value.toLowerCase());

            case 'exact':
                return condition.caseSensitive ?
                    value === condition.value :
                    value.toLowerCase() === condition.value.toLowerCase();

            case 'once-if':
                const chars = condition.value.split('');
                return chars.some(char => condition.caseSensitive ?
                    value.includes(char) :
                    value.toLowerCase().includes(char.toLowerCase()));

            case '>':
                return parseFloat(value) > parseFloat(condition.value);
            case '>=':
                return parseFloat(value) >= parseFloat(condition.value);
            case '<':
                return parseFloat(value) < parseFloat(condition.value);
            case '<=':
                return parseFloat(value) <= parseFloat(condition.value);
            case '=':
                return parseFloat(value) === parseFloat(condition.value);
            case '!=':
                return parseFloat(value) !== parseFloat(condition.value);
            case 'between':
                const numValue = parseFloat(value);
                return numValue >= parseFloat(condition.minValue) && numValue <= parseFloat(condition.maxValue);
            case 'null':
                return !value || value === '';

            default:
                return false;
        }
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    function getJsonFileOptions() {
        const storedFileNames = localStorage.getItem('common_json_files');
        const options = [{ id: '0', name: 'Select File' }];

        if (storedFileNames) {
            const fileNames = storedFileNames.split(',').map(f => f.trim()).filter(f => f);
            fileNames.forEach((fileName, index) => {
                options.push({ id: (index + 1).toString(), name: fileName });
            });
        }
        return options;
    }

    editor.DomComponents.addType('json-table', {
        isComponent: el => {
            if (!el || !el.getAttribute) return false;
            if (el.getAttribute('data-gjs-type') === 'json-table') return { type: 'json-table' };
            if (el.classList && el.classList.contains('json-table-container')) return { type: 'json-table' };
            if (el.classList && el.classList.contains('json-table-wrapper')) return { type: 'json-table' };
            return false;
        },

        model: {
            defaults: {
                tagName: 'div',
                selectable: true,
                style: {
                    'margin-top': '5px'
                },
                attributes: {
                    class: 'json-table-container standard',
                    'data-gjs-type': 'json-table',
                    'data-json-state': ''
                },

                traits: [
                    {
                        type: 'text',
                        name: 'id',
                        label: 'Id'
                    },
                    {
                        type: 'text',
                        name: 'title',
                        label: 'Title'
                    },
                    {
                        type: 'text',
                        name: 'name',
                        label: 'Name',
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'footer',
                        label: 'Footer',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'text',
                        name: 'file-download',
                        label: 'File Download',
                        placeholder: '"copy", "csv", "excel", "pdf", "print"'
                    },
                    {
                        type: 'select',
                        name: 'pagination',
                        label: 'Pagination',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'number',
                        name: 'page-length',
                        label: 'Page Length',
                        min: 1,
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'search',
                        label: 'Search',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'caption',
                        label: 'Caption',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'caption-align',
                        label: 'Caption Align',
                        options: [
                            { value: 'left', name: 'Left' },
                            { value: 'center', name: 'Center' },
                            { value: 'right', name: 'Right' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'text',
                        name: 'json-path',
                        label: 'DataSource Path',
                        placeholder: 'Enter DataSource Path',
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'table-type',
                        label: 'Table Type',
                        options: [
                            { value: 'standard', name: 'Standard Table' },
                            { value: 'crosstab', name: 'Crosstab Table' }
                        ],
                        default: "standard",
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'json-file-index',
                        label: 'DataSource File',
                        options: [],
                        changeProp: 1,
                    },
                    {
                        type: 'button',
                        name: 'json-suggestion-btn',
                        label: 'Datasource Suggestion',
                        text: 'Suggestion',
                        full: true,
                        command: 'open-json-table-suggestion'
                    },
                    {
                        type: 'select',
                        name: 'filter-column',
                        label: 'Preview Column',
                        options: [{ value: "", name: "First enter DataSource path" }],
                        changeProp: 1,
                        attributes: {
                            style: 'display: block;'
                        }
                    },
                    {
                        type: 'text',
                        name: 'filter-value',
                        label: 'Preview Value',
                        placeholder: 'Enter preview value',
                        changeProp: 1,
                        attributes: {
                            style: 'display: block;'
                        }
                    },
                    {
                        type: 'checkbox',
                        name: 'hide-data',
                        label: 'Hide Data (Silent Mode)',
                        changeProp: 1,
                    },
                    {
                        type: 'button',
                        name: 'table-settings-btn',
                        label: 'Table Settings',
                        text: 'Table Settings',
                        full: true,
                        command: 'open-table-settings-modal'
                    },
                    {
                        type: 'button',
                        name: 'manage-table-styles',
                        label: 'Table Styles',
                        text: 'Customize Table Styles',
                        full: true,
                        command: 'open-table-style-manager'
                    },
                    {
                        type: 'button',
                        name: 'manage-highlight-conditions',
                        label: ' Highlight',
                        text: 'Highlight Conditions',
                        full: true,
                        command: 'open-table-condition-manager-json-table'
                    },
                ],
                'json-path': '',
                'table-data': null,
                'table-headers': null,
                'custom-data': null,
                'custom-headers': null,
                'cell-styles': {},
                'selected-cell': null,
                'highlight-conditions': [],
                'highlight-condition-type': '',
                'highlight-words': '',
                'highlight-color': '#ffff99',
                'highlight-text-color': '',
                'highlight-font-family': '',
                'show-placeholder': true,
                'table-border-style': 'solid',
                'table-border-width': '1',
                'table-border-color': '#000000',
                'table-border-opacity': '100',
                'table-bg-color': '#ffffff',
                'table-text-color': '#000000',
                'table-font-family': 'Arial, sans-serif',
                'table-text-align': 'left',
                'table-vertical-align': 'middle',
                'grouping-fields': [],
                'summary-fields': [],
                'sort-order': 'ascending',
                'top-n': 'none',
                'define-named-group': false,
                'summarize-group': false,
                'page-break': false,
                'summary-percentage': 'none',
    'repeat-headers-before-summary': false,
                'group-header-inplace': true,
                'hide-subtotal-single-row': false,
                'show-summary-only': false,
                'keep-group-hierarchy': false,
                'running-totals': [],
                'show-summary-headers': false,
                'grand-total': true,
                'grand-total-label': '',
                'summary-label': ''
            },

            ensureSharedTableId() {
                const attrs = (this.getAttributes && this.getAttributes()) || {};
                let sharedId =
                    attrs['data-source-table-id'] ||
                    attrs['data-original-table-id'] ||
                    '';

                if (!sharedId) {
                    const seed = this.cid || Math.random().toString(36).substr(2, 9);
                    sharedId = `json-table-source-${seed}`;
                    if (typeof this.addAttributes === 'function') {
                        this.addAttributes({ 'data-source-table-id': sharedId });
                    }
                }

                return sharedId;
            },

            init() {
                this.ensureSharedTableId();
                this._isRestoring = true;
                try {
                    const attrs = this.getAttributes ? this.getAttributes() : {};
                    const encoded = attrs && attrs['data-json-state'];

                    if (encoded) {
                        const parsed = JSON.parse(decodeURIComponent(encoded));
                        const isContinuation = attrs['data-continuation-table'] === 'true';
                        const rowsKept = parseInt(attrs['data-rows-kept']) || 0;

                        if (isContinuation && rowsKept > 0) {
                            const copyHeader = attrs['data-copy-header'];
                            if (copyHeader === 'false') {
                                this.set('_remove-header-on-build', true, { silent: true });
                            }
                        }

                        this.set('table-headers', parsed.headers || null, { silent: true });
                        this.set('table-data', parsed.data || null, { silent: true });
                        this.set('custom-headers', parsed.headers || null, { silent: true });
                        this.set('custom-data', parsed.data || null, { silent: true });
                        this.set('table-styles-applied', parsed.styles || null, { silent: true });
                        this.set('highlight-conditions', parsed.highlights || null, { silent: true });
                    }
                } catch (e) {
                    this._isRestoring = false;
                }

                const refreshJsonFileTrait = () => {
                    const trait = this.getTrait('json-file-index');
                    if (!trait) return;

                    const opts = getJsonFileOptions();
                    trait.set('options', opts);

                    if (!opts.length) {
                        this.set({ 'json-file-index': '', 'json-path': '' });
                        ['json-path', 'filter-column', 'running-total-column'].forEach(n => {
                            const t = this.getTrait(n);
                            if (t) {
                                t.set('options', []);
                                t.set('value', '');
                                if (t.view && t.view.render) t.view.render();
                            }
                        });
                        if (trait.view && trait.view.render) trait.view.render();
                        return;
                    }

                    const current = String(this.get('json-file-index') ?? '');
                    const stillExists = opts.some(o => String(o.value) === current);
                    const nextVal = stillExists ? current : String(opts[0].value);

                    trait.set('value', nextVal);
                    this.set('json-file-index', nextVal);

                    if (trait.view && trait.view.render) trait.view.render();

                    if (this.get('json-path')) {
                        this.updateFilterColumnOptions?.();
                        this.updateRunningTotalColumnOptions?.();
                    }

                    if (nextVal !== current) {
                        if (typeof this.handleJsonFileChange === 'function') {
                            this.handleJsonFileChange();
                        } else {
                            this.trigger('change:json-file-index');
                        }
                    }
                };

                refreshJsonFileTrait();

                const onFilesUpdated = () => refreshJsonFileTrait();
                window.addEventListener('common-json-files-updated', onFilesUpdated);
                this.once('remove', () => {
                    window.removeEventListener('common-json-files-updated', onFilesUpdated);
                });

                try {
                    const attrs = this.getAttributes ? this.getAttributes() : {};
                    const encoded = attrs && attrs['data-json-state'];

                    if (encoded) {
                        const parsed = JSON.parse(decodeURIComponent(encoded));
                        this.set('table-headers', parsed.headers || null, { silent: true });
                        this.set('table-data', parsed.data || null, { silent: true });
                        this.set('custom-headers', parsed.headers || null, { silent: true });
                        this.set('custom-data', parsed.data || null, { silent: true });
                        this.set('table-styles-applied', parsed.styles || null, { silent: true });
                        this.set('highlight-conditions', parsed.highlights || null, { silent: true });

                        if (parsed.filter) {
                            this.set('filter-column', parsed.filter.column || '', { silent: true });
                            this.set('filter-value', parsed.filter.value || '', { silent: true });
                        }
                        if (parsed.meta) {
                            this.set('table-type', parsed.meta.tableType || 'standard', { silent: true });
                            this.set('caption', parsed.meta.caption || 'no', { silent: true });
                            this.set('page-length', parsed.meta.pageLength || 10, { silent: true });
                            this.set('pagination', parsed.meta.pagination || 'no', { silent: true });
                            this.set('search', parsed.meta.search || 'no', { silent: true });
                            this.set('file-download', parsed.meta.fileDownload || '', { silent: true });
                        }

                        const tableType = this.get('table-type') || 'standard';
                        const currentClass = this.getAttributes().class || 'json-table-container';
                        const baseClass = 'json-table-container';
                        this.addAttributes({
                            class: `${baseClass} ${tableType}`
                        });

                        const hasValidData = parsed.headers && parsed.data &&
                            (Array.isArray(parsed.data) ? parsed.data.length > 0 : true);

                        this.set('show-placeholder', !hasValidData, { silent: true });
                        this._isRestoring = false;

                        setTimeout(() => {
                            this.updateTableHTML();
                        }, 0);
                        return;
                    } else {
                        this._isRestoring = false;
                    }
                } catch (e) {
                    console.warn('⚠️ json-table init rehydrate failed');
                    this._isRestoring = false;
                }

                const resetMergedTableEditingState = () => {
                    const attrsToRemove = [
                        'data-continuation-table',
                        'data-split-table',
                        'data-original-table-id',
                        'data-rows-kept',
                        'data-copy-header'
                    ];

                    attrsToRemove.forEach((attr) => {
                        try {
                            if (typeof this.removeAttributes === 'function') {
                                this.removeAttributes(attr);
                            }
                        } catch (err) { }
                    });

                    this.set('_remove-header-on-build', false, { silent: true });
                    this.set('cell-styles', {}, { silent: true });
                    this.set('table-styles-applied', null, { silent: true });

                    const headerMaps = [
                        this.get('custom-headers'),
                        this.get('table-headers')
                    ].filter(Boolean);

                    headerMaps.forEach((headerMap) => {
                        Object.keys(headerMap || {}).forEach((key) => {
                            try {
                                if (typeof this.unset === 'function') {
                                    this.unset(`header-content-${key}`, { silent: true });
                                } else {
                                    this.set(`header-content-${key}`, undefined, { silent: true });
                                }
                            } catch (err) { }
                        });
                    });

                    this.ensureSharedTableId();
                };

                this.on('change:json-file-index', () => {
                    if (this._isRestoring) return;
                    resetMergedTableEditingState();
                    this.set('json-path', '');
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    this.set('custom-headers', null);
                    this.set('custom-data', null);
                    this.set('table-headers', null);
                    this.set('table-data', null);
                    this.set('show-placeholder', true);
                    this.updateTableHTML();

                    setTimeout(() => {
                        this.updateFilterColumnOptions();
                    }, 100);
                });

                this.on('change:json-path', () => {
                    if (this._isRestoring) return;
                    resetMergedTableEditingState();
                    const tableType = this.get('table-type') || 'standard';

                    if (tableType === 'crosstab') {
                        this.updateTableFromJson();
                        return;
                    }

                    this.updateTableFromJson();
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    this.set('custom-headers', null);
                    this.set('custom-data', null);

                    setTimeout(() => {
                        const jsonPathTrait = this.getTrait('json-path');
                        if (jsonPathTrait) {
                            const currentPath = this.get('json-path');
                            jsonPathTrait.set('value', currentPath);
                            if (jsonPathTrait.view && jsonPathTrait.view.render) {
                                jsonPathTrait.view.render();
                            }
                        }
                    }, 100);
                });

                this.on('change:table-type', () => {
                    if (this._isRestoring) return;
                    const tableType = this.get('table-type');

                    setTimeout(() => {
                        const filterColumnTrait = this.getTrait('filter-column');
                        const filterValueTrait = this.getTrait('filter-value');
                        if (filterColumnTrait && filterColumnTrait.view)
                            filterColumnTrait.view.el.style.display = tableType === 'crosstab' ? 'none' : 'block';
                        if (filterValueTrait && filterValueTrait.view)
                            filterValueTrait.view.el.style.display = tableType === 'crosstab' ? 'none' : 'block';
                    }, 100);

                    const baseClass = 'json-table-container';
                    this.addAttributes({
                        class: `${baseClass} ${tableType}`
                    });
                    if (tableType === 'crosstab') {
                        this.set('filter-column', '');
                        this.set('filter-value', '');
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                    }

                    const jsonPath = this.get('json-path');
                    if (jsonPath) {
                        this.updateTableFromJson();
                    }
                });

                this.on('change:selected-running-total-columns', () => {
                    if (this._isRestoring) return;
                    this.updateRunningTotals();
                });

                this.on('change:filter-column', () => {
                    if (this._isRestoring) return;
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    if (filterColumn === "none") {
                        this.loadFilteredData();
                        return;
                    }

                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterColumn) {
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });

                this.on('change:filter-value', () => {
                    if (this._isRestoring) return;
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    if (filterColumn === "none") {
                        return;
                    }

                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterValue || filterValue.trim() === '') {
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });
                this.on('change:hide-data', () => {
                    if (this._isRestoring) return;

                    const hideData = this.get('hide-data');
                    this.set('show-placeholder', hideData);

                    if (hideData) {
                        this.updateTableHTML();
                    } else {
                        this.updateTableHTML();
                    }
                });


                this.on('change:grouping-fields change:summary-fields change:sort-order change:top-n change:summarize-group change:merge-group-cells change:show-summary-only change:grand-total', () => {
                    if (this._isRestoring) return;
                    this.applyGroupingAndSummary();
                });

                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align change:file-download', () => {
                    if (this._isRestoring) return;
                    setTimeout(() => {
                        this.updateDataTableSettings();
                    }, 100);
                });

                this.on('change:highlight-conditions change:highlight-color', () => {
                    if (this._isRestoring) return;
                    this.handleHighlightChange();
                });

                this.on('change:table-border-style change:table-border-width change:table-border-color change:table-border-opacity change:table-bg-color change:table-text-color change:table-font-family change:table-text-align change:table-vertical-align', () => {
                    if (this._isRestoring) return;
                    this.applyTableStyles();
                });

                this.set('show-placeholder', true);
                this.updateTableHTML();

                editor.on('component:update', (component) => {
                    if (component.get('type') === 'json-table') {
                        const jsonPath = component.get('json-path');
                        const customData = component.get('custom-data');
                        const customHeaders = component.get('custom-headers');
                        if (jsonPath) component.set('_preserved_json_path', jsonPath);
                        if (customData) component.set('_preserved_custom_data', customData);
                        if (customHeaders) component.set('_preserved_custom_headers', customHeaders);
                    }
                });

                editor.on('run:core:open-code:after', () => {
                    const wrapper = editor.DomComponents.getWrapper();
                    const jsonTables = wrapper.find('[data-gjs-type="json-table"]');
                    jsonTables.forEach(table => {
                        const preservedPath = table.get('_preserved_json_path');
                        const preservedData = table.get('_preserved_custom_data');
                        const preservedHeaders = table.get('_preserved_custom_headers');
                        if (preservedPath) table.set('json-path', preservedPath);
                        if (preservedData) table.set('custom-data', preservedData);
                        if (preservedHeaders) table.set('custom-headers', preservedHeaders);

                        setTimeout(() => {
                            table.updateTableHTML();
                        }, 100);
                    });
                });

                this.on('change:custom-data change:table-data', () => {
                    setTimeout(() => {
                        this.triggerAutoPagination();
                    }, 500);
                });

                try {
                    const ed = this.em && this.em.get ? this.em.get('Editor') : this.em;
                    if (ed && !ed.__jsonTableCodeHydrateBound) {
                        ed.__jsonTableCodeHydrateBound = true;

                        ed.on('run:core:open-code', () => {
                            ed.getWrapper().findType('json-table').forEach(cmp => {
                                const st = {
                                    headers: cmp.get('custom-headers') || cmp.get('table-headers') || null,
                                    data: cmp.get('custom-data') || cmp.get('table-data') || null,
                                    styles: cmp.get('table-styles-applied') || null,
                                    highlights: cmp.get('highlight-conditions') || null,
                                    filter: {
                                        column: cmp.get('filter-column') || null,
                                        value: cmp.get('filter-value') || null
                                    },
                                    meta: {
                                        tableType: cmp.get('table-type') || 'standard',
                                        caption: cmp.get('caption') || 'no',
                                        pageLength: cmp.get('page-length') || 10,
                                        pagination: cmp.get('pagination') || 'no',
                                        search: cmp.get('search') || 'no',
                                        fileDownload: cmp.get('file-download') || ''
                                    }
                                };
                                cmp.addAttributes({ 'data-json-state': encodeURIComponent(JSON.stringify(st)) });
                            });
                        });

                        ed.on('stop:core:open-code', () => {
                            setTimeout(() => {
                                const jsonTables = ed.getWrapper().findType('json-table');
                                jsonTables.forEach(cmp => {
                                    const tableElement = cmp.view?.el?.querySelector('.json-data-table');
                                    if (tableElement && tableElement.id) {
                                        const conditions = cmp.get('highlight-conditions');
                                        const color = cmp.get('highlight-color');
                                        if (conditions && conditions.length > 0) {
                                            applyHighlighting(tableElement.id, conditions, color);
                                        }
                                    }
                                });
                            }, 300);
                        });
                    }
                } catch (e) {
                    console.warn('json-table rehydrate binding failed');
                }
            },

            triggerAutoPagination() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;
                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);
                if (!tableElement) return;
                const pageContainer = tableElement.closest('.page-container');
                if (!pageContainer) return;
                const pageIndex = parseInt(pageContainer.getAttribute('data-page-index'));
                if (isNaN(pageIndex)) return;
                const pageSetupManager = editor.get?.('PageSetupManager');

                if (pageSetupManager && pageSetupManager.checkPageForOverflow) {
                    setTimeout(() => {
                        pageSetupManager.checkPageForOverflow(pageIndex);
                    }, 300);
                }
            },
            applyTableStyles() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;
                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);
                if (!tableElement) return;
                const borderStyle = this.get('table-border-style') || 'solid';
                const borderWidth = this.get('table-border-width') || '1';
                const borderColor = this.get('table-border-color') || '#000000';
                const borderOpacity = this.get('table-border-opacity') || '100';
                const bgColor = this.get('table-bg-color') || '#ffffff';
                const textColor = this.get('table-text-color') || '#000000';
                const fontFamily = this.get('table-font-family') || 'Arial, sans-serif';
                const textAlign = this.get('table-text-align') || 'left';
                const verticalAlign = this.get('table-vertical-align') || 'middle';
                const opacity = parseInt(borderOpacity) / 100;
                const rgbBorder = hexToRgb(borderColor);
                const borderColorWithOpacity = `rgba(${rgbBorder.r}, ${rgbBorder.g}, ${rgbBorder.b}, ${opacity})`;
                const wrapper = editor.DomComponents.getWrapper();
                const tableComp = wrapper.find(`#${tableId}`)[0];

                if (tableComp) {
                    tableComp.addStyle({
                        'background-color': bgColor,
                        'border-collapse': 'collapse',
                    });

                    const cells = tableComp.find('td, th');
                    cells.forEach(cellComp => {
                        const borderValue = borderStyle === 'none' ? 'none' : `${borderWidth}px ${borderStyle} ${borderColorWithOpacity}`;

                        cellComp.addStyle({
                            'border': borderValue,
                            'color': textColor,
                            'font-family': fontFamily,
                            'background-color': bgColor,
                            'padding': '8px',
                            'vertical-align': verticalAlign,
                            'text-align': textAlign,
                        });

                        const cellContent = cellComp.find('div')[0] || cellComp.find('.cell-content')[0];
                        if (cellContent) {
                            cellContent.addStyle({
                                'display': 'flex',
                                'align-items': verticalAlign === 'top' ? 'flex-start' :
                                    verticalAlign === 'bottom' ? 'flex-end' : 'center',
                                'justify-content': textAlign === 'left' ? 'flex-start' :
                                    textAlign === 'right' ? 'flex-end' : 'center',
                                'min-height': '100%',
                                'width': '100%',
                                'box-sizing': 'border-box',
                            });
                        }
                    });
                }

                this.set('table-styles-applied', {
                    borderStyle, borderWidth, borderColor, borderOpacity,
                    bgColor, textColor, fontFamily, textAlign, verticalAlign
                });

                this.updateDataJsonState();
            },
            updateDataTableSettings() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;
                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);
                if (!tableElement) return;
                if (canvasDoc.defaultView.$ && canvasDoc.defaultView.$.fn.DataTable.isDataTable(tableElement)) {
                    const dt = canvasDoc.defaultView.$(tableElement).DataTable();
                    dt.destroy();
                }

                const pagination = this.get('pagination') || 'no';
                const pageLength = this.get('page-length') || 10;
                const search = this.get('search') || 'no';
                const fileDownload = this.get('file-download') || '';
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const colCount = Object.keys(headers).length;

                setTimeout(() => {
                    const scriptContent = this.createDataTableScript(
                        tableId,
                        pagination,
                        pageLength,
                        search,
                        fileDownload,
                        colCount
                    );

                    const scriptEl = canvasDoc.createElement('script');
                    scriptEl.textContent = scriptContent.content;
                    canvasDoc.body.appendChild(scriptEl);

                    setTimeout(() => {
                        scriptEl.remove();
                    }, 1000);
                }, 100);
            },
            loadFilteredData() {
                const filterColumn = this.get('filter-column');
                const filterValue = this.get('filter-value');
                const originalHeaders = this.get('table-headers');
                const originalData = this.get('table-data');

                if (!originalHeaders || !originalData) {
                    console.warn('Cannot load data: missing table data');
                    return;
                }

                if (filterColumn === "none") {
                    const allData = [...originalData];

                    this.set('custom-headers', { ...originalHeaders });
                    this.set('custom-data', allData);
                    this.set('show-placeholder', false);
                    this.set('filter-value', '');
                    const filterValueTrait = this.getTrait('filter-value');
                    if (filterValueTrait) {
                        filterValueTrait.set('value', '');
                    }

                    this.updateTableHTML();
                    return;
                }

                if (!filterColumn || !filterValue || filterColumn === '') {
                    console.warn('Cannot load data: missing filter criteria');
                    return;
                }

                let filteredData;

                if (filterValue === '=') {
                    filteredData = [...originalData];
                } else {
                    const normalizeInput = (value) => String(value ?? '').trim();
                    const toNumberIfValid = (value) => {
                        const normalized = normalizeInput(value).replace(/,/g, '');
                        if (normalized === '') return null;
                        if (!/^[-+]?\d*\.?\d+$/.test(normalized)) return null;
                        const parsed = Number(normalized);
                        return Number.isFinite(parsed) ? parsed : null;
                    };

                    const searchRaw = normalizeInput(filterValue);
                    const searchNumeric = toNumberIfValid(searchRaw);

                    filteredData = originalData.filter(row => {
                        const cellRaw = normalizeInput(row[filterColumn]);
                        const cellNumeric = toNumberIfValid(cellRaw);

                        // Numeric exact match: 10 and 10.00 are treated as equal, commas ignored.
                        if (searchNumeric !== null && cellNumeric !== null) {
                            return cellNumeric === searchNumeric;
                        }

                        // Fallback exact text match (case-insensitive), not substring.
                        const cellText = cellRaw.replace(/,/g, '').toLowerCase();
                        const searchText = searchRaw.replace(/,/g, '').toLowerCase();
                        return cellText === searchText;
                    });
                }

                this.set('custom-headers', { ...originalHeaders });
                this.set('custom-data', filteredData);
                this.set('show-placeholder', false);
                const filterColumnTrait = this.getTrait('filter-column');
                const filterValueTrait = this.getTrait('filter-value');

                if (filterColumnTrait) {
                    filterColumnTrait.set('value', filterColumn);
                }
                if (filterValueTrait) {
                    filterValueTrait.set('value', filterValue);
                }

                this.updateTableHTML();
                if (filteredData.length === 0) {
                    alert('No data matches the filter criteria');
                }
            },
            reorderColumns(newColumnOrder) {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];

                const reorderedHeaders = {};
                newColumnOrder.forEach(columnKey => {
                    if (headers[columnKey]) {
                        reorderedHeaders[columnKey] = headers[columnKey];
                    }
                });

                const reorderedData = data.map(row => {
                    const newRow = {};
                    newColumnOrder.forEach(columnKey => {
                        if (row.hasOwnProperty(columnKey)) {
                            newRow[columnKey] = row[columnKey];
                        }
                    });
                    return newRow;
                });

                this.set('custom-headers', reorderedHeaders);
                this.set('custom-data', reorderedData);
                this.updateTableHTML();
            },
            updateFilterColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    const fileIndex = this.get('json-file-index') || '0';
                    if (!jsonPath || jsonPath.trim() === "") {
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "First enter DataSource path" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    const pathParts = jsonPath.split('.');
                    let selectedLanguage = localStorage.getItem('language') || 'english';
                    let subPath = jsonPath;
                    if (pathParts.length > 1) {
                        selectedLanguage = pathParts[0];
                        subPath = pathParts.slice(1).join('.');
                    }

                    let jsonDataN;
                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (jsonString) {
                            const fileJson = JSON.parse(jsonString);
                            jsonDataN = fileJson[selectedLanguage];
                        }
                    } else {
                        const commonJson = JSON.parse(localStorage.getItem("common_json"));
                        jsonDataN = commonJson[selectedLanguage];
                    }

                    if (!jsonDataN || !jsonDataN[subPath]) {
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "Invalid DataSource path" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    const str = jsonDataN[subPath];
                    let tableData;
                    if (typeof str === 'string') {
                        tableData = eval(str);
                    } else {
                        tableData = str;
                    }

                    if (!tableData || !tableData.heading) {
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "Invalid table structure" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    const objectKeys = Object.keys(tableData.heading);

                    const filterTrait = this.getTrait('filter-column');
                    if (filterTrait) {
                        const currentValue = this.get('filter-column');
                        const options = [
                            { value: "", name: "Select Column to Filter & Load Data" },
                            { value: "none", name: "None (Load All Data)" },
                            ...objectKeys.map(key => ({
                                value: key,
                                name: tableData.heading[key]
                            }))
                        ];
                        filterTrait.set('options', options);

                        if (currentValue && currentValue !== '') {
                            filterTrait.set('value', currentValue);
                        }
                    }


                } catch (error) {
                    console.log('Error updating filter options:');
                    const filterTrait = this.getTrait('filter-column');
                    if (filterTrait) {
                        const options = [{ value: "", name: "Error loading columns" }];
                        filterTrait.set('options', options);
                    }
                }
                setTimeout(() => {
                    const tableType = this.get('table-type') || 'standard';
                    if (tableType === 'standard') {
                        const filterColumnTrait = this.getTrait('filter-column');
                        const filterValueTrait = this.getTrait('filter-value');

                        if (filterColumnTrait && filterColumnTrait.view) {
                            filterColumnTrait.view.el.style.display = 'block';
                        }
                        if (filterValueTrait && filterValueTrait.view) {
                            filterValueTrait.view.el.style.display = 'block';
                        }
                    }
                }, 200);
            },
            updateRunningTotalColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    const fileIndex = this.get('json-file-index') || '0';
                    if (!jsonPath || jsonPath.trim() === "") {
                        return;
                    }

                    let jsonDataN;
                    let custom_language = localStorage.getItem('language') || 'english';

                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (jsonString) {
                            const fileJson = JSON.parse(jsonString);
                            jsonDataN = fileJson[custom_language];
                        }
                    } else {
                        const commonJson = JSON.parse(localStorage.getItem("common_json"));
                        jsonDataN = commonJson[custom_language];
                    }

                    if (!jsonDataN || !jsonDataN[jsonPath]) {
                        return;
                    }

                    const str = jsonDataN[jsonPath];
                    const tableData = eval(str);

                    if (!tableData || !tableData.heading) {
                        return;
                    }
                    const objectKeys = Object.keys(tableData.heading);
                    const runningTotalTrait = this.getTrait('running-total-column');
                    if (runningTotalTrait) {
                        const options = [
                            { value: "", name: "Select Column for Running Total" },
                            ...objectKeys.map(key => ({
                                value: key,
                                name: tableData.heading[key]
                            }))
                        ];
                        runningTotalTrait.set('options', options);
                    }
                } catch (error) {
                    console.log('Error updating running total options:');
                }
            },
            updateRunningTotals() {
                const selectedColumns = this.get('selected-running-total-columns') || [];
                this.removeAllRunningTotalColumns();
                selectedColumns.forEach(column => {
                    this.addSingleRunningTotalColumn(column);
                });

                this.updateTableHTML();
            },

            removeAllRunningTotalColumns() {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const updatedHeaders = {};
                Object.keys(headers).forEach(key => {
                    if (!key.endsWith('_running_total')) {
                        updatedHeaders[key] = headers[key];
                    }
                });

                const updatedData = data.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        if (!key.endsWith('_running_total')) {
                            newRow[key] = row[key];
                        }
                    });
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
            },

            addSingleRunningTotalColumn(selectedColumn) {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const isNumericColumn = data.every(row => {
                    const value = row[selectedColumn];
                    return value === '' || value === null || value === undefined || !isNaN(parseFloat(value));
                });

                if (!isNumericColumn) {
                    console.warn(`Cannot create running total for column "${headers[selectedColumn]}". Column contains non-numeric data.`);
                    return;
                }

                const newColumnKey = `${selectedColumn}_running_total`;
                const newColumnName = `${headers[selectedColumn]} (Running Total)`;
                const headerKeys = Object.keys(headers);
                const originalIndex = headerKeys.indexOf(selectedColumn);
                const newHeaders = {};

                headerKeys.forEach((key, index) => {
                    newHeaders[key] = headers[key];
                    if (index === originalIndex) {
                        newHeaders[newColumnKey] = newColumnName;
                    }
                });

                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[selectedColumn]) || 0;
                    runningTotal += value;

                    const newRow = {};
                    Object.keys(newHeaders).forEach(key => {
                        if (key === newColumnKey) {
                            newRow[key] = runningTotal.toFixed(2);
                        } else {
                            newRow[key] = row[key];
                        }
                    });

                    return newRow;
                });

                this.set('custom-headers', newHeaders);
                this.set('custom-data', updatedData);
            },
            addRunningTotalColumn() {
                const selectedColumn = this.get('running-total-column');
                const enableRunningTotal = this.get('enable-running-total');
                if (!selectedColumn || !enableRunningTotal) return;
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};

                const isNumericColumn = data.every(row => {
                    const value = row[selectedColumn];
                    return value === '' || value === null || value === undefined || !isNaN(parseFloat(value));
                });

                if (!isNumericColumn) {
                    alert(`Cannot create running total for column "${headers[selectedColumn]}". Column contains non-numeric data.`);
                    this.set('enable-running-total', false);
                    return;
                }

                const runningTotalColumns = this.get('running-total-columns') || [];

                if (runningTotalColumns.includes(selectedColumn)) {
                    return;
                }

                runningTotalColumns.push(selectedColumn);
                this.set('running-total-columns', runningTotalColumns);

                const newColumnKey = `${selectedColumn}_running_total`;
                const newColumnName = `${headers[selectedColumn]} (Running Total)`;
                const updatedHeaders = { ...headers };
                const headerKeys = Object.keys(headers);
                const originalIndex = headerKeys.indexOf(selectedColumn);
                const newHeaders = {};

                headerKeys.forEach((key, index) => {
                    newHeaders[key] = headers[key];
                    if (index === originalIndex) {
                        newHeaders[newColumnKey] = newColumnName;
                    }
                });

                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[selectedColumn]) || 0;
                    runningTotal += value;

                    const newRow = { ...row };
                    const newRowOrdered = {};
                    Object.keys(newHeaders).forEach(key => {
                        if (key === newColumnKey) {
                            newRowOrdered[key] = runningTotal.toFixed(2);
                        } else {
                            newRowOrdered[key] = newRow[key];
                        }
                    });

                    return newRowOrdered;
                });

                this.set('custom-headers', newHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },
            removeRunningTotalColumns() {
                const runningTotalColumns = this.get('running-total-columns') || [];
                if (runningTotalColumns.length === 0) return;
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];
                const updatedHeaders = { ...headers };
                runningTotalColumns.forEach(originalColumn => {
                    const runningTotalKey = `${originalColumn}_running_total`;
                    delete updatedHeaders[runningTotalKey];
                });

                const updatedData = data.map(row => {
                    const newRow = { ...row };
                    runningTotalColumns.forEach(originalColumn => {
                        const runningTotalKey = `${originalColumn}_running_total`;
                        delete newRow[runningTotalKey];
                    });
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.set('running-total-columns', []);
                this.updateTableHTML();
            },

            getHighlightConditions() {
                return this.get('highlight-conditions') || [];
            },

            setHighlightConditions(conditions) {
                this.set('highlight-conditions', conditions);
                this.updateTableHTML();
            },

            addHighlightCondition(condition) {
                const conditions = this.getHighlightConditions();
                conditions.push(condition);
                this.setHighlightConditions(conditions);
            },

            removeHighlightCondition(index) {
                const conditions = this.getHighlightConditions();
                conditions.splice(index, 1);
                this.setHighlightConditions(conditions);
            },

            handleHighlightChange() {
                const tableElement = this.view.el.querySelector('.json-data-table');
                if (!tableElement || !tableElement.id) return;
                const tableId = tableElement.id;
                const conditions = this.getHighlightConditions();
                const color = this.get('highlight-color');
                applyHighlighting(tableId, conditions, color);
                editor.trigger('component:update', this);
                this.updateDataJsonState();
            },

            initializeDefaultTable() {
                this.set('custom-headers', null);
                this.set('custom-data', null);
                this.set('show-placeholder', true);
            },


            updateTableFromJson() {
                const jsonPath = this.get('json-path');
                const fileIndex = this.get('json-file-index') || '0';
                const tableType = this.get('table-type') || 'standard';

                if (!jsonPath) {
                    console.warn('No DataSource path provided');
                    this.set('show-placeholder', true);
                    this.updateTableHTML();
                    return;
                }

                try {
                    const pathParts = jsonPath.split('.');
                    let selectedLanguage = localStorage.getItem('language') || 'english';
                    let subPath = jsonPath;
                    if (pathParts.length > 1) {
                        selectedLanguage = pathParts[0];
                        subPath = pathParts.slice(1).join('.');
                    }

                    let jsonDataN;
                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        if (!fileNames.length || parseInt(fileIndex) > fileNames.length) {
                            console.error('Invalid file index or no files available:', fileIndex, fileNames);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (!jsonString) {
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const fileJson = JSON.parse(jsonString);
                        jsonDataN = fileJson[selectedLanguage];
                        if (!jsonDataN) {
                            console.error(`Language "${selectedLanguage}" not found in JSON file: ${selectedFile}`);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                    } else {
                        const commonJsonString = localStorage.getItem('common_json');
                        if (!commonJsonString) {
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const commonJson = JSON.parse(commonJsonString);
                        jsonDataN = commonJson[selectedLanguage];
                        if (!jsonDataN) {
                            console.error(`Language "${selectedLanguage}" not found in common JSON`);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                    }

                    if (!jsonDataN[subPath]) {
                        console.error(`DataSource subpath "${subPath}" not found under language "${selectedLanguage}"`);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                        return;
                    }

                    const str = jsonDataN[subPath];
                    let tableData;
                    if (typeof str === 'string') {
                        tableData = eval(str);
                    } else {
                        tableData = str;
                    }

                    if (tableType === 'crosstab' && tableData.type === 'crosstab') {
                        const tableResult = this.buildCrosstabTable(tableData);
                        this.set('table-headers', tableResult.headers);
                        this.set('table-data', tableResult.data);
                        this.set('custom-headers', tableResult.headers);
                        this.set('custom-data', tableResult.data);
                        this.set('show-placeholder', false);
                        this.updateTableHTML();
                        return;
                    }

                    if (tableData && tableData.heading && tableData.data) {
                        this.set('table-headers', tableData.heading);
                        this.set('table-data', tableData.data);
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                        this.updateFilterColumnOptions();
                        this.updateRunningTotalColumnOptions();
                    } else {
                        console.error('Invalid table data structure: missing heading or data');
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                } catch (error) {
                    console.error('Error parsing DataSource path:');
                    this.set('show-placeholder', true);
                    this.updateTableHTML();
                }
            },

            parseCrosstabData() {
                const jsonPath = this.get('json-path');
                const fileIndex = this.get('json-file-index') || '0';
                if (!jsonPath) return null;

                try {
                    const pathParts = jsonPath.split('.');
                    let selectedLanguage = localStorage.getItem('language') || 'english';
                    let subPath = jsonPath;
                    if (pathParts.length > 1) {
                        selectedLanguage = pathParts[0];
                        subPath = pathParts.slice(1).join('.');
                    }

                    let jsonDataN;
                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (jsonString) {
                            const fileJson = JSON.parse(jsonString);
                            jsonDataN = fileJson[selectedLanguage];
                        }
                    } else {
                        const commonJson = JSON.parse(localStorage.getItem("common_json"));
                        jsonDataN = commonJson[selectedLanguage];
                    }

                    if (!jsonDataN || !jsonDataN[subPath]) return null;

                    const crosstabData = typeof jsonDataN[subPath] === 'string'
                        ? eval(jsonDataN[subPath])
                        : jsonDataN[subPath];

                    if (crosstabData.type !== 'crosstab') return null;

                    return crosstabData;
                } catch (error) {
                    console.error('Error parsing crosstab data:');
                    return null;
                }
            },

            buildCrosstabTable(crosstabData) {
                const columnHeaders = crosstabData.columnHeaders || [];
                const rows = crosstabData.rows || [];
                const structure = crosstabData.structure || {};
                this.set('crosstab-structure', {
                    columnHeaders,
                    rows,
                    structure
                });

                const headers = {};
                const rowHeaderCount = structure.rowHeaderLevels || 1;

                for (let i = 0; i < rowHeaderCount; i++) {
                    headers[`row_header_${i}`] = `Row Header ${i + 1}`;
                }

                const dataColCount = rows.length > 0 && rows[0].cells ? rows[0].cells.length : 0;
                for (let i = 0; i < dataColCount; i++) {
                    headers[`data_col_${i}`] = `Column ${i + 1}`;
                }

                const tableData = rows.map((row, rowIdx) => {
                    const dataRow = {};
                    const rowHeadersData = row.rowHeaders || row.headers || [];
                    rowHeadersData.forEach((header, idx) => {
                        if (!header.skip) {
                            dataRow[`row_header_${idx}`] = header.value || '';
                        }
                    });

                    const cellsData = row.cells || [];
                    cellsData.forEach((cell, idx) => {
                        dataRow[`data_col_${idx}`] = cell;
                    });

                    return dataRow;
                });

                return {
                    headers,
                    data: tableData
                };
            },

            addCrosstabTableWithMerges(tableComponent, tableId) {
                const crosstabStructure = this.get('crosstab-structure');
                if (!crosstabStructure) return;
                const { columnHeaders, rows, structure } = crosstabStructure;
                const theadComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'thead',
                });

                columnHeaders.forEach((headerRow, levelIdx) => {
                    const headerRowComponent = theadComponent.components().add({
                        type: 'default',
                        tagName: 'tr'
                    });

                    headerRow.forEach((header, colIdx) => {
                        if (header.skip) return;

                        const attributes = {
                            id: `${tableId}-colheader-${levelIdx}-${colIdx}`
                        };

                        if (header.colspan && header.colspan > 1) {
                            attributes.colspan = header.colspan.toString();
                        }
                        if (header.rowspan && header.rowspan > 1) {
                            attributes.rowspan = header.rowspan.toString();
                        }

                        const tableStyles = this.get('table-styles-applied');
                        const cellStyles = tableStyles ? {
                            'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                            'color': tableStyles.textColor,
                            'font-family': tableStyles.fontFamily,
                            'background-color': tableStyles.bgColor
                        } : {
                            'border': '2px solid #0000',
                            'font-weight': 'bold'
                        };

                        headerRowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'th',
                            content: header.value || '',
                            selectable: true,
                            attributes,
                            style: {
                                ...cellStyles,
                                'padding': '8px',
                                'text-align': 'center',
                            }
                        });
                    });
                });

                const tbodyComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tbody'
                });

                rows.forEach((row, rowIdx) => {
                    const rowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr',
                        classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                        style: {
                            'background-color': isSummary ? '#f8f9fa' :
                                isGrandTotal ? '#e8f5e9' :
                                    rowIndex ? '#ffffff' : '#f8f9fa',
                            'font-weight': (isSummary || isGrandTotal) ? 'bold' : 'normal'
                        }
                    });

                    const rowHeadersData = row.rowHeaders || row.headers || [];
                    rowHeadersData.forEach((header, headerIdx) => {
                        if (header.skipFirst) return;

                        const attributes = {
                            id: `${tableId}-rowheader-${rowIdx}-${headerIdx}`,
                            'data-row': rowIdx.toString(),
                            'data-column-key': `row_header_${headerIdx}`
                        };

                        if (header.rowspan && header.rowspan > 1) {
                            attributes.rowspan = header.rowspan.toString();
                        }

                        rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'th',
                            content: header.value || '',
                            selectable: true,
                            attributes,
                            style: {
                                'padding': '8px',
                                'border': '2px solid #0000',
                                'font-weight': 'bold',
                            }
                        });
                    });

                    row.cells.forEach((cellValue, cellIdx) => {
                        const cellId = `${tableId}-cell-${rowIdx}-${cellIdx}`;

                        rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'td',
                            content: cellValue,
                            selectable: true,
                            attributes: {
                                id: cellId,
                                'data-row': rowIdx.toString(),
                                'data-column-key': `data_col_${cellIdx}`
                            },
                            style: {
                                'padding': '8px',
                                'border': '2px solid #0000'
                            }
                        });
                    });
                });
            },

            calculateColumnStructure(columnHeaders) {
                const leafColumns = [];
                function traverse(headers, path = []) {
                    if (headers.length === 0) {
                        leafColumns.push({ fullPath: [...path] });
                        return;
                    }

                    const [currentHeader, ...restHeaders] = headers;
                    const values = typeof currentHeader.values === 'object' && !Array.isArray(currentHeader.values)
                        ? (path.length > 0 ? currentHeader.values[path[path.length - 1]] || [] : Object.keys(currentHeader.values))
                        : currentHeader.values;

                    values.forEach(value => {
                        traverse(restHeaders, [...path, value]);
                    });
                }

                traverse(columnHeaders);
                return { leafColumns };
            },

            calculateRowStructure(rowHeaders, data) {
                const rows = [];

                function traverse(headers, path = [], dataNode = data) {
                    if (headers.length === 0) {
                        rows.push({ path: [...path] });
                        return;
                    }

                    const [currentHeader, ...restHeaders] = headers;
                    const values = typeof currentHeader.values === 'object' && !Array.isArray(currentHeader.values)
                        ? (path.length > 0 ? currentHeader.values[path[path.length - 1]] || [] : Object.keys(currentHeader.values))
                        : currentHeader.values;

                    values.forEach(value => {
                        const nextDataNode = dataNode && dataNode[value];
                        traverse(restHeaders, [...path, value], nextDataNode);
                    });
                }

                traverse(rowHeaders);
                return rows;
            },

            getCrosstabValue(data, rowPath, colPath) {
                let current = data;

                for (const key of rowPath) {
                    if (!current || !current[key]) return null;
                    current = current[key];
                }

                for (const key of colPath) {
                    if (!current || !current[key]) return null;
                    current = current[key];
                }

                return typeof current === 'number' ? current : null;
            },

            calculateRowTotal(data, rowPath, leafColumns) {
                let total = 0;
                leafColumns.forEach(col => {
                    const value = this.getCrosstabValue(data, rowPath, col.fullPath);
                    if (value !== null) total += value;
                });
                return total;
            },

            calculateColumnTotal(data, rowStructure, colPath) {
                let total = 0;
                rowStructure.forEach(rowDef => {
                    const value = this.getCrosstabValue(data, rowDef.path, colPath);
                    if (value !== null) total += value;
                });
                return total;
            },

            calculateGrandTotal(data, rowStructure, leafColumns) {
                let total = 0;
                rowStructure.forEach(rowDef => {
                    leafColumns.forEach(col => {
                        const value = this.getCrosstabValue(data, rowDef.path, col.fullPath);
                        if (value !== null) total += value;
                    });
                });
                return total;
            },


            addRow() {
                const headers = this.get('custom-headers') || this.get('table-headers');
                const data = this.get('custom-data') || this.get('table-data') || [];

                if (!headers) return;

                const newRow = {};
                Object.keys(headers).forEach(key => {
                    newRow[key] = 'New Data';
                });

                const updatedData = [...data, newRow];
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            addColumn() {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];
                const columnCount = Object.keys(headers).length;
                const newColumnKey = `col${columnCount + 1}`;
                const newColumnName = `New Column ${columnCount + 1}`;
                const updatedHeaders = { ...headers, [newColumnKey]: newColumnName };
                const updatedData = data.map(row => ({
                    ...row,
                    [newColumnKey]: 'New Data'
                }));

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            removeRow() {
                const data = this.get('custom-data') || this.get('table-data') || [];
                if (data.length <= 1) return;
                const updatedData = data.slice(0, -1);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            removeColumn() {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headerKeys = Object.keys(headers);
                if (headerKeys.length <= 1) return;
                const lastKey = headerKeys[headerKeys.length - 1];
                const updatedHeaders = { ...headers };
                delete updatedHeaders[lastKey];
                const updatedData = data.map(row => {
                    const newRow = { ...row };
                    delete newRow[lastKey];
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            updateCellData(rowIndex, columnKey, newValue) {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const updatedData = [...data];
                const selectedRunningTotalColumns = this.get('selected-running-total-columns') || [];

                if (updatedData[rowIndex]) {
                    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: newValue };

                    const cellId = `cell-${rowIndex}-${columnKey}`;
                    this.set('custom-data', updatedData);
                    this.set(`cell-content-${cellId}`, newValue);
                    this.updateSingleCell(rowIndex, columnKey, newValue);

                    if (selectedRunningTotalColumns.includes(columnKey)) {
                        this.recalculateRunningTotalsForColumn(columnKey);
                    }

                    this.updateDataJsonState();
                }
            },

            updateSingleCell(rowIndex, columnKey, newValue) {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;
                const canvasDoc = editor.Canvas.getDocument();
                const cellId = `${tableId}-cell-${rowIndex}-${columnKey}`;
                const cellElement = canvasDoc.getElementById(cellId);

                if (cellElement) {
                    cellElement.textContent = newValue;

                    if (canvasDoc.defaultView.$ && canvasDoc.defaultView.$.fn.DataTable.isDataTable(`#${tableId}`)) {
                        const dt = canvasDoc.defaultView.$(`#${tableId}`).DataTable();
                        const cell = dt.cell(cellElement);
                        if (cell) {
                            cell.data(newValue).draw(false);
                        }
                    }
                }
            },

            recalculateRunningTotalsForColumn(columnKey) {
                const data = this.get('custom-data') || [];
                const runningTotalKey = `${columnKey}_running_total`;

                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[columnKey]) || 0;
                    runningTotal += value;

                    return {
                        ...row,
                        [runningTotalKey]: runningTotal.toFixed(2)
                    };
                });

                this.set('custom-data', updatedData);
            },

            updateHeaderData(columnKey, newValue) {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const updatedHeaders = { ...headers, [columnKey]: newValue };
                this.set('custom-headers', updatedHeaders);
                this.set(`header-content-${columnKey}`, newValue);
                this.updateSingleHeader(columnKey, newValue);
            },

            updateSingleHeader(columnKey, newValue) {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                const canvasDoc = editor.Canvas.getDocument();
                const headerId = `${tableId}-header-${columnKey}`;
                const headerElement = canvasDoc.getElementById(headerId);

                if (headerElement) {
                    headerElement.textContent = newValue;
                }
            },

            addDataTableSortingFeatures(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);
                if (!tableElement || !canvasDoc.defaultView.$) return;

                const headers = tableElement.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (!header.querySelector('.sort-arrow')) {
                        const sortArrow = canvasDoc.createElement('span');
                        sortArrow.className = 'sort-arrow';
                        sortArrow.innerHTML = ' ↕️';
                        sortArrow.style.cssText = `
                            cursor: pointer;
                            margin-left: 5px;
                            user-select: none;
                            float: right;
                        `;

                        sortArrow.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            const dt = canvasDoc.defaultView.$(tableElement).DataTable();
                            const currentOrder = dt.order();

                            let newOrder = [index, 'asc'];
                            if (currentOrder.length && currentOrder[0][0] === index) {
                                if (currentOrder[0][1] === 'asc') {
                                    newOrder = [index, 'desc'];
                                } else {
                                    dt.order([]).draw();
                                    return;
                                }
                            }

                            dt.order(newOrder).draw();
                        });

                        header.appendChild(sortArrow);
                    }
                });
            },

            setCellStyle(rowIndex, columnKey, styles) {
                const cellStyles = this.get('cell-styles') || {};
                const cellKey = `${rowIndex}-${columnKey}`;
                cellStyles[cellKey] = { ...cellStyles[cellKey], ...styles };
                this.set('cell-styles', cellStyles);
                this.updateTableHTML();
            },

            getCellStyle(rowIndex, columnKey) {
                const cellStyles = this.get('cell-styles') || {};
                const cellKey = `${rowIndex}-${columnKey}`;
                return cellStyles[cellKey] || {};
            },
            showLoader() {
                if (!this.loaderElement) {
                    this.loaderElement = document.createElement('div');
                    this.loaderElement.className = 'json-table-loader';
                    this.loaderElement.innerHTML = `
                    <div style="
                        position: fixed; 
                        top: 0; 
                        left: 0; 
                        width: 100%; 
                        height: 100%; 
                        background: rgba(0,0,0,0.5); 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        z-index: 10000;
                    ">
                        <div style="
                            background: white; 
                            padding: 20px; 
                            border-radius: 8px; 
                            display: flex; 
                            align-items: center; 
                            gap: 10px;
                        ">
                            <div style="
                                width: 20px; 
                                height: 20px; 
                                border: 2px solid #f3f3f3; 
                                border-top: 2px solid #007bff; 
                                border-radius: 50%; 
                                animation: spin 1s linear infinite;
                            "></div>
                            Loading table data...
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
                }
                document.body.appendChild(this.loaderElement);
            },

            hideLoader() {
                if (this.loaderElement && this.loaderElement.parentNode) {
                    this.loaderElement.parentNode.removeChild(this.loaderElement);
                }
            },

            updateTableHTML() {
                const headers = this.get('custom-headers');
                const data = this.get('custom-data');
                const hideData = this.get('hide-data');

                if (hideData && headers && data) {
                    const _stateForDom = {
                        headers: headers || this.get('table-headers') || null,
                        data: data || this.get('table-data') || null,
                        styles: this.get('table-styles-applied') || null,
                        highlights: this.get('highlight-conditions') || null,
                        filter: {
                            column: this.get('filter-column') || null,
                            value: this.get('filter-value') || null
                        },
                        meta: {
                            tableType: this.get('table-type') || 'standard',
                            caption: this.get('caption') || 'no',
                            pageLength: this.get('page-length') || 10,
                            pagination: this.get('pagination') || 'no',
                            search: this.get('search') || 'no',
                            fileDownload: this.get('file-download') || ''
                        }
                    };

                    this.addAttributes({
                        'data-json-state': encodeURIComponent(JSON.stringify(_stateForDom))
                    });

                    this.components().reset();

                    this.addPlaceholderComponent();
                    return;
                }

                const _stateForDom = (() => {
                    return {
                        headers: this.get('custom-headers') || this.get('table-headers') || null,
                        data: this.get('custom-data') || this.get('table-data') || null,
                        styles: this.get('table-styles-applied') || null,
                        highlights: this.get('highlight-conditions') || null,
                        filter: {
                            column: this.get('filter-column') || null,
                            value: this.get('filter-value') || null
                        },
                        meta: {
                            tableType: this.get('table-type') || 'standard',
                            caption: this.get('caption') || 'no',
                            pageLength: this.get('page-length') || 10,
                            pagination: this.get('pagination') || 'no',
                            search: this.get('search') || 'no',
                            fileDownload: this.get('file-download') || ''
                        }
                    };
                })();

                this.addAttributes({
                    'data-json-state': encodeURIComponent(JSON.stringify(_stateForDom))
                });

                const name = this.get('name') || 'Table';
                const title = this.get('title') || '';
                const footer = this.get('footer') || 'no';
                const pagination = this.get('pagination') || 'no';
                const pageLength = this.get('page-length') || 10;
                const search = this.get('search') || 'no';
                const caption = this.get('caption') || 'no';
                const captionAlign = this.get('caption-align') || 'left';
                const fileDownload = this.get('file-download') || '';
                const showPlaceholder = this.get('show-placeholder');
                const sharedTableId = this.ensureSharedTableId();

                const tableId = this.cid
                    ? `json-table-${this.cid}`
                    : `json-table-${Math.random().toString(36).substr(2, 9)}`;

                this.components().reset();

                if (showPlaceholder || !headers || !data) {
                    this.addPlaceholderComponent();
                    return;
                }

                const wrapperComponent = this.components().add({
                    type: 'default',
                    tagName: 'div',
                    selectable: false,
                    layerable: false,
                    classes: ['json-table-wrapper'],
                    style: {
                        'width': '99.5%',
                        'padding-top': '10px',
                        'padding-bottom': '10px'
                    }
                });

                if (title) {
                    wrapperComponent.components().add({
                        type: 'text',
                        tagName: 'h3',
                        content: title,
                        style: {
                            'margin-bottom': '15px'
                        }
                    });
                }

const repeatHeadersBeforeSummary = this.get('repeat-headers-before-summary') || false;
const groupingFields = this.get('grouping-fields') || [];
const summarizeGroup = this.get('summarize-group') || false;

// Check if we should use card layout
if (repeatHeadersBeforeSummary && summarizeGroup && groupingFields.length > 0) {
    // Use custom-data if available, otherwise use the passed data
    const displayData = this.get('custom-data') || data;
    
    if (displayData && displayData.length > 0) {
        this.addCardStyleLayout(wrapperComponent, headers, displayData, tableId);
        return;
    }
}
                const tableComponent = wrapperComponent.components().add({
                    type: 'default',
                    tagName: 'table',
                    classes: ['json-data-table'],
                    attributes: {
                        id: tableId,
                        width: '100%',
                        'data-source-table-id': sharedTableId,
                    },
                    style: {
                        'width': '100%',
                        'border-collapse': 'collapse',
                        'font-family': 'Arial, sans-serif',
                        'my-input-json': this.get('json-path') || ''
                    }
                });
                if (caption === 'yes' && name) {
                    tableComponent.components().add({
                        type: 'text',
                        tagName: 'caption',
                        content: name,
                        style: {
                            'text-align': captionAlign,
                            'padding': '10px',
                            'font-weight': 'bold',
                            'background-color': '#f8f9fa'
                        }
                    });
                }

                const isCrosstab = this.get('crosstab-structure') !== undefined;

                if (isCrosstab) {
                    this.addCrosstabTableWithMerges(tableComponent, tableId);
                } else {
                    this.addTableHeader(tableComponent, headers, tableId);
                    this.addTableBody(tableComponent, headers, data, tableId);
                }

                if (!isCrosstab && footer === 'yes') {
                    this.addTableFooter(tableComponent, headers);
                }

                const datatableScript = this.createDataTableScript(
                    tableId,
                    pagination,
                    pageLength,
                    search,
                    fileDownload,
                    Object.keys(headers).length
                );
                wrapperComponent.components().add(datatableScript);

                setTimeout(() => {
                    const conditions = this.getHighlightConditions();
                    const color = this.get('highlight-color');
                    if (conditions && conditions.length > 0) {
                        applyHighlighting(tableId, conditions, color);
                    } else {
                    }
                    this.enableFormulaEditingOnComponents(tableId);
                }, 500);

                if (this.get('_remove-header-on-build')) {
                    try {
                        const tableComp = this.find && this.find('table') && this.find('table')[0];
                        if (tableComp) {
                            const theadComp = tableComp.find && tableComp.find('thead') && tableComp.find('thead')[0];
                            if (theadComp) {
                                theadComp.remove();
                            }
                        }
                    } catch (err) {
                        console.warn('⚠️ Error while attempting to remove header from continuation table:', err);
                    }
                    this.set('_remove-header-on-build', false, { silent: true });
                }
            },

            updateDataJsonState() {
                const _stateForDom = {
                    headers: this.get('custom-headers') || this.get('table-headers') || null,
                    data: this.get('custom-data') || this.get('table-data') || null,
                    styles: this.get('table-styles-applied') || null,
                    highlights: this.get('highlight-conditions') || null,
                    filter: {
                        column: this.get('filter-column') || null,
                        value: this.get('filter-value') || null
                    },
                    meta: {
                        tableType: this.get('table-type') || 'standard',
                        caption: this.get('caption') || 'no',
                        pageLength: this.get('page-length') || 10,
                        pagination: this.get('pagination') || 'no',
                        search: this.get('search') || 'no',
                        fileDownload: this.get('file-download') || ''
                    }
                };

                this.addAttributes({
                    'data-json-state': encodeURIComponent(JSON.stringify(_stateForDom))
                });
            },

            applyGroupingAndSummary() {
                const groupingFields = this.get('grouping-fields') || [];
                const summarizeGroup = this.get('summarize-group') || false;
                const summaryFields = this.get('summary-fields') || [];
                const data = this.get('table-data') || [];

                if (groupingFields.length === 0) {
                    const groupedData = this.groupData(data, 0);
                    this.set('custom-data', groupedData);
                    this.set('show-placeholder', false);
                    this.updateTableHTML();
                    return;
                }

                if (summarizeGroup && summaryFields.length === 0) {
                    console.warn('Summarize enabled but no summary fields selected');
                    alert('Please add at least one summary field before enabling "Summarize Group"');
                    this.set('summarize-group', false);
                    return;
                }

                const groupedData = this.groupData(data, groupingFields);
                this.set('custom-data', groupedData);
                this.set('show-placeholder', false);
                this.updateTableHTML();

                setTimeout(() => {
                    this.triggerAutoPagination();
                }, 500);

                this.updateDataJsonState();
            },

            getTableContainer() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return null;

                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);
                if (!tableElement) return null;
                const sectionContent = tableElement.closest('.section-content');
                if (sectionContent) return sectionContent;
                const mainContent = tableElement.closest('.main-content-area');
                if (mainContent) return mainContent;

                return null;
            },

            groupData(data, groupingFields) {
                if (!groupingFields || groupingFields.length === 0) return data;

                // SAFETY CHECK
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('Invalid or empty data for grouping');
                    return data;
                }

                const grouped = {};
                const sortOrder = this.get('sort-order') || 'ascending';
                const topN = this.get('top-n') || 'none';
                const topNValue = parseInt(this.get('top-n-value')) || 10;
                const summarizeGroup = this.get('summarize-group') || false;
                const showSummaryOnly = this.get('show-summary-only') || false;
                const mergeGroupCells = this.get('merge-group-cells') || false;
                const hideSubtotalSingleRow = this.get('hide-subtotal-single-row') || false;

                const summaryAtField = this.get('summary-at-field') || '';
                const summaryAtIndex = summaryAtField
                    ? groupingFields.findIndex(f => f.key === summaryAtField)
                    : groupingFields.length - 1;

                let processedData = data;
                const namedGroups = this.get('named-groups') || {};
                const defineNamedGroup = this.get('define-named-group') || false;

                if (defineNamedGroup && namedGroups[groupingFields[0].key]) {
                    processedData = this.applyNamedGroups(
                        data,
                        groupingFields[0].key,
                        namedGroups[groupingFields[0].key]
                    );
                }

                processedData.forEach(row => {
                    if (!row || typeof row !== 'object') return;

                    const groupKey = groupingFields.map(field => row[field.key] || '').join('|');
                    if (!grouped[groupKey]) {
                        grouped[groupKey] = {
                            key: groupKey,
                            values: groupingFields.map(field => row[field.key] || ''),
                            rows: []
                        };
                    }
                    grouped[groupKey].rows.push(row);
                });

                if (Object.keys(grouped).length === 0) {
                    console.warn('No groups created from data');
                    return data;
                }

                let sortedGroupKeys = Object.keys(grouped);
                if (sortOrder === 'ascending') {
                    sortedGroupKeys.sort();
                } else if (sortOrder === 'descending') {
                    sortedGroupKeys.sort().reverse();
                }

                if (topN !== 'none' && topN !== 'sort-all' && topNValue > 0) {
                    if (topN === 'top') {
                        sortedGroupKeys = sortedGroupKeys.slice(0, topNValue);
                    } else if (topN === 'bottom') {
                        sortedGroupKeys = sortedGroupKeys.slice(-topNValue);
                    }
                }

                const result = [];
                const selectedSummaryFields = this.get('summary-fields') || [];

                sortedGroupKeys.forEach((groupKey, groupIndex) => {
                    const group = grouped[groupKey];

                    if (showSummaryOnly) {
                        if (summarizeGroup && selectedSummaryFields.length > 0) {
                            const summaryRow = this.createSummaryRow(group.rows, groupKey);
                            summaryRow._isSummary = true;
                            summaryRow._groupIndex = groupIndex;

                            groupingFields.forEach(field => {
                                if (group.rows.length > 0) {
                                    summaryRow[field.key] = group.rows[0][field.key];
                                }
                            });

                            result.push(summaryRow);
                        } else if (this.get('keep-group-hierarchy')) {
                            const firstRow = { ...group.rows[0] };
                            firstRow._groupIndex = groupIndex;
                            result.push(firstRow);
                        }
                    }
                    else {
                        group.rows.forEach((row, rowIdx) => {
                            const newRow = { ...row };

                            if (mergeGroupCells && rowIdx === 0) {
                                newRow._groupStart = true;
                                newRow._groupSize = group.rows.length;
                                newRow._groupIndex = groupIndex;
                                groupingFields.forEach(field => {
                                    newRow[`_merge_${field.key}`] = true;
                                });
                            }

                            result.push(newRow);

                            const shouldAddSummaryHere =
                                summarizeGroup &&
                                selectedSummaryFields.length > 0 &&
                                !(hideSubtotalSingleRow && group.rows.length === 1) &&
                                rowIdx === group.rows.length - 1;

                            if (shouldAddSummaryHere) {
                                const nextGroupKey = sortedGroupKeys[groupIndex + 1];
                                let shouldShowSummary = true;

                                if (nextGroupKey && summaryAtIndex < groupingFields.length) {
                                    const currentValues = group.values;
                                    const nextValues = grouped[nextGroupKey].values;
                                    shouldShowSummary = currentValues[summaryAtIndex] !== nextValues[summaryAtIndex];
                                }

                                if (shouldShowSummary) {
                                    const summaryRow = this.createSummaryRow(group.rows, groupKey);
                                    summaryRow._isSummary = true;
                                    summaryRow._groupIndex = groupIndex;

                                    groupingFields.forEach(field => {
                                        if (group.rows.length > 0) {
                                            summaryRow[field.key] = group.rows[0][field.key];
                                        }
                                    });

                                    Object.keys(this.get('custom-headers') || this.get('table-headers') || {})
                                        .forEach(key => {
                                            summaryRow[`_skip_merge_${key}`] = true;
                                        });

                                    result.push(summaryRow);
                                }
                            }
                        });
                    }
                });

                if (this.get('grand-total')) {
                    const grandTotalRow = this.createGrandTotalRow(
                        showSummaryOnly
                            ? result.filter(r => !r._isSummary)
                            : result.filter(r => !r._isSummary && !r._isGrandTotal)
                    );
                    grandTotalRow._isGrandTotal = true;
                    result.push(grandTotalRow);
                }

                const selectedSummaryFieldsForHeaders = this.get('summary-fields') || [];
                if (selectedSummaryFieldsForHeaders.length > 0) {
                    const baseHeaders = this.get('table-headers') || {};
                    const updatedHeaders = { ...baseHeaders };

                    const columnSummaryCounts = {};
                    selectedSummaryFieldsForHeaders.forEach(field => {
                        columnSummaryCounts[field.key] =
                            (columnSummaryCounts[field.key] || 0) + 1;
                    });

                    Object.keys(columnSummaryCounts).forEach(columnKey => {
                        const count = columnSummaryCounts[columnKey];
                        if (count > 1) {
                            const functions = selectedSummaryFieldsForHeaders
                                .filter(f => f.key === columnKey)
                                .map(f => f.function);

                            for (let i = 1; i < count; i++) {
                                const newKey = `${columnKey}_summary_${i}`;
                                const funcName =
                                    functions[i].charAt(0).toUpperCase() +
                                    functions[i].slice(1);
                                updatedHeaders[newKey] =
                                    `${baseHeaders[columnKey]} (${funcName})`;
                            }
                        }
                    });

                    this.set('custom-headers', updatedHeaders);
                }

                console.log(`✅ Final result: ${result.length} rows (including summaries)`);
                return result;
            },

            applyNamedGroups(data, fieldKey, namedGroupsConfig) {
                return data.map(row => {
                    const currentValue = row[fieldKey];

                    for (const group of namedGroupsConfig) {
                        if (group.values.includes(currentValue)) {
                            return {
                                ...row,
                                [fieldKey]: group.name
                            };
                        }
                    }

                    return row;
                });
            },

            createSummaryRow(groupRows, groupKey) {
                const summaryFields = this.get('summary-fields') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const groupingFields = this.get('grouping-fields') || [];

                const summaryRow = {};

                Object.keys(headers).forEach(key => {
                    summaryRow[key] = '';
                });

                if (groupingFields.length > 0 && groupRows.length > 0) {
                    groupingFields.forEach(field => {
                        summaryRow[field.key] = groupRows[0][field.key] || '';
                    });
                }

                const columnSummaries = {};

                summaryFields.forEach((field) => {
                    if (!columnSummaries[field.key]) {
                        columnSummaries[field.key] = [];
                    }
                    columnSummaries[field.key].push(field);
                });

                Object.keys(columnSummaries).forEach(columnKey => {
                    const summariesForColumn = columnSummaries[columnKey];

                    summariesForColumn.forEach((field, index) => {

                        let result;

                        switch (field.function) {
                            case 'last':
                                for (let i = groupRows.length - 1; i >= 0; i--) {
                                    const val = groupRows[i][field.key];
                                    if (val !== '' && val !== null && val !== undefined) {
                                        result = val;
                                        break;
                                    }
                                }
                                if (!result && groupRows.length > 0) {
                                    result = groupRows[groupRows.length - 1][field.key] || '';
                                }
                                break;

                            case 'first':
                                for (let i = 0; i < groupRows.length; i++) {
                                    const val = groupRows[i][field.key];
                                    if (val !== '' && val !== null && val !== undefined) {
                                        result = val;
                                        break;
                                    }
                                }
                                if (!result && groupRows.length > 0) {
                                    result = groupRows[0][field.key] || '';
                                }
                                break;

                            case 'count':
                                const nonEmptyValues = groupRows.filter(row => {
                                    const val = row[field.key];
                                    return val !== '' && val !== null && val !== undefined;
                                });
                                result = nonEmptyValues.length;
                                break;

                            case 'sum':
                                const values = groupRows.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = values.reduce((a, b) => a + b, 0).toFixed(2);
                                break;

                            case 'average':
                                const avgValues = groupRows.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                const sum = avgValues.reduce((a, b) => a + b, 0);
                                result = (sum / avgValues.length).toFixed(2);
                                break;

                            case 'min':
                                const minValues = groupRows.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = Math.min(...minValues).toFixed(2);
                                break;

                            case 'max':
                                const maxValues = groupRows.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = Math.max(...maxValues).toFixed(2);
                                break;

                            default:
                                result = '';
                        }

                        if (index === 0) {
                            summaryRow[columnKey] = result;
                        } else {
                            const newColumnKey = `${columnKey}_summary_${index}`;
                            summaryRow[newColumnKey] = result;
                        }
                    });
                });

                return summaryRow;
            },
            createSummaryHeaderRow(summaryFields, headers) {
                const summaryHeaderRow = {};
                const groupingFields = this.get('grouping-fields') || [];

                Object.keys(headers).forEach(key => {
                    summaryHeaderRow[key] = '';
                });

                const columnMetrics = {};

                summaryFields.forEach(field => {
                    if (!columnMetrics[field.key]) {
                        columnMetrics[field.key] = [];
                    }
                    columnMetrics[field.key].push(field.function);
                });

                Object.keys(headers).forEach(key => {
                    if (columnMetrics[key] && columnMetrics[key].length > 1) {
                        summaryHeaderRow[key] = columnMetrics[key].map(fn =>
                            fn.charAt(0).toUpperCase() + fn.slice(1)
                        ).join(' | ');
                    } else if (columnMetrics[key] && columnMetrics[key].length === 1) {
                        summaryHeaderRow[key] = columnMetrics[key][0].charAt(0).toUpperCase() + columnMetrics[key][0].slice(1);
                    }
                });

                if (groupingFields.length > 0) {
                    const firstGroupKey = groupingFields[0].key;
                    summaryHeaderRow[firstGroupKey] = 'Summary';
                }

                return summaryHeaderRow;
            },
            createGrandTotalRow(data) {
                const summaryFields = this.get('summary-fields') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const groupingFields = this.get('grouping-fields') || [];
                const grandTotalRow = {};

                Object.keys(headers).forEach(key => {
                    grandTotalRow[key] = '';
                });

                if (groupingFields.length > 0) {
                    const firstGroupKey = groupingFields[0].key;
                    const label = this.get('grand-total-label') || 'Grand Total';
                    grandTotalRow[firstGroupKey] = label;
                }

                const columnSummaries = {};

                summaryFields.forEach((field) => {
                    if (!columnSummaries[field.key]) {
                        columnSummaries[field.key] = [];
                    }
                    columnSummaries[field.key].push(field);
                });

                Object.keys(columnSummaries).forEach(columnKey => {
                    const summariesForColumn = columnSummaries[columnKey];

                    summariesForColumn.forEach((field, index) => {
                        let result;

                        switch (field.function) {
                            case 'last':
                                for (let i = data.length - 1; i >= 0; i--) {
                                    const val = data[i][field.key];
                                    if (val !== '' && val !== null && val !== undefined) {
                                        result = val;
                                        break;
                                    }
                                }
                                break;

                            case 'first':
                                for (let i = 0; i < data.length; i++) {
                                    const val = data[i][field.key];
                                    if (val !== '' && val !== null && val !== undefined) {
                                        result = val;
                                        break;
                                    }
                                }
                                break;

                            case 'count':
                                const nonEmpty = data.filter(row => {
                                    const val = row[field.key];
                                    return val !== '' && val !== null && val !== undefined;
                                });
                                result = nonEmpty.length;
                                break;

                            case 'sum':
                                const values = data.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = values.reduce((a, b) => a + b, 0).toFixed(2);
                                break;

                            case 'average':
                                const avgVals = data.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                const sum = avgVals.reduce((a, b) => a + b, 0);
                                result = (sum / avgVals.length).toFixed(2);
                                break;

                            case 'min':
                                const minVals = data.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = Math.min(...minVals).toFixed(2);
                                break;

                            case 'max':
                                const maxVals = data.map(row => {
                                    const val = String(row[field.key] || '0').replace(/,/g, '');
                                    return parseFloat(val) || 0;
                                });
                                result = Math.max(...maxVals).toFixed(2);
                                break;

                            default:
                                result = '';
                        }

                        if (index === 0) {
                            grandTotalRow[columnKey] = result;
                        } else {
                            const newColumnKey = `${columnKey}_summary_${index}`;
                            grandTotalRow[columnKey] = result;
                        }
                    });
                });

                console.log('✅ Grand total row created:', grandTotalRow);
                return grandTotalRow;
            },

            processSummary(data, summaryFields) {
                return data;
            },
            createDataTableScript(tableId, pagination, pageLength, search, fileDownload, colCount) {
                let downloadBtn = '[]';
                if (fileDownload) {
                    const downloadOptions = fileDownload.replace(/"/g, '').split(',').map(opt => opt.trim());
                    downloadBtn = '[' + downloadOptions.map(opt => {
                        if (opt === 'print') {
                            return `{
                    extend: 'print',
                    title: '${this.get('name') || 'Table'}',
                    customize: function(win) {
                        const table = $(win.document.body).find('table');
                        table.addClass('json-data-table');
                        table.css({
                            'border-collapse': 'collapse',
                            'width': '100%'
                        });
                        table.find('th, td').css({
                            'padding': '8px',
                            'text-align': 'left'
                        });
                        table.find('th').css({
                            'background-color': '#ffff',
                            'font-weight': 'bold'
                        });
                        table.find('td').css({
                            'background-color': '#ffff'
                        });
                        $(win.document.body).find('.dt-buttons, .dataTables_info').remove();
                    }
                }`;
                        } else {
                            return `{extend: '${opt}', title: '${this.get('name') || 'Table'}'}`;
                        }
                    }).join(',') + ']';
                }

                const scriptContent = `
                (function() {
                    function initTable() {

                        if (typeof $ === 'undefined') {
                            const jqueryScript = document.createElement('script');
                            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
                            jqueryScript.onload = () => setTimeout(initTable, 100);
                            document.head.appendChild(jqueryScript);
                            return;
                        }
                        
                        if (typeof $.fn.DataTable === 'undefined') {
                            const dtCSS = document.createElement('link');
                            dtCSS.rel = 'stylesheet';
                            dtCSS.href = 'https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap4.min.css';
                            document.head.appendChild(dtCSS);
                            
                            const dtScript = document.createElement('script');
                            dtScript.src = 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js';
                            dtScript.onload = () => setTimeout(initTable, 100);
                            document.head.appendChild(dtScript);
                            return;
                        }
                        
                        const tableElement = document.getElementById('${tableId}');
                        if (!tableElement) {
                            setTimeout(initTable, 100);
                            return;
                        }
                        
                        const formulaCells = tableElement.querySelectorAll('[data-formula]');
                        const formulaData = Array.from(formulaCells).map(cell => ({
                            cell: cell,
                            formula: cell.getAttribute('data-formula'),
                            calculatedValue: cell.getAttribute('data-calculated-value'),
                            id: cell.id || cell.getAttribute('data-row') + '-' + cell.getAttribute('data-column-key')
                        }));
                        
                        if ($.fn.DataTable.isDataTable(tableElement)) {
                            $(tableElement).DataTable().destroy();
                        }
                        
                        const isInPageSystem = tableElement.closest('.page-container');
                        
                        const dtOptions = {
                            dom: 'Bfrtip',
                            paging: ${pagination === 'yes'},
                            info: ${pagination === 'yes'},
                            lengthChange: ${pagination === 'yes'},
                            pageLength: ${pageLength},
                            fixedHeader: false,
                            scrollX: ${colCount > 5},
                            fixedColumns: ${colCount > 5},
                            searching: ${search === 'yes'},
                            buttons: ${downloadBtn},
                            ordering: false,
                            order: [],
                            drawCallback: function() {
                                setTimeout(() => {
                                    formulaData.forEach(data => {
                                        const cell = document.getElementById(data.id) ||
                                                tableElement.querySelector('[data-row="' + data.id.split('-')[0] + '"][data-column-key="' + data.id.split('-')[1] + '"]');
                                        if (cell) {
                                            if (data.formula) cell.setAttribute('data-formula', data.formula);
                                            if (data.calculatedValue) {
                                                cell.setAttribute('data-calculated-value', data.calculatedValue);
                                                const cellContent = cell.querySelector('div');
                                                if (cellContent) {
                                                    cellContent.textContent = data.calculatedValue;
                                                }
                                            }
                                        }
                                    });
                                    
                                    const event = new CustomEvent('datatableRedrawn', {
                                        detail: { tableId: '${tableId}', formulaData: formulaData }
                                    });
                                    document.dispatchEvent(event);
                                }, 100);
                                
                                if (isInPageSystem) {
                                    const wrapper = this.closest('.dataTables_wrapper');
                                    if (wrapper) {
                                        wrapper.style.maxWidth = '100%';
                                        wrapper.style.overflow = 'hidden';
                                    }
                                }
                            },
                            responsive: isInPageSystem ? {
                                details: {
                                    display: $.fn.dataTable.Responsive.display.childRowImmediate,
                                    type: 'none',
                                    target: ''
                                }
                            } : false
                        };
                        
                        try {
                            const dataTable = $(tableElement).DataTable(dtOptions);
                            
                            const initEvent = new CustomEvent('datatableInitialized', {
                                detail: { tableId: '${tableId}' }
                            });
                            document.dispatchEvent(initEvent);

                        } catch (error) {
                            console.error('Failed to initialize DataTable:', error);
                        }
                    }
                    

                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initTable);
                    } else {
                        initTable();
                    }
                })();
                `;

                return {
                    type: 'default',
                    tagName: 'script',
                    content: scriptContent,
                    attributes: {
                        type: 'text/javascript'
                    }
                };
            },

            enableFormulaEditingOnComponents(tableId) {
                document.addEventListener('datatableRedrawn', (e) => {
                    if (e.detail.tableId === tableId) {
                        this.attachFormulaHandlersToComponents(tableId);
                        setTimeout(() => {
                            this.reattachAllCellHandlers(tableId);
                        }, 150);
                    }
                });

                document.addEventListener('datatableInitialized', (e) => {
                    if (e.detail.tableId === tableId) {
                        setTimeout(() => {
                            this.reattachAllCellHandlers(tableId);
                        }, 300);
                    }
                });

                this.attachFormulaHandlersToComponents(tableId);
            },

            attachFormulaHandlersToComponents(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const canvasWindow = canvasDoc.defaultView;
                let parser = canvasWindow.globalFormulaParser;

                if (!parser && canvasWindow.formulaParser) {
                    parser = new canvasWindow.formulaParser.Parser();
                    canvasWindow.globalFormulaParser = parser;

                    if (parser.setFunction) {
                        parser.setFunction('PERCENT', function (params) {
                            if (params.length !== 2) return '#N/A';
                            const base = parseFloat(params[0]);
                            const percent = parseFloat(params[1]);
                            if (isNaN(base) || isNaN(percent)) return '#VALUE!';
                            return base * (percent / 100);
                        });

                        parser.setFunction('ABSOLUTE', function (params) {
                            if (params.length !== 1) return '#N/A';
                            const num = parseFloat(params[0]);
                            if (isNaN(num)) return '#VALUE!';
                            return Math.abs(num);
                        });

                        if (canvasWindow.numberToWords && canvasWindow.numberToWords.toWords) {
                            parser.setFunction('NUMTOWORDS', function (params) {
                                if (params.length !== 1) return '#N/A';
                                const num = parseInt(params[0]);
                                if (isNaN(num)) return '#VALUE!';
                                try {
                                    return canvasWindow.numberToWords.toWords(num);
                                } catch (error) {
                                    return '#ERROR';
                                }
                            });
                        }
                    }
                }

                if (!parser) {
                    console.warn('Formula parser not available');
                    return;
                }

                parser.on('callCellValue', function (cellCoord, done) {
                    let col = cellCoord.column.index;
                    let row = cellCoord.row.index;
                    let tableElem = canvasDoc.getElementById(tableId);
                    let cell = tableElem?.rows[row]?.cells[col];
                    if (cell) {
                        let val = cell.getAttribute('data-calculated-value') ||
                            cell.getAttribute('data-formula') ||
                            cell.innerText;
                        if (val.startsWith && val.startsWith('=')) {
                            try {
                                let res = parser.parse(val.substring(1));
                                done(res.result);
                            } catch {
                                done('#ERROR');
                            }
                        } else {
                            done(parseFloat(val) || val);
                        }
                    } else {
                        done(null);
                    }
                });

                parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
                    let tableElem = canvasDoc.getElementById(tableId);
                    let values = [];
                    let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
                    let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
                    let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
                    let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

                    for (let row = startRow; row <= endRow; row++) {
                        for (let col = startCol; col <= endCol; col++) {
                            let cell = tableElem?.rows[row]?.cells[col];
                            if (cell) {
                                let val = cell.getAttribute('data-calculated-value') ||
                                    cell.getAttribute('data-formula') ||
                                    cell.innerText;
                                if (val.startsWith && val.startsWith('=')) {
                                    try {
                                        let res = parser.parse(val.substring(1));
                                        values.push(res.result);
                                    } catch {
                                        values.push(0);
                                    }
                                } else {
                                    values.push(parseFloat(val) || 0);
                                }
                            } else {
                                values.push(0);
                            }
                        }
                    }
                    done(values);
                });

                const tableComponent = this.components().find(comp => {
                    return comp.find(`#${tableId}`).length > 0;
                });

                if (tableComponent) {
                    const actualTable = tableComponent.find('table')[0];
                    if (actualTable) {
                        const cellComponents = actualTable.find('td, th');

                        cellComponents.forEach(cellComp => {
                            const cellEl = cellComp.getEl();
                            if (cellEl && !cellEl.hasAttribute('data-formula-enabled')) {
                                this.attachCellFormulaHandler(cellComp, cellEl, parser);
                            }
                        });
                    }
                }
            },

            attachCellFormulaHandler(cellComponent, cellElement, parser) {
                if (cellElement.hasAttribute('data-formula-enabled')) {
                    return;
                }

                cellElement.setAttribute('data-formula-enabled', 'true');
                cellElement.contentEditable = 'true';
                const cellContent = cellElement;

                const handleFocus = () => {
                    const formula = cellElement.getAttribute('data-formula');
                    if (formula) {
                        cellContent.textContent = formula;
                    }
                    cellContent.setAttribute('data-editing', 'true');
                    cellElement.classList.add('editing');
                };

                const handleBlur = () => {
                    cellContent.removeAttribute('data-editing');
                    cellElement.classList.remove('editing');

                    const val = cellContent.textContent.trim();
                    const rowIndex = cellElement.getAttribute('data-row');
                    const columnKey = cellElement.getAttribute('data-column-key');
                    const isHeader = cellElement.tagName === 'TH';

                    if (isHeader) {
                        cellElement.removeAttribute('data-formula');
                        cellElement.removeAttribute('data-calculated-value');
                        cellContent.textContent = val;
                        cellElement.classList.remove('formula-error');

                        if (columnKey) {
                            this.updateHeaderData(columnKey, val);
                        }
                    } else if (val.startsWith('=')) {
                        cellElement.setAttribute('data-formula', val);
                        try {
                            const formulaContent = val.substring(1).trim();
                            if (!formulaContent) throw new Error('Empty formula');

                            const canvasWindow = cellElement.ownerDocument.defaultView;
                            let formulaParser = canvasWindow.globalFormulaParser;

                            if (!formulaParser && canvasWindow.formulaParser) {
                                formulaParser = new canvasWindow.formulaParser.Parser();
                                canvasWindow.globalFormulaParser = formulaParser;

                                if (formulaParser.setFunction) {
                                    formulaParser.setFunction('PERCENT', function (params) {
                                        if (params.length !== 2) return '#N/A';
                                        const base = parseFloat(params[0]);
                                        const percent = parseFloat(params[1]);
                                        if (isNaN(base) || isNaN(percent)) return '#VALUE!';
                                        return base * (percent / 100);
                                    });

                                    formulaParser.setFunction('ABSOLUTE', function (params) {
                                        if (params.length !== 1) return '#N/A';
                                        const num = parseFloat(params[0]);
                                        if (isNaN(num)) return '#VALUE!';
                                        return Math.abs(num);
                                    });

                                    if (canvasWindow.numberToWords && canvasWindow.numberToWords.toWords) {
                                        formulaParser.setFunction('NUMTOWORDS', function (params) {
                                            if (params.length !== 1) return '#N/A';
                                            const num = parseInt(params[0]);
                                            if (isNaN(num)) return '#VALUE!';
                                            try {
                                                return canvasWindow.numberToWords.toWords(num);
                                            } catch (error) {
                                                return '#ERROR';
                                            }
                                        });
                                    }
                                }
                            }

                            if (!formulaParser) {
                                throw new Error('Formula parser not available');
                            }

                            const res = formulaParser.parse(formulaContent);
                            if (res.error) throw new Error(res.error);

                            const result = (res.result !== undefined && res.result !== null) ? res.result : '#ERROR';

                            cellContent.textContent = result;
                            cellElement.classList.remove('formula-error');
                            cellElement.setAttribute('data-calculated-value', result);

                            if (rowIndex !== null && columnKey) {
                                const data = this.get('custom-data') || this.get('table-data') || [];
                                const updatedData = [...data];
                                if (updatedData[parseInt(rowIndex)]) {
                                    updatedData[parseInt(rowIndex)] = {
                                        ...updatedData[parseInt(rowIndex)],
                                        [columnKey]: result
                                    };
                                    this.set('custom-data', updatedData, { silent: true });
                                }
                            }
                        } catch (error) {
                            console.warn('Formula parsing error:');
                            cellContent.textContent = '#ERROR';
                            cellElement.classList.add('formula-error');
                            cellElement.setAttribute('data-calculated-value', '#ERROR');
                        }
                    } else {
                        cellElement.removeAttribute('data-formula');
                        cellElement.removeAttribute('data-calculated-value');
                        cellContent.textContent = val;
                        cellElement.classList.remove('formula-error');

                        if (rowIndex !== null && columnKey) {
                            this.updateCellData(parseInt(rowIndex), columnKey, val);
                        }
                    }
                };

                const handleKeydown = (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        cellContent.blur();

                        const table = cellElement.closest('table');
                        const allCells = Array.from(table.querySelectorAll('td[data-formula-enabled], th[data-formula-enabled]'));
                        const currentIndex = allCells.indexOf(cellElement);

                        let nextIndex;
                        if (e.shiftKey) {
                            nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
                        } else {
                            nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
                        }

                        const nextCell = allCells[nextIndex];
                        const nextCellContent = nextCell.querySelector('div') || nextCell;
                        setTimeout(() => {
                            nextCellContent.contentEditable = 'true';
                            nextCellContent.focus();
                        }, 20);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        cellContent.blur();
                    }
                };

                cellContent.addEventListener('focus', handleFocus, { passive: false });
                cellContent.addEventListener('blur', handleBlur, { passive: false });
                cellContent.addEventListener('keydown', handleKeydown, { passive: false });

                cellElement._formulaHandlers = { handleFocus, handleBlur, handleKeydown };
                cellElement._cellContent = cellContent;
            },

            reattachAllCellHandlers(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const parser = canvasDoc.defaultView.formulaParser ? new canvasDoc.defaultView.formulaParser.Parser() : null;
                if (!parser) return;

                parser.on('callCellValue', function (cellCoord, done) {
                    let col = cellCoord.column.index;
                    let row = cellCoord.row.index;
                    let tableElem = canvasDoc.getElementById(tableId);
                    let cell = tableElem?.rows[row]?.cells[col];
                    if (cell) {
                        let val = cell.getAttribute('data-calculated-value') ||
                            cell.getAttribute('data-formula') ||
                            cell.innerText;
                        if (val.startsWith && val.startsWith('=')) {
                            try {
                                let res = parser.parse(val.substring(1));
                                done(res.result);
                            } catch {
                                done('#ERROR');
                            }
                        } else {
                            done(parseFloat(val) || val);
                        }
                    } else {
                        done(null);
                    }
                });

                parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
                    let tableElem = canvasDoc.getElementById(tableId);
                    let values = [];

                    let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
                    let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
                    let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
                    let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

                    for (let row = startRow; row <= endRow; row++) {
                        for (let col = startCol; col <= endCol; col++) {
                            let cell = tableElem?.rows[row]?.cells[col];
                            if (cell) {
                                let val = cell.getAttribute('data-calculated-value') ||
                                    cell.getAttribute('data-formula') ||
                                    cell.innerText;
                                if (val.startsWith && val.startsWith('=')) {
                                    try {
                                        let res = parser.parse(val.substring(1));
                                        values.push(res.result);
                                    } catch {
                                        values.push(0);
                                    }
                                } else {
                                    values.push(parseFloat(val) || 0);
                                }
                            } else {
                                values.push(0);
                            }
                        }
                    }
                    done(values);
                });

                const tableElement = canvasDoc.getElementById(tableId);
                if (tableElement) {
                    const allCells = tableElement.querySelectorAll('td, th');
                    allCells.forEach(cell => {
                        if (!cell.hasAttribute('data-formula-enabled')) {
                            this.attachCellFormulaHandler(null, cell, parser);
                        } else {
                            const cellContent = cell.querySelector('div') || cell;
                            cellContent.contentEditable = 'true';
                        }
                    });
                }
            },


            addPlaceholderComponent() {
                const tableHeaders = this.get('table-headers');
                const filterColumn = this.get('filter-column');
                const filterValue = this.get('filter-value');
                const tableType = this.get('table-type') || 'standard';
                const hideData = this.get('hide-data');

                const message = hideData && tableHeaders ?
                    'Data loaded in hidden mode' :
                    '';

                this.components().add({
                    type: 'default',
                    tagName: 'div',
                    selectable: false,
                    layerable: false,
                    classes: ['json-table-placeholder'],
                    content: `
                        <h3 style="margin: 0 0 10px 0; color: #495057;">DataSource Table</h3>
                        <p style="margin: 0; color: #6c757d;">${message}</p>
                    `,
                    style: {
                        'width': '100%',
                        'min-height': '70px',
                        'margin':'2px 0px',
                        'padding': '15px 15px 10px 15px',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'color': '#6c757d',
                        'text-align': 'center',
                        'font-family': 'Arial, sans-serif',
                        'cursor': 'pointer',
                        'background': hideData ? '#fff9e6' : 'transparent',
                        'border': hideData ? '2px dashed #ffc107' : 'none'
                    }
                });
            },

            addControlsComponent(parentComponent, search, fileDownload) {
                const controlsComponent = parentComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['table-controls'],
                    style: {
                        'margin-bottom': '15px',
                        'display': 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center'
                    }
                });

                if (search === 'yes') {
                    controlsComponent.components().add({
                        type: 'input',
                        classes: ['table-search'],
                        attributes: {
                            type: 'text',
                            placeholder: 'Search...'
                        },
                        style: {
                            'padding': '8px',
                            'border': '1px solid #ddd',
                            'border-radius': '4px',
                            'width': '200px'
                        }
                    });
                }

                if (fileDownload) {
                    const downloadContainer = controlsComponent.components().add({
                        type: 'default',
                        tagName: 'div',
                        classes: ['download-buttons']
                    });

                    const downloadOptions = fileDownload.replace(/"/g, '').split(',').map(opt => opt.trim());
                    downloadOptions.forEach(option => {
                        downloadContainer.components().add({
                            type: 'button',
                            classes: ['download-btn'],
                            content: option.charAt(0).toUpperCase() + option.slice(1),
                            attributes: {
                                'data-type': option
                            },
                            style: {
                                'margin-left': '5px',
                                'padding': '6px 12px',
                                'background': '#007bff',
                                'color': 'white',
                                'border': 'none',
                                'border-radius': '4px',
                                'cursor': 'pointer'
                            }
                        });
                    });
                }
            },

            addTableHeader(tableComponent, headers, tableId) {
                const theadComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'thead',
                    style: {
                        'background-color': '#ffff',
                    }
                });

                const headerRowComponent = theadComponent.components().add({
                    type: 'default',
                    tagName: 'tr'
                });
                const jsonPath = this.get('json-path') || '';
                Object.entries(headers).forEach(([key, header]) => {
                    const headerId = `${tableId}-header-${key}`;
                    const storedHeader = this.get(`header-content-${key}`) || header;

                    const tableStyles = this.get('table-styles-applied');
                    const cellStyles = tableStyles ? {
                        'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                        'color': tableStyles.textColor,
                        'font-family': tableStyles.fontFamily,
                        'background-color': tableStyles.bgColor,
                    } : {
                        'padding': '8px',
                        'font-weight': 'bold'
                    };

                    const headerCellComponent = headerRowComponent.components().add({
                        type: 'json-table-cell',
                        tagName: 'th',
                        contenteditable: true,
                        content: storedHeader,
                        selectable: true,
                        contentEditable: true,
                        classes: ['json-table-cell', 'cell-content', 'editable-header'],
                        attributes: {
                            id: headerId,
                            'data-column-key': key,
                            'data-gjs-hoverable': 'true',
                        },
                        style: {
                            ...cellStyles,
                            'width': 'auto',
                            'text-align': 'left',
                            'box-sizing': 'border-box',
                            'position': 'relative',
                            'my-input-json': `${this.get('json-path')}.heading.${key}`,
                        }
                    });
                });
            },

            addTableBody(tableComponent, headers, data, tableId) {
                const tbodyComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tbody'
                });

                if (data.length === 0) {
                    const emptyRowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr'
                    });

                    emptyRowComponent.components().add({
                        type: 'text',
                        tagName: 'td',
                        content: 'No data found',
                        attributes: {
                            colspan: Object.keys(headers).length.toString()
                        },
                        style: {
                            'text-align': 'center',
                            'padding': '20px',
                            'color': '#666'
                        }
                    });
                    return;
                }

                const jsonPath = this.get('json-path') || '';
                const runningTotals = this.get('running-totals') || [];
    const repeatHeadersBeforeSummary = this.get('repeat-headers-before-summary') || false;
                const groupingFields = this.get('grouping-fields') || [];
                data.forEach((row, rowIndex) => {
                    if (row._isPageBreak) {
                        const pageBreakRow = tbodyComponent.components().add({
                            type: 'default',
                            tagName: 'tr',
                            attributes: {
                                'data-page-break-row': 'true',
                                'id': row._pageBreakId
                            },
                            style: {
                                'display': 'none'
                            }
                        });

                        pageBreakRow.components().add({
                            type: 'default',
                            tagName: 'td',
                            attributes: {
                                'colspan': Object.keys(headers).length.toString(),
                                'data-page-break': 'true'
                            },
                            classes: ['page-break', 'page-break-element'],
                            style: {
                                'height': '0',
                                'padding': '0',
                                'border': 'none'
                            },
                            content: `<div class="page-break" data-page-break="true" style="width: 100%; height: 30px; background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%); border: 2px dashed #ff4757; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin: 10px 0; position: relative; cursor: move;"><span class="page-break-label" style="color: white; font-size: 12px; font-weight: bold; letter-spacing: 1px;">PAGE BREAK (Auto-inserted after group)</span></div>`
                        });
                        return;
                    }

                    const isSummary = row._isSummary;
                    const isGrandTotal = row._isGrandTotal;

                    if (isSummary || isGrandTotal) {
                                    if (
  repeatHeadersBeforeSummary &&
  isSummary &&
  rowIndex !== 0
) {
                const headerRowComponent = tbodyComponent.components().add({
                    type: 'default',
                    tagName: 'tr',
                    classes: ['summary-header-row'],
                    style: {
                        'font-weight': 'bold'
                    }
                });

                Object.keys(headers).forEach(key => {
                    const headerId = `${tableId}-summary-header-${rowIndex}-${key}`;
                    const tableStyles = this.get('table-styles-applied');
                    const cellStyles = tableStyles ? {
                        'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                        'color': tableStyles.textColor,
                        'font-family': tableStyles.fontFamily,
                        'background-color': tableStyles.bgColor,
                    } : {
                        'padding': '8px',
                        'font-weight': 'bold'
                    };

                    headerRowComponent.components().add({
                        type: 'json-table-cell',
                        tagName: 'th',
                        content: headers[key],
                        selectable: false,
                        attributes: {
                            id: headerId,
                            'data-summary-header': 'true'
                        },
                        style: {
                            ...cellStyles,
                            'text-align': 'left',
                            'box-sizing': 'border-box',
                        }
                    });
                });
            }
                        const summaryRowComponent = tbodyComponent.components().add({
                            type: 'default',
                            tagName: 'tr',
                            classes: [isGrandTotal ? 'grand-total-row' : 'summary-row'],
                            style: {
                                'font-weight': 'bold',
                            }
                        });

                        Object.keys(headers).forEach(key => {
                            const cellId = `${tableId}-summary-${rowIndex}-${key}`;
                            const displayValue = row[key] !== undefined && row[key] !== null ? row[key] : '';

                            const tableStyles = this.get('table-styles-applied');
                            const cellStyles = tableStyles ? {
                                'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                                'color': tableStyles.textColor,
                                'font-family': tableStyles.fontFamily
                            } : {
                                'padding': '8px',
                            };

                            summaryRowComponent.components().add({
                                type: 'json-table-cell',
                                tagName: 'td',
                                content: displayValue,
                                selectable: false,
                                attributes: {
                                    id: cellId,
                                    'data-summary': 'true',
                                    'data-row': rowIndex.toString(),
                                    'data-column-key': key
                                },
                                style: {
                                    ...cellStyles,
                                    'padding': '10px 8px',
                                    'text-align': 'left',
                                    'box-sizing': 'border-box',
                                }
                            });
                        });
                        return;
                    }

                    const isGroupStart = row._groupStart;
                    const groupSize = row._groupSize || 1;

                    const rowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr',
                        classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                        style: {
                            'background-color': rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }
                    });

                    Object.keys(headers).forEach(key => {
                        if (row[`_skip_${key}`]) {
                            return;
                        }

                        const cellId = `${tableId}-cell-${rowIndex}-${key}`;
                        const displayValue = row[key] || '';
                        const isRunningTotal = key.endsWith('_running_total');
                        const rtConfig = isRunningTotal ? runningTotals.find(rt => `${rt.columnKey}_running_total` === key) : null;
                        const tableStyles = this.get('table-styles-applied');

                        let appliedCellStyles = tableStyles ? {
                            'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                            'color': tableStyles.textColor,
                            'font-family': tableStyles.fontFamily,
                            'background-color': tableStyles.bgColor,
                        } : {
                            'padding': '8px',
                        };

                        const attributes = {
                            id: cellId,
                            'data-row': rowIndex.toString(),
                            'data-column-key': key,
                            'data-gjs-hoverable': 'true',
                        };

                        if (isRunningTotal) {
                            attributes['data-running-total'] = 'true';
                        }

                        if (isGroupStart && row[`_merge_${key}`] && mergeGroupCells) {
                            if (row[`_skip_merge_${key}`]) {
                                return;
                            }

                            let actualRowspan = 1;
                            const currentFieldIndex = groupingFields.findIndex(f => f.key === key);

                            if (currentFieldIndex >= 0) {
                                for (let i = rowIndex + 1; i < data.length; i++) {
                                    if (data[i]._isSummary || data[i][`_skip_merge_${key}`]) {
                                        break;
                                    }
                                    if (data[i][key] === row[key] && !data[i]._isPageBreak) {
                                        actualRowspan++;
                                    } else {
                                        break;
                                    }
                                }
                            } else {
                                actualRowspan = groupSize;
                            }

                            attributes.rowspan = actualRowspan.toString();

                            for (let i = 1; i < actualRowspan; i++) {
                                if (data[rowIndex + i] && !data[rowIndex + i]._isSummary) {
                                    data[rowIndex + i][`_skip_${key}`] = true;
                                }
                            }
                        }

                        const cellComponent = rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'td',
                            selectable: true,
                            contenteditable: !isRunningTotal,
                            content: displayValue,
                            classes: ['json-table-cell', 'cell-content', isRunningTotal ? 'readonly-cell' : 'editable-cell'],
                            attributes: {
                                ...attributes,
                                'data-gjs-draggable': 'false'
                            },
                            style: {
                                ...appliedCellStyles,
                                'position': 'relative',
                                'width': 'auto',
                                'box-sizing': 'border-box',
                                'my-input-json': `${jsonPath}.data[${rowIndex}].${key}`,
                            }
                        });
                    });
                });
            },
addCardStyleLayout(wrapperComponent, headers, data, tableId) {
    console.log('🎴 Card Layout - Input data:', data.length, 'rows');
    
    const groupingFields = this.get('grouping-fields') || [];
    const showSummaryOnly = this.get('show-summary-only') || false;
    
    // Determine what data to display
    let dataRows;
    if (showSummaryOnly) {
        dataRows = data.filter(row => !row._isGrandTotal);
    } else {
        dataRows = data.filter(row => !row._isSummary && !row._isGrandTotal);
    }
    
    console.log('🎴 Card Layout - Data rows after filter:', dataRows.length);
    
    if (dataRows.length === 0) {
        console.warn('No data rows available for card layout');
        this.addPlaceholderComponent();
        return;
    }

    const tableStyles = this.get('table-styles-applied') || {};
    const columnsPerRow = 3; // Number of header-value pairs per row

    // Add title if exists
    const title = this.get('title') || '';
    if (title) {
        wrapperComponent.components().add({
            type: 'text',
            tagName: 'h3',
            content: title
        });
    }

    // If there are grouping fields, group the data
    if (groupingFields.length > 0) {
        const groupField = groupingFields[0].key;
        const groups = {};
        
        dataRows.forEach((row, idx) => {
            const groupValue = row[groupField] || 'Unknown';
            if (!groups[groupValue]) {
                groups[groupValue] = {
                    rows: [],
                    summaryRow: null,
                    groupIndex: row._groupIndex !== undefined ? row._groupIndex : idx
                };
            }
            groups[groupValue].rows.push(row);
            
            if (row._isSummary) {
                groups[groupValue].summaryRow = row;
            }
        });

        console.log('🎴 Card Layout - Created groups:', Object.keys(groups).length);

        // Create a card for each group
        Object.keys(groups).forEach((groupValue) => {
            const groupInfo = groups[groupValue];
            const groupData = groupInfo.rows;
            const groupIndex = groupInfo.groupIndex;
            
            createGroupCard(
                wrapperComponent, 
                groupValue, 
                groupData, 
                groupIndex, 
                headers, 
                tableId, 
                tableStyles, 
                columnsPerRow,
                showSummaryOnly,
                groupInfo.summaryRow,
                this
            );
        });
    } else {
        // No grouping - create cards for all data
        console.log('🎴 Card Layout - No grouping, creating cards for all records');
        
        dataRows.forEach((record, recordIndex) => {
            createRecordCard(
                wrapperComponent,
                record,
                recordIndex,
                headers,
                tableId,
                0,
                tableStyles,
                columnsPerRow,
                dataRows.length
            );
        });
    }

    console.log('🎴 Card Layout - Successfully created all cards');
},

            addTableFooter(tableComponent, headers) {
                const tfootComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tfoot',
                    style: {
                        'background-color': '#e9ecef'
                    }
                });

                const footerRowComponent = tfootComponent.components().add({
                    type: 'default',
                    tagName: 'tr'
                });

                Object.values(headers).forEach(header => {
                    footerRowComponent.components().add({
                        type: 'text',
                        tagName: 'th',
                        content: header,
                        style: {
                            'padding': '12px',
                            'text-align': 'left',
                            'border-top': '2px solid #dee2e6',
                            'font-weight': 'bold'
                        }
                    });
                });
            },

            addPaginationComponent(parentComponent, pageLength) {
                const paginationComponent = parentComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['table-pagination'],
                    style: {
                        'margin-top': '15px',
                        'display': 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center'
                    }
                });

                const pageLengthContainer = paginationComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    content: 'Show '
                });

                const selectComponent = pageLengthContainer.components().add({
                    type: 'select',
                    classes: ['page-length-select'],
                    style: {
                        'padding': '4px'
                    }
                });

                [10, 25, 50, 100].forEach(value => {
                    selectComponent.components().add({
                        type: 'option',
                        attributes: { value: value.toString() },
                        content: value.toString()
                    });
                });

                pageLengthContainer.components().add({
                    type: 'text',
                    content: ' entries'
                });

                const controlsContainer = paginationComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['pagination-controls']
                });

                controlsContainer.components().add({
                    type: 'button',
                    classes: ['page-btn'],
                    content: 'Previous',
                    attributes: {
                        'data-page': 'prev'
                    },
                    style: {
                        'padding': '6px 12px',
                        'margin': '0 2px',
                        'background': '#007bff',
                        'color': 'white',
                        'border': 'none',
                        'border-radius': '4px',
                        'cursor': 'pointer'
                    }
                });

                controlsContainer.components().add({
                    type: 'text',
                    classes: ['page-info'],
                    content: 'Page 1 of 1',
                    style: {
                        'padding': '0 10px'
                    }
                });

                controlsContainer.components().add({
                    type: 'button',
                    classes: ['page-btn'],
                    content: 'Next',
                    attributes: {
                        'data-page': 'next'
                    },
                    style: {
                        'padding': '6px 12px',
                        'margin': '0 2px',
                        'background': '#007bff',
                        'color': 'white',
                        'border': 'none',
                        'border-radius': '4px',
                        'cursor': 'pointer'
                    }
                });
            },

            updateSpecificCells(updates) {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                updates.forEach(({ rowIndex, columnKey, newValue }) => {
                    const cellId = `${tableId}-cell-${rowIndex}-${columnKey}`;

                    const tableComponent = this.components().at(0);
                    const tableElement = tableComponent.components().find(comp =>
                        comp.get('tagName') === 'table'
                    );

                    if (tableElement) {
                        const tbody = tableElement.components().find(comp =>
                            comp.get('tagName') === 'tbody'
                        );

                        if (tbody) {
                            const rows = tbody.components();
                            const targetRow = rows.at(rowIndex);

                            if (targetRow) {
                                const cells = targetRow.components();
                                const headerKeys = Object.keys(this.get('custom-headers') || this.get('table-headers') || {});
                                const columnIndex = headerKeys.indexOf(columnKey);

                                if (columnIndex >= 0) {
                                    const targetCell = cells.at(columnIndex);
                                    if (targetCell) {
                                        const cellContent = targetCell.components().at(0);
                                        if (cellContent) {
                                            cellContent.set('content', newValue);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            },

            addRowDynamic() {
                const headers = this.get('custom-headers') || this.get('table-headers');
                const data = this.get('custom-data') || this.get('table-data') || [];

                if (!headers) return;

                const newRow = {};
                Object.keys(headers).forEach(key => {
                    newRow[key] = 'New Data';
                });

                const updatedData = [...data, newRow];
                this.set('custom-data', updatedData);

                const tableComponent = this.components().at(0);
                const tableElement = tableComponent.components().find(comp =>
                    comp.get('tagName') === 'table'
                );

                if (tableElement) {
                    const tbody = tableElement.components().find(comp =>
                        comp.get('tagName') === 'tbody'
                    );

                    if (tbody) {
                        const rowIndex = updatedData.length - 1;
                        const tableId = this.cid ? `json-table-${this.cid}` : `json-table-${Math.random().toString(36).substr(2, 9)}`;

                        this.addSingleRowComponent(tbody, newRow, rowIndex, headers, tableId);
                    }
                }
            },

            addSingleRowComponent(tbodyComponent, row, rowIndex, headers, tableId) {
                const rowComponent = tbodyComponent.components().add({
                    type: 'default',
                    tagName: 'tr',
                    classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                    style: {
                        'background-color': '#ffffff'
                    }
                });

                Object.keys(headers).forEach(key => {
                    const cellId = `${tableId}-cell-${rowIndex}-${key}`;
                    const cellStyles = this.getCellStyle(rowIndex, key);

                    const cellComponent = rowComponent.components().add({
                        type: 'json-table-cell',
                        tagName: 'td',
                        contentEditable: true,
                        classes: ['editable-cell', 'json-table-cell'],
                        attributes: {
                            id: cellId,
                            'data-row': rowIndex.toString(),
                            'data-column-key': key,
                            'data-gjs-type': 'json-table-cell',
                            'data-gjs-selectable': 'true',
                            'data-gjs-hoverable': 'true'
                        },
                        style: {
                            'padding': '0',
                            'cursor': 'pointer',
                            'position': 'relative',
                            ...cellStyles
                        }
                    });

                    cellComponent.components().add({
                        type: 'text',
                        tagName: 'div',
                        classes: ['cell-content'],
                        content: row[key] || '',
                        style: {
                            'margin': '10px',
                            'width': 'auto',
                            'box-sizing': 'border-content-box'
                        }
                    });
                });
            }
        },

        view: {
            events: {
                'input .table-search': 'handleSearch',
                'click .download-btn': 'handleDownload',
                'click .page-btn': 'handlePagination',
                'change .page-length-select': 'handlePageLengthChange',
                'click .json-table-cell, .json-table-cell *': 'handleCellClick',
                'click': 'handleOutsideClick',
            },

            handleCellClick(e) {
                e.preventDefault();
                e.stopPropagation();

                const cell = e.target.closest('td, th');
                if (!cell) return;

                const allCells = this.el.querySelectorAll('td, th');
                allCells.forEach(c => {
                    c.className = "";
                });

                cell.className = "i_designer_selected i_designer-selected";
            },

            startCellEditing(cell, cellContent) {
                cell.classList.remove('i_designer_hovered');
                const isHeader = cellContent.classList.contains('editable-header');

                const currentValue = cellContent.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.className = isHeader ? 'header-input' : 'cell-input';

                if (isHeader) input.style.fontWeight = 'bold';

                cell.style.position = 'relative';
                cell.classList.add('editing');
                cellContent.style.opacity = '0';
                cell.appendChild(input);
                input.focus();
                input.select();
            },

            stopCellEditing(cell) {
                const cellContent = cell.querySelector('.cell-content');
                const input = cell.querySelector('.cell-input, .header-input');
                if (!input || !cellContent) return;

                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');
                const newValue = input.value;

                cell.removeChild(input);

                if (isHeader) {
                    this.model.updateHeaderData(columnKey, newValue);
                    cellContent.innerHTML = newValue;
                } else {
                    this.model.updateCellData(parseInt(rowIndex), columnKey, newValue);
                }
            }

        }

    });

    editor.DomComponents.addType('json-table-cell', {
        isComponent: el => {
            if (!el || !el.getAttribute) return false;
            if (el.getAttribute('data-gjs-type') === 'json-table-cell') return { type: 'json-table-cell' };
            return false;
        },

        model: {
            defaults: {
                tagName: 'td',
                draggable: false,
                droppable: false,
                editable: true,
                selectable: true,
                hoverable: true,
                attributes: {
                    'data-gjs-type': 'json-table-cell',
                    'data-gjs-draggable': 'false'
                }
            }
        },

        view: {
            onRender() {
                const el = this.el;
                if (el) {
                    el.style.userSelect = 'text';
                    el.style.cursor = 'text';

                    el.addEventListener('mousedown', (e) => {
                        if (e.target.contentEditable === 'true' || e.target.closest('[contenteditable="true"]')) {
                            e.stopPropagation();
                        }
                    }, true);
                }
            }
        }
    });

    editor.BlockManager.add('json-table', {
        label: 'DataSource Table',
        category: 'Extra',
        content: {
            type: 'json-table'
        },
        media: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
    </svg>`
    });

    editor.Commands.add('open-table-condition-manager-json-table', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const conditions = selected.getHighlightConditions();

            const modalContent = `
            <div class="condition-manager" style="padding: 0 20px 20px 30px; max-width: 700px;">

                <!-- Highlight Style Settings -->
            <div class="highlight-styles" style="padding: 10px 15px 15px 0; border-radius: 5px;">
                <h4 style="margin-top: 0;">Highlight Styles</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
                        <input type="color" id="highlight-bg-color" value="#ffff99" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
                        <input type="color" id="highlight-text-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                    </div>
                    <div >
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Size (px):</label>
                        <input type="number" id="highlight-font-size" value="14" min="8" max="72" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; margin-left: 10% ">Font Family:</label>
                        <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-left:10%;">
                            <option value="">Default</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Verdana, sans-serif">Verdana</option>
                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="Tahoma, sans-serif">Tahoma</option>
                            <option value="'Lucida Sans Unicode', sans-serif">Lucida Sans Unicode</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="Helvetica, sans-serif">Helvetica</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                            <option value="'Brush Script MT', cursive">Brush Script MT</option>
                            <option value="'Arial Black', sans-serif">Arial Black</option>
                        </select>
                    </div>

                </div>
            </div>
                
                <div class="add-condition-form">
                    <h4 style="margin-top: 10px;  margin-bottom: 20px;">Add New Condition</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Condition Type:</label>
                            <select id="condition-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="">Select Condition Type</option>
                                <option value="contains">Text: Contains</option>
                                <option value="starts-with">Text: Starts With</option>
                                <option value="ends-with">Text: Ends With</option>
                                <option value="exact">Text: Exact Match</option>
                                <option value="once-if">Once If: Highlight individual letters/numbers</option>
                                <option value=">">Number: > (Greater than)</option>
                                <option value=">=">Number: >= (Greater than or equal)</option>
                                <option value="<">Number: < (Less than)</option>
                                <option value="<=">Number: <= (Less than or equal)</option>
                                <option value="=">Number: = (Equal to)</option>
                                <option value="!=">Number: != (Not equal to)</option>
                                <option value="between">Number: Between (range)</option>
                                <option value="null">Null/Empty (No value)</option>
                            </select>
                        </div>
                <div style="display: flex; align-items: center; margin-top:27px;">
                    <label style="display: flex; align-items: center; color: #f8f9fa; cursor: pointer;">
                    <input type="checkbox" id="case-sensitive" style="margin-right: 8px; transform: scale(1.2);">
                    <span style="font-weight: bold;">Case Sensitive</span>
                    </label>
                </div>
                    </div>
                    
                    <div id="condition-inputs">
                        <div id="single-value-input" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Value:</label>
                            <input type="text" id="condition-value" style="width: 97%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter text or number">
                        </div>
                        
                        <div id="range-inputs" style="display: none; margin-bottom: 15px;">
                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Min Value:</label>
                                    <input type="number" id="min-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Max Value:</label>
                                    <input type="number" id="max-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button id="add-condition-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-bottom: 3px">Add Condition</button>
                </div>
                
                <div class="existing-conditions" style=" padding: 20px 20px 20px 0; border-radius: 8px; margin-bottom: 3px;">
                    <div style="margin-top: 5px; font-weight: bold">Existing Conditions</div>
                    <div id="conditions-list" style="max-height: 300px; overflow-y: auto;">
                        ${conditions.length === 0 ? '<p style="color: #666;">No conditions added yet.</p>' : ''}
                    </div>
                </div>
                
                <div style="text-align: right;">
                    <button id="close-manager-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Close</button>
                    <button id="apply-conditions-btn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply Changes</button>
                </div>
            </div>`;

            const modal = editor.Modal;
            modal.setTitle('Table Highlight Condition Manager');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeTableConditionManager(selected, conditions);
            }, 100);
        }
    });

    editor.Commands.add('open-table-style-manager', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const modalContent = `
            <div class="table-style-manager" style="padding: 20px; max-width: 600px;">
                
                <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Border Settings</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Style:</label>
                            <select id="border-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="none">None</option>
                                <option value="solid">Solid</option>
                                <option value="double">Double</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                                <option value="groove">Groove</option>
                                <option value="ridge">Ridge</option>
                                <option value="inset">Inset</option>
                                <option value="outset">Outset</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Width (px):</label>
                            <input type="number" id="border-width" min="0" max="10" value="1" style="width: 94%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Color:</label>
                            <input type="color" id="border-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Opacity (%):</label>
                            <input type="range" id="border-opacity" min="0" max="100" value="100" style="width: 100%;">
                            <span id="opacity-value">100%</span>
                        </div>
                    </div>
                </div>

                <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Colors & Font</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
                            <input type="color" id="bg-color" value="#ffffff" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
                            <input type="color" id="text-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Family:</label>
                            <select id="font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="Verdana, sans-serif">Verdana</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="'Courier New', monospace">Courier New</option>
                                <option value="Tahoma, sans-serif">Tahoma</option>
                                <option value="Helvetica, sans-serif">Helvetica</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Alignment</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Horizontal Align:</label>
                            <select id="text-align" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Vertical Align:</label>
                            <select id="vertical-align" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="top">Top</option>
                                <option value="middle">Middle</option>
                                <option value="bottom">Bottom</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="text-align: right;">
                    <button id="reset-styles" style="background: #ffc107; color: #000; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reset to Default</button>
                    <button id="cancel-styles" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancel</button>
                    <button id="apply-styles" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply Styles</button>
                </div>
            </div>`;

            const modal = editor.Modal;
            modal.setTitle('Customize Table Styles');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeTableStyleManager(selected);
            }, 100);
        }
    });

    editor.Commands.add('open-table-settings-modal', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const headers = selected.get('custom-headers') || selected.get('table-headers') || {};
            const availableFields = Object.entries(headers).map(([key, name]) => ({
                key, name
            }));

            const modalContent = `
            <div class="table-settings-modal" style="width: 800px; max-height: 80vh; display: flex; flex-direction: column;">
                <!-- Navbar -->
                <div class="settings-navbar" style="display: flex; border-bottom: 2px solid #ddd; background: #f8f9fa; flex-shrink: 0;">
                    <button class="nav-tab active" data-tab="settings" style="flex: 1; padding: 12px; border: none; cursor: pointer; font-weight: bold; border-bottom: 3px solid #007bff;">Settings</button>
                    <button class="nav-tab" data-tab="grouping" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Grouping & Summary</button>
                    <button class="nav-tab" data-tab="running-total" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Running Total</button>
                    <button class="nav-tab" data-tab="options" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Options</button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content" style="padding: 15px; flex: 1; overflow-y: auto; min-height: 0;">
                    <!-- Settings Tab -->
                    <div id="settings-tab" class="tab-pane active">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                                    <legend style="font-weight: bold; padding: 0 10px;">Row Operations</legend>
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number of Rows:</label>
                                        <input type="number" id="row-count" min="1" value="1" style="width: 95%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button id="add-rows" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Rows</button>
                                        <button id="remove-rows" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Rows</button>
                                    </div>
                                </fieldset>

                                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-top: 15px;">
                                    <legend style="font-weight: bold; padding: 0 10px;">Column Operations</legend>
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number of Columns:</label>
                                        <input type="number" id="column-count" min="1" value="1" style="width: 95%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button id="add-columns" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Columns</button>
                                        <button id="remove-columns" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Columns</button>
                                    </div>
                                </fieldset>
                            </div>
                            
                            <div>
                                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                                    <legend style="font-weight: bold; padding: 0 10px;">Column Order</legend>
                                    <div id="column-reorder-section">
                                        <div id="column-list-inline" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                                            <!-- Will be populated dynamically -->
                                        </div>
                                        <div style="margin-top: 10px; display: flex; justify-content: space-between;">
                                            <button id="reset-order" style="background: #ffc107; color: #000; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                                                Reset to Original
                                            </button>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>

            <!-- Grouping & Summary Tab -->
            <div id="grouping-tab" class="tab-pane" style="display: none;">
            <!-- Main Grid Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <!-- LEFT: Available Fields -->
                <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0;">Available Fields</h4>
                    <div style="display: flex; gap: 5px;">
                    <button id="sort-asc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↑ A-Z</button>
                    <button id="sort-desc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↓ Z-A</button>
                    </div>
                </div>
                <div id="available-fields" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                    <!-- Dynamically populated -->
                </div>
                </div>

                <!-- RIGHT: Selected Grouping Fields -->
                <div>
                <h4 style="margin-bottom: 13.5px; margin-top: 0;">Selected Grouping Fields</h4>
                <div id="selected-fields" style="border: 1px solid #ddd; border-radius: 5px; min-height: 10px; max-height: 300px; overflow-y: auto;">
                    <p style="color: #999; text-align: center;">No fields selected</p>
                </div>
                </div>
            </div>

            <!-- Summary Fields Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <!-- LEFT: Available Fields -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Available Fields for Summary</h4>
                        <div style="display: flex; gap: 5px;">
                            <button id="sort-summary-asc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↑ A-Z</button>
                            <button id="sort-summary-desc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↓ Z-A</button>
                        </div>
                    </div>
                    <div id="available-summary-fields" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- RIGHT: Selected Summary Fields with Add Button -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Summary Configuration</h4>
                    </div>
                    
                    <!-- Summary Function Selector -->
                    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa;">
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Function:</label>
                            <select id="summary-function" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                                <option value="sum">Sum</option>
                                <option value="average">Average</option>
                                <option value="count">Count</option>
                                <option value="min">Min</option>
                                <option value="max">Max</option>
                                <option value="first">First</option>
                                <option value="last">Last</option>
                            </select>
                        <button id="add-summary-field" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            + Add Summary
                        </button>
                    </div>
                    
                    <!-- Active Summary Fields List -->
                    <div>
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Active Summaries:</label>
                        <div id="selected-summary-fields" style="border: 1px solid #ddd; border-radius: 5px; min-height: 100px; max-height: 150px; overflow-y: auto; padding: 5px;">
                            <p style="color: #999; text-align: center; font-size: 12px; margin: 10px 0;">No summaries configured</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Grouping Options Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <!-- Sort & Top N -->
                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 0;">
                <legend style="font-weight: bold; padding: 0 10px;">Sort & Filter</legend>
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Sort Order:</label>
                    <select id="sort-order" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="ascending">Ascending</option>
                    <option value="descending">Descending</option>
                    <option value="original">Original Order</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Top N:</label>
                    <select id="top-n" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="none">None</option>
                    <option value="top">Top N Groups</option>
                    <option value="bottom">Bottom N Groups</option>
                    <option value="sort-all">Sort All (No Limit)</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">N Value:</label>
                    <input type="number" id="top-n-value" value="10" min="1" style="width: calc(100% - 16px); padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                </fieldset>

                <!-- Group Options -->
                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 0;">
                <legend style="font-weight: bold; padding: 0 10px;">Group Options</legend>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="summarize-group" style="margin-right: 8px;">
                    <span style="font-weight: bold;">Summarize Group</span>
                </label>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
    <input type="checkbox" id="repeat-headers-before-summary" style="margin-right: 8px;">
    <span style="font-weight: bold;">Repeat Headers Before Summary</span>
</label>
            <label style="display: none; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="page-break" style="margin-right: 8px;">
                    <span style="font-weight: bold;">Page Break After Group</span>
                </label> 
            </fieldset>
                </div>

                <!-- Named Groups Section -->
                <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-top: 15px;">
                    <legend style="font-weight: bold; padding: 0 10px;">Named Groups</legend>
                    <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
                    <input type="checkbox" id="define-named-group" style="margin-right: 8px; width: 16px; height: 16px;">
                    <span style="font-size: 13px;">Define Named Group</span>
                    </label>
                    <button id="open-named-group" disabled style="padding: 8px 15px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: not-allowed; width: 100%; font-size: 13px;">Configure Named Groups</button>
                </fieldset>
                </div>
                </div>

                <!-- Running Total Tab (UPDATED) -->
                <div id="running-total-tab" class="tab-pane" style="display: none;">
                <div style="display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; max-height: 500px; overflow: hidden; padding: 10px;">
                    
                    <!-- Left: Column Selection + Active Running Totals -->
                    <div style="display: flex; flex-direction: column; gap: 20px; overflow: hidden; max-height: 500px;">
                    
                    <!-- Select Columns -->
                    <div style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 10px;">Select Columns:</label>
                        <div id="running-total-columns" style="overflow-y: auto; max-height: 200px;">
                        <!-- Will be populated with numeric columns -->
                        </div>
                    </div>

                    <!-- Active Running Totals -->
                    <div style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 10px;">Active Running Totals:</label>
                        <div id="rt-active-list" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
                        <p style="color: #999; text-align: center;">No running totals configured</p>
                        </div>
                    </div>
                    </div>

                    <!-- Right: Configuration Panel -->
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div id="rt-config-panel" style="border: 1px solid #ddd; border-radius: 4px; padding: 5px 15px 0px 15px; min-height: 200px;overflow-y: auto; max-height: 400px;">
                        <p style="color: #666; text-align: center;">Select a column to configure running total</p>
                    </div>
                    </div>
                </div>
                </div>

                            <!-- Options Tab (existing content) -->
                <!-- Options Tab -->
                <div id="options-tab" class="tab-pane" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                        <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                            <legend style="font-weight: bold;">Display Options</legend>
                                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="checkbox" id="group-header-inplace" checked style="margin-right: 8px;">
                                    <span>Group Header In-place</span>
                                </label>
                                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="checkbox" id="hide-subtotal-single-row" style="margin-right: 8px;">
                                    <span>Hide Subtotal for Single Row</span>
                                </label>
                            </fieldset>
                        </div>
                        <div>
                            <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                                <legend style="font-weight: bold;">Total Options</legend>
                                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="checkbox" id="grand-total" checked style="margin-right: 8px;">
                                    <span>Show Grand Total</span>
                                </label>
                                <input type="text" id="grand-total-label" placeholder="Grand Total Label" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                                <input type="text" id="summary-label" placeholder="Summary Label" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </fieldset>
                        </div>
                    </div>
                
            <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <legend style="font-weight: bold;">Grouping Type</legend>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="radio" name="grouping-type" value="normal" checked style="margin-right: 8px;"> <!-- ✅ Added checked -->
                    <span>Show All Records</span>
                </label>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="grouping-type" value="summary" style="margin-right: 8px;">
                    <span>Show Summary Only</span>
                </label>
                <label style="display: flex; align-items: center; margin-top: 10px; margin-left: 25px;">
                    <input type="checkbox" id="keep-group-hierarchy" disabled style="margin-right: 8px;">
                    <span>Keep Group Hierarchy</span>
                </label>
            </fieldset>
                
            </div>
                    </div>

                    <!-- Footer Buttons -->
                    <div style="border-top: 1px solid #ddd; padding: 15px; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;">
                        <button id="cancel-settings" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button id="apply-settings" style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
                    </div>
                </div>
                `;
            const modal = editor.Modal;
            modal.setTitle('Table Settings');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                const availableFieldsDiv = document.getElementById('available-fields');
                let groupingHTML = availableFields.map(field => `
                    <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                        <input type="checkbox" class="field-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(selected.get('grouping-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
                        <span>${field.name}</span>
                    </div>
                `).join('');
                if (!availableFields.length) {
                    groupingHTML = '<p style="color: #999; text-align: center; font-size: 12px">No fields available</p>';
                }
                availableFieldsDiv.innerHTML = groupingHTML;

                // Populate available summary fields
                const availableSummaryFieldsDiv = document.getElementById('available-summary-fields');
                let summaryHTML = availableFields.map(field => `
                    <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                        <input type="checkbox" class="summary-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(selected.get('summary-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
                        <span>${field.name}</span>
                    </div>
                `).join('');
                if (!availableFields.length) {
                    summaryHTML = '<p style="color: #999; text-align: center; font-size:12px;">No fields available</p>';
                }
                availableSummaryFieldsDiv.innerHTML = summaryHTML;

                initializeTableSettingsModal(selected, availableFields);
            }, 100);
        }
    });
// Helper function to create a group card
function createGroupCard(wrapperComponent, groupValue, groupData, groupIndex, headers, tableId, tableStyles, columnsPerRow, showSummaryOnly, summaryRow, component) {
    console.log(`🎴 Creating card for group "${groupValue}" with ${groupData.length} records`);
    
    // Group Container
    const cardComponent = wrapperComponent.components().add({
        type: 'default',
        tagName: 'div',
        classes: ['group-card'],
        attributes: {
            id: `${tableId}-group-${groupIndex}`
        }
    });

    // Group Title
    cardComponent.components().add({
        type: 'text',
        tagName: 'div',
        content: groupValue,
        classes: ['group-card-title'],
        attributes: {
            id: `${tableId}-group-title-${groupIndex}`
        }
    });

    // Create cards for each record in the group
    groupData.forEach((record, recordIndex) => {
        if (!showSummaryOnly && record._isSummary) {
            return;
        }
        
        createRecordCard(
            cardComponent,
            record,
            recordIndex,
            headers,
            tableId,
            groupIndex,
            tableStyles,
            columnsPerRow,
            groupData.length
        );
    });
    
// Add summary information if available
if (summaryRow && !showSummaryOnly) {
    const summaryWrapper = cardComponent.components().add({
        type: 'default',
        tagName: 'div',
        classes: ['group-summary'],
        attributes: {
            id: `${tableId}-group-summary-${groupIndex}`
        }
    });
    
    const summaryFields = component.get('summary-fields') || [];
    let summaryContent = '';
    
    // Group summary fields by column to show multiple functions per column
    const columnSummaries = {};
    summaryFields.forEach(field => {
        if (!columnSummaries[field.key]) {
            columnSummaries[field.key] = [];
        }
        columnSummaries[field.key].push(field);
    });
    
    // Display all summaries including multiple functions per column
    Object.keys(columnSummaries).forEach(columnKey => {
        const summaries = columnSummaries[columnKey];
        summaries.forEach((field, index) => {
            // Determine the actual key in the summary row
            let valueKey = columnKey;
            if (index > 0) {
                valueKey = `${columnKey}_summary_${index}`;
            }
            
            const value = summaryRow[valueKey];
            if (value !== undefined && value !== null && value !== '') {
                const functionName = field.function.charAt(0).toUpperCase() + field.function.slice(1);
                summaryContent += `${field.name} (${functionName}): ${value}<br>`;
            }
        });
    });
    
    if (summaryContent) {
        summaryWrapper.components().add({
            type: 'text',
            tagName: 'div',
            content: summaryContent
        });
    }
}
}

function createRecordCard(parentComponent, record, recordIndex, headers, tableId, groupIndex, tableStyles, columnsPerRow, totalRecords) {
    // Create wrapper for this record
    const recordWrapper = parentComponent.components().add({
        type: 'default',
        tagName: 'div',
        classes: ['record-card'],
        attributes: {
            id: `${tableId}-record-${groupIndex}-${recordIndex}`
        }
    });

    // Create table for this record
    const tableComponent = recordWrapper.components().add({
        type: 'default',
        tagName: 'table',
        classes: ['card-style-table'],
        attributes: {
            id: `${tableId}-card-table-${groupIndex}-${recordIndex}`,
            width: '100%'
        },
        style: {
            'width': '100%',
            'border-collapse': 'collapse'
        }
    });

    const tbodyComponent = tableComponent.components().add({
        type: 'default',
        tagName: 'tbody'
    });

    // UPDATED: Don't filter out summary columns - include ALL columns from headers
    const headerEntries = Object.entries(headers).filter(([key]) => 
        !key.endsWith('_running_total') && // Still exclude running totals
        !key.startsWith('_') // Still exclude internal fields
    );
    // Now includes: column_summary_1, column_summary_2, etc.
    
    const totalFields = headerEntries.length;
    
    // Calculate how many rows we need
    const rowsNeeded = Math.ceil(totalFields / columnsPerRow);

    // Create rows with header-value pairs
    for (let rowNum = 0; rowNum < rowsNeeded; rowNum++) {
        const headerRowComponent = tbodyComponent.components().add({
            type: 'default',
            tagName: 'tr',
            classes: ['card-header-row']
        });

        const valueRowComponent = tbodyComponent.components().add({
            type: 'default',
            tagName: 'tr',
            classes: ['card-value-row']
        });

        // Add cells for this row
        for (let col = 0; col < columnsPerRow; col++) {
            const fieldIndex = rowNum * columnsPerRow + col;
            
            if (fieldIndex < totalFields) {
                const [key, headerText] = headerEntries[fieldIndex];
                const cellValue = record[key] !== undefined && record[key] !== null ? String(record[key]) : '';

                const cellStyles = tableStyles ? {
                    'border': `${tableStyles.borderWidth || 1}px ${tableStyles.borderStyle || 'solid'} ${tableStyles.borderColor || '#000'}`,
                    'font-family': tableStyles.fontFamily || 'Arial, sans-serif',
                    'color': tableStyles.textColor || '#000',
                    'background-color': tableStyles.bgColor || '#fff'
                } : {
                    'border': '1px solid #000'
                };

                // Header cell
                headerRowComponent.components().add({
                    type: 'json-table-cell',
                    tagName: 'th',
                    content: headerText,
                    attributes: {
                        id: `${tableId}-card-header-${groupIndex}-${recordIndex}-${key}`
                    },
                    style: {
                        ...cellStyles,
                        'padding': '8px',
                        'text-align': 'left',
                        'font-weight': 'bold'
                    }
                });

                // Value cell
                valueRowComponent.components().add({
                    type: 'json-table-cell',
                    tagName: 'td',
                    content: cellValue,
                    attributes: {
                        id: `${tableId}-card-value-${groupIndex}-${recordIndex}-${key}`,
                        'data-row': recordIndex.toString(),
                        'data-column-key': key,
                        'contenteditable': 'false'
                    },
                    style: {
                        ...cellStyles,
                        'padding': '8px',
                        'text-align': 'left'
                    }
                });
            } else {
                // Empty cells
                headerRowComponent.components().add({
                    type: 'json-table-cell',
                    tagName: 'th',
                    content: '',
                    style: {
                        'border': 'none',
                        'padding': '8px'
                    }
                });

                valueRowComponent.components().add({
                    type: 'json-table-cell',
                    tagName: 'td',
                    content: '',
                    style: {
                        'border': 'none',
                        'padding': '8px'
                    }
                });
            }
        }
    }
}
    function initializeTableSettingsModal(component, availableFields) {
        let selectedGroupingFields = component.get('grouping-fields') || [];
        let selectedSummaryFields = component.get('summary-fields') || [];
        const tableType = component.get('table-type') || 'standard';

        if (tableType === 'crosstab') {
            const settingsTab = document.querySelector('.nav-tab[data-tab="settings"]');
            const runningTotalTab = document.querySelector('.nav-tab[data-tab="running-total"]');

            if (settingsTab) settingsTab.style.display = 'none';
            if (runningTotalTab) runningTotalTab.style.display = 'none';
        }

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.nav-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'transparent';
                    t.style.borderBottom = 'none';
                    t.style.fontWeight = 'normal';
                });

                document.querySelectorAll('.tab-pane').forEach(p => {
                    p.style.display = 'none';
                });

                this.classList.add('active');
                this.style.background = 'white';
                this.style.borderBottom = '3px solid #007bff';
                this.style.fontWeight = 'bold';
                const tabId = this.getAttribute('data-tab') + '-tab';
                const tabPane = document.getElementById(tabId);
                if (tabPane) {
                    tabPane.style.display = 'block';
                }

                if (this.getAttribute('data-tab') === 'running-total') {
                    initializeRunningTotalTab(component);
                }
            });
        });

        if (tableType === 'crosstab') {
            setTimeout(() => {
                document.querySelector('.nav-tab[data-tab="grouping"]')?.click();
            }, 50);
        }

        initializeInlineColumnReorder(component);

        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        const data = component.get('custom-data') || component.get('table-data') || [];
        const selectedColumns = component.get('selected-running-total-columns') || [];

        const runningTotalContainer = document.getElementById('running-total-columns');
        const numericHeaders = {};

        Object.entries(headers).forEach(([key, name]) => {
            const isStrictlyNumeric = data.every(row => {
                let value = row[key];
                if (value === '' || value === null || value === undefined) return true;

                value = String(value).trim();
                if (/^\(.*\)$/.test(value)) {
                    value = '-' + value.slice(1, -1);
                }

                value = value.replace(/[$£€₹,\s]/g, '');
                if (/^-?\d+(\.\d{3})*,\d+$/.test(value)) {
                    value = value.replace(/\./g, '').replace(',', '.');
                }

                const numValue = Number(value);
                return typeof numValue === 'number' && !isNaN(numValue);
            });

            if (
                isStrictlyNumeric &&
                data.some(row => row[key] !== '' && row[key] !== null && row[key] !== undefined)
            ) {
                numericHeaders[key] = name;
            }
        });

        if (Object.keys(numericHeaders).length === 0) {
            runningTotalContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No columns with purely numeric data available</p>';
        } else {
            runningTotalContainer.innerHTML = Object.entries(numericHeaders).map(([key, name]) => `
            <div style="margin-bottom: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" value="${key}" ${selectedColumns.includes(key) ? 'checked' : ''} 
                           class="running-total-checkbox" style="margin-right: 8px; width: 16px; height: 16px;">
                    <span>${name}</span>
                </label>
            </div>
        `).join('');
        }

        const availableFieldsDiv = document.getElementById('available-fields');
        let groupingHTML = availableFields.map(field => `
            <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                <input type="checkbox" class="field-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(component.get('grouping-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
                <span>${field.name}</span>
            </div>
        `).join('');

        if (!availableFields.length) {
            groupingHTML = '<p style="color: #999; text-align: center; font-size: 12px">No fields available</p>';
        }
        availableFieldsDiv.innerHTML = groupingHTML;
        const availableSummaryFieldsDiv = document.getElementById('available-summary-fields');
        let summaryHTML = availableFields.map(field => `
            <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                <input type="checkbox" class="summary-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(component.get('summary-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
                <span>${field.name}</span>
            </div>
        `).join('');

        if (!availableFields.length) {
            summaryHTML = '<p style="color: #999; text-align: center; font-size:12px;">No fields available</p>';
        }
        availableSummaryFieldsDiv.innerHTML = summaryHTML;
        const savedGroupingFields = component.get('grouping-fields') || [];
        const savedSummaryFields = component.get('summary-fields') || [];
        selectedGroupingFields = [...savedGroupingFields];
        selectedSummaryFields = [...savedSummaryFields];
        const sortOrder = document.getElementById('sort-order');
        const topN = document.getElementById('top-n');
        const topNValue = document.getElementById('top-n-value');
        const summarizeGroup = document.getElementById('summarize-group');
        const pageBreak = document.getElementById('page-break');
const repeatHeadersBeforeSummary = document.getElementById('repeat-headers-before-summary');
        const groupHeaderInplace = document.getElementById('group-header-inplace');
        const hideSubtotalSingleRow = document.getElementById('hide-subtotal-single-row');
        const keepGroupHierarchy = document.getElementById('keep-group-hierarchy');
        const grandTotal = document.getElementById('grand-total');
        const grandTotalLabel = document.getElementById('grand-total-label');
        const summaryLabel = document.getElementById('summary-label');

        if (sortOrder) sortOrder.value = component.get('sort-order') || 'ascending';
        if (topN) topN.value = component.get('top-n') || 'none';
        if (topNValue) topNValue.value = component.get('top-n-value') || '10';
        if (summarizeGroup) summarizeGroup.checked = component.get('summarize-group') === true;
        if (pageBreak) pageBreak.checked = component.get('page-break') === true;
if (repeatHeadersBeforeSummary) {
    repeatHeadersBeforeSummary.checked = component.get('repeat-headers-before-summary') === true;
}
        if (groupHeaderInplace) groupHeaderInplace.checked = component.get('group-header-inplace') !== false;
        if (hideSubtotalSingleRow) hideSubtotalSingleRow.checked = component.get('hide-subtotal-single-row') === true;
        if (keepGroupHierarchy) keepGroupHierarchy.checked = component.get('keep-group-hierarchy') === true;
        if (grandTotal) grandTotal.checked = component.get('grand-total') !== false;
        if (grandTotalLabel) grandTotalLabel.value = component.get('grand-total-label') || '';
        if (summaryLabel) summaryLabel.value = component.get('summary-label') || '';

        if (component.get('show-summary-only') === true) {
            const summaryRadio = document.querySelector('input[name="grouping-type"][value="summary"]');
            if (summaryRadio) {
                summaryRadio.checked = true;
                if (keepGroupHierarchy) keepGroupHierarchy.disabled = false;
            }
        } else {
            const normalRadio = document.querySelector('input[name="grouping-type"][value="normal"]');
            if (normalRadio) {
                normalRadio.checked = true;
                if (keepGroupHierarchy) {
                    keepGroupHierarchy.disabled = true;
                    keepGroupHierarchy.checked = false;
                }
            }
        }

        function updateSummaryHeadersCheckbox() {
            const showSummaryHeadersCheckbox = document.getElementById('show-summary-headers');
            const summaryHeadersHint = document.getElementById('summary-headers-hint');
            if (!showSummaryHeadersCheckbox) return;
            const hasGrouping = selectedGroupingFields.length > 0;
    const isRepeatHeadersEnabled = document.getElementById('repeat-headers-before-summary')?.checked || false;
            const isShowSummaryOnlyOff = document.querySelector('input[name="grouping-type"]:checked')?.value !== 'summary';
            const columnSummaryCounts = {};
            selectedSummaryFields.forEach(field => {
                columnSummaryCounts[field.key] = (columnSummaryCounts[field.key] || 0) + 1;
            });
            const hasMultipleSummaries = Object.values(columnSummaryCounts).some(count => count > 1);
    const shouldEnable = hasGrouping && isRepeatHeadersEnabled && isShowSummaryOnlyOff && hasMultipleSummaries; 
            showSummaryHeadersCheckbox.disabled = !shouldEnable;
            showSummaryHeadersCheckbox.style.opacity = shouldEnable ? '1' : '0.5';
            showSummaryHeadersCheckbox.parentElement.querySelector('span').style.color = shouldEnable ? '#000' : '#999';

            if (summaryHeadersHint) {
                summaryHeadersHint.style.display = shouldEnable ? 'block' : 'none';
            }

            if (!shouldEnable) {
                showSummaryHeadersCheckbox.checked = false;
            }
        }

        function updateSelectedFields() {
            const selectedFieldsDiv = document.getElementById('selected-fields');

            if (!selectedFieldsDiv) {
                return;
            }

            if (selectedGroupingFields.length === 0) {
                selectedFieldsDiv.innerHTML = '<p style="color: #999; text-align: center; font-size: 12px;">No fields selected</p>';
            } else {
                selectedFieldsDiv.innerHTML = selectedGroupingFields.map((field, idx) => `
                    <div class="field-item selected" data-key="${field.key}" data-index="${idx}" style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <span>${field.name}</span>
                        <button class="remove-grouping-field" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                    </div>
                `).join('');

                const groupingFieldDisplay = document.getElementById('grouping-field-display');
                if (groupingFieldDisplay && selectedGroupingFields.length > 0) {
                    groupingFieldDisplay.innerHTML = `<span style="color: #000;">${selectedGroupingFields[0].name}</span>`;
                }

                selectedFieldsDiv.querySelectorAll('.remove-grouping-field').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const idx = parseInt(this.closest('.field-item').getAttribute('data-index'));
                        const fieldKey = selectedGroupingFields[idx].key;
                        selectedGroupingFields.splice(idx, 1);

                        const availableCheckbox = document.querySelector(`#available-fields .field-item[data-key="${fieldKey}"] .field-checkbox`);
                        if (availableCheckbox) availableCheckbox.checked = false;

                        updateSelectedFields();
                        updateSummaryAtDropdown();
                        updateSummaryHeadersCheckbox();
                    });
                });
            }

            try {
                updateSummaryAtDropdown();
                updateSummaryHeadersCheckbox();
            } catch (e) {
                console.warn('Failed to update dropdowns:', e);
            }
        }

        function updateSummaryFieldsList() {
            const selectedSummaryFieldsDiv = document.getElementById('selected-summary-fields');

            if (!selectedSummaryFieldsDiv) {
                console.warn('Selected summary fields div not found');
                return;
            }

            if (selectedSummaryFields.length === 0) {
                selectedSummaryFieldsDiv.innerHTML = '<p style="color: #999; text-align: center; font-size: 12px; margin: 10px 0;">No summaries configured</p>';
                updateSummaryAtDropdown();
                updateSummaryHeadersCheckbox();
                return;
            }

            selectedSummaryFieldsDiv.innerHTML = selectedSummaryFields.map((field, idx) => `
                <div class="summary-field-item" data-index="${idx}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <strong style="font-size: 13px;">${field.name}</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">Function: ${field.function}</div>
                    </div>
                    <button class="remove-summary-field" data-index="${idx}" style="background: #dc3545; color: white; padding: 4px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                </div>
            `).join('');

            selectedSummaryFieldsDiv.querySelectorAll('.remove-summary-field').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.getAttribute('data-index'));
                    selectedSummaryFields.splice(idx, 1);
                    updateSummaryFieldsList();
                    updateSummaryAtDropdown();
                    updateSummaryHeadersCheckbox();
                });
            });
        }

        function updateSummaryAtDropdown() {
            const summaryAtField = document.getElementById('summary-at-field');
            if (!summaryAtField) return;
            summaryAtField.innerHTML = '<option value="">Select grouping field...</option>';
            selectedGroupingFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field.key;
                option.textContent = field.name;
                summaryAtField.appendChild(option);
            });

            const savedSummaryAt = component.get('summary-at-field') || '';
            summaryAtField.value = savedSummaryAt;

            summaryAtField.disabled = selectedGroupingFields.length === 0 || selectedSummaryFields.length === 0;
            summaryAtField.style.background = summaryAtField.disabled ? '#f0f0f0' : 'white';
        }

        updateSelectedFields();
        updateSummaryFieldsList();
        updateSummaryAtDropdown();
        updateSummaryHeadersCheckbox();

        document.getElementById('top-n').addEventListener('change', function () {
            const topNValue = document.getElementById('top-n-value');
            const isEnabled = this.value === 'top' || this.value === 'bottom';
            topNValue.disabled = !isEnabled;
            topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
            topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
            topNValue.style.opacity = isEnabled ? '1' : '0.6';
        });

        setTimeout(() => {
            const topNSelect = document.getElementById('top-n');
            const topNValue = document.getElementById('top-n-value');
            const currentValue = topNSelect.value;
            const isEnabled = currentValue === 'top' || currentValue === 'bottom';

            topNValue.disabled = !isEnabled;
            topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
            topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
            topNValue.style.opacity = isEnabled ? '1' : '0.6';
        }, 100);

        document.getElementById('grand-total').addEventListener('change', function () {
            const grandTotalLabel = document.getElementById('grand-total-label');
            const isEnabled = this.checked;

            grandTotalLabel.disabled = !isEnabled;
            grandTotalLabel.style.background = isEnabled ? 'white' : '#f0f0f0';
        });

        document.querySelectorAll('#available-fields .field-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const fieldItem = this.closest('.field-item');
                const fieldKey = fieldItem.getAttribute('data-key');
                const fieldName = fieldItem.querySelector('span').textContent;

                if (this.checked) {
                    selectedGroupingFields.push({ key: fieldKey, name: fieldName });
                    updateSelectedFields();
                }
            });
        });

        document.getElementById('add-summary-field').addEventListener('click', function () {
            const summaryCheckboxes = document.querySelectorAll('#available-summary-fields .summary-checkbox:checked');
            const summaryFunction = document.getElementById('summary-function').value;

            if (summaryCheckboxes.length === 0) {
                alert('Please select at least one field for summary');
                return;
            }

            let addedCount = 0;
            summaryCheckboxes.forEach(checkbox => {
                const fieldItem = checkbox.closest('.field-item');
                const fieldKey = fieldItem.getAttribute('data-key');
                const fieldName = fieldItem.querySelector('span').textContent;

                const exists = selectedSummaryFields.some(f => f.key === fieldKey && f.function === summaryFunction);
                if (!exists) {
                    selectedSummaryFields.push({
                        key: fieldKey,
                        name: fieldName,
                        function: summaryFunction
                    });
                    addedCount++;
                }

                checkbox.checked = false;
            });

            updateSummaryFieldsList();
            updateSummaryAtDropdown();
            updateSummaryHeadersCheckbox();

            if (addedCount > 0) {
            }
        });

        document.getElementById('sort-summary-asc').addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
            items.sort((a, b) => a.textContent.localeCompare(b.textContent));
            const container = document.getElementById('available-summary-fields');
            container.innerHTML = '';
            items.forEach(item => container.appendChild(item));
        });

        document.getElementById('sort-summary-desc').addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
            items.sort((a, b) => b.textContent.localeCompare(a.textContent));
            const container = document.getElementById('available-summary-fields');
            container.innerHTML = '';
            items.forEach(item => container.appendChild(item));
        });

        document.getElementById('sort-asc').addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
            items.sort((a, b) => a.textContent.localeCompare(b.textContent));
            const container = document.getElementById('available-fields');
            container.innerHTML = '';
            items.forEach(item => container.appendChild(item));
        });

        document.getElementById('sort-desc').addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
            items.sort((a, b) => b.textContent.localeCompare(a.textContent));
            const container = document.getElementById('available-fields');
            container.innerHTML = '';
            items.forEach(item => container.appendChild(item));
        });

        document.getElementById('define-named-group').addEventListener('change', function () {
            const btn = document.getElementById('open-named-group');
            btn.disabled = !this.checked;
            btn.style.cursor = this.checked ? 'pointer' : 'not-allowed';
            btn.style.background = this.checked ? 'white' : '#f0f0f0';
        });

        document.getElementById('open-named-group').addEventListener('click', function () {
            if (this.disabled) return;

            if (selectedGroupingFields.length === 0) {
                alert('Please select a grouping field first');
                return;
            }

            const groupField = selectedGroupingFields[0];
            showNamedGroupModal(component, groupField);
        });
document.getElementById('repeat-headers-before-summary')?.addEventListener('change', function() {
    updateSummaryHeadersCheckbox();
    // Visual feedback
    if (this.checked) {
        console.log('Card-style layout will be applied when settings are saved');
    }
});
        document.querySelectorAll('input[name="grouping-type"]').forEach(radio => {
            radio.addEventListener('change', function () {
                const keepHierarchy = document.getElementById('keep-group-hierarchy');
                const isSummaryOnly = this.value === 'summary';

                keepHierarchy.disabled = !isSummaryOnly;
                keepHierarchy.parentElement.querySelector('span').style.color = isSummaryOnly ? '#000' : '#999';

                if (!isSummaryOnly) {
                    keepHierarchy.checked = false;
                }

                updateSummaryHeadersCheckbox();
            });
        });

        document.getElementById('merge-group-cells')?.addEventListener('change', updateSummaryHeadersCheckbox);
        document.getElementById('cancel-settings').addEventListener('click', () => {
            editor.Modal.close();
        });

        document.getElementById('apply-settings').addEventListener('click', () => {

            if (selectedGroupingFields.length === 0 && selectedSummaryFields.length > 0) {
                alert('Please select at least one grouping field before adding summaries');
                return;
            }

            const summarizeChecked = document.getElementById('summarize-group').checked;
            if (summarizeChecked && selectedSummaryFields.length === 0) {
                alert('Please add at least one summary field when "Summarize Group" is enabled');
                return;
            }

            component.set('grouping-fields', selectedGroupingFields);
            component.set('summary-fields', selectedSummaryFields);
            component.set('sort-order', document.getElementById('sort-order').value);
            component.set('top-n', document.getElementById('top-n').value);
            component.set('top-n-value', parseInt(document.getElementById('top-n-value').value) || 10);

            const summaryAtFieldEl = document.getElementById('summary-at-field');
            if (summaryAtFieldEl) {
                component.set('summary-at-field', summaryAtFieldEl.value);
            }

    component.set('repeat-headers-before-summary', document.getElementById('repeat-headers-before-summary').checked);
            component.set('summarize-group', document.getElementById('summarize-group').checked);
            component.set('hide-subtotal-single-row', document.getElementById('hide-subtotal-single-row').checked);
            component.set('page-break', document.getElementById('page-break').checked);
            const showSummaryOnly = document.querySelector('input[name="grouping-type"]:checked').value === 'summary';
            component.set('show-summary-only', showSummaryOnly);
            component.set('keep-group-hierarchy', document.getElementById('keep-group-hierarchy').checked);
            component.set('grand-total', document.getElementById('grand-total').checked);
            component.set('grand-total-label', document.getElementById('grand-total-label').value);
            component.set('summary-label', document.getElementById('summary-label').value);
            component.set('define-named-group', document.getElementById('define-named-group').checked);

            const loader = document.createElement('div');
            loader.id = 'settings-loader';
            loader.style.position = 'fixed';
            loader.style.top = '0';
            loader.style.left = '0';
            loader.style.width = '100vw';
            loader.style.height = '100vh';
            loader.style.background = 'rgba(255,255,255,0.8)';
            loader.style.display = 'flex';
            loader.style.alignItems = 'center';
            loader.style.justifyContent = 'center';
            loader.style.zIndex = '10000';
            loader.innerHTML = '<div style="padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px;">Applying Table settings...</div>';
            document.body.appendChild(loader);
            editor.Modal.close();

            setTimeout(() => {
                component.applyGroupingAndSummary();
                const runningTotals = component.get('running-totals') || [];
                if (runningTotals.length > 0) {
                    applyRunningTotalsToTable(component);
                }

                document.getElementById('settings-loader').remove();
                alert('Settings applied successfully!');
            }, 100);
        });

        updateSummaryAtDropdown();
        updateSummaryHeadersCheckbox();
    }

    function initializeRunningTotalTab(component) {
        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        const data = component.get('custom-data') || component.get('table-data') || [];
        const runningTotals = component.get('running-totals') || [];

        const numericHeaders = {};
        Object.entries(headers).forEach(([key, name]) => {
            if (key.endsWith('_running_total')) return;
            const isStrictlyNumeric = data.every(row => {
                let value = row[key];
                if (value === '' || value === null || value === undefined) return true;
                value = String(value).trim();
                if (/^\(.*\)$/.test(value)) value = '-' + value.slice(1, -1);
                value = value.replace(/[$£€₹,\s]/g, '');
                if (/^-?\d+(\.\d{3})*,\d+$/.test(value)) {
                    value = value.replace(/\./g, '').replace(',', '.');
                }
                const numValue = Number(value);
                return typeof numValue === 'number' && !isNaN(numValue);
            });

            if (isStrictlyNumeric && data.some(row => row[key] !== '' && row[key] !== null && row[key] !== undefined)) {
                numericHeaders[key] = name;
            }
        });

        const columnList = document.getElementById('running-total-columns');
        if (Object.keys(numericHeaders).length === 0) {
            columnList.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No numeric columns available</p>';
            return;
        }

        columnList.innerHTML = Object.entries(numericHeaders).map(([key, name]) => `
            <div class="rt-column-item" data-key="${key}" style="padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; transition: all 0.2s;">
                <input type="checkbox" class="rt-checkbox" style="margin-right: 8px; opacity: 1; cursor: pointer; width: 16px; height: 16px;">
                <span>${name}</span>
            </div>
        `).join('');

        document.querySelectorAll('.rt-checkbox').forEach(item => {
            item.addEventListener('change', function () {
                const parentItem = this.closest('.rt-column-item');
                const columnKey = parentItem.getAttribute('data-key');
                const columnName = numericHeaders[columnKey];

                if (this.checked) {
                    document.querySelectorAll('.rt-checkbox').forEach(cb => {
                        if (cb !== this) {
                            cb.checked = false;
                            cb.disabled = true;
                        }
                    });
                    showRunningTotalConfig(component, columnKey, columnName, runningTotals);
                } else {
                    document.getElementById('rt-config-panel').innerHTML = '<p style="color: #666; text-align: center;">Select a column to configure running total</p>';
                    document.querySelectorAll('.rt-checkbox').forEach(cb => {
                        cb.disabled = false;
                    });
                }
            });
        });
        updateActiveRunningTotalsList(component, numericHeaders);
    }

    function initializeInlineColumnReorder(component) {
        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        const columnKeys = Object.keys(headers);

        if (columnKeys.length <= 1) {
            document.getElementById('column-list-inline').innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Need at least 2 columns to reorder</p>';
            return;
        }

        const originalOrder = [...columnKeys];

        const columnList = document.getElementById('column-list-inline');
        columnList.innerHTML = columnKeys.map(key => `
            <div class="column-item-inline" data-key="${key}" draggable="true" style="
                margin: 2px; 
                padding: 12px 15px; 
                border-radius: 3px; 
                cursor: move; 
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s ease;
            ">
                <span style="font-weight: 500;">${headers[key]}</span>
                <span style="color: #666; font-size: 12px;">≡≡≡</span>
            </div>
        `).join('');

        let draggedElement = null;

        const columnItems = columnList.querySelectorAll('.column-item-inline');
        columnItems.forEach(item => {
            item.addEventListener('dragstart', function (e) {
                draggedElement = this;
                this.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', function () {
                this.style.opacity = '1';
                draggedElement = null;
                columnItems.forEach(item => item.style.borderTop = '');
            });

            item.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (this !== draggedElement) {
                    this.style.borderTop = '2px solid #007bff';
                }
            });

            item.addEventListener('dragleave', function () {
                this.style.borderTop = '';
            });

            item.addEventListener('drop', function (e) {
                e.preventDefault();
                this.style.borderTop = '';

                if (this !== draggedElement) {
                    const allItems = Array.from(columnList.children);
                    const draggedIndex = allItems.indexOf(draggedElement);
                    const targetIndex = allItems.indexOf(this);

                    if (draggedIndex < targetIndex) {
                        this.parentNode.insertBefore(draggedElement, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(draggedElement, this);
                    }
                    applyColumnReorder(component);
                }
            });
        });

        document.getElementById('reset-order').addEventListener('click', function () {
            component.reorderColumns(originalOrder);
            initializeInlineColumnReorder(component);
            alert('Column order reset to original');
        });
    }

    function applyColumnReorder(component) {
        const columnList = document.getElementById('column-list-inline');
        const currentItems = columnList.querySelectorAll('.column-item-inline');
        const newOrder = Array.from(currentItems).map(item => item.getAttribute('data-key'));
        component.reorderColumns(newOrder);
    }

    function showRunningTotalConfig(component, columnKey, columnName, runningTotals) {
        const existing = runningTotals.find(rt => rt.columnKey === columnKey);

        const configPanel = document.getElementById('rt-config-panel');
        configPanel.innerHTML = `
            <h4 style="margin-top: 0;">${columnName}</h4>
            
            <!-- Summary -->
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
                <label style="font-weight: bold; display: block; margin-bottom: 5px;">Summary Field:</label>
                <select id="rt-summary-field" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                    <option value="sum" ${existing?.operation === 'sum' ? 'selected' : ''}>Sum</option>
                    <option value="count" ${existing?.operation === 'count' ? 'selected' : ''}>Count</option>
                    <option value="distinct-count" ${existing?.operation === 'distinct-count' ? 'selected' : ''}>Distinct Count</option>
                    <option value="average" ${existing?.operation === 'average' ? 'selected' : ''}>Average</option>
                    <option value="max" ${existing?.operation === 'max' ? 'selected' : ''}>Max</option>
                    <option value="min" ${existing?.operation === 'min' ? 'selected' : ''}>Min</option>
                    <option value="product" ${existing?.operation === 'product' ? 'selected' : ''}>Product</option>
                    <option value="std-dev" ${existing?.operation === 'std-dev' ? 'selected' : ''}>Std Deviation (Population)</option>
                    <option value="variance" ${existing?.operation === 'variance' ? 'selected' : ''}>Variance (Population)</option>
                    <option value="weighted-avg" ${existing?.operation === 'weighted-avg' ? 'selected' : ''}>Weighted Average</option>
                </select>
            </div>

            <!-- Evaluate -->
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
                <label style="font-weight: bold; display: block; margin-bottom: 10px;">Evaluate:</label>
                <label style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="radio" name="rt-evaluate" value="for-each-record" ${!existing || existing.evaluate === 'for-each-record' ? 'checked' : ''} style="margin-right: 8px;">
                    <span>For each record</span>
                </label>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="rt-evaluate" value="on-change-of" ${existing?.evaluate === 'on-change-of' ? 'checked' : ''} style="margin-right: 8px;">
                    <span>On change of</span>
                </label>
                <select id="rt-evaluate-field" ${existing?.evaluate !== 'on-change-of' ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px; background: ${existing?.evaluate !== 'on-change-of' ? '#f0f0f0' : 'white'};">
                    ${getGroupingFieldsOptions(component, existing?.evaluateField)}
                </select>
            </div>

            <!-- Reset -->
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; min-hight: 180px">
                <label style="font-weight: bold; display: block; margin-bottom: 10px;">Reset:</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                    <label style="display: flex; align-items: center;">
                        <input type="radio" name="rt-reset" value="never" ${!existing || existing.reset === 'never' ? 'checked' : ''} style="margin-right: 8px;">
                        <span>Never</span>
                    </label>
                    <label style="display: flex; align-items: center;">
                        <input type="radio" name="rt-reset" value="on-pagebreak" ${existing?.reset === 'on-pagebreak' ? 'checked' : ''} style="margin-right: 8px;">
                        <span>On Pagebreak</span>
                    </label>
                </div>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="rt-reset" value="on-change-of" ${existing?.reset === 'on-change-of' ? 'checked' : ''} style="margin-right: 8px;">
                    <span>On change of</span>
                </label>
                <select id="rt-reset-field" ${existing?.reset !== 'on-change-of' ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px; background: ${existing?.reset !== 'on-change-of' ? '#f0f0f0' : 'white'};">
                    ${getGroupingFieldsOptions(component, existing?.resetField)}
                </select>
            </div>

            <!-- Action Buttons - Fixed positioning -->
            <div style="display: flex; gap: 10px; margin-top: 20px; margin-bottom: 10px;">
                ${existing ? `<button id="rt-remove-btn" style="flex: 1; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Running Total</button>` : ''}
                <button id="rt-apply-btn" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">${existing ? 'Update' : 'Add'} Running Total</button>
            </div>
         `;

        document.querySelectorAll('input[name="rt-evaluate"]').forEach(radio => {
            radio.addEventListener('change', function () {
                const field = document.getElementById('rt-evaluate-field');
                field.disabled = this.value !== 'on-change-of';
                field.style.background = this.value !== 'on-change-of' ? '#f0f0f0' : 'white';
            });
        });

        document.querySelectorAll('input[name="rt-reset"]').forEach(radio => {
            radio.addEventListener('change', function () {
                const field = document.getElementById('rt-reset-field');
                field.disabled = this.value !== 'on-change-of';
                field.style.background = this.value !== 'on-change-of' ? '#f0f0f0' : 'white';
            });
        });

        document.getElementById('rt-apply-btn').addEventListener('click', function () {
            const rtConfig = {
                columnKey,
                columnName,
                operation: document.getElementById('rt-summary-field').value,
                evaluate: document.querySelector('input[name="rt-evaluate"]:checked').value,
                evaluateField: document.getElementById('rt-evaluate-field').value,
                reset: document.querySelector('input[name="rt-reset"]:checked').value,
                resetField: document.getElementById('rt-reset-field').value
            };

            addOrUpdateRunningTotal(component, rtConfig);
        });

        if (existing) {
            document.getElementById('rt-remove-btn').addEventListener('click', function () {
                removeRunningTotal(component, columnKey);
            });
        }
    }

    function getGroupingFieldsOptions(component, selectedField) {
        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        return Object.entries(headers)
            .filter(([key]) => !key.endsWith('_running_total'))
            .map(([key, name]) =>
                `<option value="${key}" ${selectedField === key ? 'selected' : ''}>${name}</option>`
            ).join('');
    }

    function addOrUpdateRunningTotal(component, rtConfig) {
        let runningTotals = component.get('running-totals') || [];
        const existingIndex = runningTotals.findIndex(rt => rt.columnKey === rtConfig.columnKey);

        if (existingIndex >= 0) {
            runningTotals[existingIndex] = rtConfig;
        } else {
            runningTotals.push(rtConfig);
        }

        component.set('running-totals', runningTotals);

        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        updateActiveRunningTotalsList(component);
        alert(`Running total ${existingIndex >= 0 ? 'updated' : 'added'} for ${rtConfig.columnName}`);

        initializeRunningTotalTab(component);
    }

    function removeRunningTotal(component, columnKey) {
        let runningTotals = component.get('running-totals') || [];
        runningTotals = runningTotals.filter(rt => rt.columnKey !== columnKey);
        component.set('running-totals', runningTotals);

        // Remove the generated running total column from the rendered table as well.
        // Previously, only values were being cleared while the column header stayed,
        // which left an empty "(RT)" column visible.
        const rtKey = `${columnKey}_running_total`;
        const currentHeaders = component.get('custom-headers');
        const currentData = component.get('custom-data');

        if (currentHeaders && Object.prototype.hasOwnProperty.call(currentHeaders, rtKey)) {
            const nextHeaders = { ...currentHeaders };
            delete nextHeaders[rtKey];
            component.set('custom-headers', nextHeaders);
        }

        if (Array.isArray(currentData) && currentData.length) {
            const nextData = currentData.map(row => {
                const nextRow = { ...(row || {}) };
                delete nextRow[rtKey];
                return nextRow;
            });
            component.set('custom-data', nextData);
        }

        component.updateTableHTML();

        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        updateActiveRunningTotalsList(component);
        document.getElementById('rt-config-panel').innerHTML = '<p style="color: #666; text-align: center;">Select a column to configure running total</p>';

        alert('Running total removed');

        initializeRunningTotalTab(component);
    }

    function updateActiveRunningTotalsList(component) {
        const runningTotals = component.get('running-totals') || [];
        const activeList = document.getElementById('rt-active-list');
        if (runningTotals.length === 0) {
            activeList.innerHTML = '<p style="color: #999; text-align: center;">No running totals configured</p>';
            return;
        }
        activeList.innerHTML = runningTotals.map(rt => `
            <div class="rt-active-item" data-key="${rt.columnKey}" style="padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>${rt.columnName}</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">
                        Operation: ${rt.operation} | Evaluate: ${rt.evaluate}
                    </div>
                </div>
                <button class="rt-remove-active" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
            </div>
        `).join('');

        activeList.querySelectorAll('.rt-remove-active').forEach(btn => {
            btn.addEventListener('click', function () {
                const columnKey = this.closest('.rt-active-item').getAttribute('data-key');
                removeRunningTotal(component, columnKey);
            });
        });
    }

    function applyRunningTotalsToTable(component) {
        const runningTotals = component.get('running-totals') || [];
        const baseData = component.get('table-data') || [];
        const baseHeaders = component.get('table-headers') || {};

        if (runningTotals.length === 0) {
            component.set('custom-headers', null);
            component.set('custom-data', null);
            component.updateTableHTML();
            return;
        }

        if (baseData.length === 0) return;
        const updatedHeaders = { ...baseHeaders };
        let updatedData = baseData.map(row => ({ ...row }));
        runningTotals.forEach(rt => {
            const newColumnKey = `${rt.columnKey}_running_total`;
            updatedHeaders[newColumnKey] = `${baseHeaders[rt.columnKey]} (RT)`;
            let accumulator = 0;
            let count = 0;
            let distinctValues = new Set();
            let values = [];
            let previousGroupValue = null;
            let sumForAverage = 0;

            if (rt.operation === 'product') {
                accumulator = 1;
            } else if (rt.operation === 'min') {
                accumulator = Infinity;
            } else if (rt.operation === 'max') {
                accumulator = -Infinity;
            }

            updatedData = updatedData.map((row, idx) => {
                if (rt.reset === 'on-change-of' && rt.resetField && idx > 0) {
                    if (row[rt.resetField] !== updatedData[idx - 1][rt.resetField]) {
                        accumulator = rt.operation === 'product' ? 1 :
                            rt.operation === 'min' ? Infinity :
                                rt.operation === 'max' ? -Infinity : 0;
                        count = 0;
                        distinctValues = new Set();
                        values = [];
                        sumForAverage = 0;
                    }
                }

                let shouldEvaluate = true;
                if (rt.evaluate === 'on-change-of' && rt.evaluateField) {
                    shouldEvaluate = row[rt.evaluateField] !== previousGroupValue;
                    previousGroupValue = row[rt.evaluateField];
                }

                if (shouldEvaluate) {
                    const value = parseFloat(row[rt.columnKey]) || 0;
                    count++;
                    distinctValues.add(row[rt.columnKey]);
                    values.push(value);
                    sumForAverage += value;

                    switch (rt.operation) {
                        case 'sum':
                            accumulator += value;
                            break;
                        case 'count':
                            accumulator = count;
                            break;
                        case 'distinct-count':
                            accumulator = distinctValues.size;
                            break;
                        case 'average':
                            accumulator = sumForAverage / count;
                            break;
                        case 'max':
                            accumulator = Math.max(accumulator, value);
                            break;
                        case 'min':
                            accumulator = Math.min(accumulator, value);
                            break;
                        case 'product':
                            accumulator *= value;
                            break;
                        case 'std-dev':
                            const mean = sumForAverage / count;
                            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
                            accumulator = Math.sqrt(variance);
                            break;
                        case 'variance':
                            const avg = sumForAverage / count;
                            accumulator = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / count;
                            break;
                        case 'weighted-avg':
                            accumulator = sumForAverage / count;
                            break;
                    }
                }

                let formattedValue;
                if (rt.operation === 'count' || rt.operation === 'distinct-count') {
                    formattedValue = accumulator.toString();
                } else {
                    formattedValue = accumulator.toFixed(2);
                }

                row[newColumnKey] = formattedValue;
                return row;
            });
        });

        component.set('custom-headers', updatedHeaders);
        component.set('custom-data', updatedData);
        component.updateTableHTML();
    }
    function initializeTableStyleManager(component) {
        const borderStyle = document.getElementById('border-style');
        const borderWidth = document.getElementById('border-width');
        const borderColor = document.getElementById('border-color');
        const borderOpacity = document.getElementById('border-opacity');
        const bgColor = document.getElementById('bg-color');
        const textColor = document.getElementById('text-color');
        const fontFamily = document.getElementById('font-family');
        const textAlign = document.getElementById('text-align');
        const verticalAlign = document.getElementById('vertical-align');
        const topNValue = document.getElementById('top-n-value');

        if (borderStyle) borderStyle.value = component.get('table-border-style') || 'solid';
        if (borderWidth) borderWidth.value = component.get('table-border-width') || '1';
        if (borderColor) borderColor.value = component.get('table-border-color') || '#000000';
        if (borderOpacity) borderOpacity.value = component.get('table-border-opacity') || '100';
        if (bgColor) bgColor.value = component.get('table-bg-color') || '#ffffff';
        if (textColor) textColor.value = component.get('table-text-color') || '#000000';
        if (fontFamily) fontFamily.value = component.get('table-font-family') || 'Arial, sans-serif';
        if (textAlign) textAlign.value = component.get('table-text-align') || 'left';
        if (verticalAlign) verticalAlign.value = component.get('table-vertical-align') || 'middle';
        if (topNValue) topNValue.value = component.get('top-n-value') || '10';

        const opacitySlider = document.getElementById('border-opacity');
        const opacityValue = document.getElementById('opacity-value');
        opacitySlider.addEventListener('input', function () {
            opacityValue.textContent = this.value + '%';
        });

        document.getElementById('apply-styles').addEventListener('click', function () {
            component.set('table-border-style', document.getElementById('border-style').value);
            component.set('table-border-width', document.getElementById('border-width').value);
            component.set('table-border-color', document.getElementById('border-color').value);
            component.set('table-border-opacity', document.getElementById('border-opacity').value);
            component.set('table-bg-color', document.getElementById('bg-color').value);
            component.set('table-text-color', document.getElementById('text-color').value);
            component.set('table-font-family', document.getElementById('font-family').value);
            component.set('table-text-align', document.getElementById('text-align').value);
            component.set('table-vertical-align', document.getElementById('vertical-align').value);

            component.applyTableStyles();
            editor.Modal.close();
        });

        document.getElementById('reset-styles').addEventListener('click', function () {
            document.getElementById('border-style').value = 'solid';
            document.getElementById('border-width').value = '1';
            document.getElementById('border-color').value = '#000000';
            document.getElementById('border-opacity').value = '100';
            document.getElementById('bg-color').value = '#ffffff';
            document.getElementById('text-color').value = '#000000';
            document.getElementById('font-family').value = 'Arial, sans-serif';
            document.getElementById('text-align').value = 'left';
            document.getElementById('vertical-align').value = 'middle';
            const opacityValue = document.getElementById('opacity-value');
            if (opacityValue) opacityValue.textContent = '100%';
        });

        document.getElementById('cancel-styles').addEventListener('click', function () {
            editor.Modal.close();
        });
    }
    function initializeTableConditionManager(component, conditions) {
        const conditionTypeSelect = document.getElementById('condition-type');
        const conditionValueInput = document.getElementById('condition-value');
        const caseSensitiveCheckbox = document.getElementById('case-sensitive');
        const singleValueInput = document.getElementById('single-value-input');
        const rangeInputs = document.getElementById('range-inputs');
        const minValueInput = document.getElementById('min-value');
        const maxValueInput = document.getElementById('max-value');
        const addConditionBtn = document.getElementById('add-condition-btn');
        const conditionsList = document.getElementById('conditions-list');
        const closeBtn = document.getElementById('close-manager-btn');
        const applyBtn = document.getElementById('apply-conditions-btn');
        const bgColorInput = document.getElementById('highlight-bg-color');
        const textColorInput = document.getElementById('highlight-text-color');
        const fontFamilySelect = document.getElementById('highlight-font-family');
        bgColorInput.value = component.get('highlight-color') || '#ffff99';
        textColorInput.value = component.get('highlight-text-color') || '#000000';
        fontFamilySelect.value = component.get('highlight-font-family') || '';
        const fontSizeInput = document.getElementById('highlight-font-size');
        fontSizeInput.value = component.get('highlight-font-size') || '14';

        conditionTypeSelect.addEventListener('change', function () {
            const selectedType = this.value;
            const isTextCondition = ['contains', 'starts-with', 'ends-with', 'exact', 'once-if'].includes(selectedType);

            caseSensitiveCheckbox.style.display = isTextCondition ? 'block' : 'none';
            caseSensitiveCheckbox.parentElement.style.display = isTextCondition ? 'block' : 'none';

            if (selectedType === 'between') {
                singleValueInput.style.display = 'none';
                rangeInputs.style.display = 'block';
            } else if (selectedType === 'null') {
                singleValueInput.style.display = 'none';
                rangeInputs.style.display = 'none';
            } else {
                singleValueInput.style.display = 'block';
                rangeInputs.style.display = 'none';
            }
        });

        addConditionBtn.addEventListener('click', function () {
            const type = conditionTypeSelect.value;
            if (!type) {
                alert('Please select a condition type');
                return;
            }

            let condition = {
                type,
                caseSensitive: caseSensitiveCheckbox.checked,
                textColor: textColorInput.value,
                fontFamily: fontFamilySelect.value,
                fontSize: fontSizeInput.value
            };

            if (type === 'between') {
                const minVal = minValueInput.value;
                const maxVal = maxValueInput.value;
                if (!minVal || !maxVal) {
                    alert('Please enter both min and max values');
                    return;
                }
                condition.minValue = minVal;
                condition.maxValue = maxVal;
            } else if (type !== 'null') {
                const value = conditionValueInput.value;
                if (!value) {
                    alert('Please enter a value');
                    return;
                }
                condition.value = value;
            }

            component.addHighlightCondition(condition);
            component.set('highlight-color', bgColorInput.value);
            component.set('highlight-text-color', textColorInput.value);
            component.set('highlight-font-family', fontFamilySelect.value);
            refreshConditionsList(component);
            conditionTypeSelect.value = '';
            conditionValueInput.value = '';
            minValueInput.value = '';
            maxValueInput.value = '';
            caseSensitiveCheckbox.checked = false;
            singleValueInput.style.display = 'block';
            rangeInputs.style.display = 'none';
            caseSensitiveCheckbox.parentElement.style.display = 'none';
        });

        closeBtn.addEventListener('click', function () {
            editor.Modal.close();
        });

        applyBtn.addEventListener('click', function () {
            component.set('highlight-color', bgColorInput.value);
            component.set('highlight-text-color', textColorInput.value);
            component.set('highlight-font-family', fontFamilySelect.value);
            component.set('highlight-font-size', fontSizeInput.value);
            component.handleHighlightChange();
            editor.Modal.close();
        });

        function refreshConditionsList(component) {
            const conditions = component.getHighlightConditions();

            if (conditions.length === 0) {
                conditionsList.innerHTML = '<p style="color: #666;">No conditions added yet.</p>';
                return;
            }

            let html = '';
            conditions.forEach((condition, index) => {
                let conditionText = '';
                const caseSensitive = condition.caseSensitive ? ' (Case Sensitive)' : '';

                if (condition.type === 'between') {
                    conditionText = `Between ${condition.minValue} and ${condition.maxValue}`;
                } else if (condition.type === 'null') {
                    conditionText = 'Null/Empty cells';
                } else {
                    conditionText = `${condition.type}: ${condition.value}${caseSensitive}`;
                }

                html += `
                    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${conditionText}</span>
                        <button onclick="removeCondition(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Remove</button>
                    </div>`;
                        });
            conditionsList.innerHTML = html;
        }

        window.removeCondition = function (index) {
            component.removeHighlightCondition(index);
            refreshConditionsList(component);
        };
        refreshConditionsList(component);
    }

    editor.Commands.add('open-json-table-suggestion', {
        run(editor, sender) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            let fileIndex = selected.get('json-file-index') || '0';
            if (fileIndex === '0') {
                alert('Please select a JSON file first');
                return;
            }

            const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
            const selectedFile = fileNames[parseInt(fileIndex) - 1];
            const jsonString = localStorage.getItem(`common_json_${selectedFile}`);

            if (!jsonString) {
                alert('Selected JSON file not found');
                return;
            }

            const commonJson = JSON.parse(jsonString);
            const topLevelKeys = Object.keys(commonJson);

            let modalContent = `
                <div class="new-table-form">
                <div style="padding-bottom:10px">
                    <input type="text" id="searchInput" placeholder="Search json">
                </div>
                <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
                `;

            topLevelKeys.forEach(key => {
                modalContent += `<div class="suggestion language-option" data-value="${key}" data-type="language">${key}</div>`;
            });

            modalContent += `
                </div>
                </div>
            `;

            editor.Modal.setTitle('Datasource Suggestion');
            editor.Modal.setContent(modalContent);
            editor.Modal.open();

            document.getElementById("searchInput").addEventListener("input", function () {
                filterSuggestions(this.value);
            });

            const suggestionItems = document.querySelectorAll('.suggestion');
            suggestionItems.forEach(item => {
                item.addEventListener('click', function () {
                    const selectedValue = this.getAttribute('data-value');
                    const dataType = this.getAttribute('data-type');

                    if (dataType === 'language') {
                        showTableLanguageKeys(selectedValue, commonJson, selected);
                    }
                });
            });
        }
    });

    function showTableLanguageKeys(language, commonJson, selectedComponent) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        let modalContent = `
            <div class="new-table-form">
            <div style="padding-bottom:10px">
                <button id="backBtn" style="margin-right: 10px;">← Back</button>
                <input type="text" id="searchInput" placeholder="Search json">
            </div>
            <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
            `;

        metaDataKeys.forEach(key => {
            const fullPath = `${language}.${key}`;
            modalContent += `<div class="suggestion" data-value="${fullPath}" data-type="key">${key}</div>`;
        });

        modalContent += `
            </div>
            </div>
            `;

        editor.Modal.setContent(modalContent);

        document.getElementById("backBtn").addEventListener("click", function () {
            editor.Commands.run('open-json-table-suggestion');
        });

        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                selectedComponent.set('json-path', selectedValue);
                const jsonPathTrait = selectedComponent.getTrait('json-path');
                if (jsonPathTrait) {
                    jsonPathTrait.set('value', selectedValue);
                    setTimeout(() => {
                        if (jsonPathTrait.view && jsonPathTrait.view.render) {
                            jsonPathTrait.view.render();
                        }
                        selectedComponent.trigger('change:json-path');
                    }, 50);
                }

                editor.Modal.close();
            });
        });
    }
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
    function filterSuggestions(query) {
        const suggestionResults = document.querySelector('.suggestion-results');
        const metaDataKeys = Array.from(suggestionResults.children);
        metaDataKeys.forEach(key => {
            if (key.textContent.toLowerCase().includes(query.toLowerCase())) {
                key.style.display = "block";
            } else {
                key.style.display = "none";
            }
        });
    }

    editor.Commands.add('add-table-row', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.addRow();
            }
        }
    });

    editor.Commands.add('add-table-column', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.addColumn();
            }
        }
    });

    editor.Commands.add('remove-table-row', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.removeRow();
            }
        }
    });

    editor.Commands.add('remove-table-column', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.removeColumn();
            }
        }
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
}
