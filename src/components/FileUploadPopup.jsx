import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconUpload, IconX, IconCheck, IconLoader2 } from "@tabler/icons-react";
import AgentButton from "./AgentButton";
import { sendAgentPrompt } from "../api";
import { AUTH_TOKEN } from "../consts";

const FileUploadPopup = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [context, setContext] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success
  const [uploadProgress, setUploadProgress] = useState(0);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const fileInputRef = useRef(null);

  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Handle any keyboard shortcuts and window sizing
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        window.close(); // Close the popup window
      }
      
      // Submit on Enter key (regardless of file selection)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit().catch(console.error);
      }
    };

    // Add event listener for keyboard
    window.addEventListener("keydown", handleKeyDown);
    
    // Resize window to fit content
    // Set a larger size for the window to accommodate agents display
    if (window.chrome && window.chrome.windows && window.chrome.windows.getCurrent && window.chrome.windows.update) {
      window.chrome.windows.getCurrent((win) => {
        window.chrome.windows.update(win.id, {
          width: 800,
          height: agents.length > 0 ? 500 : 250 // Dynamic height based on agents
        });
      });
    }
    
    console.log("FileUploadPopup component mounted");
    
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, files.length, agents.length]); // Added agents.length to dependencies

  // Handle file upload
  const handleFileChange = (e) => {
    setError(""); // Clear any previous errors
    const newFiles = Array.from(e.target.files || []);
    
    // Reset upload status if in success state
    if (uploadStatus === "success") {
      setUploadStatus("idle");
    }
    
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Make context mandatory
    if (!context.trim()) {
      setError("Please enter a description or context for the files");
      return;
    }
    
    if (files.length === 0) {
      setError("Please upload at least one file first");
      // Focus the file upload button to guide the user
      setTimeout(() => handleUploadClick(), 100);
      return;
    }
    
    // Start upload process
    setUploadStatus("uploading");
    setUploadProgress(0);
    setError(""); // Clear any previous errors
    
    try {
      const uploadedFiles = [];
      
      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress based on file being processed (first 70% for file uploads)
        setUploadProgress((i / files.length) * 70);
        
        // Create FormData for multipart/form-data
        const formData = new FormData();
        formData.append('file', file);
        
        // If context is provided, add it as well
        if (context.trim()) {
          formData.append('context', context);
        }
        
        // Make the API call
        const response = await fetch('https://cpqa.qa-mt.cywareqa.com/cpapi/rest-auth/upload-file/', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'authorization': `CYW ${AUTH_TOKEN}`,
            'cache-control': 'no-cache',
            'origin': 'https://cpqa.qa-mt.cywareqa.com',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://cpqa.qa-mt.cywareqa.com/cp/profile/my-profile',
            'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Store the file info with its fileKey
        uploadedFiles.push({
          fileName: file.name,
          fileKey: result.fileKey || result.file_key || result.key, // Handle different possible response formats
          originalFile: file,
          response: result
        });
        
        console.log(`Uploaded ${file.name}:`, result);
      }
      
      // Files uploaded, now make the agent search API call (20% progress)
      setUploadProgress(80);
      
      // Making agent search API call
      const agentSearchResponse = await fetch('https://cpqa.qa-mt.cywareqa.com/qb/v1/session/qbit/file-proc/agent-search/', {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'content-type': 'application/json',
          'origin': 'https://cpqa.qa-mt.cywareqa.com',
          'authorization': `CYW ${AUTH_TOKEN}`,
          'priority': 'u=1, i',
          'referer': 'https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/',
          'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          query: context.trim()
        })
      });
      
      if (!agentSearchResponse.ok) {
        throw new Error(`Agent search failed: ${agentSearchResponse.status} ${agentSearchResponse.statusText}`);
      }
      
      const agentSearchResult = await agentSearchResponse.json();
      console.log("Agent search result:", agentSearchResult);
      
      // Set agents from the API response
      if (agentSearchResult.agents && Array.isArray(agentSearchResult.agents)) {
        setAgents(agentSearchResult.agents);
      } else if (agentSearchResult.data && Array.isArray(agentSearchResult.data)) {
        setAgents(agentSearchResult.data);
      } else {
        // Handle different possible response formats
        setAgents(agentSearchResult.results || agentSearchResult.items || []);
      }
      
      // Final progress update
      setUploadProgress(100);
      
      // Log all uploaded files
      console.log("All files uploaded successfully:", uploadedFiles);
      console.log("Context:", context);
      
      // Show success state
      setUploadStatus("success");
      
      // Return the uploaded files data for potential use by parent components
      return uploadedFiles;
      
    } catch (error) {
      console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
      setUploadStatus("idle");
      setUploadProgress(0);
    }
  };

  // Handle agent selection
  const handleAgentSelect = async (agent) => {
    setLoadingAgents(true);
    setError(""); // Clear any previous errors
    console.log("Selected agent:", agent);
    
    try {
      // Use the sendAgentPrompt API (same as lookup functionality)
      const response = await sendAgentPrompt(context.trim(), agent.agent_id);
      console.log("Agent prompt response:", response);
      
      // Extract session ID from response and display it to user
      if (response && (response.session_id || response.sessionId)) {
        const extractedSessionId = response.session_id || response.sessionId;
        setSessionId(extractedSessionId);
        console.log("Session ID extracted:", extractedSessionId);
      } else if (typeof response === 'string' && response.trim()) {
        // Handle case where response is directly the session ID string
        const extractedSessionId = response.trim();
        setSessionId(extractedSessionId);
        console.log("Raw session ID detected:", extractedSessionId);
      } else {
        console.error("Session ID not found in response:", response);
        setError("Session ID not found in response");
      }
      
      console.log(`Processing files with agent: ${agent.agent_name || agent.name}`);
      
    } catch (error) {
      console.error("Agent selection error:", error);
      setError(`Failed to select agent: ${error.message}`);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Return a compact Spotlight-like interface
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4">
      {/* Agents display section - positioned above the spotlight */}
      <AnimatePresence>
        {agents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/95 dark:bg-neutral-800/95 rounded-lg shadow-xl p-6 min-w-[600px] max-w-[750px] mb-6"
          >
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-800 dark:text-white" style={{color: "white"}}>
                File Processing Agents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select an agent to process your uploaded files with the provided context
              </p>
            </div>
            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto">
              {agents.map((agent, index) => (
                <AgentButton
                  key={agent.id || index}
                  agent={agent}
                  loading={loadingAgents}
                  onClick={() => handleAgentSelect(agent)}
                />
              ))}
            </div>
            
            {/* Session ID display */}
            {sessionId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={() => {
                      setSessionId(null);
                      setAgents([]);
                      setFiles([]);
                      setContext("");
                      setUploadStatus("idle");
                    }}
                    className="inline-flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium"
                  >
                    🔄 Process More Files
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main spotlight component */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/90 dark:bg-neutral-800 rounded-full shadow-xl w-auto p-2 flex items-center"
      >
        {/* Left side - Text input */}
        <textarea
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            // Adjust the height to fit content
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(80, e.target.scrollHeight) + 'px';
          }}
          onFocus={() => setIsTextareaFocused(true)}
          onBlur={() => setIsTextareaFocused(false)}
          onKeyDown={(e) => {
            // Always handle Enter for submission (not just when files are selected)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit().catch(console.error);
            }
          }}
          className={`w-[600px] h-10 py-2 px-4 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none resize-none overflow-hidden scrollbar-hide transition-all ${
            isTextareaFocused ? "border-b border-blue-500" : ""
          } ${!context.trim() ? "border-b border-red-300" : ""}`}
          placeholder="Add context about the files you're uploading... (Required)"
        ></textarea>
        
        {/* Separator */}
        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-2"></div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        {/* File upload button with different states */}
        <button
          onClick={uploadStatus !== "uploading" ? handleUploadClick : null}
          disabled={uploadStatus === "uploading"}
          className={`flex items-center justify-center p-2 rounded-full transition-colors ${
            uploadStatus !== "uploading" 
              ? "hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer" 
              : "cursor-default"
          }`}
          title={
            uploadStatus === "idle" 
              ? "Upload files" 
              : uploadStatus === "uploading" 
                ? "Uploading..." 
                : "Upload more files"
          }
        >
          {uploadStatus === "idle" && (
            <IconUpload className="h-5 w-5 text-blue-500" />
          )}
          
          {uploadStatus === "uploading" && (
            <div className="relative flex items-center justify-center">
              <div 
                className="absolute inset-0 rounded-full border-2 border-blue-500"
                style={{ 
                  clipPath: `circle(${uploadProgress}% at center)`,
                  opacity: 0.3,
                  backgroundColor: '#3b82f6' 
                }}
              />
              <IconLoader2 className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          )}
          
          {uploadStatus === "success" && (
            <div
              className="bg-green-500 text-white rounded-full p-1 flex items-center justify-center"
            >
              <IconCheck className="h-4 w-4" />
            </div>
          )}
        </button>
        
        {/* File count badge - only shown in idle state */}
        {/* {files.length > 0 && uploadStatus === "idle" && (
          <div className="ml-1 bg-blue-500 text-white text-xs py-0.5 px-2 rounded-full">
            {files.length}
          </div>
        )} */}
        
        {/* Upload button (only shown when files are selected in idle state) */}
        {/* {files.length > 0 && uploadStatus === "idle" && (
          <button
            onClick={handleSubmit}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded-full transition-colors"
          >
            Upload
          </button>
        )} */}
        
        {/* Upload new files button (only shown in success state) */}
        {/* {uploadStatus === "success" && (
          <button
            onClick={() => {
              setFiles([]);
              setContext("");
              setUploadStatus("idle");
            }}
            className="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-full transition-colors"
          >
            Upload More
          </button>
        )} */}
      </motion.div>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 p-2 bg-white/90 text-red-600 rounded-md text-sm shadow-xl"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast notification for success */}
      <AnimatePresence>
        {uploadStatus === "success" && !sessionId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 p-2 bg-white/90 text-green-700 rounded-md text-sm flex items-center shadow-xl"
          >
            <IconCheck className="h-4 w-4 mr-2" />
            {agents.length > 0 
              ? "Files uploaded successfully! Select an agent above to process them."
              : "Files uploaded successfully! Press ESC to close this window."
            }
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File details (shown as a tooltip-like element when hovering over the file count) */}
      {files.length > 0 && uploadStatus === "idle" && !sessionId && (
        <div className="absolute top-[70px] right-[120px] bg-white/90 dark:bg-neutral-800 rounded-lg shadow-xl p-3 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="font-medium mb-2">{files.length} {files.length === 1 ? 'file' : 'files'} selected</div>
          <div className="max-h-[100px] overflow-y-auto scrollbar-hide">
            {files.map((file, index) => (
              <div key={index} className="flex items-center py-1">
                <span className="truncate max-w-[250px]">{file.name}</span>
                <span className="ml-2 text-neutral-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPopup;
