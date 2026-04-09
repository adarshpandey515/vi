!(function (e, t) {
    "object" == typeof exports && "object" == typeof module
        ? (module.exports = t())
        : "function" == typeof define && define.amd
            ? define([], t)
            : "object" == typeof exports
                ? (exports["video-forms-component"] = t())
                : (e["video-forms-component"] = t());
})(
    "undefined" != typeof globalThis
        ? globalThis
        : "undefined" != typeof window
            ? window
            : this,
    () =>
        (() => {
            "use strict";
            var e = {
                d: (t, n) => {
                    for (var o in n)
                        e.o(n, o) &&
                            !e.o(t, o) &&
                            Object.defineProperty(t, o, { enumerable: !0, get: n[o] });
                },
                o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
                r: (e) => {
                    "undefined" != typeof Symbol &&
                        Symbol.toStringTag &&
                        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
                        Object.defineProperty(e, "__esModule", { value: !0 });
                },
            },
                t = {};
            e.r(t), e.d(t, { default: () => m });
            var n = "video-form",
                o = "video-input",
                a = "video-textarea",
                i = "video-select",
                s = "video-checkbox",
                r = "video-radio",
                p = "video-button",
                c = "video-label",
                l = "video-option",
                customInput = "video-custom-input",
                customInputButton = "video-custom-input-button",
                customInputDropzone = "video-custom-input-dropzone";

            var d =
                (void 0 && (void 0).__assign) ||
                function () {
                    return (
                        (d =
                            Object.assign ||
                            function (e) {
                                for (var t, n = 1, o = arguments.length; n < o; n++)
                                    for (var a in (t = arguments[n]))
                                        Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
                                return e;
                            }),
                        d.apply(this, arguments)
                    );
                };
            var u =
                (void 0 && (void 0).__assign) ||
                function () {
                    return (
                        (u =
                            Object.assign ||
                            function (e) {
                                for (var t, n = 1, o = arguments.length; n < o; n++)
                                    for (var a in (t = arguments[n]))
                                        Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
                                return e;
                            }),
                        u.apply(this, arguments)
                    );
                };

            var apiHelpers = {
                loadExcelHeaders: function (component) {
                    var uploadId = localStorage.getItem('uploadedFileId');

                    if (!uploadId) {
                        alert('Please upload an Excel or CSV file first.');
                        component.set('input-type', 'none');
                        component.updateTraitsForInputType();
                        return;
                    }

                    var xhr = new XMLHttpRequest();
                    xhr.open(
                        'GET',
                        `${API_BASE_URL_Video}/excel/headers?uploadId=` + uploadId,
                        true
                    );

                    xhr.onload = function () {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                var response = JSON.parse(xhr.responseText);
                                var headers = response.map(function (header) {
                                    return { value: header, name: header };
                                });
                                headers.unshift({ value: "", name: "Select Header" });

                                component.set('excel-headers', headers);
                                component.updateTraitsForInputType();
                            } catch (e) {
                                console.error('Error parsing headers response:', e);
                            }
                        }
                    };

                    xhr.send();
                },

                loadUniqueValues: function (component, columnName) {
                    var uploadId = localStorage.getItem('uploadedFileId');

                    if (!uploadId || !columnName) return;
                    var xhr = new XMLHttpRequest();
                    xhr.open(
                        'GET',
                        `${API_BASE_URL_Video}/excel/unique-values?uploadId=` +
                        uploadId +
                        '&columnName=' +
                        encodeURIComponent(columnName),
                        true
                    );
                    xhr.onload = function () {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                var response = JSON.parse(xhr.responseText);
                                var uniqueValues = response.map(function (value) {
                                    return { value: value, name: value };
                                });
                                component.set('unique-values', uniqueValues);
                                if (component.get('tagName') === 'select') {
                                    component.set('selected-values', []);
                                    component.updateTraitsForInputType();
                                } else {
                                    component.updateTraitsForInputType();
                                }
                            } catch (e) {
                                console.error('Error parsing unique values response:', e);
                            }
                        } else {
                            console.error('Failed to load unique values:', xhr.status, xhr.responseText);
                        }
                    };

                    xhr.onerror = function () {
                        console.error('Network error loading unique values');
                    };

                    xhr.send();
                }
            };

            const m = function (e, t) {
                void 0 === t && (t = {});
                var m = u(
                    {
                        blocks: [
                            "video-form",
                            "video-input",
                            "video-textarea",
                            "video-select",
                            "video-button",
                            "video-label",
                            "video-checkbox",
                            "video-radio",
                            "video-custom-input",
                        ],
                        category: { id: "forms1", label: "Video-Forms" },
                        block: function () {
                            return {};
                        },
                    },
                    t
                );
                !(function (e) {
                    var t = e.Components,
                        d = { name: "name" },
                        u = { name: "placeholder" },
                        m = { type: "checkbox", name: "required" },
                        h = function (e, t) {
                            return { type: l, content: t, attributes: { value: e } };
                        },
                        v = function (t) {
                            e.Commands.isActive("preview") || t.preventDefault();
                        };

                    var createInputTypeTraitsWithValue = function (originalTraits) {
                        return function () {
                            var inputType = this.get('input-type');
                            var baseTraits = [
                                {
                                    type: "select",
                                    name: "input-type",
                                    label: "Input Type",
                                    options: [
                                        { value: "none", name: "None" },
                                        { value: "api", name: "API" },
                                    ],
                                    changeProp: true
                                }
                            ];

                            if (inputType === 'api') {
                                var apiTraits = originalTraits.filter(function (trait) {
                                    return trait.name !== 'name' && trait.name !== 'value';
                                });

                                baseTraits.push(
                                    {
                                        type: "select",
                                        name: "name",
                                        label: "Name",
                                        options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                                        changeProp: true
                                    },
                                    {
                                        type: "select",
                                        name: "value",
                                        label: "Value",
                                        options: this.get('unique-values') || [{ value: "", name: "Select header first..." }],
                                        changeProp: true
                                    }
                                );

                                baseTraits = baseTraits.concat(apiTraits);

                                if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                                    apiHelpers.loadExcelHeaders(this);
                                }
                            } else {
                                baseTraits = baseTraits.concat(originalTraits);
                            }

                            this.set('traits', baseTraits);
                        };
                    };

                    var createInputTypeTraitsWithoutValue = function (originalTraits) {
                        return function () {
                            var inputType = this.get('input-type');
                            var baseTraits = [
                                {
                                    type: "select",
                                    name: "input-type",
                                    label: "Input Type",
                                    options: [
                                        { value: "none", name: "None" },
                                        { value: "api", name: "API" },
                                    ],
                                    changeProp: true
                                }
                            ];

                            if (inputType === 'api') {
                                var apiTraits = originalTraits.filter(function (trait) {
                                    return trait.name !== 'name';
                                });

                                baseTraits.push({
                                    type: "select",
                                    name: "name",
                                    label: "Name",
                                    options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                                    changeProp: true
                                });

                                baseTraits = baseTraits.concat(apiTraits);

                                if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                                    apiHelpers.loadExcelHeaders(this);
                                }
                            } else {
                                baseTraits = baseTraits.concat(originalTraits);
                            }

                            this.set('traits', baseTraits);
                        };
                    };

                    var initApiComponentWithValue = function () {
                        this.on('change:input-type', this.updateTraitsForInputType);
                        this.on('change:name', function () {
                            var inputType = this.get('input-type');
                            var selectedName = this.get('name');

                            if (inputType === 'api' && selectedName) {
                                this.addAttributes({ name: selectedName });
                                apiHelpers.loadUniqueValues(this, selectedName);
                            }
                        });

                        this.on('change:value', function () {
                            var inputType = this.get('input-type');
                            var selectedValue = this.get('value');
                            if (inputType === 'api' && selectedValue) {
                                this.addAttributes({ value: selectedValue });
                            }
                        });

                        this.updateTraitsForInputType();
                    };

                    var initApiComponentWithoutValue = function () {
                        this.on('change:input-type', this.updateTraitsForInputType);
                        this.on('change:name', function () {
                            var inputType = this.get('input-type');
                            var selectedName = this.get('name');
                            if (inputType === 'api' && selectedName) {
                                this.addAttributes({ name: selectedName });
                            }
                        });

                        this.updateTraitsForInputType();
                    };

                    t.addType(customInputButton, {
                        isComponent: function (e) {
                            return e.getAttribute && e.getAttribute('data-gjs-type') === customInputButton;
                        },
                        model: {
                            defaults: {
                                tagName: "button",
                                attributes: {
                                    type: "button",
                                    'data-gjs-type': customInputButton,
                                    'data-custom-input-button': true
                                },
                                text: "Button",
                                name: "",
                                value: "",
                                'input-type': 'none',
                                'excel-headers': [],
                                'unique-values': [],
                                droppable: false,
                                draggable: function (component, target) {
                                    if (target && target.get('type') === customInputDropzone) {
                                        var buttonName = component.get('name');
                                        var dropzoneName = target.get('name');
                                        return buttonName === dropzoneName;
                                    }
                                    return false;
                                },
                                traits: [
                                    {
                                        type: "select",
                                        name: "input-type",
                                        label: "Input Type",
                                        options: [
                                            { value: "none", name: "None" },
                                            { value: "api", name: "API" },
                                        ],
                                        changeProp: true
                                    },
                                    { name: "text", changeProp: true, label: "Display Text" },
                                    { name: "id" },
                                    { name: "name", label: "Name" },
                                    { name: "value", label: "Value" }
                                ],
                            },
                            init: function () {
                                var component = this;
                                var e = this.components(),
                                    t = 1 === e.length && e.models[0],
                                    n = (t && t.is("textnode") && t.get("content")) || "",
                                    o = n || this.get("text");
                                this.set("text", o),
                                    this.on("change:text", this.__onTextChange),
                                    o !== n && this.__onTextChange();

                                this.on('change:input-type', this.updateTraitsForInputType);
                                this.on('change:name', function () {
                                    var inputType = this.get('input-type');
                                    var selectedName = this.get('name');

                                    if (inputType === 'api' && selectedName) {
                                        this.addAttributes({ name: selectedName });
                                        apiHelpers.loadUniqueValues(this, selectedName);
                                    } else if (inputType === 'none' && selectedName) {
                                        this.addAttributes({ name: selectedName });
                                    }
                                });

                                this.on('change:value', function () {
                                    var selectedValue = this.get('value');
                                    if (selectedValue) {
                                        this.addAttributes({ value: selectedValue });
                                    }
                                });

                                this.updateTraitsForInputType();
                            },
                            updateTraitsForInputType: createInputTypeTraitsWithValue([
                                { name: "text", changeProp: true, label: "Display Text" },
                                { name: "id" },
                                { name: "name", label: "Name" },
                                { name: "value", label: "Value" }
                            ]),
                            __onTextChange: function () {
                                this.components(this.get("text"));
                            },
                        },
                        view: {
                            events: {
                                click: v,
                                dblclick: 'onDoubleClick'
                            },
                            onDoubleClick: function (e) {
                                e.preventDefault();
                                if (e.detail === 2) {
                                    var currentText = this.model.get('text') || 'Button';
                                    var newText = prompt('Enter button text:', currentText);
                                    if (newText !== null && newText !== currentText) {
                                        this.model.set('text', newText);
                                    }
                                }
                            }
                        },
                    });

                    t.addType(customInputDropzone, {
                        isComponent: function (e) {
                            return e.getAttribute && e.getAttribute('data-gjs-type') === customInputDropzone;
                        },
                        model: {
                            defaults: {
                                tagName: "input",
                                attributes: {
                                    type: "text",
                                    readonly: true,
                                    placeholder: "Drop input here",
                                    'data-gjs-type': customInputDropzone,
                                    'data-custom-dropzone': true
                                },
                                'input-type': 'none',
                                'excel-headers': [],
                                droppable: function (component) {
                                    if (component.get('type') === customInputButton) {
                                        var buttonName = component.get('name');
                                        var dropzoneName = this.get('name');
                                        return buttonName === dropzoneName;
                                    }
                                    return false;
                                },
                                traits: [
                                    {
                                        type: "select",
                                        name: "input-type",
                                        label: "Input Type",
                                        options: [
                                            { value: "none", name: "None" },
                                            { value: "api", name: "API" },
                                        ],
                                        changeProp: true
                                    },
                                    { name: "name", label: "Name" },
                                    { name: "id" },
                                    { name: "placeholder" }
                                ],
                            },
                            init: function () {
                                this.on('component:add', this.onComponentAdd);
                                this.on('change:input-type', this.updateTraitsForInputType);
                                this.on('change:name', function () {
                                    var inputType = this.get('input-type');
                                    var selectedName = this.get('name');

                                    if (inputType === 'api' && selectedName) {
                                        this.addAttributes({ name: selectedName });
                                    } else if (inputType === 'none' && selectedName) {
                                        this.addAttributes({ name: selectedName });
                                    }
                                });

                                this.updateTraitsForInputType();
                            },
                            updateTraitsForInputType: createInputTypeTraitsWithoutValue([
                                { name: "name", label: "Name" },
                                { name: "id" },
                                { name: "placeholder" }
                            ]),
                            onComponentAdd: function (component) {
                                if (component.get('type') === customInputButton) {
                                    var buttonName = component.get('name');
                                    var dropzoneName = this.get('name');

                                    if (buttonName !== dropzoneName) {
                                        alert('Error: Button name "' + buttonName + '" does not match dropzone name "' + dropzoneName + '"');
                                        component.remove();
                                        return;
                                    }

                                    var existing = this.components().models.filter(function (comp) {
                                        return comp.get('type') === customInputButton;
                                    });

                                    if (existing.length > 1) {

                                        for (var i = 0; i < existing.length - 1; i++) {
                                            existing[i].remove();
                                        }
                                    }

                                    var buttonValue = component.get('value') || '';
                                    this.addAttributes({ value: buttonValue });

                                    var parent = this.parent();
                                    if (parent && parent.get('type') === customInput) {
                                        parent.trigger('dropzone:updated');
                                    }
                                }
                            }
                        },
                        view: {
                            init: function () {
                                this.listenTo(this.model, 'component:add', this.render);
                                this.listenTo(this.model, 'component:remove', this.render);
                            }
                        }
                    });

                    t.addType(customInput, {
                        isComponent: function (e) {
                            return e.getAttribute && e.getAttribute('data-gjs-type') === customInput;
                        },
                        model: {
                            defaults: {
                                tagName: "div",
                                attributes: {
                                    'data-gjs-type': customInput,
                                    'data-custom-input': true
                                },
                                components: [
                                    {
                                        type: customInputButton,
                                        attributes: { 'data-custom-input-button': true },
                                        text: "Button 1",
                                        value: "value1"
                                    },
                                    {
                                        type: customInputButton,
                                        attributes: { 'data-custom-input-button': true },
                                        text: "Button 2",
                                        value: "value2"
                                    },
                                    {
                                        type: customInputDropzone,
                                        attributes: { 'data-custom-dropzone': true },
                                        name: "custom_input_1"
                                    }
                                ],
                                droppable: function (component) {
                                    return component.get('type') === customInputButton;
                                },
                                traits: [
                                    { name: "id" },
                                    {
                                        type: "video-button-trait",
                                        name: "add-button",
                                        label: "Add Button",
                                        text: "Add Button",
                                        command: function (editor, trait, component) {
                                            component.addNewButton();
                                        }
                                    }
                                ],
                            },
                            init: function () {
                                this.on('component:add', this.onComponentAdd);
                                this.on('dropzone:updated', this.onDropzoneUpdated);
                            },
                            addNewButton: function () {
                                var buttonCount = this.components().models.filter(function (comp) {
                                    return comp.get('type') === customInputButton;
                                }).length;

                                var newButton = {
                                    type: customInputButton,
                                    attributes: { 'data-custom-input-button': true },
                                    text: "Button " + (buttonCount + 1),
                                    value: "value" + (buttonCount + 1)
                                };

                                var dropzoneIndex = -1;
                                this.components().models.forEach(function (comp, index) {
                                    if (comp.get('type') === customInputDropzone) {
                                        dropzoneIndex = index;
                                    }
                                });

                                if (dropzoneIndex >= 0) {
                                    this.components().add(newButton, { at: dropzoneIndex });
                                } else {
                                    this.components().add(newButton);
                                }
                            },
                            onComponentAdd: function (component) {
                                if (component.get('type') === customInputButton) {
                                    var dropzone = this.components().models.find(function (comp) {
                                        return comp.get('type') === customInputDropzone;
                                    });

                                    if (dropzone) {
                                        var dropzoneIndex = this.components().indexOf(dropzone);
                                        var componentIndex = this.components().indexOf(component);

                                        if (componentIndex > dropzoneIndex) {
                                            this.components().remove(component, { silent: true });
                                            this.components().add(component, { at: dropzoneIndex, silent: true });
                                        }
                                    }
                                }
                            },
                            onDropzoneUpdated: function () {
                            }
                        },
                        view: {
                            init: function () {
                                this.listenTo(this.model, 'component:add', this.render);
                                this.listenTo(this.model, 'component:remove', this.render);
                            }
                        }
                    });

                    t.addType(n, {
                        isComponent: function (e) {
                            return "FORM" == e.tagName;
                        },
                        model: {
                            defaults: {
                                tagName: "form",
                                droppable: ":not(form)",
                                draggable: ":not(form)",
                                attributes: { method: "get" },
                                'action-type': 'none',
                                traits: [
                                    {
                                        type: "select",
                                        name: "method",
                                        options: [
                                            { value: "get", name: "GET" },
                                            { value: "post", name: "POST" },
                                        ],
                                    },
                                    { name: "action" },
                                ],
                            },
                            init: function () {
                                this.on('change:attributes:method', this.updateTraits);
                                this.on('change:action-type', this.updateActionAttribute);
                                this.updateTraits();
                            },
                            updateTraits: function () {
                                var method = this.get('attributes').method;
                                var actionType = this.get('action-type');
                                var baseTraits = [
                                    {
                                        type: "select",
                                        name: "method",
                                        options: [
                                            { value: "get", name: "GET" },
                                            { value: "post", name: "POST" },
                                        ],
                                    }
                                ];

                                if (method === 'post') {
                                    baseTraits.push({
                                        type: "select",
                                        name: "action-type",
                                        label: "Action Type",
                                        options: [
                                            { value: "none", name: "None" },
                                            { value: "api", name: "API Call" },
                                        ],
                                        changeProp: true
                                    });

                                    if (actionType !== 'api') {
                                        baseTraits.push({ name: "action" });
                                    }
                                } else {
                                    baseTraits.push({ name: "action" });
                                    this.set('action-type', 'none');
                                }

                                this.set('traits', baseTraits);
                            },
                            updateActionAttribute: function () {
                                var actionType = this.get('action-type');
                                var method = this.get('attributes').method;

                                if (method === 'post' && actionType === 'api') {
                                    var Id = localStorage.getItem('uploadedFileId');
                                    if (!Id) {
                                        alert('Please upload an Excel or CSV file first.');
                                        return;
                                    }

                                    var apiAction = `${API_BASE_URL_Video}/excel/query-full-row-form/` + Id;
                                    this.addAttributes({ action: apiAction });
                                } else if (actionType === 'none') {
                                    var currentAction = this.get('attributes').action || '';
                                    if (currentAction.includes(`${API_BASE_URL_Video}/excel`)) {
                                        this.addAttributes({ action: '' });
                                    }
                                }
                            }
                        },
                        view: {
                            events: {
                                submit: function (e) {
                                    e.preventDefault();
                                    if (!this.em || this.em.get('Commands').isActive('preview')) {
                                        this.handleFormSubmit(e);
                                    }
                                },
                            },
                            onRender: function () {
                                if (!document.querySelector('#drag-drop-script')) {
                                    var script = document.createElement('script');
                                    script.id = 'drag-drop-script';
                                    script.innerHTML = `
                                        document.addEventListener('DOMContentLoaded', function() {
                                        
                                        const buttons = document.querySelectorAll('[data-custom-input-button="true"]');
                                        buttons.forEach(button => {
                                            button.setAttribute('draggable', 'true');
                                            
                                            button.addEventListener('dragstart', function(e) {
                                            const buttonData = {
                                                id: this.id,
                                                name: this.getAttribute('name') || '',
                                                value: this.getAttribute('value') || this.innerText,
                                                type: 'button'
                                            };
                                            
                                            e.dataTransfer.setData('text/plain', JSON.stringify(buttonData));
                                            e.dataTransfer.effectAllowed = 'copy';
                                            this.style.opacity = '0.7';
                                            });
                                            
                                            button.addEventListener('dragend', function(e) {
                                            this.style.opacity = '';
                                            });
                                        });
                                        
                                        const dropzones = document.querySelectorAll('[data-custom-dropzone="true"]');
                                        dropzones.forEach(dropzone => {
                                            dropzone.addEventListener('dragover', function(e) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'copy';
                                            this.style.backgroundColor = '#e3f2fd';
                                            this.style.borderColor = '#2196f3';
                                            });
                                            
                                            dropzone.addEventListener('dragleave', function(e) {
                                            if (!this.contains(e.relatedTarget)) {
                                                this.style.backgroundColor = '';
                                                this.style.borderColor = '';
                                            }
                                            });
                                            
                                            dropzone.addEventListener('drop', function(e) {
                                            e.preventDefault();
                                            this.style.backgroundColor = '';
                                            this.style.borderColor = '';
                                            
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
                                                this.style.backgroundColor = '#c8e6c9';
                                                setTimeout(() => {
                                                    this.style.backgroundColor = '';
                                                }, 1000);
                                                }
                                            } catch (error) {
                                            }
                                            });
                                        });
                                        });
                                    `;
                                    document.head.appendChild(script);

                                    if (!document.querySelector('#drag-drop-css')) {
                                        var style = document.createElement('style');
                                        style.id = 'drag-drop-css';
                                        style.innerHTML = `
                                            [data-custom-input-button="true"] {
                                                cursor: grab;
                                                transition: all 0.2s ease;
                                                user-select: none;
                                            }
                                            [data-custom-input-button="true"]:hover {
                                                transform: scale(1.05);
                                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                            }
                                            [data-custom-dropzone="true"] {
                                                transition: all 0.2s ease;
                                                min-height: 40px;
                                                border: 2px dashed #ccc;
                                                padding: 10px;
                                                text-align: center;
                                            }
                                            `;
                                        document.head.appendChild(style);
                                    }
                                }
                            },

                            handleFormSubmit: function (e) {
                                var form = e.target;
                                var action = form.getAttribute('action');
                                var method = form.getAttribute('method') || 'GET';
                                var formData = new FormData(form);

                                var data = {};
                                formData.forEach(function (value, key) {
                                    data[key] = value;
                                });

                                if (action) {
                                    var xhr = new XMLHttpRequest();
                                    xhr.open(method.toUpperCase(), action, true);

                                    xhr.onload = function () {
                                        if (xhr.status >= 200 && xhr.status < 300) {
                                            form.dispatchEvent(new CustomEvent('formSubmitSuccess', {
                                                detail: { response: xhr.responseText }
                                            }));
                                        } else {
                                            form.dispatchEvent(new CustomEvent('formSubmitError', {
                                                detail: { status: xhr.status, response: xhr.responseText }
                                            }));
                                        }
                                    };

                                    xhr.onerror = function () {
                                        console.error('Network error during form submission');
                                    };

                                    if (method.toUpperCase() === 'POST') {
                                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                                        xhr.send(new URLSearchParams(data).toString());
                                    } else {
                                        xhr.send();
                                    }
                                }
                            }
                        },
                    }),
                        t.addType(o, {
                            isComponent: function (e) {
                                return "INPUT" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "input",
                                    droppable: !1,
                                    highlightable: !1,
                                    attributes: { type: "text" },
                                    'input-type': 'none',
                                    'excel-headers': [],
                                    'unique-values': [],
                                    traits: [
                                        {
                                            type: "select",
                                            name: "input-type",
                                            label: "Input Type",
                                            options: [
                                                { value: "none", name: "None" },
                                                { value: "api", name: "API" },
                                            ],
                                            changeProp: true
                                        },
                                        d,
                                        u,
                                        {
                                            type: "select",
                                            name: "type",
                                            options: [
                                                { value: "text" },
                                                { value: "email" },
                                                { value: "password" },
                                                { value: "number" },
                                            ],
                                        },
                                        m,
                                    ],
                                },
                                init: initApiComponentWithoutValue,
                                updateTraitsForInputType: createInputTypeTraitsWithoutValue([d, u, {
                                    type: "select",
                                    name: "type",
                                    options: [
                                        { value: "text" },
                                        { value: "email" },
                                        { value: "password" },
                                        { value: "number" },
                                    ],
                                }, m])
                            },
                            extendFnView: ["updateAttributes"],
                            view: {
                                updateAttributes: function () {
                                    this.el.setAttribute("autocomplete", "off");
                                },
                            },
                        }),
                        t.addType(a, {
                            extend: o,
                            isComponent: function (e) {
                                return "TEXTAREA" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "textarea",
                                    attributes: {},
                                    'input-type': 'none',
                                    'excel-headers': [],
                                    'unique-values': [],
                                    traits: [
                                        {
                                            type: "select",
                                            name: "input-type",
                                            label: "Input Type",
                                            options: [
                                                { value: "none", name: "None" },
                                                { value: "api", name: "API" },
                                            ],
                                            changeProp: true
                                        },
                                        d,
                                        u,
                                        m
                                    ],
                                },
                                init: initApiComponentWithoutValue,
                                updateTraitsForInputType: createInputTypeTraitsWithoutValue([d, u, m])
                            },
                        }),
                        t.addType(l, {
                            isComponent: function (e) {
                                return "OPTION" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "option",
                                    layerable: !1,
                                    droppable: !1,
                                    draggable: !1,
                                    highlightable: !1,
                                },
                            },
                        }),
                        t.addType(i, {
                            extend: o,
                            isComponent: function (e) {
                                return "SELECT" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "select",
                                    components: [h("opt1", "Option 1"), h("opt2", "Option 2")],
                                    'input-type': 'none',
                                    'excel-headers': [],
                                    'unique-values': [],
                                    'selected-values': [],
                                    traits: [
                                        {
                                            type: "select",
                                            name: "input-type",
                                            label: "Input Type",
                                            options: [
                                                { value: "none", name: "None" },
                                                { value: "api", name: "API" },
                                            ],
                                            changeProp: true
                                        },
                                        d,
                                        { name: "options", type: "select-options" },
                                        m
                                    ],
                                },
                                init: function () {
                                    this.on('change:input-type', this.updateTraitsForInputType);
                                    this.on('change:name', function () {
                                        var inputType = this.get('input-type');
                                        var selectedName = this.get('name');
                                        if (inputType === 'api' && selectedName) {
                                            this.addAttributes({ name: selectedName });
                                            this.set('selected-values', []);
                                            apiHelpers.loadUniqueValues(this, selectedName);
                                        }
                                    });

                                    this.on('change:unique-values', function () {
                                        var inputType = this.get('input-type');
                                        if (inputType === 'api') {
                                            this.updateTraitsForInputType();
                                            setTimeout(function () {
                                                if (this.em && this.em.get('TraitManager')) {
                                                    var traitManager = this.em.get('TraitManager');
                                                    if (traitManager.getTraitsViewer) {
                                                        var viewer = traitManager.getTraitsViewer();
                                                        if (viewer && viewer.render) {
                                                            viewer.render();
                                                        }
                                                    }
                                                }
                                            }.bind(this), 50);
                                        }
                                    });

                                    this.on('change:selected-values', function () {
                                        var inputType = this.get('input-type');

                                        if (inputType === 'api') {
                                            this.updateSelectOptions();
                                        }
                                    });

                                    this.updateTraitsForInputType();
                                },
                                updateTraitsForInputType: function () {
                                    var inputType = this.get('input-type');
                                    var baseTraits = [
                                        {
                                            type: "select",
                                            name: "input-type",
                                            label: "Input Type",
                                            options: [
                                                { value: "none", name: "None" },
                                                { value: "api", name: "API" },
                                            ],
                                            changeProp: true
                                        }
                                    ];

                                    if (inputType === 'api') {
                                        baseTraits.push(
                                            {
                                                type: "select",
                                                name: "name",
                                                label: "Name",
                                                options: this.get('excel-headers') || [{ value: "", name: "Loading headers..." }],
                                                changeProp: true
                                            },
                                            {
                                                type: "unique-values-selector",
                                                name: "selected-values",
                                                label: "Options",
                                                uniqueValues: this.get('unique-values') || [],
                                                changeProp: true
                                            },
                                            m
                                        );

                                        if (!this.get('excel-headers') || this.get('excel-headers').length === 0) {
                                            console.log('Loading Excel headers for select component');
                                            apiHelpers.loadExcelHeaders(this);
                                        }
                                    } else {
                                        baseTraits.push(
                                            d,
                                            { name: "options", type: "select-options" },
                                            m
                                        );
                                    }

                                    this.set('traits', baseTraits);

                                    if (this.em && this.em.get('TraitManager')) {
                                        var traitManager = this.em.get('TraitManager');
                                        if (traitManager.getTraitsViewer) {
                                            var viewer = traitManager.getTraitsViewer();
                                            if (viewer && viewer.updatedCollection) {
                                                viewer.updatedCollection();
                                            }
                                        }
                                    }
                                },
                                updateSelectOptions: function () {
                                    var selectedValues = this.get('selected-values') || [];
                                    var newOptions = [];

                                    for (var i = 0; i < selectedValues.length; i++) {
                                        var value = selectedValues[i];
                                        newOptions.push({
                                            type: l,
                                            content: value,
                                            attributes: { value: value }
                                        });
                                    }

                                    this.components().reset(newOptions);
                                    this.view && this.view.render();
                                }
                            },
                            view: { events: { mousedown: v } },
                        }),
                        t.addType(s, {
                            extend: o,
                            isComponent: function (e) {
                                return "INPUT" == e.tagName && "checkbox" == e.type;
                            },
                            model: {
                                defaults: {
                                    copyable: !1,
                                    attributes: { type: "checkbox" },
                                    'input-type': 'none',
                                    'excel-headers': [],
                                    'unique-values': [],
                                    traits: [
                                        {
                                            type: "select",
                                            name: "input-type",
                                            label: "Input Type",
                                            options: [
                                                { value: "none", name: "None" },
                                                { value: "api", name: "API" },
                                            ],
                                            changeProp: true
                                        },
                                        { name: "id" },
                                        d,
                                        { name: "value" },
                                        m,
                                        { type: "checkbox", name: "checked" },
                                    ],
                                },
                                init: initApiComponentWithValue,
                                updateTraitsForInputType: createInputTypeTraitsWithValue([{ name: "id" }, d, { name: "value" }, m, { type: "checkbox", name: "checked" }])
                            },
                            view: {
                                events: { click: v },
                                init: function () {
                                    this.listenTo(
                                        this.model,
                                        "change:attributes:checked",
                                        this.handleChecked
                                    );
                                },
                                handleChecked: function () {
                                    var e;
                                    this.el.checked = !!(null ===
                                        (e = this.model.get("attributes")) || void 0 === e
                                        ? void 0
                                        : e.checked);
                                },
                            },
                        }),
                        t.addType(r, {
                            extend: s,
                            isComponent: function (e) {
                                return "INPUT" == e.tagName && "radio" == e.type;
                            },
                            model: { defaults: { attributes: { type: "radio" } } },
                        }),
                        t.addType(p, {
                            extend: o,
                            isComponent: function (e) {
                                return "BUTTON" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "button",
                                    attributes: { type: "button" },
                                    text: "Send",
                                    traits: [
                                        { name: "text", changeProp: !0 },
                                        {
                                            type: "select",
                                            name: "type",
                                            options: [
                                                { value: "button" },
                                                { value: "submit" },
                                                { value: "reset" },
                                            ],
                                        },
                                    ],
                                },
                                init: function () {
                                    var e = this.components(),
                                        t = 1 === e.length && e.models[0],
                                        n = (t && t.is("textnode") && t.get("content")) || "",
                                        o = n || this.get("text");
                                    this.set("text", o),
                                        this.on("change:text", this.__onTextChange),
                                        o !== n && this.__onTextChange();
                                },
                                __onTextChange: function () {
                                    this.components(this.get("text"));
                                },
                            },
                            view: { events: { click: v } },
                        }),
                        t.addType(c, {
                            extend: "text",
                            isComponent: function (e) {
                                return "LABEL" == e.tagName;
                            },
                            model: {
                                defaults: {
                                    tagName: "label",
                                    components: "Label",
                                    traits: [
                                        { name: "for" }
                                    ],
                                },
                            },
                        });
                })(e),
                    (function (e) {
                        e.TraitManager.addType("select-options", {
                            events: { keyup: "onChange" },
                            onValueChange: function () {
                                for (
                                    var e = this.model,
                                    t = this.target,
                                    n = e.get("value").trim().split("\n"),
                                    o = [],
                                    a = 0;
                                    a < n.length;
                                    a++
                                ) {
                                    var i = n[a].split("::");
                                    o.push({
                                        type: l,
                                        components: i[1] || i[0],
                                        attributes: { value: i[0] },
                                    });
                                }
                                t.components().reset(o), t.view.render();
                            },
                            getInputEl: function () {
                                if (!this.$input) {
                                    for (
                                        var e = [], t = this.target.components(), n = 0;
                                        n < t.length;
                                        n++
                                    ) {
                                        var o = t.models[n],
                                            a = o.get("attributes").value || "",
                                            i = o.components().models[0],
                                            s = (i && i.get("content")) || "";
                                        e.push("".concat(a, "::").concat(s));
                                    }
                                    (this.$input = document.createElement("textarea")),
                                        (this.$input.value = e.join("\n"));
                                }
                                return this.$input;
                            },
                        });

                        e.TraitManager.addType("unique-values-selector", {
                            templateInput: function () {
                                return '<div class="unique-values-container"></div>';
                            },

                            onRender: function () {
                                this.updateContent();
                                this.listenTo(this.target, 'change:unique-values', function () {
                                    this.updateContent();
                                });
                            },

                            updateContent: function () {
                                var target = this.target;
                                var uniqueValues = target.get('unique-values') || [];
                                var selectedValues = target.get('selected-values') || [];
                                var container = this.el.querySelector('.unique-values-container');
                                if (!container) {
                                    return;
                                }

                                container.innerHTML = '';
                                container.style.cssText = 'max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; width: 72.5%; ';

                                if (uniqueValues.length === 0) {
                                    container.innerHTML = '<div style="padding: 10px;">Select a header first...</div>';
                                    return;
                                }

                                var trait = this;

                                uniqueValues.forEach(function (valueObj, index) {
                                    if (!valueObj.value) return;

                                    var checkboxContainer = document.createElement('div');
                                    checkboxContainer.style.cssText = 'display: flex; align-items: center; padding: 3px 0; justify-content: space-between;';

                                    var leftDiv = document.createElement('div');
                                    leftDiv.style.cssText = 'display: flex; align-items: center;';

                                    var checkbox = document.createElement('input');
                                    checkbox.type = 'checkbox';
                                    checkbox.value = valueObj.value;
                                    checkbox.id = 'checkbox_' + index;
                                    checkbox.style.cssText = 'margin-right: 5px;';

                                    checkbox.checked = selectedValues.indexOf(valueObj.value) !== -1;

                                    var label = document.createElement('label');
                                    label.htmlFor = checkbox.id;
                                    label.textContent = valueObj.name || valueObj.value;
                                    label.style.cssText = 'cursor: pointer; font-size: 12px;';

                                    leftDiv.appendChild(checkbox);
                                    leftDiv.appendChild(label);

                                    var numberSpan = document.createElement('span');
                                    numberSpan.style.cssText = 'background: #007cba;  border-radius: 10px; padding: 2px 6px; font-size: 10px; min-width: 16px; text-align: center;';
                                    var currentIndex = selectedValues.indexOf(valueObj.value);
                                    numberSpan.textContent = currentIndex !== -1 ? (currentIndex + 1) : '';
                                    numberSpan.id = 'number_' + index;

                                    checkboxContainer.appendChild(leftDiv);
                                    checkboxContainer.appendChild(numberSpan);

                                    checkbox.addEventListener('change', function () {
                                        var currentSelected = target.get('selected-values') || [];
                                        var newSelected = [];

                                        if (this.checked) {
                                            newSelected = currentSelected.concat([this.value]);
                                        } else {
                                            newSelected = currentSelected.filter(function (val) {
                                                return val !== checkbox.value;
                                            });
                                        }
                                        target.set('selected-values', newSelected);
                                        trait.updateNumberIndicators(container, newSelected);
                                    });

                                    container.appendChild(checkboxContainer);
                                });
                            },

                            updateNumberIndicators: function (container, selectedValues) {
                                var checkboxes = container.querySelectorAll('input[type="checkbox"]');
                                checkboxes.forEach(function (checkbox, index) {
                                    var numberSpan = container.querySelector('#number_' + index);
                                    if (numberSpan) {
                                        var valueIndex = selectedValues.indexOf(checkbox.value);
                                        numberSpan.textContent = valueIndex !== -1 ? (valueIndex + 1) : '';
                                    }
                                });
                            },

                            onValueChange: function () {
                                this.updateContent();
                            }
                        });

                        e.TraitManager.addType("video-button-trait", {
                            templateInput: function () {
                                return '<button type="button" class="video-trait-button">' + this.model.get('text') + '</button>';  // changed class name
                            },

                            onRender: function () {
                                var button = this.el.querySelector('.video-trait-button');
                                var command = this.model.get('command');

                                if (button && command) {
                                    button.addEventListener('click', function () {
                                        command(this.em, this.model, this.target);
                                    }.bind(this));
                                }
                            }
                        });
                    })(e),
                    (function (e, t) {
                        var l = t,
                            u = e.BlockManager,
                            m = function (e, n) {
                                var o;
                                (null === (o = l.blocks) || void 0 === o
                                    ? void 0
                                    : o.indexOf(e)) >= 0 &&
                                    u.add(
                                        e,
                                        d(
                                            d(d({}, n), { category: l.category, select: !0 }),
                                            t.block(e)
                                        )
                                    );
                            };
                        m(n, {
                            label: "Form",
                            media:
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 5.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 8H3V6h18v2zM22 10.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 13H3v-2h18v2z"/><rect width="10" height="3" x="2" y="15" rx=".5"/></svg>',
                            content: {
                                type: n,
                                components: [
                                    {
                                        components: [{ type: c, components: "Name" }, { type: o }],
                                    },
                                    {
                                        components: [
                                            { type: c, components: "Email" },
                                            { type: o, attributes: { type: "email" } },
                                        ],
                                    },
                                    {
                                        components: [
                                            { type: c, components: "Gender" },
                                            { type: s, attributes: { value: "M" } },
                                            { type: c, components: "M" },
                                            { type: s, attributes: { value: "F" } },
                                            { type: c, components: "F" },
                                        ],
                                    },
                                    {
                                        components: [
                                            { type: c, components: "Message" },
                                            { type: a },
                                        ],
                                    },
                                    { components: [{ type: p }] },
                                ],
                            },
                        }),
                            m(o, {
                                label: "Input",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 10h1v4H4z"/></svg>',
                                content: { type: o },
                            }),
                            m(a, {
                                label: "Textarea",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 7.5c0-.9-.5-1.5-1.3-1.5H3.4C2.5 6 2 6.6 2 7.5v9c0 .9.5 1.5 1.3 1.5h17.4c.8 0 1.3-.6 1.3-1.5v-9zM21 17H3V7h18v10z"/><path d="M4 8h1v4H4zM19 7h1v10h-1zM20 8h1v1h-1zM20 15h1v1h-1z"/></svg>',
                                content: { type: a },
                            }),
                            m(i, {
                                label: "Select",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M18.5 13l1.5-2h-3zM4 11.5h11v1H4z"/></svg>',
                                content: { type: i },
                            }),
                            m(p, {
                                label: "Button",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 11.5h16v1H4z"/></svg>',
                                content: { type: p },
                            }),
                            m(c, {
                                label: "Label",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 11.9c0-.6-.5-.9-1.3-.9H3.4c-.8 0-1.3.3-1.3.9V17c0 .5.5.9 1.3.9h17.4c.8 0 1.3-.4 1.3-.9V12zM21 17H3v-5h18v5z"/><rect width="14" height="5" x="2" y="5" rx=".5"/><path d="M4 13h1v3H4z"/></svg>',
                                content: { type: c },
                            }),
                            m(s, {
                                label: "Checkbox",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.42L10 14.17l7.59-7.59L19 8m0-5H5c-1.11 0-2 .89-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2z"></path></svg>',
                                content: { type: s },
                            }),
                            m(r, {
                                label: "Radio",
                                media:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-18C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"></path></svg>',
                                content: { type: r },
                            }),
                            m(customInput, {
                                label: "Drag & Drop",
                                media: `
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 350 290" style="display:block; padding:4px; margin-left: 15px;">
                                    <path fill="currentColor" d="
                                        M48 32c0 17.7-14.3 32-32 32S-16 49.7-16 32  -1.7 0 16 0s32 14.3 32 32z
                                        M160 32c0 17.7-14.3 32-32 32s-32-14.3-32-32S110.3 0 128 0s32 14.3 32 32z
                                        M272 32c0 17.7-14.3 32-32 32s-32-14.3-32-32S221.7 0 240 0s32 14.3 32 32z

                                        M48 128c0 17.7-14.3 32-32 32S-16 145.7-16 128  -1.7 96 16 96s32 14.3 32 32z
                                        M160 128c0 17.7-14.3 32-32 32s-32-14.3-32-32S110.3 96 128 96s32 14.3 32 32z
                                        M272 128c0 17.7-14.3 32-32 32s-32-14.3-32-32S221.7 96 240 96s32 14.3 32 32z
                                    "/>
                                    </svg>
                                `,
                                content: { type: customInput },
                            });

                    })(e, m);
            };
            return t;
        })()
);