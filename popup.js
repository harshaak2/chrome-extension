// Function to initialize the extension
const confirmButton = document.getElementById("confirm");

const resultDiv = document.getElementById("result");

confirmButton.addEventListener("click", () => {
    console.log("Confirm button clicked");
    const result = document.getElementById("result");
    result.textContent = "Extracting data...";
    result.style.color = "white";

    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        if (!tab) {
            result.textContent = "No active tab found";
            result.style.color = "red";
            return;
        }

        // Check if this is a valid URL where content scripts can run
        if (
            !tab.url ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("chrome-extension://") ||
            tab.url.startsWith("edge://") ||
            tab.url.startsWith("about:")
        ) {
            result.textContent = "Cannot access content on this page";
            result.style.color = "red";
            return;
        }

        // Make sure the content script is loaded first
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"],
            });

            // Now send the message to the content script
            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_SELECTED_TEXT" },
                async (response) => {
                    if (chrome.runtime.lastError) {
                        result.textContent =
                            "Error: " + chrome.runtime.lastError.message;
                        result.style.color = "red";
                        return;
                    }

                    if (response && response.text) {
                        // result.textContent = response.text;
                        //* the logic to handle API calls
                        try {
                            const res = await getAIResponse(response.text);
                            result.textContent = res;
                            result.style.color = "white";
                        } catch (error) {
                            result.textContent = "AI Error: " + error.message;
                            result.style.color = "red";
                        }
                    } else {
                        result.textContent =
                            "No text selected or cannot access page content";
                    }
                }
            );
        } catch (error) {
            result.textContent = "Error: " + error.message;
            result.style.color = "red";
        }
    });
});

document.getElementById("copy").addEventListener("click", () => {
    const result = document.getElementById("result");
    const text = result.textContent;
    if (text) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                const btn = document.getElementById("copy");
                const oldText = btn.textContent;
                btn.textContent = "Copied!";
                setTimeout(() => {
                    btn.textContent = oldText;
                }, 2000);
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    } else {
        console.error("No text to copy");
    }
});

// Start the initialization when the script loads
// If running at the end of body, DOM should be loaded
// If not, this will still work with setTimeout retry
// initExtension();

// main logic
//* Get the auth token from the local storage
//* if auth token is present, show the popup
//* if auth token is not present, redirect to the login page
//! check if the auth token is stored in the local storage
//! and is accessible from other tabs
//* check if it possible to show a popover wherever the user selects text

async function getAIResponse(text) {
    const res = await fetch(`http:localhost:3000/api/ai/test`, {
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
}
