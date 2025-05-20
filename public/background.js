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
