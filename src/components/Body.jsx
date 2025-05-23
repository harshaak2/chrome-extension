import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getAIResponse } from "../api";
import { MODEL, VENDOR, CHAT_MODE, SAVED_AGENT_MODE, AUTH_TOKEN } from "../consts";


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
            // This would typically come from the Chrome extension's content script
            // For now, we'll mock it with a sample text
            chrome.runtime.sendMessage(
                { action: "getSelectedText" },
                // TODO: redirect to saved agent mode
                function (response) {
                    if (response && response.selectedText) {
                        setSelectedText(response.selectedText);
                        // Add the user message to the chat
                        addMessage("user", response.selectedText);
                        // Send to AI for processing
                        processWithAI(response.selectedText);
                    }
                }
            );

            // MOCK DATA - Remove in production
            // const mockSelectedText = "How do I analyze this dataset?";
            // setSelectedText(mockSelectedText);
            // addMessage("user", mockSelectedText);
            // processWithAI(mockSelectedText);
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

    // Process the selected text with AI
    const processWithAI = async (text) => {
        setIsLoading(true);
        try {
            // TODO: Handle API logic here
            // const response = await getAIResponse(text);

            // MOCK RESPONSE - Replace with actual API call
            const mockResponse = {
                message:
                    "I can help analyze your dataset. Here are some options:",
                agents: [
                    {
                        id: 1,
                        name: "Data Analysis Agent",
                        description:
                            "Perform basic statistical analysis on your data",
                    },
                    {
                        id: 2,
                        name: "Visualization Agent",
                        description: "Create charts and graphs from your data",
                    },
                    {
                        id: 3,
                        name: "Machine Learning Agent",
                        description: "Run predictive models on your dataset",
                    },
                ],
            };

            // Add AI response to chat
            // addMessage("ai", mockResponse.message);
            // Set available agents
            setAvailableAgents(mockResponse.agents);
        } catch (error) {
            console.error("Error processing with AI:", error);
            addMessage(
                "system",
                "Sorry, there was an error processing your request."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // handle chat should trigger the prompt api
    // 1. make a POST request to new session API with user prompt as body - returns session id
    // 2. make a GET request to the join API which keeps streaming events throughout the session
    // 3. make a POST request to the prompt API with the session id and the user message and prompt mode
    const handleChat = async () => {
        if (!userMessage.trim()) return; // Don't send empty messages

        // Add user message to chat
        addMessage("user", userMessage);

        // Clear input field
        const currentMessage = userMessage;
        // setUserMessage("");

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

            // For demo purposes, we'll use the dummy events instead of actual streaming
            // In production, uncomment the streaming code below

            // Demo implementation with dummy data
            console.log("Successfully joined session:", activeSessionId);
            // addMessage("system", "Connected to session");

            // Process dummy events with slight delays to simulate streaming
            // setTimeout(() => {
            //     handleEvent({"ev_name": "prompt", "event": 9, "offset": 0, "data": {"data":{"session_id": activeSessionId,"text": userMessage,"context":"","vendor":"openai","model":"gpt4o","product":"","user_id":"01JS4EXWSRHQ9QRXVRERDCH2S1","full_name":"Harsha","email":"harsha.k@cyware.com","prompt_mode":1,"type":1,"temperature":false},"type":1,"subtype":0,"offset":0,"error":null,"parent_msg_offset":null}});
            // }, 500);

            // setTimeout(() => {
            //     handleEvent({"ev_name": "analysing", "event": 10, "offset": 0});
            // }, 1000);

            // setTimeout(() => {
            //     handleEvent({"ev_name": "title changed", "event": 5, "data": "Understanding " + userMessage});
            // }, 1500);

            // setTimeout(() => {
            //     setIsLoading(false);
            // }, 2000);

            // Real streaming implementation (uncomment in production):

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

    // Process events from the stream
    const processEvents = (buffer) => {
        try {
            // In a real implementation, we need to handle incomplete JSON objects
            // This is a simplified version that assumes each chunk is a complete JSON object

            // For demo purposes, we're using dummy events instead of parsing the buffer
            // In a real implementation, you would parse the buffer to extract JSON objects

            // IMPLEMENTATION NOTE: In production, replace this with actual buffer parsing
            const dummyEvents = [
                { "ev_name": "prompt", "event": 9, "offset": 0, "data": { "data": { "session_id": "01JVWAJ2K79201F30CG4HAY9B8", "text": "explain dos attack", "context": "", "vendor": "openai", "model": "gpt4o", "product": "", "user_id": "01JS4EXWSRHQ9QRXVRERDCH2S1", "full_name": "Harsha", "email": "harsha.k@cyware.com", "prompt_mode": 1, "type": 1, "temperature": false }, "type": 1, "subtype": 0, "offset": 0, "error": null, "parent_msg_offset": null } },
                { "ev_name": "analysing", "event": 10, "offset": 0 },
                { "ev_name": "title changed", "event": 5, "data": "Understanding DoS Attacks" }
            ];

            // Process each dummy event (replace with actual parsing in production)
            dummyEvents.forEach(event => {
                handleEvent(event);
            });

            /* Real implementation would be something like:
            
            // Split buffer by newlines to get individual JSON objects
            const lines = buffer.split('\n');
            
            // Process each line that might contain a JSON object
            lines.forEach((line, index) => {
                if (!line.trim()) return; // Skip empty lines
                
                try {
                    const event = JSON.parse(line);
                    handleEvent(event);
                } catch (err) {
                    // This might be an incomplete JSON object, keep it for the next processing
                    if (index === lines.length - 1) {
                        return line; // Return the incomplete line to be reprocessed
                    }
                }
            });
            
            // Return any incomplete data to be processed with the next chunk
            return lines[lines.length - 1].trim() ? lines[lines.length - 1] : '';
            */
        } catch (error) {
            console.error("Error processing events:", error);
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

            {/* Available agents section */}
            {/* {availableAgents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {availableAgents.map((agent) => (
                      <AgentButton
                          key={agent.id}
                          agent={agent}
                          onClick={() => selectAgent(agent)}
                      />
                  ))}
              </div>
          )} */}

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
                <div className="flex items-center justify-between p-4 border-t border-gray-300 gap-1.5">
                    <textarea
                        className={`p-2 border border-gray-300 rounded-lg w-80 resize-none`}
                        rows={1}
                        placeholder="Chat with QBit"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
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
