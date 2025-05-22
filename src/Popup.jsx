import { useState, useEffect } from 'react'
import { getAIResponse } from './api'
import './Popup.css'
import Header from './components/Header';
import Body from './components/Body';

function Popup() {
  const [result, setResult] = useState('Select text on the page and click "Confirm" to display it here');
  const [isLoading, setIsLoading] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [cursorEnabled, setCursorEnabled] = useState(false);

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

  // Apply cursor automatically when popup opens
  useEffect(() => {
    const enableCustomCursor = async () => {
      try {
        // Always enable the cursor
        setCursorEnabled(true);
        
        // Save the state in storage
        await chrome.storage.sync.set({ cursorEnabled: true });
        
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.id) {
          // Make sure the content script is loaded
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
          
          // Send message to enable cursor
          chrome.tabs.sendMessage(
            tab.id,
            { type: "TOGGLE_CURSOR", enabled: true }
          );
        }
      } catch (error) {
        console.error("Error enabling cursor:", error);
      }
    };

    // Enable custom cursor every time popup opens
    enableCustomCursor();
  }, []);

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
