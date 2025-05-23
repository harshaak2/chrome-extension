import { useState, useEffect } from 'react';
import './LookupPopup.css';
import { getAIResponse, performAgentSearch } from './api';
import AgentButton from './components/AgentButton';

function LookupPopup() {
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [isAgentSearch, setIsAgentSearch] = useState(false);

  // Function to handle closing the popup with animation
  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => window.close(), 150);
  };

  // Function to fetch agent search results
  const fetchAgentSearchResults = async (text) => {
    try {
      setLoading(true);
      console.log("Fetching agent search results for:", text);
      const result = await performAgentSearch(text);
      console.log("Received agent search results:", result);
      setLookupResult(result);
      setLoading(false);
    } catch (error) {
      console.error("Failed to get agent search results:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("LookupPopup mounted");
    
    // Get URL parameters
    // TODO: check the params - the POST request should have data in the payload
    const queryParams = new URLSearchParams(window.location.search);
    const textParam = queryParams.get('text');
    const agentSearchParam = queryParams.get('agentSearch');
    
    // Check if this is an agent search
    const isAgentSearchRequest = agentSearchParam === 'true';
    setIsAgentSearch(isAgentSearchRequest);
    
    // If we have text in the URL parameters, use it
    if (textParam) {
      console.log("Text parameter found:", textParam);
      setSelectedText(textParam);
      
      // If this is an agent search, fetch results
      if (isAgentSearchRequest) {
        console.log("This is an agent search request, fetching results...");
        fetchAgentSearchResults(textParam);
        return; // Skip the regular text fetch
      }
      
      // Auto-trigger agent search with the provided text parameter
      setIsAgentSearch(true);
      fetchAgentSearchResults(textParam);
      return;
    }
    
    // Get the selected text from the active tab if no text parameter is provided
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
              // Auto-trigger agent search when there's selected text
              setIsAgentSearch(true);
              fetchAgentSearchResults(response.text);
            } else {
              setSelectedText('No text selected');
              setLoading(false);
            }
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
    <div className={`lookup-container ${fadeOut ? 'fade-out' : ''}`}>
      {/* <div className="lookup-header">
        <div className="lookup-title">QBit Lookup</div>
        <button 
          className="close-button"
          onClick={handleClose}
          aria-label="Close">
          ✕
        </button>
      </div> */}
      
      <div className="lookup-content">
        {loading && !isAgentSearch ? (
          <div className="loading">
            <div className="spinner"></div>
            <div>Loading...</div>
          </div>
        ) : (
          <>
            {/* <div className="selected-text-section">
              <h3>Selected Text</h3>
              <div className="selected-text">{selectedText}</div>
              {error && <div className="error">{error}</div>}
            </div> */}
            
            <div className="lookup-results">
              <h3>Agent Lookup</h3>
              {isAgentSearch ? (
                loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <div>Fetching results...</div>
                  </div>
                ) : lookupResult ? (
                  <div className="">
                    {/* {typeof lookupResult === 'string' 
                      ? lookupResult 
                      : lookupResult.message 
                        ? lookupResult.message
                        : lookupResult.results && Array.isArray(lookupResult.results)
                          ? (
                            <div>
                              <p>{lookupResult.message || "Search results:"}</p>
                              <ul className="search-results-list">
                                {lookupResult.results.map((result, index) => (
                                  <li key={index} className="search-result-item">
                                    <strong>{result.agent_name || "Agent"}</strong>
                                    {result.description && <p>{result.description}</p>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                          : JSON.stringify(lookupResult, null, 2)} */}
                    {lookupResult.results && (
                        <div className="flex flex-wrap gap-2">
                            {lookupResult.results.map((result, index) => (
                                <div key={index} className="result-item">
                                    <AgentButton>{result.agent_name}</AgentButton>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                ) : error ? (
                  <div className="error">{error}</div>
                ) : (
                  <div className="no-results">No results found</div>
                )
              ) : (
                <div className="dummy-result">
                  <p>No text is currently selected.</p>
                  <p>Select text on the page to automatically see AI-powered results.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LookupPopup;