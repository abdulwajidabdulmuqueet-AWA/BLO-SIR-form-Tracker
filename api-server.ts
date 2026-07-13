import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import mammoth from 'mammoth';

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
  console.log("=== Received Request to /api/parse-yaadi ===");
  try {
    const { ocrText, fileBase64, mimeType } = req.body;
    
    if (!ocrText && !fileBase64) {
      console.warn("Bad Request: Neither OCR text nor File base64 data was provided.");
      return res.status(400).json({ error: 'Either OCR text or File base64 data is required' });
    }

    let contents: any;

    if (fileBase64 && mimeType) {
      console.log(`Processing file payload: mimeType=${mimeType}, base64 length=${fileBase64.length}`);
      // Remove data URL prefix if present
      const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
      console.log(`Cleaned base64 length: ${cleanBase64.length}`);
      
      const isWordDoc = mimeType.includes('word') || 
                        mimeType.includes('officedocument') || 
                        mimeType.includes('msword') || 
                        mimeType === 'docx' || 
                        mimeType === 'doc';

      if (isWordDoc) {
        console.log("Extracting text from Word (.docx/.doc) file using mammoth...");
        try {
          const buffer = Buffer.from(cleanBase64, 'base64');
          const result = await mammoth.extractRawText({ buffer });
          const extractedText = result.value;
          console.log(`Successfully extracted ${extractedText.length} characters of text from Word file.`);

          contents = {
            parts: [
              {
                text: `You are an expert electoral data processor for Maharashtra Voter Lists (Yaadi).
Parse the following text extracted from a Word (.docx/.doc) document (which may contain mixed Marathi, English, or OCR typos) into a structured JSON array of voter objects.

Strict Output Rules:
1. Translate Marathi genders ("पुरुष" -> "Male", "स्त्री" or "महिला" -> "Female", otherwise "Other") to English.
2. Clean up names and remove trailing/leading special characters.
3. Extract age as an integer.
4. Extract the serial number ("srNo" / अनुक्रमांक) as a clean string representing the number (e.g., "1", "12").
5. Extract the EPIC Card Number (voter card ID like XYZ1234567, MH/12/...). If missing or unreadable, return empty string "".
6. Extract the House Number ("houseNo" / घर क्रमांक). If missing, return empty string "".
7. Maintain the relative order of voters as they appear in the text.

Extracted Text to Parse:
"""
${extractedText}
"""

Return ONLY a valid JSON array conforming to this schema. Do not include any markdown formatting, no preamble, and no explanation.`
              }
            ]
          };
        } catch (docxError: any) {
          console.error("Mammoth DOCX parsing failed:", docxError);
          return res.status(400).json({ error: `Failed to read Word document: ${docxError.message || docxError}` });
        }
      } else {
        contents = {
          parts: [
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
          ]
        };
      }
    } else {
      console.log(`Processing plain text OCR payload: text length=${ocrText.length}`);
      contents = {
        parts: [
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
        ]
      };
    }

    console.log("Calling Gemini API (model: gemini-3.1-flash-lite) with responseSchema configuration...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
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
    console.log(`Gemini raw response text length: ${resultText.length}`);
    
    // Parse to ensure it is valid JSON and send back
    try {
      const parsedData = JSON.parse(resultText);
      console.log(`Successfully parsed voter list. Total voters: ${parsedData.length}`);
      return res.json({ success: true, voters: parsedData });
    } catch (parseError) {
      console.warn("Direct JSON parsing failed, attempting markdown cleanup for:", resultText.slice(0, 200));
      // Fallback in case Gemini wrapped it in markdown or returned invalid format
      const cleanJson = resultText.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      console.log(`Successfully parsed voter list after cleanup. Total voters: ${parsedData.length}`);
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
