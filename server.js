import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate SQL from English input
async function generateSQL(question) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // ✅ Correct model
    const prompt = `Convert the following English query into a valid MySQL query. Return only the SQL query, with no explanations or markdown formatting. Question: ${question}`;
    
    try {
        const result = await model.generateContent(prompt);
        let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Failed to extract SQL from Gemini response.");

        // ✅ Remove markdown formatting if present
        text = text.replace(/```sql/g, "").replace(/```/g, "").trim();
        
        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Gemini API failed to generate SQL.");
    }
}


// Endpoint to convert English to SQL
app.post("/query", async (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({ success: false, error: "Question is required." });
    }

    try {
        const sqlQuery = await generateSQL(question);
        res.json({ success: true, sql: sqlQuery, message: "Generated SQL successfully. Confirm before execution." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to execute the SQL query in MySQL
app.post("/execute", async (req, res) => {
    const { sql } = req.body;
    
    if (!sql) {
        return res.status(400).json({ success: false, error: "SQL query is required." });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "rms",
        });

        const [rows] = await connection.query(sql);
        res.json({ success: true, result: rows });
    } catch (error) {
        console.error("MySQL Error:", error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) await connection.end(); // Close connection properly
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
