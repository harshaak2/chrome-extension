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
