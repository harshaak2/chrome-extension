// responsible for handling the background tasks of the extension
chrome.runtime.onInstalled.addListener(() => {
  // syncs the storage across all the tabs
  chrome.storage.sync.get(["cycp"], (key) => {
    // takes to the mentioned url / page as soon as the extension is installed
    if (key.cycp === undefined) {
      chrome.tabs.create({ url: "options.html" });
    }
  });
  
  // Always set cursor enabled to true
  chrome.storage.sync.set({ cursorEnabled: true });
});

// Apply custom cursor to all new tabs automatically
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Skip chrome:// and other restricted URLs
    if (!tab.url || tab.url.startsWith("chrome://") || 
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")) {
      return;
    }

    // Use a more reliable approach to injecting the content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      // Delay sending the message slightly to ensure content script is ready
      setTimeout(() => {
        try {
          chrome.tabs.sendMessage(tabId, { 
            type: "TOGGLE_CURSOR", 
            enabled: true 
          });
        } catch (e) {
          console.error('Error sending message to tab:', e);
        }
      }, 200);
    }).catch(err => {
      // Likely a restricted page or other issue
      console.error('Error injecting content script:', err);
    });
  }
});

// Also handle tab activation to ensure cursor is applied when switching tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // Skip restricted URLs
    if (!tab.url || tab.url.startsWith("chrome://") || 
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")) {
      return;
    }
    
    // Try to send a message to check if content script is loaded
    chrome.tabs.sendMessage(activeInfo.tabId, { type: "ARE_YOU_THERE" }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded, inject it
        chrome.scripting.executeScript({
          target: { tabId: activeInfo.tabId },
          files: ['content.js']
        }).then(() => {
          chrome.tabs.sendMessage(activeInfo.tabId, { type: "TOGGLE_CURSOR", enabled: true });
        }).catch(err => {
          console.error('Error injecting content script on tab activation:', err);
        });
      } else if (response) {
        // Content script is already loaded, just send the toggle message
        chrome.tabs.sendMessage(activeInfo.tabId, { type: "TOGGLE_CURSOR", enabled: true });
      }
    });
  });
});
