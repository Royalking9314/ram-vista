import { GEMINI_MODELS } from "../constants.ts";

// API endpoint for Cloudflare Pages Function
const API_ENDPOINT = '/api/generate';

export const checkApiKey = (): boolean => {
  // Always return true since API key is checked server-side
  return true;
};

export const generateQuickResponse = async (prompt: string): Promise<string> => {
   try {
     const response = await fetch(API_ENDPOINT, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         model: GEMINI_MODELS.FAST,
         userPrompt: prompt,
         isComplex: false
       }),
     });

     if (!response.ok) {
       const errorData = await response.json();
       console.error("API Error:", errorData);
       return "Error generating response.";
     }

     const data = await response.json();
     return data.text || "";
   } catch (error) {
     console.error("Gemini Quick Response Error", error);
     return "Error generating response.";
   }
};

export const generateArtifact = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  isComplex: boolean
): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        systemInstruction: systemInstruction,
        userPrompt: userPrompt,
        isComplex: isComplex
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return "Error generating content.";
    }

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Gemini Artifact Generation Error", error);
    return "Error generating content.";
  }
};

export const streamChatResponse = async function* (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_MODELS.STANDARD,
        systemInstruction: "You are a helpful assistant for the 'RAM Vista' project. You help the user understand memory virtualization, Linux kernels, and Redis.",
        history: history,
        newMessage: newMessage,
        stream: true
      }),
    });

    if (!response.ok) {
      yield "An error occurred while communicating with Gemini.";
      return;
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      yield "Error: Unable to read response stream.";
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr.trim() === '[DONE]') continue;
            
            const data = JSON.parse(jsonStr);
            
            // Extract text from Gemini streaming response format
            if (data.candidates && data.candidates[0]?.content?.parts) {
              const text = data.candidates[0].content.parts
                .map((part: any) => part.text || '')
                .join('');
              if (text) {
                yield text;
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.debug('Skipping line:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error("Chat Stream Error:", error);
    yield "An error occurred while communicating with Gemini.";
  }
};