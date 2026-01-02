import { GoogleGenAI } from "@google/genai";

const getClient = (overrideKey?: string) => {
  const apiKey = overrideKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSmartPythonScript = async (
  fileName: string,
  fileType: string,
  filePreview: string,
  userInstruction?: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    
    // Using flash for speed and reasoning
    const model = "gemini-3-flash-preview";

    let prompt = "";

    if (userInstruction) {
      // User has a specific request
      prompt = `
        I have a file named "${fileName}" with MIME type "${fileType}".
        
        Here is a hex preview of the beginning of the file (first few bytes):
        ${filePreview}
        
        THE USER HAS A SPECIFIC GOAL:
        "${userInstruction}"
        
        Please write a COMPLETE, ROBUST, and PROFESSIONAL Python script to accomplish this specific goal.
        - Assume the file is in the local directory.
        - Use standard libraries or popular ones (pandas, numpy, PIL, etc.).
        - Handle potential errors gracefully.
        - Add comments explaining complex parts.
        
        Return ONLY the Python code block. Do not use Markdown backticks.
      `;
    } else {
      // Default generic analysis
      prompt = `
        I have a file named "${fileName}" with MIME type "${fileType}".
        
        Here is a hex preview of the beginning of the file:
        ${filePreview}
        
        Please write a robust, professional Python script to:
        1. Load this file efficiently.
        2. Identify what library would be best to parse it based on the file type/magic bytes.
        3. Provide a code snippet that opens the file and prints basic metadata or statistics about it.
        
        If the file type is generic binary, use the 'struct' module.
        Return ONLY the Python code block. Do not use Markdown backticks.
      `;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text || "";
    // Clean up if the model adds markdown
    return text.replace(/```python/g, '').replace(/```/g, '').trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return `# Error generating smart script.\n# Please check your API configuration.\n# Details: ${error instanceof Error ? error.message : String(error)}`;
  }
};

export const sendGeminiChat = async (
  modelName: string,
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  systemInstruction?: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    const chat = ai.chats.create({
        model: modelName,
        history: history,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
     console.error("Gemini Chat Error:", error);
     throw error;
  }
};

export const generateTeamSuccessVideo = async (
    imageBase64: string,
    mimeType: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = getClient(apiKey);
        const model = 'veo-3.1-fast-generate-preview';
        
        const prompt = "Cyberpunk style, cinematic 8k. A futuristic command center with red and blue neon lighting (ROG Aura style). In the center, a highly detailed character resembling the input image is typing on a holographic keyboard. Standing next to them is a glowing, abstract digital spirit made of pure data (representing the AI Assistant). They look at a massive main screen showing 'SUCCESS' and complex code scrolling. They high-five or nod in mutual respect. Digital confetti and sparks. High energy, triumphant atmosphere.";

        console.log("Initiating Veo Video Generation...");

        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        console.log("Video operation started. Polling for completion...");

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log("Polling status...", operation.metadata);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            throw new Error("Video generation completed but no URI returned.");
        }

        const currentKey = apiKey || process.env.API_KEY;
        return `${downloadLink}&key=${currentKey}`;

    } catch (error) {
        console.error("Veo API Error:", error);
        throw error;
    }
};