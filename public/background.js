// responsible for handling the background tasks of the extension
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  // syncs the storage across all the tabs
  chrome.storage.sync.get(["cycp"], (key) => {
    // takes to the mentioned url / page as soon as the extension is installed
    if (key.cycp === undefined) {
      chrome.tabs.create({ url: "options.html" });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus.create({
    id: "qbit",
    title: "QBit",
    contexts: ["all"], // appears on all contexts
  });

  chrome.contextMenus.create({
    id: "addToChat",
    title: "Add To Chat",
    contexts: ["selection"], // only appears when text is selected
  });
}

// Store selected text for lookup popup
let selectedTextForLookup = '';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRIGGER_AGENT_SEARCH") {
    console.log("Agent search triggered with text:", message.text);
    selectedTextForLookup = message.text;
    openLookupPopup(sender.tab, true);
    // Send a response back to confirm we received the message
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "open_lookup_popup") {
    openLookupPopup();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  
  if (info.menuItemId === "qbit") {
    console.log("QBit menu clicked, opening lookup popup");
    // Open lookup popup at cursor or selection location
    openLookupPopup(tab);
  }
  else if (info.menuItemId === "addToChat") {
    // Handle add to chat functionality (existing feature)
    if (info.selectionText) {
      // You can implement this part if needed
      console.log("Selected text:", info.selectionText);
    }
  }
});

// Function to open lookup popup
function openLookupPopup(tab, isAgentSearch = false) {
  // If tab is not provided, query for the active tab
  if (!tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      handleLookupPopup(activeTab, isAgentSearch);
    });
  } else {
    handleLookupPopup(tab, isAgentSearch);
  }
}

// Function to handle the lookup popup logic
function handleLookupPopup(activeTab, isAgentSearch = false) {
  if (!activeTab || !activeTab.id) return;
  
  // Skip if we're on a page where we can't execute scripts
  if (
    !activeTab.url ||
    activeTab.url.startsWith("chrome://") ||
    activeTab.url.startsWith("chrome-extension://") ||
    activeTab.url.startsWith("edge://") ||
    activeTab.url.startsWith("about:")
  ) {
    return;
  }
  
  // Execute the content script
  try {
    // Simplified approach: directly inject the script without Promise chaining
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Script execution error:", chrome.runtime.lastError.message);
        // Even if there's an error, try to show the popup in the center
        showLookupPopup(null, isAgentSearch);
        return;
      }
      
      // If it's a direct agent search trigger, we already have the text
      if (isAgentSearch) {
        // Get screen dimensions to ensure popup doesn't go off-screen
        chrome.windows.getCurrent((window) => {
          // Create popup without position data
          showLookupPopup(null, isAgentSearch);
        });
        return;
      }
      
      // Otherwise, get cursor position for regular popup
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: "GET_CURSOR_POSITION" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error getting cursor position:", chrome.runtime.lastError.message);
            showLookupPopup(null, isAgentSearch);
            return;
          }
          
          if (response && response.position && response.text) {
            // If getting a normal lookup, store the text
            if (!isAgentSearch) {
              selectedTextForLookup = response.text;
            }
            
            showLookupPopup(response.position, isAgentSearch);
          } else {
            // If no position is returned, show popup in center of screen
            console.log("No position data. Showing popup in center.");
            showLookupPopup(null, isAgentSearch);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error executing script:", error);
    // Show popup in center if there's an exception
    showLookupPopup(null, isAgentSearch);
  }
}

// Function to show the lookup popup with appropriate URL parameters
function showLookupPopup(position, isAgentSearch) {
  // Parameters to pass to the lookup popup
  const queryParams = new URLSearchParams();
  
  // Add selected text to URL parameters
  if (selectedTextForLookup) {
    queryParams.append('text', selectedTextForLookup);
  }
  
  // Add agent search flag
  if (isAgentSearch) {
    queryParams.append('agentSearch', 'true');
  }
  
  // URL for the popup with parameters
  const lookupUrl = `lookup.html?${queryParams.toString()}`;
  
  // Define popup dimensions
  const popupWidth = 450;
  const popupHeight = 300;
  
  // If we have position data, position the popup near the cursor
  if (position) {
    chrome.windows.getCurrent((window) => {
      const screenWidth = window.width;
      const screenHeight = window.height;
      
      // Calculate popup position
      let popupX = Math.round(position.x);
      let popupY = Math.round(position.y);
      
      // Ensure popup stays within screen bounds
      if (popupX + popupWidth > screenWidth) {
        popupX = screenWidth - popupWidth - 20; // 20px padding
      }
      
      if (popupY + popupHeight > screenHeight) {
        // If popup would go below screen bottom, position it above the cursor
        popupY = Math.round(position.y - popupHeight - 10);
      }
      
      // Create popup at adjusted position
      chrome.windows.create({
        url: lookupUrl,
        type: "popup",
        width: popupWidth,
        height: popupHeight,
        left: popupX,
        top: popupY
      });
    });
  } else {
    // No position data, show in center of screen
    chrome.windows.create({
      url: lookupUrl,
      type: "popup",
      width: popupWidth,
      height: popupHeight
    });
  }
  
  // Reset stored text
  if (!isAgentSearch) {
    selectedTextForLookup = '';
  }
}
