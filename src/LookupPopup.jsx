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
      <div className="lookup-content">
        {loading && !isAgentSearch ? (
          <div className="ai-response-container">
            <div className="ai-avatar">
              <img src="/qb_icon.svg" alt="AI Assistant" />
            </div>
            <div className="ai-content">
              <div className="ai-header">
                {/* <div className="ai-name">QBit Assistant</div> */}
              </div>
              <div className="ai-message">
                <div className="loading">
                  <div className="spinner"></div>
                  <div>Loading...</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="lookup-results">
              {isAgentSearch ? (
                loading ? (
                  <div className="ai-response-container">
                    <div className="ai-avatar">
                      <img src="/qb_icon.svg" alt="AI Assistant" />
                    </div>
                    <div className="ai-content">
                      <div className="ai-header">
                        {/* <div className="ai-name">QBit Assistant</div> */}
                      </div>
                      <div className="ai-message">
                        <div className="loading">
                          <div className="spinner"></div>
                          <div>Analyzing your selection...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : lookupResult ? (
                  <div className="ai-response-container">
                    <div className="ai-avatar">
                      <img src="/qb_icon.svg" alt="AI Assistant" />
                    </div>
                    <div className="ai-content">
                      <div className="ai-header">
                        {/* <div className="ai-name">QBit Assistant</div> */}
                      </div>
                      <div className="ai-message">
                        I found some relevant agents that might help with your query:
                      </div>
                      {lookupResult.results && (
                        <div className="agent-results">
                          {lookupResult.results.map((result, index) => (
                            <div 
                              key={index} 
                              className="result-item"
                              style={{ '--animation-order': index }}
                            >
                              <AgentButton agent={result}>{result.agent_name}</AgentButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : error ? (
                  <div className="ai-response-container">
                    <div className="ai-avatar">
                      <img src="/qb_icon.svg" alt="AI Assistant" />
                    </div>
                    <div className="ai-content">
                      <div className="ai-header">
                        {/* <div className="ai-name">QBit Assistant</div> */}
                      </div>
                      <div className="ai-message">
                        Sorry, I encountered an error: {error}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ai-response-container">
                    <div className="ai-avatar">
                      <img src="/qb_icon.svg" alt="AI Assistant" />
                    </div>
                    <div className="ai-content">
                      <div className="ai-header">
                        {/* <div className="ai-name">QBit Assistant</div> */}
                      </div>
                      <div className="ai-message">
                        I couldn't find any relevant agents for your query.
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="ai-response-container">
                  <div className="ai-avatar">
                    <img src="/qb_icon.svg" alt="AI Assistant" />
                  </div>
                  <div className="ai-content">
                    <div className="ai-header">
                      {/* <div className="ai-name">QBit Assistant</div> */}
                    </div>
                    <div className="ai-message">
                      <p>No text is currently selected.</p>
                      <p>Select text on the page to automatically see AI-powered results.</p>
                    </div>
                  </div>
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