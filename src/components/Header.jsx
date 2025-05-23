// "use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, X, User, Calendar, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react"
import { getAllAgents, getAllSessions } from "../api" // Import the API functions

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [allAgents, setAllAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [allSessions, setAllSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const menuRef = useRef(null);

  // Dummy data for agents and sessions
  const dummyAgents = [
    { id: 1, name: "Data Analysis Agent" },
    { id: 2, name: "Text Summarizer Agent" },
    { id: 3, name: "Code Generator Agent" },
    { id: 4, name: "Translation Agent" },
  ];

  const dummySessions = [
    { id: 1, name: "Dataset Analysis", date: "2025-05-20" },
    { id: 2, name: "Text Summary", date: "2025-05-21" },
    { id: 3, name: "Code Generation", date: "2025-05-22" },
  ];

  function handleNewSession() {
    // Logic to start a new session
    console.log("New session started");
  }

  function handleMenuClick() {
    // Logic to toggle the menu
    setShowMenu(!showMenu);
  }

  function handleClose() {
    window.close(); // Close the popup window
  }

  function toggleAgents() {
    setShowAgents(!showAgents);
    // When opening agents, close sessions and reset all agents view
    if (!showAgents) {
      setShowSessions(false);
      setShowAllAgents(false);
    }
  }

  function toggleSessions() {
    setShowSessions(!showSessions);
    // When opening sessions, close agents and reset all sessions view
    if (!showSessions) {
      setShowAgents(false);
      setShowAllSessions(false);
    }
  }

  // Function to handle fetching all agents
  async function handleSeeAllAgents() {
    try {
      setIsLoadingAgents(true);
      setShowAllAgents(true);
      const agents = await getAllAgents();
      setAllAgents(agents);
    } catch (error) {
      console.error("Error fetching all agents:", error);
    } finally {
      setIsLoadingAgents(false);
    }
  }

  // Function to go back from all agents view to normal view
  function handleBackToAgents() {
    setShowAllAgents(false);
  }

  // Function to handle fetching all sessions
  async function handleSeeAllSessions() {
    try {
      setIsLoadingSessions(true);
      setShowAllSessions(true);
      const sessions = await getAllSessions();
      setAllSessions(sessions);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  // Function to go back from all sessions view to normal view
  function handleBackToSessions() {
    setShowAllSessions(false);
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add custom scrollbar styles
  useEffect(() => {
    // Add a style element for custom scrollbar
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #c0c0c0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0a0a0;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-2 py-2" style={{ backgroundColor: "#4123d8" }}>
      <span className="text-white text-lg font-medium ml-1 font-mono">QB it!</span>
      <div className="flex items-center gap-1">
        <div
          onClick={handleNewSession}
          className="bg-white text-[#4123d8] hover:bg-gray-100 hover:text-[#4123d8] font-normal rounded-sm text-xs px-2 py-1 cursor-pointer"
        >
          Start New Session
        </div>
        <div 
          ref={menuRef}
          className="relative"
        >
          <div
            onClick={handleMenuClick}
            className="text-white hover:bg-[#5438e2] cursor-pointer p-1 rounded-sm"
          >
            <MoreVertical className="h-4 w-4" />
          </div>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              {/* Agent list option */}
              <div className="px-2 py-2 border-b border-gray-100">
                <div 
                  onClick={toggleAgents}
                  className="font-medium text-sm text-gray-700 flex items-center justify-between hover:bg-gray-100 p-2 rounded-md cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Agent List</span>
                  </div>
                  {showAgents ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>
                
                {/* Agents list - collapsible */}
                {showAgents && !showAllAgents && (
                  <div className="ml-6 mt-1">
                    <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {dummyAgents.map(agent => (
                        <div key={agent.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                          {agent.name}
                        </div>
                      ))}
                    </div>
                    <div 
                      onClick={handleSeeAllAgents}
                      className="text-xs text-[#4123d8] py-1 mt-1 font-medium cursor-pointer"
                    >
                      See all agents →
                    </div>
                  </div>
                )}

                {/* Full Agents list from API */}
                {showAgents && showAllAgents && (
                  <div className="ml-6 mt-1">
                    <div 
                      onClick={handleBackToAgents}
                      className="text-xs text-[#4123d8] py-1 mb-2 font-medium cursor-pointer flex items-center"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" /> Back
                    </div>
                    
                    {isLoadingAgents ? (
                      <div className="text-xs text-gray-600 py-1">Loading agents...</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {allAgents.map(agent => (
                          <div key={agent.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                            {agent.name}
                            {agent.description && (
                              <div className="text-gray-400 text-[10px]">
                                {agent.description.length > 40 
                                  ? agent.description.substring(0, 40) + "..." 
                                  : agent.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sessions option */}
              <div className="px-2 py-2">
                <div 
                  onClick={toggleSessions}
                  className="font-medium text-sm text-gray-700 flex items-center justify-between hover:bg-gray-100 p-2 rounded-md cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Sessions</span>
                  </div>
                  {showSessions ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>
                
                {/* Sessions list - collapsible */}
                {showSessions && !showAllSessions && (
                  <div className="ml-6 mt-1">
                    <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {dummySessions.map(session => (
                        <div key={session.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                          <span>{session.name}</span>
                          {/* <span className="text-gray-400 ml-1">({session.date})</span> */}
                        </div>
                      ))}
                    </div>
                    <div 
                      onClick={handleSeeAllSessions}
                      className="text-xs text-[#4123d8] py-1 mt-1 font-medium cursor-pointer"
                    >
                      See all sessions →
                    </div>
                  </div>
                )}

                {/* Full Sessions list from API */}
                {showSessions && showAllSessions && (
                  <div className="ml-6 mt-1">
                    <div 
                      onClick={handleBackToSessions}
                      className="text-xs text-[#4123d8] py-1 mb-2 font-medium cursor-pointer flex items-center"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" /> Back
                    </div>
                    
                    {isLoadingSessions ? (
                      <div className="text-xs text-gray-600 py-1">Loading sessions...</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {allSessions.map(session => (
                          <div key={session.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                            <div className="flex justify-between">
                              <span>{session.name}</span>
                              {/* <span className="text-gray-400 ml-1 text-[10px]">{session.date}</span> */}
                            </div>
                            {/* {session.description && (
                              <div className="text-gray-400 text-[10px]">
                                {session.description.length > 40 
                                  ? session.description.substring(0, 40) + "..." 
                                  : session.description}
                              </div>
                            )} */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div 
          onClick={handleClose} 
          className="text-white hover:bg-[#5438e2] hover:rounded-sm cursor-pointer p-1 transition-all"
        >
          <X className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}
