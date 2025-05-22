// content.js
// Define version and debug settings
const QB_CURSOR_VERSION = '1.0.2';
const DEBUG = false;

function log(...args) {
    if (DEBUG) {
        console.log('[QB Cursor]', ...args);
    }
}

function getSelectedText() {
    // Handle potential null value for window.getSelection()
    const selection = window.getSelection();
    if (!selection) return '';
    return selection.toString();
}

// Keep track of shortcut key state
const keyState = {
    meta: false,    // Command/Windows key
    ctrl: false,    // Control key
    alt: false,     // Alt key
    shift: false    // Shift key
};

// Handle mouse movement
function handleMouseMove(e) {
    const overlay = document.getElementById('qb-cursor-overlay');
    if (overlay) {
        overlay.style.left = `${e.clientX}px`;
        overlay.style.top = `${e.clientY}px`;
    }
}

// Add a transparent overlay that follows the mouse and shows our custom cursor
function addCursorOverlay() {
    try {
        // Remove any existing overlay first
        removeCursorOverlay();
        
        // Create an overlay div for the custom cursor
        const overlay = document.createElement('div');
        overlay.id = 'qb-cursor-overlay';
        overlay.style.cssText = `
            position: fixed;
            width: 24px;
            height: 24px;
            pointer-events: none;
            z-index: 2147483647;
            background-image: url('${chrome.runtime.getURL('qb_icon.svg')}');
            background-size: contain;
            background-repeat: no-repeat;
            transform: translate(-12px, -12px);
            transition: opacity 0.1s ease;
        `;
        
        document.body.appendChild(overlay);
        
        // Hide the actual cursor
        document.documentElement.style.cursor = 'none';
        document.body.style.cursor = 'none';
        
        // Update overlay position on mouse move
        document.addEventListener('mousemove', handleMouseMove);
        
        // Store that we enabled the cursor
        document.documentElement.dataset.qbCursorEnabled = 'true';
        
        log('Cursor overlay added');
    } catch (error) {
        console.error('[QB Cursor] Error adding cursor overlay:', error);
    }
}

// Remove the cursor overlay
function removeCursorOverlay() {
    try {
        const overlay = document.getElementById('qb-cursor-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Restore original cursor
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
        
        // Remove mousemove listener
        document.removeEventListener('mousemove', handleMouseMove);
        
        // Update state
        delete document.documentElement.dataset.qbCursorEnabled;
        document.body.removeAttribute('data-qb-cursor-paused');
        
        log('Cursor overlay removed');
    } catch (error) {
        console.error('[QB Cursor] Error removing cursor overlay:', error);
    }
}

// Function to enable custom cursor
function enableCustomCursor() {
    addCursorOverlay();
    
    // Set up keydown/keyup listeners with capture to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    log('Custom cursor enabled');
}

// Function to disable custom cursor
function disableCustomCursor() {
    removeCursorOverlay();
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('keyup', handleKeyUp, true);
    
    log('Custom cursor disabled');
}

// Temporarily disable the cursor overlay but maintain state
function temporarilyDisableCursor() {
    try {
        const overlay = document.getElementById('qb-cursor-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            
            // Restore default cursor temporarily
            document.documentElement.style.cursor = '';
            document.body.style.cursor = '';
            
            // Mark as temporarily disabled
            document.body.setAttribute('data-qb-cursor-paused', 'true');
            
            log('Cursor temporarily disabled');
        }
    } catch (error) {
        console.error('[QB Cursor] Error temporarily disabling cursor:', error);
    }
}

// Re-enable the cursor overlay
function reEnableCursor() {
    try {
        const overlay = document.getElementById('qb-cursor-overlay');
        if (overlay) {
            overlay.style.opacity = '1';
            
            // Hide cursor again
            document.documentElement.style.cursor = 'none';
            document.body.style.cursor = 'none';
            
            // Remove paused state
            document.body.removeAttribute('data-qb-cursor-paused');
            
            log('Cursor re-enabled');
        }
    } catch (error) {
        console.error('[QB Cursor] Error re-enabling cursor:', error);
    }
}

// Handle key combinations - using capture phase to intercept before other handlers
function handleKeyDown(e) {
    // Update key state
    keyState.meta = e.metaKey;
    keyState.ctrl = e.ctrlKey;
    keyState.alt = e.altKey;
    keyState.shift = e.shiftKey;
    
    log('Key down', e.key, keyState);
    
    // For Cmd+I (Mac) or Ctrl+I (Windows) specifically - italic text
    if ((keyState.meta || keyState.ctrl) && e.key.toLowerCase() === 'i') {
        log('Detected Cmd/Ctrl+I shortcut');
        
        // Completely remove cursor for italic command
        removeCursorOverlay();
        
        // Re-add after a delay
        setTimeout(() => {
            if (document.documentElement.dataset.qbCursorEnabled) {
                addCursorOverlay();
                log('Re-adding cursor after Cmd/Ctrl+I');
            }
        }, 1000);
        
        // Allow event to propagate
        return;
    }
    
    // For any other keyboard shortcut
    if (keyState.meta || keyState.ctrl) {
        temporarilyDisableCursor();
    }
}

function handleKeyUp(e) {
    // Update key state
    keyState.meta = e.metaKey;
    keyState.ctrl = e.ctrlKey;
    keyState.alt = e.altKey;
    keyState.shift = e.shiftKey;
    
    log('Key up', e.key, keyState);
    
    // If no modifier keys are pressed anymore
    if (!keyState.meta && !keyState.ctrl && !keyState.alt && !keyState.shift) {
        // Wait a moment to ensure the keyboard shortcut has been processed
        setTimeout(() => {
            if (document.documentElement.dataset.qbCursorEnabled && 
                document.body.getAttribute('data-qb-cursor-paused') === 'true') {
                reEnableCursor();
            }
        }, 300);
    }
}

// Initialize the extension
function initialize() {
    if (window.qbCursorInitialized) {
        log('Already initialized, skipping');
        return;
    }
    
    window.qbCursorInitialized = true;
    log('Initializing QB cursor, version', QB_CURSOR_VERSION);
    
    // Always enable cursor by default
    // But wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableCustomCursor);
    } else {
        enableCustomCursor();
    }
    
    // Message handling
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        log('Received message', request);
        
        if (request.type === "GET_SELECTED_TEXT") {
            // Get the selected text from the current page
            const selectedText = getSelectedText();
            if (selectedText) {
                sendResponse({ text: selectedText });
            } else {
                sendResponse({ text: "No text selected" });
            }
            
            // Return true to indicate we will send a response asynchronously
            return true;
        } else if (request.type === "TOGGLE_CURSOR") {
            // Always enable cursor regardless of the message content
            enableCustomCursor();
            sendResponse({ success: true });
            return true;
        } else if (request.type === "ARE_YOU_THERE") {
            // For ping checks from background script
            sendResponse({ alive: true, version: QB_CURSOR_VERSION });
            return true;
        }
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Check if we need to re-enable the cursor
            if (document.documentElement.dataset.qbCursorEnabled && 
                !document.getElementById('qb-cursor-overlay')) {
                log('Page became visible, re-enabling cursor');
                enableCustomCursor();
            }
        }
    });
    
    // Handle iframe focus/blur events which might affect cursor visibility
    window.addEventListener('blur', () => {
        // If window loses focus, we might be in an iframe scenario
        log('Window lost focus');
        temporarilyDisableCursor();
    });
    
    window.addEventListener('focus', () => {
        // Restore cursor when window regains focus
        log('Window gained focus');
        if (document.documentElement.dataset.qbCursorEnabled) {
            reEnableCursor();
        }
    });
    
    // Handle specific events that might interfere with keyboard shortcuts
    document.addEventListener('beforeinput', (e) => {
        // If in an editable element, temporarily disable cursor
        if (document.activeElement && 
            (document.activeElement.isContentEditable || 
             document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA')) {
            log('Text editing, temporarily disabling cursor');
            temporarilyDisableCursor();
        }
    }, true);
    
    // Re-enable cursor after input is complete
    document.addEventListener('input', (e) => {
        // Short delay to ensure the input has been processed
        setTimeout(() => {
            if (document.documentElement.dataset.qbCursorEnabled) {
                log('Input complete, re-enabling cursor');
                reEnableCursor();
            }
        }, 100);
    }, true);
}

// Run initialization
initialize();

// Log that content script is loaded and ready
console.log("QB extension content script is ready with custom cursor");
