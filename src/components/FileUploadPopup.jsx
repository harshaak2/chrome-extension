import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconUpload, IconX, IconCheck, IconLoader2 } from "@tabler/icons-react";

const FileUploadPopup = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [context, setContext] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success
  const [uploadProgress, setUploadProgress] = useState(0);
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
    // Set a small initial size for the window
    if (window.chrome && window.chrome.windows && window.chrome.windows.getCurrent && window.chrome.windows.update) {
      window.chrome.windows.getCurrent((win) => {
        window.chrome.windows.update(win.id, {
          width: 580,
          height: 150 // Keep it compact since we don't show the file list anymore
        });
      });
    }
    
    console.log("FileUploadPopup component mounted");
    
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, files.length]);

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
        
        // Update progress based on file being processed
        setUploadProgress((i / files.length) * 90); // Reserve 10% for final processing
        
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
            'authorization': 'CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY',
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

  // Return a compact Spotlight-like interface
  return (
    <div className="fixed inset-0 flex items-center justify-center">
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
          className={`w-[450px] h-10 py-2 px-4 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none resize-none overflow-hidden scrollbar-hide transition-all ${
            isTextareaFocused ? "border-b border-blue-500" : ""
          }`}
          placeholder="Add context about the files you're uploading..."
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
        {uploadStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 p-2 bg-white/90 text-green-700 rounded-md text-sm flex items-center shadow-xl"
          >
            <IconCheck className="h-4 w-4 mr-2" />
            Files uploaded successfully! Press ESC to close this window.
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File details (shown as a tooltip-like element when hovering over the file count) */}
      {files.length > 0 && uploadStatus === "idle" && (
        <div className="absolute top-[60px] right-[90px] bg-white/90 dark:bg-neutral-800 rounded-lg shadow-xl p-2 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="font-medium mb-1">{files.length} {files.length === 1 ? 'file' : 'files'} selected</div>
          <div className="max-h-[80px] overflow-y-auto scrollbar-hide">
            {files.map((file, index) => (
              <div key={index} className="flex items-center py-1">
                <span className="truncate max-w-[200px]">{file.name}</span>
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
