import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        const response = await result.response;
        console.log(`SUCCESS: ${modelName} responded:`, response.text().substring(0, 50));
        return true;
    } catch (error) {
        console.log(`FAIL: ${modelName} - ${error.message.split(']')[0]}]`); // Log first part of error
        return false;
    }
}

async function runTests() {
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-1.0-pro",
        "gemini-pro"
    ];

    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n>>> RECOMMENDED MODEL: ${model} <<<\n`);
            break; // Stop after finding the first working one
        }
    }
}

runTests();
