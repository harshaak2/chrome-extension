import { AUTH_TOKEN } from "./consts";

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
    const res = await fetch(`https://cpqa.qa-mt.cywareqa.com/qb/v1/session/qbit/cursor/agent-search/`, {
      method: "PUT",
      headers: {
        "accept": "application/json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "origin": "https://cpqa.qa-mt.cywareqa.com",
        "authorization": "CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY",
        "priority": "u=1, i",
        "referer": "https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/",
        "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        "query": text
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch agent search response: ${res.status}`);
    }

    const data = await res.json();
    console.log("Agent search response:", data);
    
    // Handle the response format with agents array
    if (data.agents && Array.isArray(data.agents)) {
      return { results: data.agents };
    }
    
    return { results: [] };
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
        { id: 1, name: "Understanding Denial of Service (DoS) Attacks", date: "2025-05-20", description: "Analysis of customer behavior dataset" },
        { id: 2, name: "IP Enrichment Query", date: "2025-05-21", description: "Summarized quarterly report" },
        { id: 3, name: "General Security Chat", date: "2025-05-22", description: "Generated React components for dashboard" },
        { id: 4, name: "Explain DDoS Attack", date: "2025-05-15", description: "Analyzed marketing campaign results" },
        { id: 5, name: "IP Address Query", date: "2025-05-10", description: "Summarized financial reports for Q1" },
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

// Agent prompt API function for handling agent selection
export async function sendAgentPrompt(text, agentId) {
  try {
    console.log("Sending agent prompt with:", { text, agentId });
    
    const requestBody = {
      "text": text,
      "agent_id": agentId,
      "type": 1,
      "topic": 0,
      "prompt_mode": 6,
      "vendor": "openai",
      "model": "gpt-4o",
      "heat": "false"
    };
    
    console.log("Request body:", requestBody);
    
    const res = await fetch(`https://cpqa.qa-mt.cywareqa.com/qb/v1/session/qbit/prompt/ctix`, {
      method: "PUT",
      headers: {
        "accept": "application/json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "origin": "https://cpqa.qa-mt.cywareqa.com",
        "authorization": "CYW eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJjc2FwX21lbWJlcl9wZXJtaXNzaW9uIjpudWxsLCJkZXZpY2VfaWQiOiIiLCJlbWFpbCI6InN5c3RlbS5kZWZhdWx0QGN5d2FyZS5jb20iLCJleHAiOjE3NjA5MTQzMjgsImZ1bGxfbmFtZSI6IlN5c3RlbSBEZWZhdWx0IiwidGVuYW50X2FwcHMiOlsicXVhcnRlcmJhY2siLCJjbyJdLCJ0ZW5hbnRfaWQiOiIwMUpDRDc4RDM3NDI0Q0tWSDIwMjZWTjNSNSIsInVzZXJfaWQiOiIwMUpDRDc4RDVYMDAwMDAwMDAwMDAwMDAwMCIsIndvcmtzcGFjZV9pZCI6IjAxSlFSRDAzOVM3MEFBREhNR0pCOUNNTkM3In0.QQqWpD0adn9vulcXBCLAK1iznhYw_pSKXKXUJNQTOrQhRyrx2ao_nnavmHfiPBTBQ2dyzap-lCwAtUCoGufy6T_zrcx2d4g466pGx8IfUOEYr8qUCDDz3cYuq1OpkKVHqzsZcj8cHaMTJScVBmXSnwoGZThW6pUCBITRrsWJYOY",
        "priority": "u=1, i",
        "referer": "https://cpqa.qa-mt.cywareqa.com/mfa/quarterback/",
        "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Agent prompt API error response:", errorText);
      throw new Error(`Failed to send agent prompt: ${res.status} - ${errorText}`);
    }

    // Get the response as text first to check if it's valid JSON
    const responseText = await res.text();
    console.log("Agent prompt raw response:", responseText);
    
    // Check if the response is a raw session ID (just a string) or JSON
    try {
      const data = responseText;
      console.log("Agent prompt parsed response:", data);
      return data;
    } catch (jsonError) {
      // If JSON parsing fails, check if it's a raw session ID string
      console.log("Response is not JSON, checking if it's a raw session ID");
      
      // Remove any quotes or whitespace that might be around the session ID
      const cleanedResponse = responseText.trim().replace(/^["']|["']$/g, '');
      
      // Check if it looks like a session ID (alphanumeric string)
      if (cleanedResponse && /^[A-Z0-9]{20,}$/i.test(cleanedResponse)) {
        console.log("Detected raw session ID:", cleanedResponse);
        return { session_id: cleanedResponse };
      }
      
      console.error("Failed to parse JSON response:", jsonError);
      console.error("Raw response was:", responseText);
      throw new Error(`Invalid response from server. Expected JSON or session ID, got: ${responseText}`);
    }
  } catch (error) {
    console.error("Error calling agent prompt API:", error);
    throw new Error("Failed to process agent prompt: " + error.message);
  }
}
