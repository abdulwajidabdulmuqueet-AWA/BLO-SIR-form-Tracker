import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Gemini client with standard environment key and User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to parse voter list OCR text or PDF/Image files
router.post('/parse-yaadi', async (req, res) => {
  try {
    const { ocrText, fileBase64, mimeType } = req.body;
    
    if (!ocrText && !fileBase64) {
      return res.status(400).json({ error: 'Either OCR text or File base64 data is required' });
    }

    let contents: any[] = [];

    if (fileBase64 && mimeType) {
      // Remove data URL prefix if present
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      contents = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        {
          text: `You are an expert electoral data processor for Maharashtra Voter Lists (Yaadi).
Parse the attached file containing a voter list into a structured JSON array of voter objects.

Strict Output Rules:
1. Translate Marathi genders ("पुरुष" -> "Male", "स्त्री" or "महिला" -> "Female", otherwise "Other") to English.
2. Clean up names and remove trailing/leading special characters.
3. Extract age as an integer.
4. Extract the serial number ("srNo" / अनुक्रमांक) as a clean string representing the number (e.g., "1", "12").
5. Extract the EPIC Card Number (voter card ID like XYZ1234567, MH/12/...). If missing or unreadable, return empty string "".
6. Extract the House Number ("houseNo" / घर क्रमांक). If missing, return empty string "".
7. Maintain the relative order of voters as they appear in the document.

Return ONLY a valid JSON array conforming to this schema. Do not include any markdown formatting, no preamble, and no explanation.`
        }
      ];
    } else {
      contents = [
        {
          text: `You are an expert electoral data processor for Maharashtra Voter Lists (Yaadi).
Parse the following messy OCR text of a voter list (which may contain mixed Marathi, English, or OCR typos) into a structured JSON array of voter objects.

Strict Output Rules:
1. Translate Marathi genders ("पुरुष" -> "Male", "स्त्री" or "महिला" -> "Female", otherwise "Other") to English.
2. Clean up names and remove trailing/leading special characters.
3. Extract age as an integer.
4. Extract the serial number ("srNo" / अनुक्रमांक) as a clean string representing the number (e.g., "1", "12").
5. Extract the EPIC Card Number (voter card ID like XYZ1234567, MH/12/...). If missing or unreadable, return empty string "".
6. Extract the House Number ("houseNo" / घर क्रमांक). If missing, return empty string "".
7. Maintain the relative order of voters as they appear in the text.

OCR Text to Parse:
"""
${ocrText}
"""

Return ONLY a valid JSON array conforming to this schema. Do not include any markdown formatting, no preamble, and no explanation.`
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              srNo: {
                type: Type.STRING,
                description: "The serial number / Voter ID serial number (अनुक्रमांक), e.g. '125'"
              },
              name: {
                type: Type.STRING,
                description: "The full name of the voter (मतदाराचे नाव), cleaned up and properly formatted"
              },
              epic: {
                type: Type.STRING,
                description: "The EPIC Card Number (ओळखपत्र क्रमांक) if found, otherwise empty string"
              },
              age: {
                type: Type.INTEGER,
                description: "The age of the voter in years"
              },
              gender: {
                type: Type.STRING,
                description: "Voter's gender: 'Male', 'Female', or 'Other'"
              },
              houseNo: {
                type: Type.STRING,
                description: "The House Number (घर क्रमांक) if found, otherwise empty string"
              }
            },
            required: ['srNo', 'name']
          }
        }
      }
    });

    const resultText = response.text?.trim() || '[]';
    
    // Parse to ensure it is valid JSON and send back
    try {
      const parsedData = JSON.parse(resultText);
      return res.json({ success: true, voters: parsedData });
    } catch (parseError) {
      console.error("JSON parsing failed for text:", resultText);
      // Fallback in case Gemini wrapped it in markdown or returned invalid format
      const cleanJson = resultText.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return res.json({ success: true, voters: parsedData });
    }

  } catch (error: any) {
    console.error('Error parsing Yaadi with Gemini:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to parse voter list document using Gemini' 
    });
  }
});

export default router;
