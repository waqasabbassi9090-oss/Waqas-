import { GoogleGenAI } from "@google/genai";
import { UploadedImage, GenerationResult } from "../types";

const apiKey = process.env.API_KEY;

export const enhancePrompt = async (input: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  if (!input.trim()) return "";

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert architectural visualization prompter.
      Refine the following user request into a specific, high-quality prompt for an image generation model.
      
      User Request: "${input}"
      
      Guidelines:
      - Focus on architectural materials, lighting, style, and atmosphere.
      - Keep it concise (under 50 words).
      - Do not include conversational filler.
      - If the user asks for a specific change (e.g. "remove car"), prioritize that clearly.
      
      Enhanced Prompt:`,
    });

    return response.text ? response.text.trim() : input;
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    return input; // Fallback to original
  }
};

export const generateArchitectureTransform = async (
  prompt: string,
  sourceImage: UploadedImage,
  referenceImage: UploadedImage | null
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];

  // 1. Add Source Image
  parts.push({
    inlineData: {
      mimeType: sourceImage.mimeType,
      data: sourceImage.base64,
    },
  });

  // 2. Add Reference Image (if available)
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: referenceImage.mimeType,
        data: referenceImage.base64,
      },
    });
  }

  // 3. Construct the Text Prompt
  let finalPrompt = "";
  if (referenceImage) {
    finalPrompt = `You are an expert architectural visualizer.
    
    Image 1: Source image of a house/building.
    Image 2: Style reference image.
    
    Task: Re-skin the house in Image 1 to completely match the visual style, materials, and color palette of Image 2.
    
    CRITICAL INSTRUCTIONS FOR UNIFORMITY:
    - GLOBAL APPLICATION: Apply the new style to the ENTIRE exterior. Do not just patch specific areas.
    - MATERIAL REPLACEMENT: Completely replace the textures of the original walls, roof, and trim. If the source is brick and reference is stucco, the output MUST be 100% stucco, no patchy brick showing through.
    - GEOMETRY PRESERVATION: Keep the structural shape, windows, and perspective of Image 1 exactly as they are. Only change the "skin" (surface materials and colors).
    
    User instruction: ${prompt || "Apply the style from the reference image."}
    
    Output a photorealistic high-resolution render.`;
  } else {
    finalPrompt = `You are an expert architectural visualizer.
    
    Image 1: Source image of a house/building.
    
    Task: Edit this image based on the following instruction: "${prompt}"
    
    CRITICAL INSTRUCTIONS:
    - IF STYLE CHANGE: If the user asks to change materials (e.g., "make it wood", "paint it black"), apply this change GLOBALLY and UNIFORMLY to all relevant surfaces. Do not leave patches of the old material. Overwrite the old texture completely.
    - IF EDITING OBJECTS: If the user asks to remove or add objects (e.g., "remove person", "add tree"), blend the changes seamlessly into the environment.
    - PRESERVE: Maintain the perspective, lighting direction, and structural integrity of the house unless explicitly told to remodel it.
    
    Output a photorealistic high-resolution render.`;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: parts,
      },
    });

    let generatedImageUrl: string | null = null;
    let generatedText: string | null = null;

    // Parse response to find image and text
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
             // Sometimes the model returns a text description along with the image
            generatedText = part.text;
          }
        }
      }
    }

    if (!generatedImageUrl) {
        // Fallback if no image found directly in inlineData, check if it's purely text indicating refusal or error
        if (generatedText) {
             throw new Error("The model returned text but no image. It might have refused the request: " + generatedText);
        }
        throw new Error("No image generated.");
    }

    return {
      imageUrl: generatedImageUrl,
      text: generatedText,
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate transformation.");
  }
};