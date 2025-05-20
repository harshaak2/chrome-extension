// Function to initialize the extension
function initExtension() {
    console.log("Initializing extension");
    const confirmButton = document.getElementById("confirm");
    
    if (!confirmButton) {
        console.error("Confirm button not found in the DOM");
        // Try again after a short delay
        setTimeout(initExtension, 100);
        return;
    }
    
    console.log("Confirm button found, adding click listener");
    
    confirmButton.addEventListener("click", () => {
        console.log("Confirm button clicked");
        const result = document.getElementById("result");
        result.textContent = "Extracting data...";
        result.style.color = "white";

        chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
            if (!tab) {
                result.textContent = "No active tab found";
                result.style.color = "red";
                return;
            }
            
            // Check if this is a valid URL where content scripts can run
            if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
                result.textContent = "Cannot access content on this page";
                result.style.color = "red";
                return;
            }

            // Make sure the content script is loaded first
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                });
                
                // Now send the message to the content script
                chrome.tabs.sendMessage(
                    tab.id,
                    { type: "GET_SELECTED_TEXT" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            result.textContent = "Error: " + chrome.runtime.lastError.message;
                            result.style.color = "red";
                            return;
                        }
                        
                        if (response && response.text) {
                            result.textContent = response.text;
                        } else {
                            result.textContent = "No text selected or cannot access page content";
                        }
                    }
                );
            } catch (error) {
                result.textContent = "Error: " + error.message;
                result.style.color = "red";
            }
        });
    });
}

// Start the initialization when the script loads
// If running at the end of body, DOM should be loaded
// If not, this will still work with setTimeout retry
initExtension();
