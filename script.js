// Clock functionality
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = hours + ':' + minutesStr + ' ' + ampm;
    document.getElementById('clock').textContent = timeString;
}

updateClock();
setInterval(updateClock, 1000);

// Window dragging and resizing functionality
let activeWindow = null;
let isDragging = false;
let isResizing = false;
let resizeDirection = null;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
let initialWidth;
let initialHeight;

const windows = document.querySelectorAll('.window');

windows.forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    const closeButton = win.querySelector('.close-button');
    const minimizeButton = win.querySelectorAll('.title-bar-button')[0];
    const maximizeButton = win.querySelectorAll('.title-bar-button')[1];
    
    // Add resize handles
    addResizeHandles(win);
    
    // Make window active when clicked
    win.addEventListener('mousedown', (e) => {
        makeWindowActive(win);
    });
    
    // Dragging
    titleBar.addEventListener('mousedown', dragStart);
    
    // Close button
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        win.style.display = 'none';
        win.classList.remove('minimized'); // Remove minimized state when closing
        updateTaskbar();
    });
    
    // Minimize button
    minimizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('minimized');
        win.style.display = 'none';
        updateTaskbar();
    });
    
    // Maximize button (toggle between maximized and normal)
    maximizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (win.style.width === '100%') {
            // Restore
            win.style.width = win.dataset.normalWidth || '600px';
            win.style.height = win.dataset.normalHeight || '450px';
            win.style.left = win.dataset.normalLeft || '150px';
            win.style.top = win.dataset.normalTop || '80px';
        } else {
            // Maximize
            win.dataset.normalWidth = win.style.width;
            win.dataset.normalHeight = win.style.height;
            win.dataset.normalLeft = win.style.left;
            win.dataset.normalTop = win.style.top;
            
            win.style.width = '100%';
            win.style.height = 'calc(100% - 28px)';
            win.style.left = '0';
            win.style.top = '0';
        }
    });
});

function dragStart(e) {
    if (e.target.classList.contains('title-bar-button')) {
        return;
    }
    
    const win = e.target.closest('.window');
    if (win.style.width === '100%') {
        return; // Don't allow dragging maximized windows
    }
    
    activeWindow = win;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    const transform = window.getComputedStyle(win).transform;
    if (transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        xOffset = matrix.m41;
        yOffset = matrix.m42;
    } else {
        xOffset = parseInt(win.style.left) || 0;
        yOffset = parseInt(win.style.top) || 0;
    }
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    isDragging = true;
}

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function drag(e) {
    if (isDragging && activeWindow) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, activeWindow);
    }
    
    if (isResizing && activeWindow) {
        e.preventDefault();
        
        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;
        
        if (resizeDirection === 'right' || resizeDirection === 'corner') {
            const newWidth = initialWidth + deltaX;
            if (newWidth >= 200) {
                activeWindow.style.width = newWidth + 'px';
            }
        }
        
        if (resizeDirection === 'left') {
            const newWidth = initialWidth - deltaX;
            if (newWidth >= 200) {
                activeWindow.style.width = newWidth + 'px';
                activeWindow.style.left = (parseInt(activeWindow.dataset.initialLeft) + deltaX) + 'px';
            }
        }
        
        if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
            const newHeight = initialHeight + deltaY;
            if (newHeight >= 100) {
                activeWindow.style.height = newHeight + 'px';
            }
        }
        
        if (resizeDirection === 'top') {
            const newHeight = initialHeight - deltaY;
            if (newHeight >= 100) {
                activeWindow.style.height = newHeight + 'px';
                activeWindow.style.top = (parseInt(activeWindow.dataset.initialTop) + deltaY) + 'px';
            }
        }
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.left = xPos + 'px';
    el.style.top = yPos + 'px';
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    isResizing = false;
    resizeDirection = null;
}

function makeWindowActive(win) {
    // Remove active class from all windows
    windows.forEach(w => w.classList.remove('active'));
    
    // Add active class to clicked window
    win.classList.add('active');
    
    // Bring to front
    let maxZ = 0;
    windows.forEach(w => {
        const z = parseInt(window.getComputedStyle(w).zIndex) || 0;
        if (z > maxZ) maxZ = z;
    });
    win.style.zIndex = maxZ + 1;
    
    updateTaskbar();
}

// Add resize handles to a window
function addResizeHandles(win) {
    // Check if handles already exist
    if (win.querySelector('.resize-handle')) {
        return;
    }
    
    // Left edge
    const leftHandle = document.createElement('div');
    leftHandle.className = 'resize-handle left';
    leftHandle.addEventListener('mousedown', (e) => resizeStart(e, win, 'left'));
    win.appendChild(leftHandle);
    
    // Right edge
    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle right';
    rightHandle.addEventListener('mousedown', (e) => resizeStart(e, win, 'right'));
    win.appendChild(rightHandle);
    
    // Top edge
    const topHandle = document.createElement('div');
    topHandle.className = 'resize-handle top';
    topHandle.addEventListener('mousedown', (e) => resizeStart(e, win, 'top'));
    win.appendChild(topHandle);
    
    // Bottom edge
    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'resize-handle bottom';
    bottomHandle.addEventListener('mousedown', (e) => resizeStart(e, win, 'bottom'));
    win.appendChild(bottomHandle);
    
    // Corner
    const cornerHandle = document.createElement('div');
    cornerHandle.className = 'resize-handle corner';
    cornerHandle.addEventListener('mousedown', (e) => resizeStart(e, win, 'corner'));
    win.appendChild(cornerHandle);
}

// Start resizing
function resizeStart(e, win, direction) {
    e.stopPropagation();
    e.preventDefault();
    
    if (win.style.width === '100%') {
        return; // Don't allow resizing maximized windows
    }
    
    activeWindow = win;
    isResizing = true;
    resizeDirection = direction;
    
    initialX = e.clientX;
    initialY = e.clientY;
    initialWidth = win.offsetWidth;
    initialHeight = win.offsetHeight;
    
    // Store initial position for left/top resizing
    win.dataset.initialLeft = parseInt(win.style.left) || 0;
    win.dataset.initialTop = parseInt(win.style.top) || 0;
    
    makeWindowActive(win);
}

// Desktop icon functionality
const desktopIcons = document.querySelectorAll('.desktop-icon');

desktopIcons.forEach(icon => {
    let clickCount = 0;
    let clickTimer = null;
    
    icon.addEventListener('click', (e) => {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                // Single click - select icon
                desktopIcons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            // Double click - open window
            clearTimeout(clickTimer);
            clickCount = 0;
            
            const iconType = icon.dataset.icon;
            openIconWindow(iconType);
        }
    });
});

// Function to open windows based on icon type
function openIconWindow(iconType) {
    switch(iconType) {
        case 'computer':
            openMyComputerWindow();
            break;
        case 'documents':
            openMyDocumentsWindow();
            break;
        case 'network':
            openNetworkWindow();
            break;
        case 'recycle':
            openRecycleBinWindow();
            break;
        case 'ie':
            openInternetExplorerWindow();
            break;
        case 'normal-view':
            // Navigate to the normal view
            window.location.href = 'ematth.dev/index.html';
            break;
    }
}

// Unified Explorer window for My Documents, My Network Places, Recycle Bin, and My Computer
window.openExplorerWindow = function(location, title, src) {
    const windowId = 'window-explorer';
    const existingWindow = document.getElementById(windowId);
    
    if (existingWindow) {
        // Window exists - navigate to new location
        existingWindow.style.display = 'flex';
        makeWindowActive(existingWindow);
        
        // Update title
        const titleBar = existingWindow.querySelector('.title-bar-text');
        if (titleBar) {
            titleBar.textContent = title;
        }
        
        // Navigate iframe to new location
        const iframe = existingWindow.querySelector('iframe');
        if (iframe) {
            iframe.src = src + '?t=' + Date.now();
        }
        
        updateTaskbar();
        return;
    }
    
    // Create new window
    createWindowWithIframe(windowId, title, src, 220, 140);
}

function openMyComputerWindow() {
    openExplorerWindow('my-computer', 'My Computer', 'mycomputer.html');
}

window.openWelcomeTxt = function() {
    createWindowWithIframe('window-welcome-txt', 'Welcome.txt - Notepad', 'documents/welcome-txt.html', 240, 160);
}

// Generic function to open any HTML document
window.openHTMLDocument = function(id, title, src, left, top) {
    createWindowWithIframe(id, title, src, left || 260, top || 180);
}

// Deprecated: kept for backwards compatibility
window.openExampleDocument = function() {
    window.openHTMLDocument('window-example-doc', 'Example Document', 'documents/example-document.html', 260, 180);
}

function createWindowWithIframe(id, title, src, left = 200, top = 100) {
    const existingWindow = document.getElementById(id);
    if (existingWindow) {
        existingWindow.style.display = 'flex';
        makeWindowActive(existingWindow);
        
        // Reload the iframe to show latest content
        const iframe = existingWindow.querySelector('iframe');
        if (iframe) {
            iframe.src = iframe.src.split('?')[0] + '?t=' + Date.now();
        }
        return;
    }
    
    // Add cache-busting parameter to iframe src
    const cacheBustedSrc = src + '?t=' + Date.now();
    
    const windowHTML = `
        <div class="window" id="${id}" style="left: ${left}px; top: ${top}px; width: 500px; height: 380px;">
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <button class="title-bar-button" aria-label="Minimize"></button>
                    <button class="title-bar-button" aria-label="Maximize"></button>
                    <button class="title-bar-button close-button" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-content">
                <div class="menu-bar">
                    <span class="menu-item"><u>F</u>ile</span>
                    <span class="menu-item"><u>E</u>dit</span>
                    <span class="menu-item"><u>V</u>iew</span>
                    <span class="menu-item">F<u>a</u>vorites</span>
                    <span class="menu-item"><u>T</u>ools</span>
                    <span class="menu-item"><u>H</u>elp</span>
                </div>
                <iframe src="${cacheBustedSrc}" frameborder="0" style="width: 100%; flex: 1; border: none; background: white;"></iframe>
            </div>
        </div>
    `;
    
    const desktop = document.querySelector('.desktop');
    desktop.insertAdjacentHTML('beforeend', windowHTML);
    
    const newWindow = document.getElementById(id);
    setupWindowEvents(newWindow);
    makeWindowActive(newWindow);
    updateTaskbar();
}

function openMyDocumentsWindow() {
    openExplorerWindow('my-documents', 'My Documents', 'mydocuments.html');
}

function openNetworkWindow() {
    openExplorerWindow('my-network', 'My Network Places', 'mynetwork.html');
}

function openRecycleBinWindow() {
    openExplorerWindow('recycle-bin', 'Recycle Bin', 'recyclebin.html');
}

function openInternetExplorerWindow() {
    // If IE window already exists, just show it
    const existingWindow = document.getElementById('window1');
    if (existingWindow) {
        existingWindow.style.display = 'flex';
        makeWindowActive(existingWindow);
        updateTaskbar();
        
        // Reload the iframe to reinitialize the animation
        const ieFrame = document.getElementById('ie-frame');
        if (ieFrame) {
            const currentSrc = ieFrame.src || 'http://localhost:8000/ematth.dev/index.html';
            ieFrame.src = currentSrc;
        }
        return;
    }
}

function createWindow(id, title, content, left = 200, top = 100) {
    const existingWindow = document.getElementById(id);
    if (existingWindow) {
        existingWindow.style.display = 'flex';
        makeWindowActive(existingWindow);
        return;
    }
    
    const windowHTML = `
        <div class="window" id="${id}" style="left: ${left}px; top: ${top}px; width: 500px; height: 380px;">
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <button class="title-bar-button" aria-label="Minimize"></button>
                    <button class="title-bar-button" aria-label="Maximize"></button>
                    <button class="title-bar-button close-button" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-content">
                <div class="menu-bar">
                    <span class="menu-item">File</span>
                    <span class="menu-item">Edit</span>
                    <span class="menu-item">View</span>
                    <span class="menu-item">Help</span>
                </div>
                ${content}
            </div>
        </div>
    `;
    
    const desktop = document.querySelector('.desktop');
    desktop.insertAdjacentHTML('beforeend', windowHTML);
    
    const newWindow = document.getElementById(id);
    setupWindowEvents(newWindow);
    makeWindowActive(newWindow);
    updateTaskbar();
}

function setupWindowEvents(win) {
    const titleBar = win.querySelector('.title-bar');
    const closeButton = win.querySelector('.close-button');
    const minimizeButton = win.querySelectorAll('.title-bar-button')[0];
    const maximizeButton = win.querySelectorAll('.title-bar-button')[1];
    
    // Add resize handles
    addResizeHandles(win);
    
    win.addEventListener('mousedown', (e) => {
        makeWindowActive(win);
    });
    
    titleBar.addEventListener('mousedown', dragStart);
    
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        win.style.display = 'none';
        win.classList.remove('minimized'); // Remove minimized state when closing
        updateTaskbar();
    });
    
    minimizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('minimized');
        win.style.display = 'none';
        updateTaskbar();
    });
    
    maximizeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (win.style.width === '100%') {
            win.style.width = win.dataset.normalWidth || '500px';
            win.style.height = win.dataset.normalHeight || '380px';
            win.style.left = win.dataset.normalLeft || '200px';
            win.style.top = win.dataset.normalTop || '100px';
        } else {
            win.dataset.normalWidth = win.style.width;
            win.dataset.normalHeight = win.style.height;
            win.dataset.normalLeft = win.style.left;
            win.dataset.normalTop = win.style.top;
            
            win.style.width = '100%';
            win.style.height = 'calc(100% - 28px)';
            win.style.left = '0';
            win.style.top = '0';
        }
    });
}

// Click on desktop to deselect icons
document.querySelector('.desktop').addEventListener('click', (e) => {
    if (e.target.classList.contains('desktop')) {
        desktopIcons.forEach(i => i.classList.remove('selected'));
    }
});

// Taskbar button functionality
function updateTaskbar() {
    const taskbarButtons = document.querySelector('.taskbar-buttons');
    taskbarButtons.innerHTML = '';
    
    // Get all windows (including dynamically created ones)
    const allWindows = document.querySelectorAll('.window');
    
    allWindows.forEach(win => {
        // Show button if window exists and hasn't been closed (not minimized counts)
        const isClosed = win.style.display === 'none' && !win.classList.contains('minimized');
        
        if (!isClosed) {
            const button = document.createElement('button');
            button.className = 'taskbar-button';
            button.textContent = win.querySelector('.title-bar-text').textContent;
            button.dataset.window = win.id;
            
            if (win.classList.contains('active') && win.style.display !== 'none') {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                if (win.style.display === 'none') {
                    // Restore minimized window
                    win.style.display = 'flex';
                    win.classList.remove('minimized');
                    makeWindowActive(win);
                } else if (win.classList.contains('active')) {
                    // Minimize if clicking on already active window
                    win.classList.add('minimized');
                    win.style.display = 'none';
                    updateTaskbar();
                } else {
                    // Activate if not active
                    makeWindowActive(win);
                }
            });
            
            taskbarButtons.appendChild(button);
        }
    });
}

// Initialize
updateTaskbar();
if (windows.length > 0 && windows[0].style.display !== 'none') {
    makeWindowActive(windows[0]);
}

// Start Menu functionality
const startButton = document.querySelector('.start-button');
const startMenu = document.getElementById('start-menu');

startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.classList.toggle('active');
    startButton.classList.toggle('active');
});

// Close start menu when clicking outside
document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
        startMenu.classList.remove('active');
        startButton.classList.remove('active');
    }
});

// Handle start menu item clicks
const startMenuItems = document.querySelectorAll('.start-menu-item');
startMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const action = item.getAttribute('data-action');
        handleStartMenuAction(action);
        startMenu.classList.remove('active');
        startButton.classList.remove('active');
    });
});

function handleStartMenuAction(action) {
    switch(action) {
        case 'programs':
            alert('Programs menu - Coming soon!');
            break;
        case 'documents':
            // Open My Documents
            const documentsIcon = document.querySelector('[data-icon="documents"]');
            if (documentsIcon) {
                documentsIcon.click();
                documentsIcon.click();
            }
            break;
        case 'settings':
            alert('Settings - Coming soon!');
            break;
        case 'search':
            alert('Search - Coming soon!');
            break;
        case 'help':
            alert('Help - Coming soon!');
            break;
        case 'run':
            alert('Run dialog - Coming soon!');
            break;
        case 'shutdown':
            if (confirm('Are you sure you want to shut down?')) {
                alert('Shutting down... (you can close the window now!)')
            }
            break;
    }
}

// Internet Explorer navigation
const ieFrame = document.getElementById('ie-frame');
const ieAddress = document.getElementById('ie-address');
const ieBack = document.getElementById('ie-back');
const ieForward = document.getElementById('ie-forward');
const ieRefresh = document.getElementById('ie-refresh');
const ieStop = document.getElementById('ie-stop');
const ieHome = document.getElementById('ie-home');

if (ieFrame && ieBack && ieForward && ieRefresh && ieHome) {
    // Back button
    ieBack.addEventListener('click', () => {
        try {
            ieFrame.contentWindow.history.back();
        } catch (e) {
            console.log('Cannot navigate back');
        }
    });
    
    // Forward button
    ieForward.addEventListener('click', () => {
        try {
            ieFrame.contentWindow.history.forward();
        } catch (e) {
            console.log('Cannot navigate forward');
        }
    });
    
    // Refresh button
    ieRefresh.addEventListener('click', () => {
        ieFrame.contentWindow.location.reload();
    });
    
    // Stop button
    ieStop.addEventListener('click', () => {
        try {
            ieFrame.contentWindow.stop();
        } catch (e) {
            console.log('Cannot stop loading');
        }
    });
    
    // Home button
    ieHome.addEventListener('click', () => {
        ieFrame.src = 'http://localhost:8000/ematth.dev/index.html';
        ieAddress.value = 'http://localhost:8000/ematth.dev/index.html';
    });
    
    // Update address bar when iframe navigates
    ieFrame.addEventListener('load', () => {
        try {
            const currentPath = ieFrame.contentWindow.location.pathname;
            const currentSearch = ieFrame.contentWindow.location.search;
            if (currentPath) {
                // Extract just the relevant part of the path
                const pathParts = currentPath.split('/');
                const relevantPath = pathParts.slice(-2).join('/');
                // Include query parameters if they exist
                ieAddress.value = relevantPath + currentSearch;
            }
        } catch (e) {
            // Cross-origin restrictions may prevent reading the location
            console.log('Cannot read iframe location');
        }
    });
}

// Automatically open welcome.txt on page load
window.addEventListener('load', function() {
    // Small delay to ensure everything is initialized
    setTimeout(function() {
        openWelcomeTxt();
    }, 300);
});
