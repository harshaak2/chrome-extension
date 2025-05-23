import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getAIResponse } from "../api";
import { MODEL, VENDOR, CHAT_MODE, SAVED_AGENT_MODE, AUTH_TOKEN } from "../consts";

// Define a style for the welcome message animation
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
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
                        // Send to AI for processing
                        processWithAI(response.selectedText);
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

        // Set hasInteracted to true to hide the welcome message
        setHasInteracted(true);
        
        // Add user message to chat
        addMessage("user", userMessage);

        // Clear input field
        const currentMessage = userMessage;
        setUserMessage("");

        // 1. make a POST request to new session API - returns session id
        const newSessionId = await getSessionId();
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
        await newPrompt(newSessionId);
    };

    const getSessionId = async () => {
        try {
            setIsLoading(true);
            // response gives a status code of 201 with session id as a string
            const response = await fetch("http://localhost:2319/v1/session/ctix", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "sku": 0,
                },
                body: JSON.stringify({
                    "name": userMessage,
                }),
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
            return null;
        }
        finally {
            setIsLoading(false);
        }
    };


    // Function to join a session and handle streaming events
    // consider null if no value is passed
    const joinSession = async (sid = null) => {
        try {
            setIsLoading(true);
            // Use provided session ID or fall back to state
            const activeSessionId = sid || sessionId;
            
            const response = await fetch(`http://localhost:2319/v1/session/join/${activeSessionId}/`, {
                method: "GET",
                headers: {
                    "sku": 0,
                    // In a real implementation, you would include the auth token
                    // "Cookie": `cycp=${AUTH_TOKEN};`,
                }
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
                        setIsLoading(false);
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

    // Handle individual events
    const handleEvent = (event) => {
        console.log("Received event:", event.ev_name);
        let response = null;
        if(event.data) {
            if(event.data.data) {
                response = event.data.data.content;
            }
        }
        console.log("Response data:", response);
        switch (event.event) {
            case 9: // prompt
                // Handle prompt event
                console.log("Prompt data:", event.data);
                break;
            case 10: // analyzing
                // Show analyzing status
                console.log("Analyzing request...");
                // addMessage("system", "Analyzing your request...");
                break;
            case 5: // title changed
                // Update title or show it
                console.log("Title changed to:", event.data);
                setSessionTitle(event.data);
                // addMessage("system", `Topic: ${event.data}`);
                break;
            case 3: // ai answer
                // Clear input field after sending the response back to the user
                addMessage("ai", response);
                setUserMessage("");
                break;
            default:
                console.log("Unhandled event type:", event.ev_name);
        }
    };

    const newPrompt = async (sid = null) => {
        try {
            setIsLoading(true);
            // Use provided session ID or fall back to state
            const activeSessionId = sid || sessionId;
            
            const response = await fetch(`http://localhost:2319/v1/session/prompt/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "sku": 0,
                },
                body: JSON.stringify({
                    "session_id": activeSessionId,
                    "text": userMessage,
                    "type": 1,
                    //* Chat mode - 1
                    "prompt_mode": CHAT_MODE,
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
        }
        finally {
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
                            {message.text}
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
