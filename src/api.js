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
