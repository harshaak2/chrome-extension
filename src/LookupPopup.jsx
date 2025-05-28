import { useState, useEffect } from 'react';
import './LookupPopup.css';
import { getAIResponse, performAgentSearch, sendAgentPrompt } from './api';
import AgentButton from './components/AgentButton';

function LookupPopup() {
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [isAgentSearch, setIsAgentSearch] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // Function to handle closing the popup with animation
  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => window.close(), 150);
  };

  // Function to handle agent click
  const handleAgentClick = async (agent) => {
    try {
      setAgentLoading(true);
      setError(null);
      console.log("Agent clicked:", agent);
      
      // Use the selected text and agent ID to make the API call
      const response = await sendAgentPrompt(selectedText, agent.agent_id);
      console.log("Agent prompt response:", response);
      
      // Extract session ID from response and display it to user
      if (response && (response.session_id || response.sessionId)) {
        const sessionId = response.session_id || response.sessionId;
        setSessionId(sessionId);
        console.log("Session ID extracted:", sessionId);
      } else if (typeof response === 'string' && response.trim()) {
        // Handle case where response is directly the session ID string
        const sessionId = response.trim();
        setSessionId(sessionId);
        console.log("Raw session ID detected:", sessionId);
      } else {
        console.error("Session ID not found in response:", response);
        setError("Session ID not found in response");
      }
    } catch (error) {
      console.error("Error executing agent:", error);
      setError(error.message);
    } finally {
      setAgentLoading(false);
    }
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
                              <AgentButton 
                                agent={result} 
                                onClick={() => handleAgentClick(result)}
                                loading={agentLoading}
                              >
                                {result.agent_name}
                              </AgentButton>
                            </div>
                          ))}
                        </div>
                      )}
                      {agentLoading && (
                        <div className="ai-message mt-2">
                          <div className="loading">
                            <div className="spinner"></div>
                            <div>Processing with agent...</div>
                          </div>
                        </div>
                      )}
                      {sessionId && (
                        <div className="ai-message mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-medium text-green-800 mb-3 flex items-center">
                            ✅ Agent session created successfully!
                          </div>
                          <div className="text-xs text-green-700 mb-3">
                            <strong>Session ID:</strong> 
                            <div className="mt-1 p-2 bg-green-100 rounded border font-mono text-xs break-all">
                              {sessionId}
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <a 
                              href={`https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/?id=${sessionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                              style={{color: 'white'}}
                            >
                              🔗 Open Session
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(sessionId);
                                // Optional: Show a temporary "Copied!" message
                              }}
                              className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
                            >
                              📋 Copy ID
                            </button>
                          </div>
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