// API service for handling AI requests
export async function getAIResponse(text) {
  try {
    const res = await fetch(`http://localhost:3000/api/ai/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch AI response");
    }

    const data = await res.json();
    console.log("AI response data:", data);

    return data.message;
  } catch (error) {
    console.error("Error calling AI API:", error);
    throw new Error("Failed to process with AI: " + error.message);
  }
}

// Agent search API function
export async function performAgentSearch(text) {
  try {
    // const API_URL = "http://localhost:3000"; // Update this based on your actual API endpoint
    // const res = await fetch(`${API_URL}/cursor/agent-search`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     // "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
    //   },
    //   body: JSON.stringify({
    //     text,
    //   }),
    // });

    // if (!res.ok) {
    //   throw new Error(`Failed to fetch agent search response: ${res.status}`);
    // }

    // const data = await res.json();
    // console.log("Agent search response:", data);

    
    // Fallback to dummy data if the API is not available
    const data = {
      message: "Agent search results for: " + text,
      results: [
        {
          "agent_id": "01JV",
          "agent_name": "Cyware Agent",
        }
      ],
    };
    return data;
  } catch (error) {
    console.error("Error calling agent search API:", error);
    throw new Error("Failed to process with agent search: " + error.message);
  }
}

// Fetch all agents API function
export async function getAllAgents() {
  try {
    // const API_URL = "http://localhost:3000"; // Update this based on your actual API endpoint
    // const res = await fetch(`${API_URL}/api/agent-list`, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //     // "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
    //   }
    // });

    // if (!res.ok) {
    //   throw new Error(`Failed to fetch agent list: ${res.status}`);
    // }

    // const data = await res.json();
    // console.log("All agents response:", data);
    
    // Fallback to dummy data if the API is not available
    const data = {
      agents: [
        { id: 1, name: "Data Analysis Agent", description: "Analyzes datasets and provides insights" },
        { id: 2, name: "Text Summarizer Agent", description: "Summarizes lengthy documents into concise points" },
        { id: 3, name: "Code Generator Agent", description: "Generates code snippets based on requirements" },
        { id: 4, name: "Translation Agent", description: "Translates text between multiple languages" },
        { id: 5, name: "Research Assistant Agent", description: "Helps with academic and general research" },
        { id: 6, name: "Image Processing Agent", description: "Processes and analyzes images" },
        { id: 7, name: "Content Writer Agent", description: "Creates engaging content for various platforms" },
        { id: 8, name: "Financial Advisor Agent", description: "Provides financial insights and recommendations" },
        { id: 9, name: "test Writer Agent", description: "Creates engaging content for various platforms" },
        { id: 10, name: "Financial Agent", description: "Provides financial insights and recommendations" },
        { id: 11, name: "Advisor Agent", description: "Provides financial insights and recommendations" }
      ]
    };
    
    return data.agents;
  } catch (error) {
    console.error("Error fetching agent list:", error);
    throw new Error("Failed to fetch agent list: " + error.message);
  }
}

// Fetch all sessions API function
export async function getAllSessions() {
  try {
    // const API_URL = "http://localhost:3000"; // Update this based on your actual API endpoint
    // const res = await fetch(`${API_URL}/api/session-list`, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //     // "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
    //   }
    // });

    // if (!res.ok) {
    //   throw new Error(`Failed to fetch session list: ${res.status}`);
    // }

    // const data = await res.json();
    // console.log("All sessions response:", data);
    
    // Fallback to dummy data if the API is not available
    const data = {
      sessions: [
        { id: 1, name: "Dataset Analysis", date: "2025-05-20", description: "Analysis of customer behavior dataset" },
        { id: 2, name: "Text Summary", date: "2025-05-21", description: "Summarized quarterly report" },
        { id: 3, name: "Code Generation", date: "2025-05-22", description: "Generated React components for dashboard" },
        { id: 4, name: "Marketing Campaign", date: "2025-05-15", description: "Analyzed marketing campaign results" },
        { id: 5, name: "Financial Report", date: "2025-05-10", description: "Summarized financial reports for Q1" },
        { id: 6, name: "Product Research", date: "2025-04-28", description: "Research on competitor products" },
        { id: 7, name: "Document Translation", date: "2025-04-25", description: "Translated product manual to Spanish" },
        { id: 8, name: "API Documentation", date: "2025-04-20", description: "Generated documentation for REST API" },
        { id: 9, name: "Customer Survey", date: "2025-04-15", description: "Analyzed customer survey responses" },
        { id: 10, name: "Project Planning", date: "2025-04-10", description: "Created project timeline and tasks" },
        { id: 11, name: "Bug Analysis", date: "2025-04-05", description: "Analyzed bug reports for v2.3 release" },
        { id: 12, name: "Feature Requests", date: "2025-04-01", description: "Compiled and categorized user feature requests" }
      ]
    };
    
    return data.sessions;
  } catch (error) {
    console.error("Error fetching session list:", error);
    throw new Error("Failed to fetch session list: " + error.message);
  }
}
