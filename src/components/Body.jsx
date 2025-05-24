import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { getAIResponse } from "../api";
import { MODEL, VENDOR, CHAT_MODE, SAVED_AGENT_MODE, AUTH_TOKEN } from "../consts";
import '../highlight.css';
import MarkdownErrorBoundary from './MarkdownErrorBoundary';
import AppTile from './AppTile';

// Define a style for the welcome message animation
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

/* App Tiles Grid Styling */
.app-tile {
  min-height: 80px;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.app-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Markdown content styles */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 0.9rem; /* Decreased font size for AI responses */
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4, 
.markdown-content h5, 
.markdown-content h6 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content h1 {
  font-size: 1.3rem;
}

.markdown-content h2 {
  font-size: 1.1rem;
}

.markdown-content h3 {
  font-size: 1rem;
}

.markdown-content p {
  margin-bottom: 0.6rem;
  line-height: 1.4;
}

.markdown-content ul, 
.markdown-content ol {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-content ul {
  list-style-type: disc;
}

.markdown-content ol {
  list-style-type: decimal;
}

.markdown-content a {
  color: #4123d8;
  text-decoration: underline;
}

.markdown-content code {
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2rem 0.3rem;
  border-radius: 3px;
  font-size: 0.85em;
}

.markdown-content pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.markdown-content blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  color: #6b7280;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.75rem;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  text-align: left;
}

.markdown-content table th {
  background-color: rgba(0, 0, 0, 0.05);
}
`;

export default function Body() {
    // State for storing messages
    const [messages, setMessages] = useState([]);
    // State for storing selected text from user
    const [selectedText, setSelectedText] = useState("");
    // State for handling loading state
    const [isLoading, setIsLoading] = useState(false);
    // State for storing available agents from AI response
    const [availableAgents, setAvailableAgents] = useState([]);
    // Reference to scroll to bottom of chat
    const messagesEndRef = useRef(null);
    // State to track if the user has sent their first prompt
    const [hasInteracted, setHasInteracted] = useState(false);

    // State to show the text area for the user to add context
    const [showTextArea, setShowTextArea] = useState(true);
    // State to store the context added by the user
    const [userMessage, setUserMessage] = useState("");
    // State to store the session id
    const [sessionId, setSessionId] = useState("");
    // State to store the title of the session
    const [sessionTitle, setSessionTitle] = useState("");
    
    // New states for handling skill clash and actions
    const [availableActions, setAvailableActions] = useState([]);
    const [showSkillClash, setShowSkillClash] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);

    useEffect(() => {
        // Function to get the selected text from Chrome extension
        const getSelectedText = () => {
            // Check if there's any text stored from the context menu
            chrome.storage.local.get(['textForPopup'], function(result) {
                if (result.textForPopup) {
                    const storedText = result.textForPopup;
                    console.log('Retrieved stored text for popup:', storedText);
                    
                    // Set the text in the textarea
                    setUserMessage(storedText);
                    
                    // Clear the stored text to avoid showing it again on next open
                    chrome.storage.local.remove('textForPopup');
                    
                } else {
                    // This would typically come from the Chrome extension's content script
                    chrome.runtime.sendMessage(
                        { action: "getSelectedText" },
                        // TODO: redirect to saved agent mode && check the below function
                        function (response) {                    if (response && response.selectedText) {
                        setSelectedText(response.selectedText);
                        // Add the user message to the chat
                        addMessage("user", response.selectedText);
                        // Set hasInteracted to true since content was selected
                        setHasInteracted(true);
                        // Auto-send the selected text for processing
                        setUserMessage(response.selectedText);
                        // Automatically trigger the chat flow
                        setTimeout(() => {
                            if (response.selectedText.trim()) {
                                handleChat();
                            }
                        }, 100);
                    }
                        }
                    );
                }
            });
        };

        // Call once when component mounts
        getSelectedText();
    }, []);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Add a new message to the chat
    const addMessage = (sender, text) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender, text, timestamp: new Date() },
        ]);
    };

    // handle chat should trigger the prompt api
    // 1. make a POST request to new session API with user prompt as body - returns session id
    // 2. make a GET request to the join API which keeps streaming events throughout the session
    // 3. make a POST request to the prompt API with the session id and the user message and prompt mode
    const handleChat = async () => {
        if (!userMessage.trim()) return; // Don't send empty messages

        try {
            // Set loading state at the beginning
            setIsLoading(true);
            
            // Set hasInteracted to true to hide the welcome message
            setHasInteracted(true);
            
            // Add user message to chat - no need to parse as markdown here as it's user input
            addMessage("user", userMessage);

            // Clear input field
            const currentMessage = userMessage;
            setUserMessage("");

            // 1. make a POST request to new session API - returns session id
            const newSessionId = await getSessionId(currentMessage);
            if (!newSessionId) {
                console.error("Session ID not found");
                return;
            }
            
            // Update the state with the new session ID
            setSessionId(newSessionId);
            console.log(`Session ID: ${newSessionId}`);

            // 2. make a GET request to the join API which keeps streaming events throughout the session
            joinSession(newSessionId);

            // 3. make a POST request to the prompt API with the session id and the user message and prompt mode
            await newPrompt(newSessionId, currentMessage);
        } catch (error) {
            console.error("Error in chat flow:", error);
            addMessage("system", "Sorry, there was an error processing your request.");
            setIsLoading(false);
        }
    };

    const getSessionId = async (message) => {
        try {
            // Don't set loading here since it's already set in handleChat
            // response gives a status code of 201 with session id as a string
            const response = await fetch("https://cpqa.qa-mt.cywareqa.com/qb/v1/session/ctix/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "authorization": "CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY",
                    "origin": "https://cpqa.qa-mt.cywareqa.com",
                    "referer": "https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/",
                    "sku": 0,
                },
                body: JSON.stringify({
                    "name": message,
                }),
                credentials: 'include', // This includes cookies in the request
            });
            if (!response.ok) {
                console.error("Error creating session:", response.statusText);
                addMessage(
                    "system",
                    "Sorry, there was an error creating a new session."
                );
                setIsLoading(false);
                return null;
            }
            
            // response is a string with the session id
            const data = await response.text();
            console.log("Session ID:", data);
            
            // Return the session ID instead of just setting state
            return data;
        }
        catch (error) {
            console.error("Error creating session:", error);
            addMessage(
                "system",
                "Sorry, there was an error creating a new session."
            );
            setIsLoading(false);
            return null;
        }
    };


    // Function to join a session and handle streaming events
    // consider null if no value is passed
    const joinSession = async (sid = null) => {
        try {
            // Don't set loading here since it's already managed by handleChat
            // Use provided session ID or fall back to state
            const activeSessionId = sid || sessionId;
            
            const response = await fetch(`https://cpqa.qa-mt.cywareqa.com/qb/v1/session/join/${activeSessionId}/`, {
                method: "GET",
                headers: {
                    "accept": "text/event-stream",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "cache-control": "no-cache",
                    "priority": "u=1, i",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "referer": `https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/?id=${activeSessionId}`,
                    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
                },
                credentials: 'include', // This includes cookies in the request
            });

            if (!response.ok) {
                throw new Error(`Failed to join session: ${response.statusText}`);
            }

            console.log("Successfully joined session:", activeSessionId);

            // Real streaming implementation
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                // Process the stream
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        console.log("Stream completed");
                        // Only set loading to false if no skill clash is active
                        if (!showSkillClash) {
                            setIsLoading(false);
                        }
                        break;
                    }

                    // Decode the chunk and add to buffer
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Split on newlines to find complete JSON objects
                    const lines = buffer.split('\n');

                    // Process all complete lines except possibly the last one
                    buffer = '';
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        // If this is the last line and doesn't end with a newline, it might be incomplete
                        if (i === lines.length - 1 && !chunk.endsWith('\n')) {
                            buffer = line;
                            continue;
                        }

                        try {
                            // Check if the line starts with "data:" and remove it
                            const cleanLine = line.startsWith("data:") ? line.substring(5) : line;
                            if (!cleanLine) continue;

                            // Parse the JSON string into an event object
                            const event = JSON.parse(cleanLine);
                            handleEvent(event);
                        } catch (parseError) {
                            console.error("Error parsing event:", parseError, line);
                        }
                    }
                }
            } else {
                console.error("ReadableStream not supported in this browser");
                addMessage("system", "Sorry, your browser doesn't support streaming responses.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error joining session:", error);
            addMessage("system", "Error connecting to session. Please try again.");
            setIsLoading(false);
        }
    };

    // Function to handle continue API call when user selects an action
    const continueWithAction = async (selectedAction, actionOffset) => {
        try {
            setIsLoading(true);
            
            const response = await fetch(`https://cpqa.qa-mt.cywareqa.com/qb/v1/session/continue/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "authorization": "CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY",
                    "origin": "https://cpqa.qa-mt.cywareqa.com",
                    "referer": `https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/?id=${sessionId}`,
                    "sku": 0,
                },
                credentials: 'include',
                body: JSON.stringify({
                    "session_id": sessionId,
                    "offset": currentOffset,
                    "action_offset": actionOffset,
                    "consent": true
                })
            });

            if (!response.ok) {
                // More detailed error handling based on status codes
                let errorMessage = "Sorry, there was an error processing your selection.";
                
                switch (response.status) {
                    case 400:
                        errorMessage = "Invalid request. Please try selecting a different action.";
                        break;
                    case 401:
                        errorMessage = "Authentication failed. Please refresh and try again.";
                        break;
                    case 403:
                        errorMessage = "You don't have permission to perform this action.";
                        break;
                    case 404:
                        errorMessage = "Session not found. Please start a new conversation.";
                        break;
                    case 500:
                        errorMessage = "Server error. Please try again later.";
                        break;
                    default:
                        errorMessage = `Failed to continue with action: ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            console.log("Continue API call successful");
            
            // Hide skill clash UI after successful selection
            setShowSkillClash(false);
            setAvailableActions([]);
            
            // Add confirmation message
            addMessage("system", `Selected: ${selectedAction.title || selectedAction.desc || 'Action'}. Processing...`);
            
            // The streaming should continue automatically through the existing joinSession connection
            // Loading state will be managed by the stream events
            
        } catch (error) {
            console.error("Error in continue API call:", error);
            
            // Show user-friendly error message
            addMessage("system", error.message || "Sorry, there was an error processing your selection.");
            
            // Turn off loading on error
            setIsLoading(false);
            
            // Don't hide skill clash UI on error so user can try again
            // setShowSkillClash(false);
            // setAvailableActions([]);
        }
    };

    // Function to handle action selection from skill clash
    const handleActionSelection = (selectedAction) => {
        console.log("Action selected:", selectedAction);
        
        // Find the action offset (index in the actions array)
        const actionOffset = availableActions.findIndex(action => action.appid === selectedAction.appid);
        
        if (actionOffset !== -1) {
            // Make the continue API call
            continueWithAction(selectedAction, actionOffset);
        } else {
            console.error("Could not find action offset for selected action");
        }
    };

    // Handle individual events
    const handleEvent = (event) => {
        console.log("Received event:", event.ev_name, "Event type:", event.event);
        
        // Update current offset for any event that has one
        if (event.offset !== undefined) {
            setCurrentOffset(event.offset);
        }
        
        let response = null;
        if(event.data) {
            if(event.data.data) {
                response = event.data.data.content;
            }
        }
        console.log("Response data:", response);
        
        // Helper function to check if a string is likely markdown
        const isMarkdown = (text) => {
            if (!text) return false;
            
            // Check for common markdown patterns
            const markdownPatterns = [
                /^#+\s+.+$/m,                    // Headers
                /^[-*+]\s+.+$/m,                 // Lists
                /^>\s+.+$/m,                     // Blockquotes
                /`{1,3}[\s\S]*?`{1,3}/m,         // Code (inline or blocks)
                /\[.+?\]\(.+?\)/m,               // Links
                /^\|.+\|.+\|/m,                  // Tables
                /^\s*?```[\s\S]*?```/m,          // Code blocks
                /^\s*?~~~[\s\S]*?~~~/m,          // Code blocks (alternative)
                /(\*\*|__).+?(\*\*|__)/m,        // Bold
                /(\*|_).+?(\*|_)/m,              // Italic
                /!\[.+?\]\(.+?\)/m               // Images
            ];
            
            return markdownPatterns.some(pattern => pattern.test(text));
        };
        
        switch (event.event) {
            case 9: // prompt
                // Handle prompt event
                console.log("Prompt data:", event.data);
                break;
            case 10: // analyzing
                // Show analyzing status
                console.log("Analyzing request...");
                addMessage("system", "Analyzing your request...");
                break;
            case 5: // title changed
                // Update title or show it
                console.log("Title changed to:", event.data);
                setSessionTitle(event.data);
                // addMessage("system", `Topic: ${event.data}`);
                break;
            case 3: // ai answer
                // Check if this has multiple actions (skill clash scenario)
                if (event.data && event.data.data && event.data.data.actions && event.data.data.actions.length > 1) {
                    console.log("Multiple actions detected - skill clash scenario");
                    setAvailableActions(event.data.data.actions);
                    setShowSkillClash(true);
                    
                    // Show message about skill clash
                    addMessage("ai", event.data.data.content || "I found multiple suitable actions. Please select one to proceed:");
                    
                    // Don't turn off loading yet since user needs to select an action
                } else if (response) {
                    // Single response - handle normally and turn off loading
                    console.log("Is markdown format:", isMarkdown(response));
                    addMessage("ai", response);
                    setUserMessage("");
                    setIsLoading(false);
                }
                break;
            case 15: // skill clash
                console.log("Skill clash event detected");
                // This event confirms the skill clash scenario
                // The UI should already be showing app tiles if case 3 handled multiple actions
                break;
            case 7: // executing
                console.log("Executing action:", event.action);
                addMessage("system", "Executing selected action...");
                break;
            case 16: // co result
                console.log("Action execution result:", event.data);
                // Usually this doesn't need to show anything to user
                break;
            case 8: // executed
                console.log("Action executed successfully");
                // addMessage("system", "Action completed.");
                break;
            case 17: // result summarizing
                console.log("Summarizing results...");
                addMessage("system", "Summarizing results...");
                break;
            default:
                console.log("Unhandled event type:", event.ev_name, "Event:", event.event);
        }
    };

    const newPrompt = async (sid = null, message = null) => {
        try {
            // Don't set loading here since it's already managed by handleChat
            // Use provided session ID or fall back to state
            const activeSessionId = sid || sessionId;
            // Use provided message or fall back to state
            const promptMessage = message || userMessage;
            
            const response = await fetch(`https://cpqa.qa-mt.cywareqa.com/qb/v1/session/prompt/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "authorization": "CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY",
                    "origin": "https://cpqa.qa-mt.cywareqa.com",
                    "referer": "https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/",
                    "sku": 0,
                },
                credentials: 'include', // This includes cookies in the request
                body: JSON.stringify({
                    "session_id": activeSessionId,
                    "text": promptMessage,
                    "type": 1,
                    //* Chat mode - 1
                    "prompt_mode": 2,
                    "vendor": VENDOR,
                    "model": MODEL,
                    "heat": "false",
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to send prompt: ${response.statusText}`);
            }
            console.log("Prompt sent successfully");
        }
        catch (error) {
            console.error("Error sending prompt:", error);
            addMessage(
                "system",
                "Sorry, there was an error sending your prompt."
            );
            setIsLoading(false);
        }
    };

    // Handle agent selection
    const selectAgent = (agent) => {
        console.log(`Agent selected: ${agent.name}`);
        addMessage("system", `You selected: ${agent.name}`);

        // TODO: Handle agent execution logic here
        // This would typically involve calling another API endpoint or service
    };

    return (
        <div className="flex flex-col h-full max-h-[500px] bg-gray-50 rounded-lg shadow-md">
            {/* Apply the animation style */}
            <style>{fadeInAnimation}</style>
            
            {/* Title container */}
            {sessionTitle && (
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <h2 className="text-md font-semibold" style={{color: "black"}}>{sessionTitle}</h2>
                    {/* <span
                        className="text-gray-500 cursor-pointer text-md font-mono flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 transition duration-200 ease-in-out"
                        onClick={() => setSessionTitle("")}
                    >
                        Clear
                    </span> */}
                </div>
            )}

            {/* Header with icon */}
            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 && !hasInteracted && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-700 p-6 animate-fade-in font-sans">
                            <p className="text-lg font-semibold font-sans">Leverage the power of</p>
                            <span className="text-3xl font-bold font-sans text-shadow-xs" style={{color: "black"}}>Quarterback AI</span>
                            <p className="text-md mt-0.5">Now at your cursor</p>
                        </div>
                    </div>
                )}
                
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 flex ${message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                            }`}
                    >
                        <div
                            className={`p-3 rounded-lg max-w-[80%] ${message.sender === "user"
                                ? "bg-blue-500 text-white rounded-br-none"
                                : message.sender === "ai"
                                    ? "bg-gray-200 text-gray-800 rounded-bl-none"
                                    : "bg-gray-300 text-gray-800 italic"
                                }`}
                        >
                            {message.sender === "ai" ? (
                                <div className="markdown-content">
                                    <MarkdownErrorBoundary>
                                        <ReactMarkdown 
                                            rehypePlugins={[rehypeHighlight]} 
                                            components={{
                                                // Make links open in a new tab
                                                a: ({ node, ...props }) => (
                                                    <a 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        {...props} 
                                                    />
                                                ),
                                                // Add custom styling for tables
                                                table: ({ node, ...props }) => (
                                                    <div className="table-container" style={{ overflowX: 'auto' }}>
                                                        <table {...props} />
                                                    </div>
                                                )
                                            }}
                                            // Handle errors during markdown processing
                                            remarkRehypeOptions={{ allowDangerousHtml: true }}
                                        >
                                            {message.text || ''}
                                        </ReactMarkdown>
                                    </MarkdownErrorBoundary>
                                </div>
                            ) : (
                                message.text
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div
                                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                ></div>
                                <div
                                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.4s" }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Skill Clash UI - App Tiles Selection */}
                {showSkillClash && availableActions.length > 0 && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-gray-100 p-4 rounded-lg rounded-bl-none max-w-[90%]">
                            <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Please select an app to proceed:</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {availableActions.map((action, index) => (
                                    <AppTile
                                        key={`${action.appid}-${index}`}
                                        action={action}
                                        onSelect={handleActionSelection}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Only show span when textarea is not visible */}
            {/* make sure that the span icon is in the center */}
            {!showTextArea && (
                <span
                    className="text-black cursor-pointer text-md font-mono flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 transition duration-200 ease-in-out"
                    onClick={() => setShowTextArea(true)}
                >
                    Chat with QuarterBack?
                </span>
            )}
            {/* Text area for user input along with a send button*/}
            {showTextArea && (
                <div className="flex items-center justify-between p-4 border-gray-300 gap-1.5">
                    <textarea
                        className={`p-2 border border-gray-300 rounded-lg w-80 resize-none scrollbar-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isLoading}
                        rows={1}
                        placeholder="Chat with QBit"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isLoading && userMessage.trim()) {
                                    handleChat();
                                }
                            }
                        }}
                        style={{
                            height: "40px",
                            minHeight: "40px",
                            overflow: "auto",
                        }}
                    />
                    <Send
                        onClick={handleChat}
                        // add a rounded border to the send button
                        className="text-blue-500 cursor-pointer hover:text-blue-700 transition duration-200 ease-in-out mt-0.5"
                    ></Send>
                </div>
            )}
        </div>
    );
}
