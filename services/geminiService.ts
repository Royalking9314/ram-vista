import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GEMINI_MODELS } from "../constants.ts";

// Initialize AI using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

export const generateQuickResponse = async (prompt: string): Promise<string> => {
   if (!process.env.API_KEY) return "API Key missing.";
   
   try {
     const response = await ai.models.generateContent({
       model: GEMINI_MODELS.FAST,
       contents: prompt
     });
     // Access the text property directly on the response object.
     return response.text || "";
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
  if (!process.env.API_KEY) return "API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        // Set thinking budget for reasoning capabilities in Pro models.
        thinkingConfig: isComplex ? { thinkingBudget: 4000 } : undefined
      }
    });
    // Access the text property directly on the response object.
    return response.text || "";
  } catch (error) {
    console.error("Gemini Artifact Generation Error", error);
    return "Error generating content.";
  }
};

export const streamChatResponse = async function* (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  if (!process.env.API_KEY) {
    yield "API Key missing in environment variables.";
    return;
  }

  try {
    // Correctly using Chat type and chats.create method.
    const chat: Chat = ai.chats.create({
      model: GEMINI_MODELS.STANDARD,
      history: history,
      config: {
        systemInstruction: "You are a helpful assistant for the 'RAM Vista' project. You help the user understand memory virtualization, Linux kernels, and Redis.",
      }
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      // Access the text property on the response chunk during streaming.
      if (response.text) {
        yield response.text;
      }
    }
  } catch (error) {
    console.error("Chat Stream Error:", error);
    yield "An error occurred while communicating with Gemini.";
  }
};