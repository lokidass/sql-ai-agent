import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer"; // For handling file uploads
import fs from "fs"; // For reading the uploaded file

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create a connection pool for MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Function to generate SQL from English input
async function generateSQL(question) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = `Convert the following English query into a valid MySQL query. Return only the SQL query, with no explanations or markdown formatting. Question: ${question}`;
    
    try {
        const result = await model.generateContent(prompt);
        let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Failed to extract SQL from Gemini response.");

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
    const { sql, database } = req.body;
    
    if (!sql || !database) {
        return res.status(400).json({ success: false, error: "SQL query and database are required." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.changeUser({ database });

        const [rows] = await connection.query(sql);
        res.json({ success: true, result: rows });
    } catch (error) {
        console.error("MySQL Error:", error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Endpoint to fetch databases
app.get("/databases", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SHOW DATABASES");
        res.json({ success: true, databases: rows.map(row => row.Database) });
    } catch (error) {
        console.error("MySQL Error:", error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Endpoint to fetch tables in a database
app.get("/tables/:database", async (req, res) => {
    const { database } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.changeUser({ database });

        const [rows] = await connection.query("SHOW TABLES");
        res.json({ success: true, tables: rows.map(row => row[`Tables_in_${database}`]) });
    } catch (error) {
        console.error("MySQL Error:", error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Endpoint to fetch table structure
app.get("/table/:database/:table", async (req, res) => {
    const { database, table } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.changeUser({ database });

        const [rows] = await connection.query(`DESCRIBE ${table}`);
        res.json({ success: true, structure: rows });
    } catch (error) {
        console.error("MySQL Error:", error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Endpoint to generate ERD
app.get("/erd/:database", async (req, res) => {
    const { database } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.changeUser({ database });

        // Fetch all tables
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(row => row[`Tables_in_${database}`]);

        // Fetch table fields and relationships
        const tablesWithFields = [];
        const relationships = [];

        for (const table of tableNames) {
            // Fetch table fields
            const [fields] = await connection.query(`DESCRIBE ${table}`);
            tablesWithFields.push({ table, fields });

            // Fetch foreign key relationships
            const [rows] = await connection.query(`
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
            `, [database]);

            relationships.push(...rows);
        }

        // Generate Mermaid ERD syntax
        const erd = generateMermaidERD(tablesWithFields, relationships);
        res.json({ success: true, erd });
    } catch (error) {
        console.error("ERD Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Helper function to generate Mermaid ERD syntax
function generateMermaidERD(tablesWithFields, relationships) {
    let erd = "erDiagram\n";

    // Add tables with fields
    for (const { table, fields } of tablesWithFields) {
        // Escape table names with backticks if they contain special characters
        const escapedTable = table.includes(" ") || table.includes("-") ? `\`${table}\`` : table;
        erd += `    ${escapedTable} {\n`;

        // Add fields
        for (const field of fields) {
            // Escape field names with backticks if they contain special characters
            const escapedField = field.Field.includes(" ") || field.Field.includes("-") ? `\`${field.Field}\`` : field.Field;
            // Simplify field types (e.g., remove parentheses for Mermaid compatibility)
            const simplifiedType = field.Type.replace(/\(.*\)/, ""); // Remove parentheses and their contents
            erd += `        ${simplifiedType} ${escapedField}\n`;
        }
        erd += `    }\n`;
    }

    // Add relationships
    for (const rel of relationships) {
        // Escape table names with backticks if they contain special characters
        const escapedTable = rel.TABLE_NAME.includes(" ") || rel.TABLE_NAME.includes("-") ? `\`${rel.TABLE_NAME}\`` : rel.TABLE_NAME;
        const escapedRefTable = rel.REFERENCED_TABLE_NAME.includes(" ") || rel.REFERENCED_TABLE_NAME.includes("-") ? `\`${rel.REFERENCED_TABLE_NAME}\`` : rel.REFERENCED_TABLE_NAME;

        erd += `    ${escapedTable} ||--o{ ${escapedRefTable} : "${rel.COLUMN_NAME} -> ${rel.REFERENCED_COLUMN_NAME}"\n`;
    }

    return erd;
}

// Endpoint for the chatbot
app.post("/chatbot", async (req, res) => {
    const { message, context } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: "Message is required." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        
        // Include context in the prompt
        const prompt = `
            Context:
            - Selected Database: ${context.database || "None"}
            - Current SQL Query: ${context.sqlQuery || "None"}
            - Current Table: ${context.table || "None"}
            - Table Structure: ${context.tableStructure ? JSON.stringify(context.tableStructure) : "None"}

            Question: ${message}

            Explain or answer the question based on the above context.
        `;

        const result = await model.generateContent(prompt);
        let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Failed to generate a response from Gemini.");

        res.json({ success: true, response: text });
    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
const upload = multer({ dest: "uploads/" }); // Files will be temporarily stored in the "uploads" folder

// Endpoint to import and execute an SQL file
app.post("/import-sql", upload.single("sqlFile"), async (req, res) => {
    const { database } = req.body;
    const filePath = req.file.path; // Path to the uploaded file

    if (!database) {
        return res.status(400).json({ success: false, error: "Database is required." });
    }

    let connection;
    try {
        // Read the SQL file
        const sqlContent = fs.readFileSync(filePath, "utf8");

        // Connect to the database
        connection = await pool.getConnection();
        await connection.changeUser({ database });

        // Execute the SQL statements
        await connection.query(sqlContent);

        res.json({ success: true, message: "SQL file imported and executed successfully." });
    } catch (error) {
        console.error("SQL Import Error:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));