import { useState, useEffect } from 'react'
import { getAIResponse } from './api'

function Popup() {
  const [result, setResult] = useState('Select text on the page and click "Confirm" to display it here');
  const [isLoading, setIsLoading] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  const handleConfirmClick = async () => {
    console.log("Confirm button clicked");
    setResult("Extracting data...");
    setIsLoading(true);

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        setResult("No active tab found");
        setIsLoading(false);
        return;
      }

      // Check if this is a valid URL where content scripts can run
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")
      ) {
        setResult("Cannot access content on this page");
        setIsLoading(false);
        return;
      }

      // Make sure the content script is loaded first
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Now send the message to the content script
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_SELECTED_TEXT" },
        async (response) => {
          if (chrome.runtime.lastError) {
            setResult("Error: " + chrome.runtime.lastError.message);
            setIsLoading(false);
            return;
          }

          if (response && response.text) {
            try {
              // Replace this with your actual API call
              const aiResponse = await getAIResponse(response.text);
              setResult(aiResponse);
            } catch (error) {
              setResult("AI Error: " + error.message);
            }
          } else {
            setResult("No text selected or cannot access page content");
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResult("Error: " + error.message);
      setIsLoading(false);
    }
  };

  const handleCopyClick = () => {
    if (result) {
      navigator.clipboard
        .writeText(result)
        .then(() => {
          setCopyButtonText("Copied!");
          setTimeout(() => {
            setCopyButtonText("Copy");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  // The getAIResponse function is now imported from api.js

  return (
    <div className="min-w-[250px] p-4 font-sans bg-black text-white flex flex-col gap-4">
      <h2 className="mt-0 text-white">QB it at your cursor</h2>
      <div className="flex flex-col gap-4 my-4">
        <button 
          className="py-2.5 px-4 border-none rounded cursor-pointer text-sm transition-all duration-300 ease-in-out hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed bg-[#4CAF50] text-white"
          onClick={handleConfirmClick} 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
        <button 
          className="py-2.5 px-4 border-none rounded cursor-pointer text-sm transition-all duration-300 ease-in-out hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0.5 bg-[#2196F3] text-white"
          onClick={handleCopyClick}
        >
          {copyButtonText}
        </button>
      </div>

      <div 
        className={`mt-4 p-3 bg-[#333] text-white rounded min-h-[40px] relative ${isLoading ? 'flex justify-center items-center' : ''}`}
      >
        {isLoading ? 
          <div className="border-4 border-solid border-[#f3f3f3] border-t-[#3498db] rounded-full w-5 h-5 animate-spin my-2.5 mx-auto"></div> 
          : result}
      </div>
    </div>
  );
}

export default Popup;
