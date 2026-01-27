import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

export async function analyzeImage(imageFile, textInput) {
  const formData = new FormData();
  if (imageFile) formData.append("file", imageFile);
  if (textInput) formData.append("text_input", textInput);

  try {
    const res = await api.post("/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("API Error:", err);
    throw new Error("Failed to analyze");
  }
}

export async function startCooking(recipeId) {
  try {
    const response = await fetch(`${API_URL}/start_cooking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipe_id: recipeId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Request failed'}`);
    }
    
    return response;
  } catch (error) {
    console.error("Start cooking error:", error);
    throw error;
  }
}

export async function sendChatMessage(threadId, message) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: threadId,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Request failed'}`);
    }

    return response;
  } catch (error) {
    console.error("Chat message error:", error);
    throw error;
  }
}
