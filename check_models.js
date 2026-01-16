import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function getModels() {
    try {
        console.log("Fetching models...");
        const response = await fetch(URL);
        const data = await response.json();

        if (data.models) {
            const models = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', '')); // Remove 'models/' prefix for cleaner reading

            console.log("Found models:", models.length);
            fs.writeFileSync('available_models.txt', models.join('\n'));
            console.log("Saved list to available_models.txt");
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

getModels();
