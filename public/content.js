// content.js
function getSelectedText() {
    // Handle potential null value for window.getSelection()
    const selection = window.getSelection();
    if (!selection) return '';
    return selection.toString();
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
    });

    // Log that content script is loaded and ready
    console.log("QB extension content script is ready");
}
