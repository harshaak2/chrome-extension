import { useState, useEffect } from 'react';
import './LookupPopup.css';

function LookupPopup() {
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("LookupPopup mounted");
    
    // Get the selected text from the active tab
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          console.error("No active tab found");
          setSelectedText('No active tab available');
          setLoading(false);
          return;
        }
        
        const activeTab = tabs[0];
        console.log("Active tab:", activeTab.id);
        
        // Skip if we're on a page where we can't execute scripts
        if (
          !activeTab.url ||
          activeTab.url.startsWith("chrome://") ||
          activeTab.url.startsWith("chrome-extension://") ||
          activeTab.url.startsWith("edge://") ||
          activeTab.url.startsWith("about:")
        ) {
          setSelectedText('Text selection not available on this page');
          setLoading(false);
          return;
        }
        
        // Try to get selected text from content script
        chrome.tabs.sendMessage(
          activeTab.id,
          { type: "GET_SELECTED_TEXT" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error getting selected text:", chrome.runtime.lastError.message);
              setError(chrome.runtime.lastError.message);
              setSelectedText('Unable to get selected text');
              setLoading(false);
              return;
            }
            
            console.log("Response from content script:", response);
            
            if (response && response.text) {
              setSelectedText(response.text);
            } else {
              setSelectedText('No text selected');
            }
            setLoading(false);
          }
        );
      });
    } catch (e) {
      console.error("Error in useEffect:", e);
      setError(e.message);
      setSelectedText('Error occurred');
      setLoading(false);
    }
  }, []);

  return (
    <div className="lookup-container">
      <div className="lookup-header">
        <div className="lookup-title">QBit Lookup</div>
        <button 
          className="close-button"
          onClick={() => window.close()}>
          ✕
        </button>
      </div>
      
      <div className="lookup-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="selected-text-section">
              <h3>Selected Text</h3>
              <div className="selected-text">{selectedText}</div>
              {error && <div className="error">{error}</div>}
            </div>
            
            <div className="lookup-results">
              <h3>Lookup Results</h3>
              <div className="dummy-result">
                <p>This is a dummy lookup result for the selected text.</p>
                <p>Here you can display information from your AI or other services.</p>
                <p>Customize this section based on your requirements.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LookupPopup;