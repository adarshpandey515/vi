function drawingTool(editor) {
    const styles = `
        #drawing-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            width: 90%;
            height: 90%;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            background: #f1f1f1;
            padding: 15px;
            border-bottom: 1px solid #ccc;
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .tool-btn {
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .tool-btn:hover {
            background: #e9e9e9;
        }
        
        .tool-btn.active {
            background: #007bff;
            color: white;
        }
        
        .tool-input {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
            width: 60px;
        }
        
        .color-input {
            width: 40px;
            height: 30px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .canvas-container {
            flex: 1;
            overflow: auto;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
        }
        
        #konva-container {
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
        }
        
        .modal-footer {
            padding: 15px;
            text-align: right;
            border-top: 1px solid #ccc;
            background: #f9f9f9;
        }
        
        .footer-btn {
            padding: 10px 20px;
            margin-left: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        
        .ok-btn {
            background: #28a745;
            color: white;
        }
        
        .cancel-btn {
            background: #dc3545;
            color: white;
        }
        
        .footer-btn:hover {
            opacity: 0.9;
        }

        .drawing-canvas-block {
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 16px;
            cursor: pointer;
        }

        .tool-icon {
            font-size: 16px;
            transition: font-size 0.2s;
            display: inline-block;
        }
        
        .tool-icon.resizable {
            font-size: 20px;
        }
        
        .tool-btn[data-tool="pencil"] .tool-icon::before {
            content: "✏️";
        }
        
        .tool-btn[data-tool="eraser"] .tool-icon::before {
        content: "🧽"; 
        }
        
        .tool-btn[data-tool="paint"] .tool-icon::before {
            content: "🪣";
        }
            .pencil-cursor {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text y="18" font-size="16">✏️</text></svg>') 8 20, crosshair !important;
        }
        
        .eraser-cursor {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text y="18" font-size="16">🧽</text></svg>') 8 20, crosshair !important;
        }
            .paint-cursor {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text y="18" font-size="16">🪣</text></svg>') 8 20, pointer !important;
        }

        .size-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    const modalHTML = `
        <div id="drawing-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="tool-btn" id="select-btn">
                        <span class="tool-icon">🔲</span> Select
                    </button>
                    <button class="tool-btn" id="move-btn">
                        <span class="tool-icon">✋</span> Move
                    </button>
                    <button class="tool-btn" id="pencil-btn" data-tool="pencil">
                        <span class="tool-icon"></span> Pencil
                    </button>
                    <button class="tool-btn" id="eraser-btn" data-tool="eraser">
                        <span class="tool-icon"></span> Eraser
                    </button>
                    <button class="tool-btn" id="line-btn">
                        <span class="tool-icon">📏</span> Line
                    </button>
                    <button class="tool-btn" id="rect-btn">
                        <span class="tool-icon">⬜</span> Rectangle
                    </button>
                    <button class="tool-btn" id="circle-btn">
                        <span class="tool-icon">🔵</span> Circle
                    </button>
                    <button class="tool-btn" id="text-btn">
                        <span class="tool-icon">📝</span> Text
                    </button>
                    <button class="tool-btn" id="paint-btn" data-tool="paint">
                        <span class="tool-icon"></span> Paint
                    </button>
                    
                    <label style="display: flex; align-items: center; gap: 5px;">
                        Color: <input type="color" id="tool-color" value="#000000" class="color-input">
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 5px;">
                        Width: <input type="number" id="brush-size" value="5" min="1" max="100" class="tool-input">
                    </label>
                    
                    <button class="tool-btn" id="clear-btn">🗑️ Clear</button>
                    <button class="tool-btn" id="undo-btn">↶ Undo</button>
                    <button class="tool-btn" id="redo-btn">↷ Redo</button>
                    <button class="tool-btn" id="load-image-btn">🖼️ Add Image</button>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-left: 20px;">
                        <label style="display: flex; align-items: center; gap: 5px;">
                            Canvas Width: <input type="number" id="canvas-width" value="600" min="200" max="2000" class="tool-input" style="width: 80px;">
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            Canvas Height: <input type="number" id="canvas-height" value="300" min="200" max="1500" class="tool-input" style="width: 80px;">
                        </label>
                        <button class="tool-btn" id="resize-canvas-btn">📐 Resize</button>
                    </div>
                </div>
                
                <div class="canvas-container">
                    <div id="konva-container"></div>
                    <div class="size-indicator" id="size-indicator">Size: 5px</div>
                </div>
                
                <div class="modal-footer">
                    <button class="footer-btn ok-btn" id="drawing-ok-btn">✅ OK</button>
                    <button class="footer-btn cancel-btn" id="drawing-cancel-btn">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    editor.DomComponents.addType('drawing-canvas', {
        model: {
            defaults: {
                tagName: 'div',
                classes: ['drawing-canvas-block'],
                content: '🖌️ Click to draw',
                draggable: true,
                droppable: false,
                editable: false,
                removable: true,
                copyable: true,
                traits: [],
            }
        },
        view: {
            events: {
                click: 'openDrawingModal'
            },

            openDrawingModal() {
                const model = this.model;
                showDrawingModal(model);
            }
        }
    });

    editor.BlockManager.add('drawing-canvas-block', {
        label: `
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" 
             xmlns="http://www.w3.org/2000/svg">
            
            <!-- Centered large rectangle -->
            <rect x="10" y="10" width="40" height="40" rx="4" ry="4" 
                  stroke="white" stroke-width="3" fill="none"/>
            
            <!-- Random white fill strokes inside the rectangle -->
            <g opacity="0.6">
                <line x1="14" y1="16" x2="34" y2="18" stroke="white" stroke-width="2"/>
                <line x1="20" y1="24" x2="44" y2="26" stroke="white" stroke-width="1.5"/>
                <line x1="12" y1="32" x2="40" y2="34" stroke="white" stroke-width="2"/>
                <circle cx="28" cy="38" r="2" fill="white" opacity="0.7"/>
                <circle cx="36" cy="20" r="1.5" fill="white" opacity="0.5"/>
                <circle cx="18" cy="28" r="1" fill="white" opacity="0.6"/>
            </g>

            <!-- Pencil (angled and properly proportioned) -->
            <g transform="rotate(-20 30 30)">
                <!-- Pencil body -->
                <rect x="20" y="26" width="24" height="6" rx="1" ry="1"
                      fill="white" stroke="white" stroke-width="1"/>
                <!-- Pencil tip -->
                <polygon points="44,28 48,30 44,32" 
                         fill="white" stroke="white" stroke-width="1"/>
                <!-- Pencil eraser -->
                <rect x="16" y="26" width="4" height="6" rx="1" ry="1"
                      fill="white" stroke="white" stroke-width="1"/>
            </g>
        </svg>
        Drawing Canvas
    `,
        category: 'Drawing Tools',
        content: {
            type: 'drawing-canvas'
        }
    });

    const modal = document.getElementById('drawing-modal');
    let stage, layer, transformer;
    let history = [];
    let historyIndex = -1;
    let currentTool = 'select';
    let isDrawing = false;
    let isPaint = false;
    let lastLine = null;
    let pencilSize = 5;
    let eraserSize = 15;
    let currentColor = '#000000';

    let toolStates = {
        pencil: { size: 5, icon: '✏️' },
        eraser: { size: 15, icon: '🧽' },
        paint: { icon: '🪣' }
    };

    function floodFill(imageData, startX, startY, fillColor, tolerance = 0) {
        const canvas = stage.getStage();
        const width = canvas.width();
        const height = canvas.height();
        const data = imageData.data;

        const startPos = (startY * width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        const fillR = parseInt(fillColor.slice(1, 3), 16);
        const fillG = parseInt(fillColor.slice(3, 5), 16);
        const fillB = parseInt(fillColor.slice(5, 7), 16);
        const fillA = 255;

        if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
            return imageData;
        }

        const stack = [{ x: startX, y: startY }];
        const visited = new Set();

        function colorMatch(x, y) {
            if (x < 0 || x >= width || y < 0 || y >= height) return false;

            const pos = (y * width + x) * 4;
            const r = data[pos];
            const g = data[pos + 1];
            const b = data[pos + 2];
            const a = data[pos + 3];

            return Math.abs(r - startR) <= tolerance &&
                Math.abs(g - startG) <= tolerance &&
                Math.abs(b - startB) <= tolerance &&
                Math.abs(a - startA) <= tolerance;
        }

        function setPixel(x, y) {
            const pos = (y * width + x) * 4;
            data[pos] = fillR;
            data[pos + 1] = fillG;
            data[pos + 2] = fillB;
            data[pos + 3] = fillA;
        }

        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const key = `${x},${y}`;

            if (visited.has(key) || !colorMatch(x, y)) continue;

            visited.add(key);
            setPixel(x, y);

            stack.push({ x: x + 1, y: y });
            stack.push({ x: x - 1, y: y });
            stack.push({ x: x, y: y + 1 });
            stack.push({ x: x, y: y - 1 });
        }

        return imageData;
    }

    // Create a fresh Konva stage in the modal. If `layerJsonStr` is provided,
    // restore the saved drawing so the user can edit it again later.
    function initializeCanvas(width = 600, height = 300, layerJsonStr = null) {
        const container = document.getElementById('konva-container');
        container.innerHTML = '';

        stage = new Konva.Stage({
            container: 'konva-container',
            width: width,
            height: height
        });

        layer = new Konva.Layer();
        stage.add(layer);

        setupEventListeners();

        if (layerJsonStr) {
            try {
                const objects = JSON.parse(layerJsonStr);
                (objects.children || []).forEach(obj => {
                    // layer.toJSON() includes the Transformer too; ignore it and create a new one.
                    if (obj.className !== 'Transformer') {
                        const shape = Konva.Node.create(obj);
                        layer.add(shape);
                        if (shape.className === 'Text') {
                            addTextEditingHandler(shape);
                        }
                    }
                });
            } catch (e) {
                console.warn('Failed to restore drawing state:', e);
            }
        }

        transformer = new Konva.Transformer({
            rotateEnabled: true,
            enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
            boundBoxFunc: (oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            },
            shouldOverdrawWholeArea: true
        });
        layer.add(transformer);

        layer.draw();
        saveState();
    }

    function setupEventListeners() {
        stage.on('mousedown touchstart', handleMouseDown);
        stage.on('mousemove touchmove', handleMouseMove);
        stage.on('mouseup touchend', handleMouseUp);
        stage.on('click tap', handleClick);

        stage.on('dragstart', (e) => {
            if (currentTool !== 'select' && currentTool !== 'move') {
                e.evt.preventDefault();
            }
        });

        stage.on('dragend', (e) => {
            if (currentTool === 'move' || currentTool === 'select') {
                saveState();
            }
        });
    }

    function handleClick(e) {
        if (currentTool === 'select' || currentTool === 'move') {
            if (e.target === stage) {
                transformer.nodes([]);
                layer.draw();
                return;
            }

            const clickedOnEmpty = e.target === stage;
            if (clickedOnEmpty) {
                transformer.nodes([]);
                layer.draw();
                return;
            }

            if (currentTool === 'move') {
                e.target.draggable(true);
                transformer.nodes([e.target]);
                transformer.forceUpdate();
                layer.draw();
                return;
            }

            const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
            const isSelected = transformer.nodes().indexOf(e.target) >= 0;

            if (!metaPressed && !isSelected) {
                transformer.nodes([e.target]);
            } else if (metaPressed && isSelected) {
                const nodes = transformer.nodes().slice();
                nodes.splice(nodes.indexOf(e.target), 1);
                transformer.nodes(nodes);
            } else if (metaPressed && !isSelected) {
                const nodes = transformer.nodes().concat([e.target]);
                transformer.nodes(nodes);
            }

            transformer.forceUpdate();
            layer.draw();
        } else if (currentTool === 'paint') {
            const pos = stage.getPointerPosition();
            const canvas = stage.toCanvas();
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const filledImageData = floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), currentColor, 10);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(filledImageData, 0, 0);
            layer.destroyChildren();

            transformer = new Konva.Transformer({
                rotateEnabled: true,
                enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                    'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
                boundBoxFunc: (oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                    }
                    return newBox;
                }
            });
            layer.add(transformer);

            const img = new Image();
            img.onload = () => {
                const konvaImg = new Konva.Image({
                    x: 0,
                    y: 0,
                    image: img,
                    width: canvas.width,
                    height: canvas.height
                });
                layer.add(konvaImg);
                layer.draw();
                saveState();
            };
            img.src = tempCanvas.toDataURL();
        }
    }

    function handleMouseDown(e) {
        if (currentTool === 'select' || currentTool === 'move') return;

        isDrawing = true;
        const pos = stage.getPointerPosition();

        if (currentTool === 'pencil') {
            isPaint = true;
            lastLine = new Konva.Line({
                stroke: currentColor,
                strokeWidth: pencilSize,
                globalCompositeOperation: 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            layer.add(lastLine);
        } else if (currentTool === 'eraser') {
            isPaint = true;
            lastLine = new Konva.Line({
                stroke: 'white',
                strokeWidth: eraserSize,
                globalCompositeOperation: 'destination-out',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            layer.add(lastLine);
        } else if (currentTool === 'line') {
            lastLine = new Konva.Line({
                stroke: currentColor,
                strokeWidth: pencilSize,
                lineCap: 'round',
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            layer.add(lastLine);
        } else if (currentTool === 'rect') {
            lastLine = new Konva.Rect({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                stroke: currentColor,
                strokeWidth: pencilSize,
                fill: 'transparent'
            });
            layer.add(lastLine);
        } else if (currentTool === 'circle') {
            lastLine = new Konva.Circle({
                x: pos.x,
                y: pos.y,
                radius: 0,
                stroke: currentColor,
                strokeWidth: pencilSize,
                fill: 'transparent'
            });
            layer.add(lastLine);
        } else if (currentTool === 'text') {
            const text = new Konva.Text({
                x: pos.x,
                y: pos.y,
                text: 'Type here...',
                fontSize: pencilSize * 3,
                fontFamily: 'Arial',
                fill: currentColor,
                draggable: true
            });
            layer.add(text);
            addTextEditingHandler(text);
            layer.draw();
            saveState();
            return;
        }
    }

    function handleMouseMove(e) {
        if (!isDrawing) return;
        const pos = stage.getPointerPosition();

        if (currentTool === 'pencil' || currentTool === 'eraser') {
            if (isPaint && lastLine) {
                const newPoints = lastLine.points().concat([pos.x, pos.y]);
                lastLine.points(newPoints);
            }
        } else if (currentTool === 'line' && lastLine) {
            const points = lastLine.points();
            lastLine.points([points[0], points[1], pos.x, pos.y]);
        } else if (currentTool === 'rect' && lastLine) {
            const startX = lastLine.x();
            const startY = lastLine.y();
            lastLine.width(pos.x - startX);
            lastLine.height(pos.y - startY);
        } else if (currentTool === 'circle' && lastLine) {
            const startX = lastLine.x();
            const startY = lastLine.y();
            const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
            lastLine.radius(radius);
        }

        layer.batchDraw();
    }

    function handleMouseUp() {
        if (isDrawing) {
            isDrawing = false;
            isPaint = false;
            lastLine = null;
            saveState();
        }
    }

    function addTextEditingHandler(text) {
        text.on('dblclick', () => {
            const textPosition = text.absolutePosition();
            const stageBox = stage.container().getBoundingClientRect();
            const areaPosition = {
                x: stageBox.left + textPosition.x,
                y: stageBox.top + textPosition.y,
            };

            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            textarea.value = text.text();
            textarea.style.position = 'absolute';
            textarea.style.top = areaPosition.y + 'px';
            textarea.style.left = areaPosition.x + 'px';
            textarea.style.width = Math.max(text.width() - text.padding() * 2, 100) + 'px';
            textarea.style.height = Math.max(text.height() - text.padding() * 2 + 5, 30) + 'px';
            textarea.style.fontSize = text.fontSize() + 'px';
            textarea.style.border = '2px solid #007bff';
            textarea.style.padding = '2px';
            textarea.style.margin = '0px';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'white';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.lineHeight = text.lineHeight();
            textarea.style.fontFamily = text.fontFamily();
            textarea.style.transformOrigin = 'left top';
            textarea.style.textAlign = text.align();
            textarea.style.color = text.fill();
            textarea.style.zIndex = '10001';
            textarea.focus();
            textarea.select();

            function finishEditing() {
                if (textarea.parentNode) {
                    text.text(textarea.value);
                    document.body.removeChild(textarea);
                    layer.draw();
                    saveState();
                }
            }

            textarea.addEventListener('keydown', function (e) {
                if (e.keyCode === 13 && !e.shiftKey) {
                    e.preventDefault();
                    finishEditing();
                }
                if (e.keyCode === 27) {
                    if (textarea.parentNode) {
                        document.body.removeChild(textarea);
                    }
                }
            });

            textarea.addEventListener('blur', finishEditing);
        });
    }

    function saveState() {
        const state = layer.toJSON();
        history = history.slice(0, historyIndex + 1);
        history.push(state);
        historyIndex++;

        if (history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }

    const toolButtons = {
        select: document.getElementById('select-btn'),
        move: document.getElementById('move-btn'),
        pencil: document.getElementById('pencil-btn'),
        eraser: document.getElementById('eraser-btn'),
        line: document.getElementById('line-btn'),
        rect: document.getElementById('rect-btn'),
        circle: document.getElementById('circle-btn'),
        text: document.getElementById('text-btn'),
        paint: document.getElementById('paint-btn')
    };

    const colorPicker = document.getElementById('tool-color');
    const sizeInput = document.getElementById('brush-size');
    const sizeIndicator = document.getElementById('size-indicator');

    function setActiveTool(tool) {
        if (currentTool !== 'select' && tool !== 'select' && transformer) {
            transformer.nodes([]);
            layer.draw();
        } else if (tool !== 'select' && tool !== 'move' && transformer) {
            transformer.nodes([]);
            layer.draw();
        }

        if (tool === 'move') {
            layer.children.forEach(child => {
                if (child !== transformer) {
                    child.draggable(true);
                }
            });
        } else if (tool !== 'select') {
            layer.children.forEach(child => {
                if (child !== transformer) {
                    child.draggable(false);
                }
            });
        } else if (tool === 'select') {
            layer.children.forEach(child => {
                if (child !== transformer) {
                    child.draggable(true);
                }
            });
        }

        Object.values(toolButtons).forEach(btn => btn.classList.remove('active'));

        if (toolButtons[tool]) {
            toolButtons[tool].classList.add('active');
        }

        currentTool = tool;

        const container = stage ? stage.container() : null;
        if (container) {
            container.classList.remove('pencil-cursor', 'eraser-cursor', 'paint-cursor');
            container.style.cursor = '';

            switch (tool) {
                case 'select':
                    container.style.cursor = 'default';
                    break;
                case 'move':
                    container.style.cursor = 'move';
                    break;
                case 'pencil':
                    container.style.cursor = createToolCursor('✏️', pencilSize);
                    break;
                case 'eraser':
                    container.style.cursor = createToolCursor('🧽', eraserSize);
                    break;
                case 'paint':
                    container.style.cursor = createToolCursor('🪣');
                    break;
                default:
                    container.style.cursor = 'crosshair';
            }
        }

        if (tool === 'pencil') {
            sizeInput.value = toolStates.pencil.size;
            pencilSize = toolStates.pencil.size;
        } else if (tool === 'eraser') {
            sizeInput.value = toolStates.eraser.size;
            eraserSize = toolStates.eraser.size;
        }

        updateSizeIndicator();
    }

    function createToolCursor(emoji, size = 5) {
        const canvas = document.createElement('canvas');
        const canvasSize = Math.max(24, size + 8);
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        if (emoji === '✏️' || emoji === '🧽') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, canvasSize / 2, canvasSize / 2);

        const dataURL = canvas.toDataURL();
        return `url('${dataURL}') ${canvasSize / 2} ${canvasSize / 2}, crosshair`;
    }

    function updateSizeIndicator() {
        const currentSize = currentTool === 'eraser' ? eraserSize : pencilSize;
        sizeIndicator.textContent = `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Size: ${currentSize}px`;
    }

    toolButtons.select.onclick = () => setActiveTool('select');
    toolButtons.move.onclick = () => setActiveTool('move');
    toolButtons.pencil.onclick = () => setActiveTool('pencil');
    toolButtons.eraser.onclick = () => setActiveTool('eraser');
    toolButtons.line.onclick = () => setActiveTool('line');
    toolButtons.rect.onclick = () => setActiveTool('rect');
    toolButtons.circle.onclick = () => setActiveTool('circle');
    toolButtons.text.onclick = () => setActiveTool('text');
    toolButtons.paint.onclick = () => setActiveTool('paint');

    colorPicker.onchange = () => {
        currentColor = colorPicker.value;
    };

    sizeInput.onchange = () => {
        const newSize = parseInt(sizeInput.value, 10);
        if (currentTool === 'pencil') {
            pencilSize = newSize;
            toolStates.pencil.size = newSize;
            const container = stage ? stage.container() : null;
            if (container) {
                container.style.cursor = createToolCursor('✏️', pencilSize);
            }
        } else if (currentTool === 'eraser') {
            eraserSize = newSize;
            toolStates.eraser.size = newSize;
            const container = stage ? stage.container() : null;
            if (container) {
                container.style.cursor = createToolCursor('🧽', eraserSize);
            }
        } else {
            pencilSize = newSize;
        }
        updateSizeIndicator();
    };

    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.shiftKey && e.key === '+') {
                e.preventDefault();
                if (currentTool === 'pencil' || currentTool === 'eraser') {
                    const iconElement = toolButtons[currentTool === 'pencil' ? 'pencil' : 'eraser'].querySelector('.tool-icon');
                    iconElement.classList.add('resizable');
                    sizeIndicator.style.display = 'block';

                    const currentSize = currentTool === 'pencil' ? toolStates.pencil.size : toolStates.eraser.size;
                    const newSize = Math.min(currentSize + 2, 100);

                    if (currentTool === 'pencil') {
                        pencilSize = newSize;
                        toolStates.pencil.size = newSize;
                        const container = stage ? stage.container() : null;
                        if (container) {
                            container.style.cursor = createToolCursor('✏️', pencilSize);
                        }
                    } else {
                        eraserSize = newSize;
                        toolStates.eraser.size = newSize;
                        const container = stage ? stage.container() : null;
                        if (container) {
                            container.style.cursor = createToolCursor('🧽', eraserSize);
                        }
                    }

                    sizeInput.value = newSize;
                    updateSizeIndicator();

                    setTimeout(() => {
                        iconElement.classList.remove('resizable');
                        sizeIndicator.style.display = 'none';
                    }, 1000);
                }
            } else if (e.shiftKey && e.key === '_') {
                e.preventDefault();
                if (currentTool === 'pencil' || currentTool === 'eraser') {
                    const iconElement = toolButtons[currentTool === 'pencil' ? 'pencil' : 'eraser'].querySelector('.tool-icon');
                    iconElement.classList.add('resizable');
                    sizeIndicator.style.display = 'block';

                    const currentSize = currentTool === 'pencil' ? toolStates.pencil.size : toolStates.eraser.size;
                    const newSize = Math.max(currentSize - 2, 1);

                    if (currentTool === 'pencil') {
                        pencilSize = newSize;
                        toolStates.pencil.size = newSize;
                        const container = stage ? stage.container() : null;
                        if (container) {
                            container.style.cursor = createToolCursor('✏️', pencilSize);
                        }
                    } else {
                        eraserSize = newSize;
                        toolStates.eraser.size = newSize;
                        const container = stage ? stage.container() : null;
                        if (container) {
                            container.style.cursor = createToolCursor('🧽', eraserSize);
                        }
                    }

                    sizeInput.value = newSize;
                    updateSizeIndicator();

                    setTimeout(() => {
                        iconElement.classList.remove('resizable');
                        sizeIndicator.style.display = 'none';
                    }, 1000);
                }
            }
        }
    });

    document.getElementById('clear-btn').onclick = () => {
        layer.destroyChildren();
        transformer = new Konva.Transformer({
            rotateEnabled: true,
            enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
            boundBoxFunc: (oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            },
            shouldOverdrawWholeArea: true
        });
        layer.add(transformer);
        layer.draw();
        saveState();
    };

    document.getElementById('undo-btn').onclick = () => {
        if (historyIndex > 0) {
            historyIndex--;
            layer.destroyChildren();
            const objects = JSON.parse(history[historyIndex]);
            objects.children.forEach(obj => {
                if (obj.className !== 'Transformer') {
                    const shape = Konva.Node.create(obj);
                    layer.add(shape);
                    if (shape.className === 'Text') {
                        addTextEditingHandler(shape);
                    }
                }
            });

            transformer = new Konva.Transformer({
                rotateEnabled: true,
                enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                    'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
                boundBoxFunc: (oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                    }
                    return newBox;
                },
                shouldOverdrawWholeArea: true
            });
            layer.add(transformer);
            layer.draw();
        }
    };

    document.getElementById('redo-btn').onclick = () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            layer.destroyChildren();
            const objects = JSON.parse(history[historyIndex]);
            objects.children.forEach(obj => {
                if (obj.className !== 'Transformer') {
                    const shape = Konva.Node.create(obj);
                    layer.add(shape);

                    if (shape.className === 'Text') {
                        addTextEditingHandler(shape);
                    }
                }
            });

            transformer = new Konva.Transformer({
                rotateEnabled: true,
                enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                    'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
                boundBoxFunc: (oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                    }
                    return newBox;
                },
                shouldOverdrawWholeArea: true
            });
            layer.add(transformer);
            layer.draw();
        }
    };

    document.getElementById('load-image-btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const konvaImg = new Konva.Image({
                            x: 50,
                            y: 50,
                            image: img,
                            width: Math.min(img.width, 200),
                            height: Math.min(img.height, 200),
                            draggable: true
                        });

                        konvaImg.on('dragend', () => {
                            transformer.forceUpdate();
                            layer.draw();
                        });

                        konvaImg.on('transformend', () => {
                            saveState();
                        });

                        layer.add(konvaImg);
                        layer.draw();
                        saveState();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    document.getElementById('resize-canvas-btn').onclick = () => {
        const newWidth = parseInt(document.getElementById('canvas-width').value, 10);
        const newHeight = parseInt(document.getElementById('canvas-height').value, 10);

        if (newWidth && newHeight && newWidth >= 200 && newHeight >= 200) {
            stage.width(newWidth);
            stage.height(newHeight);
            layer.draw();
            saveState();
        } else {
            alert('Please enter valid dimensions (minimum 200px)');
        }
    };

    function showDrawingModal(model) {
        const attrs = (model && model.getAttributes) ? model.getAttributes() : {};
        const savedLayerJson = attrs['data-drawing-json'] || null;
        const savedW = parseInt(attrs['data-drawing-width'], 10);
        const savedH = parseInt(attrs['data-drawing-height'], 10);
        const width = Number.isFinite(savedW) && savedW > 0 ? savedW : 600;
        const height = Number.isFinite(savedH) && savedH > 0 ? savedH : 300;

        modal.style.display = 'flex';

        // Reset modal state so drawings do not leak between components.
        history = [];
        historyIndex = -1;

        initializeCanvas(width, height, savedLayerJson);
        setActiveTool('select');

        // Keep the resize inputs in sync with the currently opened drawing.
        const wInput = document.getElementById('canvas-width');
        const hInput = document.getElementById('canvas-height');
        if (wInput) wInput.value = String(stage.width());
        if (hInput) hInput.value = String(stage.height());

        document.getElementById('drawing-ok-btn').onclick = () => {
            const dataURL = stage.toDataURL({ pixelRatio: 2 });
            const canvasWidth = stage.width();
            const canvasHeight = stage.height();

            // Persist drawing state on the component so it can be reopened for editing.
            // Preview is set as a background image to keep the component selectable/editable.
            const layerJsonStr = layer.toJSON();
            if (model && model.addAttributes) {
                model.addAttributes({
                    'data-drawing-json': layerJsonStr,
                    'data-drawing-width': String(canvasWidth),
                    'data-drawing-height': String(canvasHeight),
                });
            }

            if (model && model.addStyle) {
                model.addStyle({
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    'background-image': `url("${dataURL}")`,
                    'background-repeat': 'no-repeat',
                    'background-position': 'center',
                    'background-size': '100% 100%',
                });
            }

            // Remove placeholder text once a drawing exists.
            if (model && model.set) {
                model.set('content', '');
            }

            modal.style.display = 'none';
        };

        document.getElementById('drawing-cancel-btn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}
