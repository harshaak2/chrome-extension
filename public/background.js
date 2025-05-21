// responsible for handling the background tasks of the extension
chrome.runtime.onInstalled.addListener(() => {
  // syncs the storage across all the tabs
  chrome.storage.sync.get(["cycp"], (key) => {
    // takes to the mentioned url / page as soon as the extension is installed
    if (key.cycp === undefined) {
      chrome.tabs.create({ url: "options.html" });
    }
  });
});


// create context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToChat",
    title: "Add To Chat",
    contexts: ["selection"], // only appears when the text is selected
  });
});

// Handle context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToChat" && info.selectionText) {
    // Store the selected text in Chrome storage
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      console.log('Text saved to chat:', info.selectionText);
    });
    
    // Option 1: Open the popup with the selected text
    chrome.action.openPopup();
    
    // Option 2: Or send a message to any open popup to update the chat
    chrome.runtime.sendMessage({
      action: "addTextToChat",
      text: info.selectionText
    });
  }
});
