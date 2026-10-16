// --- Dashboard & 檔案管理 ---
let files = JSON.parse(localStorage.getItem('logicDiagramFiles')) || [];
let currentFileId = null;

function saveFilesToStorage() { localStorage.setItem('logicDiagramFiles', JSON.stringify(files)); }

function showDashboardView(view) {
    if (view === 'files') {
        document.getElementById('dashboard-files-view').classList.remove('hidden');
        document.getElementById('dashboard-trash-view').classList.add('hidden');
        document.getElementById('nav-files').classList.add('bg-blue-50', 'text-blue-600', 'font-bold');
        document.getElementById('nav-trash').classList.remove('bg-blue-50', 'text-blue-600', 'font-bold');
        renderFileList();
    } else if (view === 'trash') {
        document.getElementById('dashboard-files-view').classList.add('hidden');
        document.getElementById('dashboard-trash-view').classList.remove('hidden');
        document.getElementById('nav-trash').classList.add('bg-blue-50', 'text-blue-600', 'font-bold');
        document.getElementById('nav-files').classList.remove('bg-blue-50', 'text-blue-600', 'font-bold');
        renderTrashList();
    }
}

function renderFileList() {
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    const activeFiles = files.filter(f => !f.isDeleted);
    if (activeFiles.length === 0) {
        list.innerHTML = '<div class="px-6 py-12 text-center text-gray-400"><i class="fa-regular fa-folder-open text-4xl mb-3 block"></i> 尚無文件，請點擊左側建立新文件。</div>';
        return;
    }
    [...activeFiles].reverse().forEach(file => {
        const dateStr = new Date(file.updatedAt).toLocaleString();
        list.innerHTML += `
            <div class="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/50 cursor-pointer group transition-colors" onclick="openFile('${file.id}')">
                <div class="col-span-8 flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600"><i class="fa-solid fa-file-lines"></i></div>
                    <span class="font-bold text-gray-700 group-hover:text-blue-600">${file.name}</span>
                </div>
                <div class="col-span-4 text-sm text-gray-500 flex justify-between items-center">
                    <span>${dateStr}</span>
                    <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="renameFile('${file.id}', event)" class="text-gray-500 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 rounded transition-all flex items-center justify-center" title="重新命名"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteFile('${file.id}', event)" class="text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded transition-all flex items-center justify-center" title="移至垃圾桶"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderTrashList() {
    const list = document.getElementById('trash-list');
    list.innerHTML = '';
    const deletedFiles = files.filter(f => f.isDeleted);
    if (deletedFiles.length === 0) {
        list.innerHTML = '<div class="px-6 py-12 text-center text-gray-400"><i class="fa-solid fa-trash text-4xl mb-3 block"></i> 垃圾桶是空的。</div>';
        return;
    }
    [...deletedFiles].reverse().forEach(file => {
        const dateStr = new Date(file.deletedAt).toLocaleString();
        list.innerHTML += `
            <div class="grid grid-cols-12 gap-4 px-6 py-4 items-center group transition-colors">
                <div class="col-span-6 flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500"><i class="fa-solid fa-file-lines"></i></div>
                    <span class="text-gray-500 line-through">${file.name}</span>
                </div>
                <div class="col-span-3 text-sm text-gray-400">${dateStr}</div>
                <div class="col-span-3 text-sm text-gray-500 flex justify-end items-center gap-2">
                    <button onclick="restoreFile('${file.id}')" class="text-green-500 hover:text-green-700 hover:bg-green-50 px-3 py-1 rounded transition-all flex items-center justify-center gap-1.5"><i class="fa-solid fa-rotate-left"></i> 還原</button>
                    <button onclick="deleteFilePermanently('${file.id}', event)" class="text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded transition-all flex items-center justify-center gap-1.5"><i class="fa-solid fa-trash"></i> 永久刪除</button>
                </div>
            </div>
        `;
    });
}

function createNewFile() {
    const newFile = {
        id: 'file_' + Date.now(),
        name: '未命名文件',
        updatedAt: Date.now(),
        theme: 'purple',
        layoutSettings: { alignSiblings: false, hideRoot: false, spacing: 'default' },
        nodes: [ { id: 1, x: window.innerWidth/3, y: window.innerHeight/3, text: '中心主題', parentId: null, color: '#4361ee' } ]
    };
    files.push(newFile);
    saveFilesToStorage();
    openFile(newFile.id);
}

function openFile(id) {
    currentFileId = id;
    const file = files.find(f => f.id === id);
    document.getElementById('document-title').value = file.name;
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-editor').classList.remove('hidden');
    document.getElementById('view-editor').classList.add('flex');
    
    resetEditor();
    
    const settings = file.layoutSettings || { alignSiblings: false, hideRoot: false, spacing: 'default' };
    document.getElementById('layout-align-siblings').checked = settings.alignSiblings;
    document.getElementById('layout-hide-root').checked = settings.hideRoot;
    document.getElementById('layout-spacing').value = settings.spacing;

    applyGlobalTheme(file.theme || 'purple', false);
    selectTheme(file.theme || 'purple');
    loadNodes(file.nodes);
    focusOnRootNode();
    saveHistory(); 
}

function deleteFile(id, event) {
    event.stopPropagation();
    const file = files.find(f => f.id === id);
    if (file) {
        file.isDeleted = true;
        file.deletedAt = Date.now();
        saveFilesToStorage();
        renderFileList();
    }
}

function renameFile(id, event) {
    event.stopPropagation();
    const fileItem = event.target.closest('.grid');
    const nameSpan = fileItem.querySelector('span.font-bold');
    const currentName = nameSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'font-bold text-gray-700 bg-white border rounded px-1 -my-1 w-3/4';
    
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    const saveRename = () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            const file = files.find(f => f.id === id);
            if (file) {
                file.name = newName;
                file.updatedAt = Date.now();
                saveFilesToStorage();
            }
        }
        renderFileList(); 
    };

    input.addEventListener('blur', saveRename);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        else if (e.key === 'Escape') renderFileList();
    });
}

function restoreFile(id) {
    const file = files.find(f => f.id === id);
    if (file) {
        delete file.isDeleted;
        delete file.deletedAt;
        file.updatedAt = Date.now();
        saveFilesToStorage();
        renderTrashList();
    }
}

function deleteFilePermanently(id, event) {
    event.stopPropagation();
    if (confirm('永久刪除後無法復原，確定嗎？')) {
        files = files.filter(f => f.id !== id);
        saveFilesToStorage();
        renderTrashList();
    }
}

function backToDashboard() {
    currentFileId = null;
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('view-editor').classList.remove('flex');
    document.getElementById('view-dashboard').classList.remove('hidden');
    renderFileList();
}

function updateFileName(newName) {
    if(!currentFileId) return;
    const file = files.find(f => f.id === currentFileId);
    if(file) {
        file.name = newName;
        file.updatedAt = Date.now();
        saveFilesToStorage();
    }
}

function syncFileState() {
    if(!currentFileId) return;
    const file = files.find(f => f.id === currentFileId);
    if(file) {
        file.nodes = getCurrentNodesState();
        file.layoutSettings = getCurrentLayoutSettings();
        file.updatedAt = Date.now();
        saveFilesToStorage();
        
        const status = document.getElementById('save-status');
        status.innerHTML = '<i class="fa-regular fa-circle-check"></i> 已儲存';
        status.className = 'text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full';
    }
}

window.onload = () => {
    const activeFiles = files.filter(f => !f.isDeleted);
    if (activeFiles.length === 0) {
        createNewFile();
    } else {
        showDashboardView('files');
    }
    initEditorEventListeners();
    populateIconLibrary();
};

// --- UI 控制 ---
let isSidebarOpen = true;
function toggleSidebar() {
    const container = document.getElementById('sidePanelContainer');
    const content = document.getElementById('sidePanelContent');
    const icon = document.getElementById('toggleIcon');
    
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        container.style.width = '20rem';
        content.style.opacity = '1';
        icon.style.transform = 'rotate(0deg)';
    } else {
        container.style.width = '0px';
        content.style.opacity = '0';
        icon.style.transform = 'rotate(180deg)';
    }
}

function showPanel(panelName) {
    if(!isSidebarOpen) toggleSidebar();
    document.querySelectorAll('.panel-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('panel-' + panelName).classList.remove('hidden');
    document.querySelectorAll('.panel-trigger').forEach(el => {
        el.classList.remove('text-blue-500', 'bg-blue-50');
        if(el.dataset.target === panelName) el.classList.add('text-blue-500', 'bg-blue-50');
    });
}

// --- 全域主題套用 ---
const themes = {
    'classic': { bg: '#f8f9fa', grid: '#e5e7eb', line: '#94a3b8' },
    'gothic': { bg: '#111115', grid: '#2a2a35', line: '#4b4b5c' },
    'soft': { bg: '#fefae0', grid: '#e9edc9', line: '#ccd5ae' },
    'purple': { bg: '#f8f5ff', grid: '#e9e3fa', line: '#b4a6e5' },
    'retro': { bg: '#f4f1ea', grid: '#e5e1d8', line: '#b2a99a' },
    'vibrant': { bg: '#f0f7f8', grid: '#dbe8ea', line: '#a7b9bc' },
    'business': { bg: '#fcfbfa', grid: '#e9e6e3', line: '#b8b3ad' }
};
const themePalettes = {
    'classic': ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#1e293b'],
    'retro': ['#cb8a77', '#c9af6d', '#8b9d69', '#7a8fb7', '#9782a9', '#3b424d'],
    'vibrant': ['#6347d4', '#afd735', '#4361ee', '#cc77ff', '#2a2346'],
    'business': ['#56b8ab', '#70d6ff', '#3b82f6', '#4361ee', '#0b132b'],
    'purple': ['#3a0ca3', '#7209b7', '#4361ee', '#cc99ff', '#e9edc9'],
    'gothic': ['#7209b7', '#b5179e', '#f72585', '#4cc9f0', '#3a0ca3'],
    'soft': ['#d4a373', '#ccd5ae', '#e9edc9', '#faedcd', '#8c7a6b']
};
const themeNames = {
    'classic': '經典推薦', 'retro': '復古彩虹', 'vibrant': '活力幻彩', 
    'business': '簡約商務', 'purple': '紫色國韻', 'gothic': '暗黑幻想', 'soft': '齒輪復古'
};

let currentTheme = 'classic';
let lastLayoutType = 'mindmap-right';
function applyGlobalTheme(themeName, recordHistory = true) {
    if(!themes[themeName]) return;
    currentTheme = themeName;
    const theme = themes[themeName];
    
    document.documentElement.style.setProperty('--bg-color', theme.bg);
    document.documentElement.style.setProperty('--grid-color', theme.grid);
    
    document.querySelectorAll('#canvas svg line').forEach(line => line.setAttribute('stroke', theme.line));
    // 在 applyGlobalTheme 函式內部的 document.querySelectorAll('#canvas svg line')... 之後加入：
    document.querySelectorAll('.theme-marker').forEach(m => m.setAttribute('fill', theme.line));
    document.querySelectorAll('.theme-marker-stroke').forEach(m => m.setAttribute('stroke', theme.line));

    const palette = themePalettes[themeName];
    if (palette) {
        const nodeLevels = getNodeLevels();
        document.querySelectorAll('#canvas .group').forEach(nodeWrapper => {
            const nodeId = parseInt(nodeWrapper.dataset.id);
            const level = nodeLevels[nodeId] || 0;
            const color = palette[level % palette.length];
            applyColorToNode(nodeWrapper.querySelector('.node-content'), color);
        });
    }

    if(currentFileId) {
        const file = files.find(f => f.id === currentFileId);
        if(file) file.theme = themeName;
    }

    if(recordHistory) saveHistory();
}

// --- 編輯器核心 ---
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('canvas');
let nodeIdCounter = 0;
let draggedElement = null;
let offset = { x: 0, y: 0 };
let selectedNodeId = null;
let multiSelectedNodeIds = [];
let historyStack = [];
let historyIndex = -1;
let isMultiDragging = false;
let dragStartPositions = new Map();
let nodeClipboard = { nodes: [], baseId: null };

// Zoom & Pan
let scale = 1;
let panOffset = { x: 0, y: 0 };
let isPanning = false;
let lastMousePos = { x: 0, y: 0 };
const canvasContent = document.getElementById('canvas-content');

// Context Menu
const contextMenu = document.getElementById('context-menu');
let contextMenuPos = { x: 0, y: 0 };


const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svgLayer.style.position = 'absolute';
svgLayer.style.top = '0';
svgLayer.style.left = '0';
svgLayer.style.width = '100%'; 
svgLayer.style.height = '100%';
svgLayer.style.pointerEvents = 'none';
canvas.appendChild(svgLayer);

function resetEditor() {
    document.querySelectorAll('#canvas .group').forEach(el => el.remove());
    svgLayer.innerHTML = '';
    nodeIdCounter = 0;
    historyStack = [];
    historyIndex = -1;
    selectedNodeId = null;
    multiSelectedNodeIds = [];

    // Add SVG marker definitions for arrows
    // 新增豐富的 SVG 箭頭標記
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const lineTheme = themes[currentTheme].line;
    defs.innerHTML = `
        <marker id="marker-arrow" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,-5L10,0L0,5 Z" fill="${lineTheme}" class="theme-marker"></path>
        </marker>
        <marker id="marker-triangle" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,-5L10,0L0,5 Z" fill="none" stroke="${lineTheme}" stroke-width="2" class="theme-marker-stroke"></path>
        </marker>
        <marker id="marker-circle" viewBox="0 -5 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <circle cx="5" cy="0" r="4" fill="${lineTheme}" class="theme-marker"></circle>
        </marker>
        <marker id="marker-diamond" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0L5,-5L10,0L5,5 Z" fill="${lineTheme}" class="theme-marker"></path>
        </marker>
    `;
    svgLayer.appendChild(defs);
}

function getCurrentNodesState() {
    const nodes = [];
    document.querySelectorAll('#canvas .group').forEach(nodeEl => {
        const contentEl = nodeEl.querySelector('.node-content');
        const textEl = contentEl.querySelector('.node-text-content');
        nodes.push({
            id: parseInt(nodeEl.dataset.id),
            x: nodeEl.offsetLeft,
            y: nodeEl.offsetTop,
            text: textEl ? textEl.textContent : '',
            parentId: nodeEl.dataset.parentId ? parseInt(nodeEl.dataset.parentId) : null,
            color: contentEl.style.backgroundColor,
            fontColor: contentEl.style.color,
            fontFamily: contentEl.style.fontFamily,
            fontSize: contentEl.style.fontSize,
            fontWeight: contentEl.style.fontWeight, // 新增
            fontStyle: contentEl.style.fontStyle, // 新增
            textDecoration: contentEl.style.textDecorationLine, // 新增
            textAlign: contentEl.style.textAlign || 'center', // 新增
            isHidden: nodeEl.style.display === 'none',
            lineStyle: nodeEl.dataset.lineStyle || 'solid',
            lineArrow: nodeEl.dataset.lineArrow || 'none',
            isCollapsed: nodeEl.dataset.isCollapsed === 'true',
            lineLabel: nodeEl.dataset.lineLabel || '',
            // 新增圖片與圖示
            imageUrl: nodeEl.dataset.imageUrl || '',
            iconClass: nodeEl.dataset.iconClass || ''
        });
    });
    return nodes;
}

function loadNodes(nodesArray) {
    document.querySelectorAll('#canvas .group').forEach(el => el.remove());
    svgLayer.querySelectorAll('line').forEach(el => el.remove());
    svgLayer.querySelectorAll('text').forEach(el => el.remove());
    
    // --- NEW: Handle collapsed nodes ---
    const nodesToProcess = JSON.parse(JSON.stringify(nodesArray)); // Deep copy
    const collapsedParents = new Set(nodesToProcess.filter(n => n.isCollapsed).map(n => n.id));
    const nodesToHide = new Set();
    const childrenMap = new Map();
    nodesToProcess.forEach(n => {
        if (n.parentId) {
            if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
            childrenMap.get(n.parentId).push(n.id);
        }
    });

    function findDescendants(parentId) {
        const children = childrenMap.get(parentId) || [];
        children.forEach(childId => {
            nodesToHide.add(childId);
            findDescendants(childId);
        });
    }
    collapsedParents.forEach(id => findDescendants(id));
    // --- END NEW ---

    let maxId = 0;
    nodesToProcess.forEach(data => {
        if (nodesToHide.has(data.id)) data.isHidden = true;
        createNodeDOM(data);
        if (data.id > maxId) maxId = data.id;
    });
    nodeIdCounter = maxId;

    nodesToProcess.forEach(data => {
        if (data.parentId) drawLine(data.parentId, data.id);
    });
}

function getNodeLevels() {
    const levels = {};
    const nodes = getCurrentNodesState();
    const childrenMap = new Map();
    let rootId = null;

    nodes.forEach(n => {
        if (n.parentId) {
            if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
            childrenMap.get(n.parentId).push(n.id);
        } else {
            rootId = n.id;
        }
    });

    function assignLevels(nodeId, level) {
        if (nodeId === undefined || nodeId === null) return;
        levels[nodeId] = level;
        (childrenMap.get(nodeId) || []).forEach(childId => assignLevels(childId, level + 1));
    }
    assignLevels(rootId, 0);
    return levels;
}

function saveHistory() {
    const currentState = getCurrentNodesState();
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }
    historyStack.push({ theme: currentTheme, nodes: currentState });
    historyIndex++;
    
    const status = document.getElementById('save-status');
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 儲存中...';
    status.className = 'text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full';
    setTimeout(syncFileState, 300);
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const state = historyStack[historyIndex];
        applyGlobalTheme(state.theme, false);
        loadNodes(state.nodes);
        syncFileState();
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const state = historyStack[historyIndex];
        applyGlobalTheme(state.theme, false);
        loadNodes(state.nodes);
        syncFileState();
    }
}

function getContrastYIQ(hexcolor){
    if(!hexcolor) return '#1f2937';
    hexcolor = hexcolor.replace("#", "");
    if(hexcolor.length === 3) hexcolor = hexcolor.split('').map(x => x+x).join('');
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#1f2937' : '#ffffff';
}

function applyColorToNode(nodeContentEl, colorCode) {
    if(!nodeContentEl || !colorCode) return;
    nodeContentEl.style.backgroundColor = colorCode;
    nodeContentEl.style.color = getContrastYIQ(colorCode);
}

function createNodeDOM(nodeData) {
    const { x, y, text, parentId, id: forceId, color, fontColor, fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textAlign, isHidden, lineStyle, lineArrow, lineLabel, imageUrl, iconClass, isCollapsed } = nodeData;
    const id = (forceId !== null && forceId !== undefined) ? forceId : ++nodeIdCounter;
    
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'absolute group';
    nodeWrapper.style.left = `${x}px`;
    nodeWrapper.style.top = `${y}px`;
    if(isHidden) nodeWrapper.style.display = 'none';
    nodeWrapper.dataset.id = id;
    nodeWrapper.dataset.parentId = parentId || '';
    nodeWrapper.dataset.lineStyle = lineStyle || 'solid';
    nodeWrapper.dataset.lineArrow = lineArrow || 'none';
    nodeWrapper.dataset.isCollapsed = isCollapsed || false;
    if (lineLabel) nodeWrapper.dataset.lineLabel = lineLabel;
    if (imageUrl) nodeWrapper.dataset.imageUrl = imageUrl;
    if (iconClass) nodeWrapper.dataset.iconClass = iconClass;
    nodeWrapper.style.zIndex = 10;

    const nodeContent = document.createElement('div');
    nodeContent.className = 'node-content px-4 py-2 rounded-md shadow relative z-10 cursor-move border-2 border-transparent transition-all min-w-[80px] text-center font-medium flex flex-col items-center gap-2';
    applyColorToNode(nodeContent, color);
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'max-w-full h-auto rounded-sm mt-1';
        nodeContent.appendChild(img);
    }

    const textWrapper = document.createElement('div');
    textWrapper.className = 'flex items-center gap-2';

    if (iconClass) {
        const iconEl = document.createElement('i');
        iconEl.className = `${iconClass} node-icon`;
        textWrapper.appendChild(iconEl);
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'node-text-content';
    textSpan.textContent = text;
    textWrapper.appendChild(textSpan);
    nodeContent.appendChild(textWrapper);

    // 套用完整字體樣式
    nodeContent.style.fontFamily = fontFamily || 'inherit';
    nodeContent.style.fontSize = fontSize || '16px';
    nodeContent.style.fontWeight = fontWeight || 'normal';
    nodeContent.style.fontStyle = fontStyle || 'normal';
    nodeContent.style.textDecorationLine = textDecoration || 'none';
    nodeContent.style.textAlign = textAlign || 'center';
    
    // 預設關閉編輯模式，才能順利拖曳
    nodeContent.contentEditable = "false";

    // The 'click' event listener is removed to prevent conflicts with the new mousedown logic.

    // 雙擊開啟編輯模式
    nodeContent.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const textEl = nodeContent.querySelector('.node-text-content');
        textEl.contentEditable = "true";
        textEl.focus();
        document.execCommand('selectAll', false, null);
        document.getSelection().collapseToEnd();
    });

    // 監聽文字內容的 blur 事件
    nodeContent.querySelector('.node-text-content').addEventListener('blur', (e) => {
        e.target.contentEditable = "false";
        saveHistory(); 
    });

    // --- NEW: Collapse Button ---
    const collapseBtn = document.createElement('div');
    collapseBtn.className = 'node-collapse-btn absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 z-20 text-xs cursor-pointer shadow-sm hidden';
    collapseBtn.innerHTML = `<i class="fa-solid ${isCollapsed ? 'fa-plus' : 'fa-minus'}"></i>`;
    collapseBtn.onclick = (e) => {
        e.stopPropagation();
        toggleNodeCollapse(id);
    };

    const addButton = document.createElement('div');
    addButton.className = 'absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-500 hover:border-blue-500 z-20 text-md cursor-pointer opacity-0 group-hover:opacity-100 transition-all shadow-sm';
    addButton.innerHTML = '<i class="fa-solid fa-plus text-xs"></i>';
    
    nodeWrapper.appendChild(nodeContent);
    nodeWrapper.appendChild(collapseBtn);
    nodeWrapper.appendChild(addButton);
    canvas.appendChild(nodeWrapper);

    addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentRect = nodeWrapper.getBoundingClientRect();
        const newX = nodeWrapper.offsetLeft + parentRect.width + 60;
        const newY = nodeWrapper.offsetTop + (Math.random()*40-20);
        const newNodeData = { x: newX, y: newY, text: '新分支', parentId: id };
        createNodeDOM(newNodeData);
        drawLine(id, nodeIdCounter);
        saveHistory();
    });

    // --- REFACTORED: Unified Mousedown for Selection & Dragging ---
    nodeContent.addEventListener('mousedown', (e) => {
        if (e.target.isContentEditable) return; // 編輯中防干擾
        e.stopPropagation();

        const isCurrentlySelected = multiSelectedNodeIds.includes(id);

        // Step 1: Update selection state
        if (e.ctrlKey || e.metaKey) {
            if (isCurrentlySelected) {
                multiSelectedNodeIds = multiSelectedNodeIds.filter(sid => sid !== id);
            } else {
                multiSelectedNodeIds.push(id);
            }
        } else if (!isCurrentlySelected) {
            clearSelection();
            multiSelectedNodeIds.push(id);
        }
        // If clicked on an already selected node without Ctrl, do nothing to the selection array.

        // Step 2: Update UI and global state from new selection
        selectedNodeId = id;
        updateSelectionUI();
        updateSidebarForSelection();

        // Step 3: Initiate dragging
        if (multiSelectedNodeIds.length > 1 && multiSelectedNodeIds.includes(id)) {
            isMultiDragging = true;
            offset.x = e.pageX;
            offset.y = e.pageY;
            dragStartPositions.clear();
            multiSelectedNodeIds.forEach(nodeId => {
                const el = document.querySelector(`[data-id="${nodeId}"]`);
                if (el) {
                    dragStartPositions.set(nodeId, { x: el.offsetLeft, y: el.offsetTop, el: el });
                    el.style.zIndex = 1000;
                }
            });
        } else {
            draggedElement = nodeWrapper;
            offset.x = e.clientX - nodeWrapper.getBoundingClientRect().left;
            offset.y = e.clientY - nodeWrapper.getBoundingClientRect().top;
            draggedElement.style.zIndex = 1000;
        }
    });
}

function updateSelectionUI() {
    document.querySelectorAll('.node-selected, .multi-selected').forEach(el => el.classList.remove('node-selected', 'multi-selected'));
    multiSelectedNodeIds.forEach(sid => {
        const nodeContent = document.querySelector(`[data-id="${sid}"] .node-content`);
        if (nodeContent) {
            nodeContent.classList.add('multi-selected');
            if (sid === selectedNodeId) {
                nodeContent.classList.add('node-selected');
            }
        }
    });
}

function toggleNodeCollapse(nodeId) {
    const nodeEl = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeEl) return;

    const isCollapsed = nodeEl.dataset.isCollapsed === 'true';
    nodeEl.dataset.isCollapsed = !isCollapsed;

    saveHistory();
    loadNodes(getCurrentNodesState()); // Re-render to apply visibility changes
}

function updateCollapseButtons() {
    const childrenMap = new Map();
    document.querySelectorAll('#canvas .group').forEach(node => {
        const parentId = node.dataset.parentId;
        if (parentId) {
            if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
            childrenMap.get(parentId).push(node.dataset.id);
        }
    });

    document.querySelectorAll('.node-collapse-btn').forEach(btn => btn.classList.add('hidden'));

    childrenMap.forEach((children, parentId) => {
        const parentNode = document.querySelector(`[data-id="${parentId}"]`);
        if (parentNode) {
            const btn = parentNode.querySelector('.node-collapse-btn');
            if (btn) btn.classList.remove('hidden');
        }
    });
}

function clearSelection() {
    selectedNodeId = null;
    if (!isMarqueeSelecting) multiSelectedNodeIds = []; // Don't clear if marquee selecting
    document.querySelectorAll('.node-content').forEach(el => el.classList.remove('node-selected', 'multi-selected'));
}

function updateSidebarForSelection() {
    if (!selectedNodeId) return;
    const nodeEl = document.querySelector(`[data-id="${selectedNodeId}"]`);
    const contentEl = nodeEl.querySelector('.node-content');
    if (!contentEl) return;

    // 同步字體選擇 (將雙引號替換，避免 html 屬性匹配失敗)
    const fontStr = (contentEl.style.fontFamily || "'Microsoft YaHei', 'PingFang SC', sans-serif").replace(/"/g, "'");
    document.getElementById('font-family-select').value = fontStr;
    document.getElementById('font-size-select').value = parseInt(contentEl.style.fontSize) || 16;

    // 同步排版按鈕狀態
    document.getElementById('btn-format-bold').classList.toggle('bg-gray-200', contentEl.style.fontWeight === 'bold');
    document.getElementById('btn-format-italic').classList.toggle('bg-gray-200', contentEl.style.fontStyle === 'italic');
    const textDeco = contentEl.style.textDecorationLine || '';
    document.getElementById('btn-format-underline').classList.toggle('bg-gray-200', textDeco.includes('underline'));
    document.getElementById('btn-format-strikethrough').classList.toggle('bg-gray-200', textDeco.includes('line-through'));

    // 同步對齊按鈕狀態
    const align = contentEl.style.textAlign || 'center';
    document.getElementById('btn-align-left').classList.toggle('bg-gray-200', align === 'left');
    document.getElementById('btn-align-center').classList.toggle('bg-gray-200', align === 'center');
    document.getElementById('btn-align-right').classList.toggle('bg-gray-200', align === 'right');

    document.getElementById('line-style-select').value = nodeEl.dataset.lineStyle || 'solid';
    document.getElementById('line-arrow-select').value = nodeEl.dataset.lineArrow || 'none';
    document.getElementById('line-label-input').value = nodeEl.dataset.lineLabel || '';
}

// 新增功能：套用文字排版
function applyTextFormat(type) {
    if (multiSelectedNodeIds.length === 0) return;
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if (!nodeEl) return;
        if (type === 'bold') nodeEl.style.fontWeight = nodeEl.style.fontWeight === 'bold' ? 'normal' : 'bold';
        else if (type === 'italic') nodeEl.style.fontStyle = nodeEl.style.fontStyle === 'italic' ? 'normal' : 'italic';
        else if (type === 'underline' || type === 'line-through') {
            // 優化文字裝飾樣式，使其能正確疊加或移除 (使用 textDecorationLine)
            const currentDecorations = (nodeEl.style.textDecorationLine || 'none').split(' ');
            if (currentDecorations.includes(type)) {
                // 移除樣式
                nodeEl.style.textDecorationLine = currentDecorations.filter(d => d !== type && d !== 'none').join(' ') || 'none';
            } else {
                // 新增樣式
                nodeEl.style.textDecorationLine = [...currentDecorations.filter(d => d !== 'none'), type].join(' ');
            }
        }
    });
    updateSidebarForSelection();
    saveHistory();
}

// 新增功能：套用對齊
function applyTextAlign(align) {
    if (multiSelectedNodeIds.length === 0) return;
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if (nodeEl) nodeEl.style.textAlign = align;
    });
    updateSidebarForSelection();
    saveHistory();
}

function getCurrentLayoutSettings() {
    return {
        alignSiblings: document.getElementById('layout-align-siblings').checked,
        hideRoot: document.getElementById('layout-hide-root').checked,
        spacing: document.getElementById('layout-spacing').value
    };
}

function updateLayoutSetting(key, value) {
    // 修復：當設定變更時，如果存在上一次的排版類型，則重新排版
    if (key === 'hideRoot') {
        const rootNode = document.querySelector('.group[data-parent-id=""]');
        if (rootNode) {
            rootNode.style.display = value ? 'none' : 'block';
            svgLayer.querySelectorAll(`line[data-from="${rootNode.dataset.id}"], line[data-to="${rootNode.dataset.id}"]`).forEach(line => {
                line.style.display = value ? 'none' : 'block';
            });
        }
    }
    if (lastLayoutType) {
        autoLayout(lastLayoutType);
    }
    saveHistory();
}

function updateCanvasBg() {
    const type = document.getElementById('bg-fill-type').value;
    const color = document.getElementById('bg-color-picker').value;
    if (type === 'none') {
        document.documentElement.style.setProperty('--bg-color', 'transparent');
        canvas.style.backgroundImage = 'none';
    } else if (type === 'solid') {
        document.documentElement.style.setProperty('--bg-color', color);
        canvas.style.backgroundImage = 'none'; 
    } else if (type === 'image') {
        alert('圖片填充功能尚未實裝');
        document.getElementById('bg-fill-type').value = 'solid';
    }
}

function toggleThemeDropdown() {
    document.getElementById('theme-dropdown').classList.toggle('hidden');
}

function selectTheme(themeId, themeName, colors = []) {
    document.getElementById('theme-dropdown').classList.add('hidden');
    
    const nameToSet = themeName || themeNames[themeId];
    if(nameToSet) document.getElementById('current-theme-name').textContent = nameToSet;
    
    const colorsToSet = colors.length > 0 ? colors : themePalettes[themeId];
    if (colorsToSet) {
        const displayBar = document.querySelector('#current-theme-display div');
        displayBar.innerHTML = '';
        colorsToSet.slice(0, 5).forEach(color => {
            const div = document.createElement('div');
            div.className = 'flex-1';
            div.style.backgroundColor = color;
            displayBar.appendChild(div);
        });
    }
    applyGlobalTheme(themeId);
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('theme-dropdown');
    const trigger = document.getElementById('current-theme-display');
    if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !trigger.parentNode.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

function applyPresetNodeStyle(styleType) {
    if (multiSelectedNodeIds.length === 0) { alert('請先選取一個節點'); return; }
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if (!nodeEl) return;
        
        nodeEl.style.border = '2px solid transparent';
        nodeEl.style.textDecoration = 'none';
        nodeEl.style.textDecorationLine = 'none';

        switch (styleType) {
            case 'important': applyColorToNode(nodeEl, '#ea5455'); break;
            case 'pending': applyColorToNode(nodeEl, '#f0932b'); break;
            case 'done': applyColorToNode(nodeEl, '#6ab04c'); break;
            case 'highlight': applyColorToNode(nodeEl, '#487eb0'); break;
            case 'delete':
                applyColorToNode(nodeEl, '#b2bec3');
                nodeEl.style.textDecorationLine = 'line-through';
                break;
            case 'secondary':
                applyColorToNode(nodeEl, '#ffffff');
                nodeEl.style.color = '#f0932b';
                nodeEl.style.border = '2px dashed #f0932b';
                break;
        }
    });
    saveHistory();
}

function applyFontFamily(font) {
    if (multiSelectedNodeIds.length === 0) return;
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if (nodeEl) nodeEl.style.fontFamily = font;
    });
    updateSidebarForSelection();
    saveHistory();
}

function applyFontSize(size) {
    if (multiSelectedNodeIds.length === 0) return;
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if (nodeEl) nodeEl.style.fontSize = size;
    });
    updateSidebarForSelection();
    saveHistory();
}

function applyColor(colorCode) {
    if (multiSelectedNodeIds.length === 0) { alert('請先選取一個節點'); return; }
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"] .node-content`);
        if(nodeEl) applyColorToNode(nodeEl, colorCode);
    });
    saveHistory();
}

function applyLineStyle(key, value) {
    if (multiSelectedNodeIds.length === 0) { alert('請先選取一個節點'); return; }
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"]`);
        if (nodeEl && nodeEl.dataset.parentId) {
            nodeEl.dataset[key] = value;
            const line = svgLayer.querySelector(`line[data-to="${id}"]`);
            if (line) updateSpecificLine(line);
        }
    });
    updateSidebarForSelection();
    saveHistory();
}

function applyLineLabel(label) {
    if (multiSelectedNodeIds.length === 0) { alert('請先選取一個節點'); return; }
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"]`);
        if (nodeEl && nodeEl.dataset.parentId) {
            nodeEl.dataset.lineLabel = label;
            const line = svgLayer.querySelector(`line[data-to="${id}"]`);
            if (line) updateSpecificLine(line);
        }
    });
    saveHistory();
}

function drawLine(fromId, toId) {
    if (svgLayer.querySelector(`line[data-from="${fromId}"][data-to="${toId}"]`)) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', themes[currentTheme].line);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    line.dataset.from = fromId;
    line.dataset.to = toId;
    svgLayer.appendChild(line);
    updateSpecificLine(line);
}
updateCollapseButtons();

// 智慧連接線：計算線與節點矩形的交點
function getIntersectionPoint(p1, p2, rect) {
    const { left, top, width, height } = rect;
    const p2_center = { x: left + width / 2, y: top + height / 2 };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (dx === 0 && dy === 0) return p2_center;

    const t = Math.max(
        Math.abs(p1.x - p2_center.x) / (width / 2),
        Math.abs(p1.y - p2_center.y) / (height / 2)
    );

    return {
        x: p2_center.x + (p1.x - p2_center.x) / t,
        y: p2_center.y + (p1.y - p2_center.y) / t,
    };
}

function updateSpecificLine(line) {
    const fromEl = document.querySelector(`[data-id="${line.dataset.from}"]`);
    const toEl = document.querySelector(`[data-id="${line.dataset.to}"]`);
    if (!fromEl || !toEl) return;
    
    const fromRect = { left: fromEl.offsetLeft, top: fromEl.offsetTop, width: fromEl.offsetWidth, height: fromEl.offsetHeight };
    const toRect = { left: toEl.offsetLeft, top: toEl.offsetTop, width: toEl.offsetWidth, height: toEl.offsetHeight };

    const fromCenter = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
    const toCenter = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };

    // 計算智慧連接點
    const fromPoint = getIntersectionPoint(toCenter, fromCenter, fromRect);
    const toPoint = getIntersectionPoint(fromCenter, toCenter, toRect);

    line.setAttribute('x1', fromPoint.x);
    line.setAttribute('y1', fromPoint.y);
    line.setAttribute('x2', toPoint.x);
    line.setAttribute('y2', toPoint.y);

    // Apply line styles
    const lineStyle = toEl.dataset.lineStyle || 'solid';
    const lineArrow = toEl.dataset.lineArrow || 'none';
    const lineLabel = toEl.dataset.lineLabel || '';

    if (lineStyle === 'dashed') line.setAttribute('stroke-dasharray', '8, 6');
    else if (lineStyle === 'dotted') line.setAttribute('stroke-dasharray', '2, 5');
    else line.removeAttribute('stroke-dasharray');

    // 套用各種不同的箭頭 marker
    if (lineArrow === 'arrow') line.setAttribute('marker-end', 'url(#marker-arrow)');
    else if (lineArrow === 'triangle') line.setAttribute('marker-end', 'url(#marker-triangle)');
    else if (lineArrow === 'circle') line.setAttribute('marker-end', 'url(#marker-circle)');
    else if (lineArrow === 'diamond') line.setAttribute('marker-end', 'url(#marker-diamond)');
    else line.removeAttribute('marker-end');

    // --- NEW: Update or create the text label ---
    const toId = line.dataset.to;
    let textEl = svgLayer.querySelector(`text[data-for-to="${toId}"]`);

    if (lineLabel) {
        if (!textEl) {
            textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.dataset.forTo = toId;
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dy', '-4');
            textEl.setAttribute('font-size', '12');
            textEl.setAttribute('font-family', 'sans-serif');
            textEl.setAttribute('fill', '#334155');
            textEl.setAttribute('stroke', 'white');
            textEl.setAttribute('stroke-width', '0.4em');
            textEl.setAttribute('paint-order', 'stroke');
            svgLayer.appendChild(textEl);
        }
        textEl.textContent = lineLabel;
        textEl.setAttribute('x', (fromPoint.x + toPoint.x) / 2);
        textEl.setAttribute('y', (fromPoint.y + toPoint.y) / 2);
    } else if (textEl) {
        textEl.remove();
    }
}

function updateLinesForNode(nodeId) {
    svgLayer.querySelectorAll(`line[data-from="${nodeId}"], line[data-to="${nodeId}"]`).forEach(line => {
        updateSpecificLine(line);
    });
}

// --- Marquee Selection & Dragging ---
let isMarqueeSelecting = false;
let marqueeStart = { x: 0, y: 0 };
const selectionBox = document.getElementById('selection-box');

function initEditorEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
    canvasContainer.addEventListener('contextmenu', showContextMenu);
    document.addEventListener('click', hideContextMenu, true); // Use capture phase to hide menu first

    canvasContainer.addEventListener('mousedown', (e) => {
        // Only act on clicks on the background
        if (e.target === canvas || e.target === canvasContainer || e.target === canvasContent) {
            if (e.button === 0) { // Left mouse button
                isMarqueeSelecting = true;
                isPanning = false; // Ensure panning is off
                const rect = canvas.getBoundingClientRect();
                marqueeStart.x = e.clientX - rect.left;
                marqueeStart.y = e.clientY - rect.top;

                selectionBox.style.left = `${marqueeStart.x}px`;
                selectionBox.style.top = `${marqueeStart.y}px`;
                selectionBox.style.width = '0px';
                selectionBox.style.height = '0px';
                selectionBox.classList.remove('hidden');
                if (!e.ctrlKey && !e.metaKey) clearSelection();
            }
        }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
    if (isMarqueeSelecting) {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const left = Math.min(currentX, marqueeStart.x);
        const top = Math.min(currentY, marqueeStart.y);
        const width = Math.abs(currentX - marqueeStart.x);
        const height = Math.abs(currentY - marqueeStart.y);
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        document.querySelectorAll('#canvas .group').forEach(nodeWrapper => {
            const nodeRect = nodeWrapper.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const nodeLeft = (nodeWrapper.offsetLeft * scale) + panOffset.x;
            const nodeTop = (nodeWrapper.offsetTop * scale) + panOffset.y;
            const nodeRight = nodeLeft + (nodeRect.width * scale);
            const nodeBottom = nodeTop + (nodeRect.height * scale);

            const nodeContent = nodeWrapper.querySelector('.node-content');
            const id = parseInt(nodeWrapper.dataset.id);

            if (nodeRight > left && nodeLeft < left + width && nodeBottom > top && nodeTop < top + height) {
                if (!multiSelectedNodeIds.includes(id)) multiSelectedNodeIds.push(id);
                nodeContent.classList.add('multi-selected');
            } else {
                multiSelectedNodeIds = multiSelectedNodeIds.filter(i => i !== id);
                nodeContent.classList.remove('multi-selected');
            }
        });
    } else if (draggedElement) {
        let x = (e.clientX - canvasContainer.getBoundingClientRect().left - panOffset.x) / scale - offset.x;
        let y = (e.clientY - canvasContainer.getBoundingClientRect().top - panOffset.y) / scale - offset.y;
        draggedElement.style.left = `${x}px`;
        draggedElement.style.top = `${y}px`;
        updateLinesForNode(draggedElement.dataset.id);
    } else if (isMultiDragging) {
        const deltaX = (e.pageX - offset.x) / scale;
        const deltaY = (e.pageY - offset.y) / scale;
        dragStartPositions.forEach((pos, id) => {
            pos.el.style.left = `${pos.x + deltaX}px`;
            pos.el.style.top = `${pos.y + deltaY}px`;
            updateLinesForNode(id);
        });
    } else if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        panOffset.x += dx;
        panOffset.y += dy;
        lastMousePos = { x: e.clientX, y: e.clientY };
        updateCanvasTransform();
    }
});
    
    document.addEventListener('mouseup', () => {
    if (draggedElement || isMultiDragging) {
        if(draggedElement) draggedElement.style.zIndex = 10;
        if(isMultiDragging) dragStartPositions.forEach(pos => pos.el.style.zIndex = 10);
        saveHistory();
        draggedElement = null;
        isMultiDragging = false;
    }
    if (isMarqueeSelecting) {
        isMarqueeSelecting = false;
        selectionBox.classList.add('hidden');
        updateSelectionUI();
    }
    isPanning = false; // Reset panning state on any mouse up
    });
}

// --- 新增：聚焦中心主題 ---
function focusOnRootNode() {
    const rootNode = document.querySelector('.group[data-parent-id=""]');
    if (!rootNode) return;

    const containerRect = canvasContainer.getBoundingClientRect();

    // 重設縮放以獲得一致的視圖
    scale = 1;

    // 計算平移量以將節點置中
    panOffset.x = (containerRect.width / 2) - (rootNode.offsetLeft + rootNode.offsetWidth / 2);
    panOffset.y = (containerRect.height / 2) - (rootNode.offsetTop + rootNode.offsetHeight / 2);

    updateCanvasTransform();
}

// --- Context Menu ---
function showContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasContainer.getBoundingClientRect();
    
    // Save canvas-relative coordinates for node creation
    contextMenuPos.x = (e.clientX - rect.left - panOffset.x) / scale;
    contextMenuPos.y = (e.clientY - rect.top - panOffset.y) / scale;

    // Position menu relative to viewport
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.classList.remove('hidden');
}

function hideContextMenu(e) {
    if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
    }
}

function addNodeFromContextMenu() {
    const newNodeData = { x: contextMenuPos.x, y: contextMenuPos.y, text: '新節點', parentId: null };
    createNodeDOM(newNodeData);
    saveHistory();
    contextMenu.classList.add('hidden');
}

// --- Auto Layout ---
function autoLayout(type) {
    lastLayoutType = type; // 記錄最後使用的排版類型
    const nodes = getCurrentNodesState();
    if(nodes.length === 0) return;
    const root = nodes.find(n => !n.parentId) || nodes[0];
    
    const childrenMap = {};
    nodes.forEach(n => {
        if(n.parentId) {
            if(!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
            childrenMap[n.parentId].push(n.id);
        }
    });

    const settings = getCurrentLayoutSettings();
    const spacingMap = { 'compact': {h: 120, v: 50}, 'default': {h: 160, v: 80}, 'loose': {h: 220, v: 110} };
    const gaps = spacingMap[settings.spacing] || spacingMap['default'];

    const hGap = gaps.h; 
    const vGap = gaps.v;  
    let timelineCounter = 0;
    let yOffsets = {};

    function calcPositions(nodeId, depth, index, total, baseX, baseY, direction = 'right') {
        const dom = document.querySelector(`[data-id="${nodeId}"]`);
        if(!dom) return;
        const children = childrenMap[nodeId] || [];

        let newX = baseX;
        let newY = baseY;

        if (settings.alignSiblings && depth > 0) {
            const parentId = nodes.find(n => n.id === nodeId).parentId;
            if (!yOffsets[parentId]) yOffsets[parentId] = baseY - ((total - 1) * vGap / 2);
            newY = yOffsets[parentId] + (index * vGap);
        }

        if(type === 'mindmap-right') {
            newX = baseX + (depth === 0 ? 0 : hGap);
            if (!settings.alignSiblings) {
                const spread = (total - 1) * vGap;
                newY = baseY - (spread / 2) + (index * vGap);
            }
            dom.style.left = `${newX}px`;
            dom.style.top = `${newY}px`;
            children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY, 'right'));
        
        } else if(type === 'mindmap-left') {
            newX = baseX - (depth === 0 ? 0 : hGap);
            if (!settings.alignSiblings) {
                const spread = (total - 1) * vGap;
                newY = baseY - (spread / 2) + (index * vGap);
            }
            dom.style.left = `${newX}px`;
            dom.style.top = `${newY}px`;
            children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY, 'left'));

        } else if(type === 'mindmap-both' && depth === 0) {
            dom.style.left = `${baseX}px`;
            dom.style.top = `${baseY}px`;
            const half = Math.ceil(children.length / 2);
            const rightChildren = children.slice(0, half);
            const leftChildren = children.slice(half);
            rightChildren.forEach((cId, i) => calcPositions(cId, 1, i, rightChildren.length, baseX, baseY, 'right'));
            leftChildren.forEach((cId, i) => calcPositions(cId, 1, i, leftChildren.length, baseX, baseY, 'left'));
        
        } else if(type === 'mindmap-both' && depth > 0) {
            newX = baseX + (direction === 'right' ? hGap : -hGap);
            if (!settings.alignSiblings) {
                const spread = (total - 1) * vGap;
                newY = baseY - (spread / 2) + (index * vGap);
            }
            dom.style.left = `${newX}px`;
            dom.style.top = `${newY}px`;
            children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY, direction));

        } else if(type === 'orgchart-down') {
            newY = baseY + (depth === 0 ? 0 : vGap * 1.5);
            const spread = (total - 1) * hGap;
            newX = baseX - (spread / 2) + (index * hGap);
            dom.style.left = `${newX}px`;
            dom.style.top = `${newY}px`;
            children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY));

        } else if(type === 'orgchart-up') {
            newY = baseY - (depth === 0 ? 0 : vGap * 1.5);
            const spread = (total - 1) * hGap;
            newX = baseX - (spread / 2) + (index * hGap);
            dom.style.left = `${newX}px`;
            dom.style.top = `${newY}px`;
            children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY));

        } else if (type === 'timeline' || type === 'fishbone') {
            if (depth === 0) {
                newX = 100;
                newY = baseY;
                dom.style.left = `${newX}px`;
                dom.style.top = `${newY}px`;
                children.forEach((cId, i) => calcPositions(cId, 1, i, children.length, newX, newY));
            } else if (depth === 1) {
                timelineCounter++;
                newX = baseX + (timelineCounter * hGap * 1.2);
                newY = baseY;
                dom.style.left = `${newX}px`;
                dom.style.top = `${newY}px`;
                children.forEach((cId, i) => calcPositions(cId, 2, i, children.length, newX, newY, timelineCounter % 2 === 0 ? 'up' : 'down'));
            } else {
                newX = baseX;
                let multiplier = (index + 1);
                newY = direction === 'up' ? baseY - (multiplier * vGap) : baseY + (multiplier * vGap);
                if(type === 'fishbone') newX = baseX + (multiplier * 40);
                
                dom.style.left = `${newX}px`;
                dom.style.top = `${newY}px`;
                children.forEach((cId, i) => calcPositions(cId, depth+1, i, children.length, newX, newY, direction));
            }
        }
    }

    const canvasRect = canvas.getBoundingClientRect();
    const rootBaseX = Math.max(canvasRect.width / 2, 400);
    const rootBaseY = Math.max(canvasRect.height / 2, 300);

    calcPositions(root.id, 0, 0, 1, rootBaseX, rootBaseY);

    nodes.forEach(n => updateLinesForNode(n.id));
    saveHistory();
}

function exportJSON() {
    if(!currentFileId) return;
    const file = files.find(f => f.id === currentFileId);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(file, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", file.name + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// --- 新增：縮放與平移 ---
function updateCanvasTransform() {
    canvasContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`;
}

function handleWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) { // Zoom
        const rect = canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const mousePointX = (mouseX - panOffset.x) / scale;
        const mousePointY = (mouseY - panOffset.y) / scale;

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.2, Math.min(3, scale + delta));

        panOffset.x = mouseX - mousePointX * newScale;
        panOffset.y = mouseY - mousePointY * newScale;
        scale = newScale;

    } else { // Pan
        panOffset.x -= e.deltaX;
        panOffset.y -= e.deltaY;
    }
    updateCanvasTransform();
}

// --- 新增：鍵盤快捷鍵 ---
function handleKeyDown(e) {
    // Don't trigger shortcuts if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && multiSelectedNodeIds.length > 0) {
        e.preventDefault();
        deleteSelectedNodes();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyNodes();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteNodes();
    } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        focusOnRootNode();
    }
}

function deleteSelectedNodes() {
    multiSelectedNodeIds.forEach(id => {
        document.querySelector(`[data-id="${id}"]`)?.remove();
        svgLayer.querySelectorAll(`line[data-from="${id}"], line[data-to="${id}"]`).forEach(line => {
            const toId = line.dataset.to;
            svgLayer.querySelector(`text[data-for-to="${toId}"]`)?.remove();
            line.remove();
        });
    });
    clearSelection();
    saveHistory();
}

function copyNodes() {
    if (multiSelectedNodeIds.length === 0) return;
    const allNodes = getCurrentNodesState();
    const selectedNodes = allNodes.filter(n => multiSelectedNodeIds.includes(n.id));

    if (selectedNodes.length > 0) {
        // Find a base position to make pasting relative
        const baseNode = selectedNodes[0];
        nodeClipboard.nodes = selectedNodes.map(node => ({
            ...node,
            originalId: node.id,
            offsetX: node.x - baseNode.x,
            offsetY: node.y - baseNode.y
        }));
        nodeClipboard.baseId = baseNode.id;
        console.log('Copied nodes:', nodeClipboard);
    }
}

function pasteNodes() {
    if (nodeClipboard.nodes.length === 0) return;

    clearSelection();
    const idMap = new Map();
    const newIds = [];
    const pasteOffset = 30;

    // First pass: create all new nodes and map old IDs to new IDs
    nodeClipboard.nodes.forEach(nodeToPaste => {
        const newId = ++nodeIdCounter;
        idMap.set(nodeToPaste.originalId, newId);
        newIds.push(newId);

        const newNodeData = {
            ...nodeToPaste,
            id: newId,
            x: nodeToPaste.x + pasteOffset,
            y: nodeToPaste.y + pasteOffset,
            parentId: null // We'll set this in the second pass
        };
        createNodeDOM(newNodeData);
    });

    // Second pass: update parent IDs and draw lines
    newIds.forEach(newId => {
        const newNodeEl = document.querySelector(`[data-id="${newId}"]`);
        const originalId = [...idMap.entries()].find(([_, val]) => val === newId)[0];
        const originalNodeData = nodeClipboard.nodes.find(n => n.originalId === originalId);

        if (originalNodeData.parentId && idMap.has(originalNodeData.parentId)) {
            const newParentId = idMap.get(originalNodeData.parentId);
            newNodeEl.dataset.parentId = newParentId;
            drawLine(newParentId, newId);
        }
    });

    multiSelectedNodeIds = newIds;
    multiSelectedNodeIds.forEach(id => {
        document.querySelector(`[data-id="${id}"] .node-content`)?.classList.add('multi-selected');
    });
    if (newIds.length > 0) {
        selectedNodeId = newIds[0];
        document.querySelector(`[data-id="${selectedNodeId}"] .node-content`)?.classList.add('node-selected');
    }
    updateSidebarForSelection();
    saveHistory();
}

// --- 新增：圖示與圖片 ---
const iconList = ['fa-star', 'fa-flag', 'fa-bookmark', 'fa-circle-check', 'fa-circle-xmark', 'fa-circle-exclamation', 'fa-circle-question', 'fa-lightbulb', 'fa-heart', 'fa-thumbs-up', 'fa-comment', 'fa-user'];

function populateIconLibrary() {
    const library = document.getElementById('icon-library');
    library.innerHTML = iconList.map(icon =>
        `<button onclick="addIconToNode('fa-solid ${icon}')" class="w-10 h-10 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 text-xl transition-colors flex items-center justify-center">
            <i class="fa-solid ${icon}"></i>
        </button>`
    ).join('');
}

function addIconToNode(iconClass) {
    if (multiSelectedNodeIds.length === 0) { alert('請先選取節點'); return; }
    multiSelectedNodeIds.forEach(id => {
        const nodeEl = document.querySelector(`[data-id="${id}"]`);
        if (nodeEl) {
            nodeEl.dataset.iconClass = iconClass;
            // Re-render node is too complex, let's just update DOM directly
            const contentEl = nodeEl.querySelector('.node-content');
            let icon = contentEl.querySelector('.node-icon');
            if (!icon) {
                icon = document.createElement('i');
                contentEl.querySelector('.node-text-content').before(icon);
            }
            icon.className = `${iconClass} node-icon`;
        }
    });
    saveHistory();
}

function triggerImageUpload() {
    if (multiSelectedNodeIds.length !== 1) { alert('請選取單一節點來上傳圖片'); return; }
    document.getElementById('image-upload-input').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !selectedNodeId) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        const nodeEl = document.querySelector(`[data-id="${selectedNodeId}"]`);
        nodeEl.dataset.imageUrl = imageUrl;
        // For simplicity, we reload the node to show the image
        saveHistory(); // Save state before reload
        const state = getCurrentNodesState();
        loadNodes(state);
    };
    reader.readAsDataURL(file);
}
