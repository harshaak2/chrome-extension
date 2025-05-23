// content.js
function getSelectedText() {
    // Handle potential null value for window.getSelection()
    const selection = window.getSelection();
    if (!selection) return '';
    return selection.toString();
}

// Get the cursor position or the position of selected text
function getCursorPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        // If no selection, try to get active element position (like cursor in input fields)
        if (document.activeElement) {
            try {
                const activeElement = document.activeElement;
                // Only consider text inputs, textareas, or contenteditable elements
                if (
                    activeElement.tagName === "INPUT" || 
                    activeElement.tagName === "TEXTAREA" || 
                    activeElement.getAttribute("contenteditable") === "true"
                ) {
                    const rect = activeElement.getBoundingClientRect();
                    // For input elements, return position under the element
                    return {
                        x: rect.left + window.scrollX,
                        y: rect.bottom + window.scrollY + 5, // 5px below the element
                        text: activeElement.value || activeElement.textContent || ""
                    };
                }
            } catch (e) {
                console.error("Error getting active element position:", e);
            }
        }
        return null;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    return {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5, // 5px below the selection
        text: selection.toString()
    };
}

// Create and add QBit icon element
function createQBitIcon() {
    const existingIcon = document.getElementById('qbit-selection-icon');
    if (existingIcon) return existingIcon;
    
    const icon = document.createElement('div');
    icon.id = 'qbit-selection-icon';
    icon.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        background-image: url(${chrome.runtime.getURL('qb_icon.svg')});
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        cursor: pointer;
        z-index: 10000;
        display: none;
        transition: transform 0.2s ease-in-out;
    `;
    
    icon.addEventListener('mouseover', () => {
        icon.style.transform = 'scale(1.2)';
    });
    
    icon.addEventListener('mouseout', () => {
        icon.style.transform = 'scale(1)';
    });
    
    icon.addEventListener('click', async (event) => {
        // Prevent the default action and stop event propagation
        event.preventDefault();
        event.stopPropagation();
        
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text) {
            console.log("QBit icon clicked with text:", text);
            
            // Hide the icon after clicking
            hideQBitIcon();
            
            // Send message to background script to open lookup popup with selected text
            chrome.runtime.sendMessage({
                type: "TRIGGER_AGENT_SEARCH",
                text: text
            }, response => {
                // Optional callback if you want to handle responses
                if (response && response.success) {
                    console.log("Agent search triggered successfully");
                } else {
                    console.error("Failed to trigger agent search or no response received");
                }
            });
        } else {
            console.warn("QBit icon clicked but no text selected");
        }
    });
    
    document.body.appendChild(icon);
    return icon;
}

// Show QBit icon near the selection
function showQBitIconNearSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
        hideQBitIcon();
        return;
    }
    
    console.log("Showing QBit icon for selection:", selection.toString().trim());
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position icon at the top-right of selection
    const icon = createQBitIcon();
    
    // Position exactly at the top-right corner of selection
    icon.style.left = `${rect.right + window.scrollX + 5}px`; // Add 5px offset from the selection
    icon.style.top = `${rect.top + window.scrollY - 5}px`; // Position slightly above the top of selection
    
    // Make sure the icon is visible within the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const iconLeft = parseFloat(icon.style.left);
    const iconTop = parseFloat(icon.style.top);
    
    if (iconLeft + 24 > viewportWidth) {
        icon.style.left = `${viewportWidth - 30}px`; // Keep it within viewport width
    }
    
    if (iconTop < 5) {
        icon.style.top = '5px'; // Keep it within viewport top
    }
    
    icon.style.display = 'block';
    
    // Add a nice fade-in effect
    icon.style.opacity = '0';
    icon.style.transition = 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out';
    setTimeout(() => {
        icon.style.opacity = '1';
    }, 10);
    
    console.log("QBit icon positioned at:", icon.style.left, icon.style.top);
}

// Hide QBit icon
function hideQBitIcon() {
    const icon = document.getElementById('qbit-selection-icon');
    if (icon) {
        icon.style.display = 'none';
    }
}

// Make sure we don't add multiple listeners
if (!window.hasSelectedTextListener) {
    window.hasSelectedTextListener = true;
    
    // Create the icon element when the script loads
    createQBitIcon();
    
    // Listen for text selection changes
    document.addEventListener('mouseup', () => {
        setTimeout(showQBitIconNearSelection, 100); // Small delay to ensure selection is complete
    });
    
    document.addEventListener('selectionchange', () => {
        // When selection changes, check if we need to show/hide the icon
        const selection = window.getSelection();
        if (!selection || selection.toString().trim() === '') {
            hideQBitIcon();
        }
    });
    
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
        }
        else if (request.type === "GET_CURSOR_POSITION") {
            const position = getCursorPosition();
            if (position && position.text) {
                sendResponse({ 
                    position: position,
                    text: position.text
                });
            } else {
                // If no text at cursor, get any highlighted text on the page
                const selectedText = getSelectedText();
                if (selectedText) {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    
                    sendResponse({ 
                        position: {
                            x: rect.left + window.scrollX,
                            y: rect.bottom + window.scrollY + 5,
                            text: selectedText
                        },
                        text: selectedText
                    });
                } else {
                    sendResponse({ 
                        position: null,
                        text: "No cursor position or text detected" 
                    });
                }
            }
            return true;
        }
    });

    // Log that content script is loaded and ready
    console.log("QB extension content script is ready");
}
