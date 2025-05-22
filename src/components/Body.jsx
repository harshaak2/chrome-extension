import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getAIResponse } from "../api";

import AgentButton from "./AgentButton";

// body should have the chat UI with the user selected content and the
// available agents that are available to act on the selected content
// the selected text (not copied) should be shown as the message sent
// to the AI - waiting for the AI to respond with available agents
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
    const [showTextArea, setShowTextArea] = useState(false);
    // State to store the context added by the user
    const [userMessage, setUserMessage] = useState("");

    useEffect(() => {
        // Function to get the selected text from Chrome extension
        const getSelectedText = () => {
            // This would typically come from the Chrome extension's content script
            // For now, we'll mock it with a sample text
            chrome.runtime.sendMessage(
                { action: "getSelectedText" },
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
            const mockSelectedText = "How do I analyze this dataset?";
            setSelectedText(mockSelectedText);
            addMessage("user", mockSelectedText);
            processWithAI(mockSelectedText);
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
            addMessage("ai", mockResponse.message);
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
        // console.log(`Context added: ${context}`);
        // 1. make a POST request to new session API - returns session id
        const sessionId = await getSessionId();
        if (!sessionId) {
            console.error("Session ID not found");
            return;
        }
        console.log(`Session ID: ${sessionId}`);

        // 2. make a GET request to the join API which keeps streaming events throughout the session
        
    };

    const getSessionId = async () => {
        try{
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
                return;
            }
            setIsLoading(false);
            // response is a string with the session id
            const data = await response.text();
            return data;
        }
        catch (error) {
            console.error("Error creating session:", error);
            addMessage(
                "system",
                "Sorry, there was an error creating a new session."
            );
        }
        finally{
            setIsLoading(false);
        }
    }

    // Handle agent selection
    const selectAgent = (agent) => {
        console.log(`Agent selected: ${agent.name}`);
        addMessage("system", `You selected: ${agent.name}`);

        // TODO: Handle agent execution logic here
        // This would typically involve calling another API endpoint or service
    };

    return (
        <div className="flex flex-col h-full max-h-[500px] bg-gray-50 rounded-lg shadow-md">
            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 flex ${
                            message.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            className={`p-3 rounded-lg max-w-[80%] ${
                                message.sender === "user"
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
