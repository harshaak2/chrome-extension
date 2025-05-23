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

// Make sure we don't add multiple listeners
if (!window.hasSelectedTextListener) {
    window.hasSelectedTextListener = true;
    
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
