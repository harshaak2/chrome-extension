import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import { motion, AnimatePresence } from "framer-motion";

const FileUploadPopup = () => {
  const [isOpen, setIsOpen] = useState(true); // Start as open by default
  const [files, setFiles] = useState([]);
  const [context, setContext] = useState("");
  const [error, setError] = useState("");

  // Handle any keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        window.close(); // Close the popup window
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Log that the component is mounted
    console.log("FileUploadPopup component mounted");
    
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle file upload
  const handleFileChange = (newFiles) => {
    setError(""); // Clear any previous errors
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (files.length === 0) {
      setError("Please upload at least one file");
      return;
    }
    
    console.log("Files:", files);
    console.log("Context:", context);
    // Here you can process the files and context as needed
    
    // Show success message and close
    alert("Files uploaded successfully!");
    window.close(); // Close the popup window
  };

  // Always render the UI since this is a dedicated popup window
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full p-6 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Upload Files to QBit
        </h2>
        <button
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          onClick={() => window.close()}
        >
          ✕
        </button>
      </div>
      
      <div className="mb-6">
        <FileUpload onChange={handleFileChange} />
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <label
          htmlFor="context"
          className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Context about the file(s):
        </label>
        <textarea
          id="context"
          rows="4"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full p-2.5 text-sm text-neutral-900 bg-neutral-50 rounded-lg border border-neutral-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white"
          placeholder="Add some context about the files you're uploading..."
        ></textarea>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.close()}
          className="px-4 py-2 mr-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-lg hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default FileUploadPopup;
