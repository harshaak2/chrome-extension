// "use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, X, User, Calendar, ChevronDown, ChevronRight } from "lucide-react"

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
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
    // Logic to close the header
    console.log("Header closed");
  }

  function toggleAgents() {
    setShowAgents(!showAgents);
    // When opening agents, close sessions
    if (!showAgents) {
      setShowSessions(false);
    }
  }

  function toggleSessions() {
    setShowSessions(!showSessions);
    // When opening sessions, close agents
    if (!showSessions) {
      setShowAgents(false);
    }
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
                {showAgents && (
                  <div className="ml-6 mt-1">
                    {dummyAgents.map(agent => (
                      <div key={agent.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                        {agent.name}
                      </div>
                    ))}
                    <div className="text-xs text-[#4123d8] py-1 mt-1 font-medium cursor-pointer">
                      {/* API integration placeholder */}
                      {/* In the future, fetch agents from API here */}
                      See all agents →
                    </div>
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
                {showSessions && (
                  <div className="ml-6 mt-1">
                    {dummySessions.map(session => (
                      <div key={session.id} className="text-xs text-gray-600 py-1 hover:text-[#4123d8] cursor-pointer">
                        <span>{session.name}</span>
                        <span className="text-gray-400 ml-1">({session.date})</span>
                      </div>
                    ))}
                    <div className="text-xs text-[#4123d8] py-1 mt-1 font-medium cursor-pointer">
                      {/* API integration placeholder */}
                      {/* In the future, fetch sessions from API here */}
                      See all sessions →
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div 
          onClick={handleClose} 
          className="text-white hover:bg-[#5438e2] cursor-pointer p-1"
        >
          <X className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}
