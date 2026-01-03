/**
 * Cloudflare Pages Function: /api/generate
 * Handles server-side Gemini API requests to keep API key secure
 */

interface Env {
  GEMINI_API_KEY: string;
}

interface GenerateRequest {
  model: string;
  systemInstruction?: string;
  userPrompt: string;
  isComplex?: boolean;
  stream?: boolean;
  history?: Array<{ role: string; parts: Array<{ text: string }> }>;
  newMessage?: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get API key from environment
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API Key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: GenerateRequest = await request.json();
    const { model, systemInstruction, userPrompt, isComplex, stream, history, newMessage } = body;

    // Handle streaming chat requests
    if (stream && history && newMessage) {
      return handleStreamingChat(apiKey, model, systemInstruction, history, newMessage);
    }

    // Handle regular content generation
    return handleGeneration(apiKey, model, systemInstruction, userPrompt, isComplex);
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleGeneration(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  userPrompt: string,
  isComplex: boolean | undefined
): Promise<Response> {
  // Build request body for Gemini API
  const requestBody: any = {
    contents: [
      {
        parts: [{ text: userPrompt }]
      }
    ]
  };

  // Add system instruction if provided
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Add generation config for complex reasoning
  if (isComplex) {
    requestBody.generationConfig = {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };
  }

  // Call Gemini API
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error('Gemini API error:', errorText);
    return new Response(
      JSON.stringify({ 
        error: 'Gemini API error', 
        status: geminiResponse.status,
        details: errorText 
      }),
      {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const data = await geminiResponse.json();
  
  // Extract text from response
  let text = '';
  if (data.candidates && data.candidates[0]?.content?.parts) {
    text = data.candidates[0].content.parts
      .map((part: any) => part.text || '')
      .join('');
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleStreamingChat(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  newMessage: string
): Promise<Response> {
  // Build request body with history
  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }]
    }
  ];

  const requestBody: any = {
    contents
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Call Gemini streaming API
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
  
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    return new Response(
      JSON.stringify({ error: 'Gemini API error', details: errorText }),
      {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Stream the response back to the client
  return new Response(geminiResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
