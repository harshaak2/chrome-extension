import { useState, useEffect } from 'react'
import { getAIResponse } from './api'
import './Popup.css'
import Header from './components/Header';
import Body from './components/Body';

function Popup() {
  const [result, setResult] = useState('Select text on the page and click "Confirm" to display it here');
  const [isLoading, setIsLoading] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  
  // Listen for messages from the background script
  useEffect(() => {
    const handleMessage = async (message) => {
      if (message.action === "addTextToChat" && message.text) {
        setResult("Processing text...");
        setIsLoading(true);
        
        try {
          // Process the text with AI
          const aiResponse = await getAIResponse(message.text);
          setResult(aiResponse);
        } catch (error) {
          setResult("AI Error: " + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    // Add message listener
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Check if there's any saved text when popup opens
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        handleSelectedText(result.selectedText);
        // Clear the storage after using it
        chrome.storage.local.remove(['selectedText']);
      }
    });
    
    // Cleanup
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);
  
  // Helper function to process selected text
  const handleSelectedText = async (text) => {
    if (text) {
      setResult("Processing text...");
      setIsLoading(true);
      
      try {
        const aiResponse = await getAIResponse(text);
        setResult(aiResponse);
      } catch (error) {
        setResult("AI Error: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

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

  // return (
  //     <>
  //         <div className="popup-container">
  //         <Header />
  //             <h2>QB it at your cursor</h2>
  //             <div className="buttons">
  //                 <button
  //                     id="confirm"
  //                     onClick={handleConfirmClick}
  //                     disabled={isLoading}
  //                 >
  //                     {isLoading ? "Processing..." : "Confirm"}
  //                 </button>
  //                 <button id="copy" onClick={handleCopyClick}>
  //                     {copyButtonText}
  //                 </button>
  //             </div>

  //             <div id="result" className={isLoading ? "loading" : ""}>
  //                 {isLoading ? <div className="loader"></div> : result}
  //             </div>
  //         </div>
  //     </>
  // );

  return (
    <div className="container w-80 h-120 bg-white rounded-lg">
      <Header />
      <Body />
      {/* a test button to test handleConfirmClick */}
      {/* <button onClick={handleConfirmClick}>Test Confirm</button> */}
    </div>
  )
}

export default Popup;
