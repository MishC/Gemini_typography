import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
import {GoogleGenAI} from '@google/genai';

const app = express();

// ---- security & parsing ----
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// In dev, allow your React dev origin (adjust as needed)
const DEV_ORIGIN = process.env.DEV_ORIGIN || 'http://localhost:5174';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : [DEV_ORIGIN],
}));
// --- Configuration ---
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

// Define the system instructions and desired JSON schema for the typographer task
const FONT_SYSTEM_PROMPT = "You are an expert typographer and graphic designer specializing in Google Fonts. Your task is to select the single most appropriate Google Font (by name) for a given title, based on the title's content and implied mood. You must only respond with a single JSON object. Do not include any other text, explanation, or conversational filler.";

const FONT_RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        font_name: {
            type: "STRING",
            description: "The exact name of the chosen Google Font."
        },
        reason: {
            type: "STRING",
            description: "A brief, one-sentence string explaining the typographic rationale for the choice."
        }
    },
    // Ensure both fields are always present
    required: ["font_name", "reason"] 
};


// Check for API Key before starting
if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set. Please create a .env file.");
    process.exit(1);
}

// Initialize the GoogleGenAI client (it automatically uses the API_KEY from the environment)
const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash"; // Use the fast and capable model

// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use((req, res, next) => {
    // Basic CORS setup to allow frontend access
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// --- API Endpoint ---
/**
 * POST /api/suggest-font
 * Expects a JSON body: { "prompt": "The title text to analyze" }
 * Returns a JSON object: { "font_name": "...", "reason": "..." }
 */
app.post('/api/suggest-font', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing "prompt" in request body. Please provide the title text.' });
    }

    try {
        console.log(`Received title for analysis: "${prompt.substring(0, 50)}..."`);
        
        // Call the Gemini API, forcing structured JSON output and applying the expert persona
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: FONT_SYSTEM_PROMPT,
            config: {
                responseMimeType: "application/json",
                responseSchema: FONT_RESPONSE_SCHEMA
            }
        });
        
        // The model returns the JSON object as a string in response.text. We must parse it.
        const jsonString = response.text.trim();
        let parsedJson;

        try {
            parsedJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', jsonString);
            return res.status(500).json({ 
                error: 'AI returned non-JSON data.', 
                raw_response: jsonString 
            });
        }

        // Send the structured JSON object back to the client
        res.json(parsedJson);

    } catch (error) {
        console.error('Gemini API Error:', error.message);
        // Send a generic error response back to the client
        res.status(500).json({ 
            error: 'Failed to generate content from AI.', 
            details: error.message 
        });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\nServer is running on http://localhost:${PORT}`);
    console.log(`API Key: ${API_KEY ? 'Loaded' : 'NOT FOUND!'}`);
    console.log(`Try POSTing a request to http://localhost:${PORT}/api/suggest-font`);
});

