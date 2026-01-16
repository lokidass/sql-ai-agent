import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import pkg from 'pg';
const { Pool: PgPool } = pkg;
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Database Connection Manager ---
class DBManager {
    constructor() {
        this.mysqlPool = null;
        this.pgPool = null;
        this.mongoClient = null;
        this.currentConfig = null;
    }

    async connect(config) {
        this.currentConfig = config;
        const { type, host, user, password, database, port, ssl } = config;

        try {
            if (type === "mysql") {
                if (this.mysqlPool) await this.mysqlPool.end();
                this.mysqlPool = mysql.createPool({
                    host,
                    user,
                    password,
                    database,
                    port: port || 3306,
                    waitForConnections: true,
                    connectionLimit: 10,
                });
                // Test connection
                await this.mysqlPool.getConnection().then(conn => conn.release());
            } else if (type === "postgres") {
                if (this.pgPool) await this.pgPool.end();
                this.pgPool = new PgPool({
                    host,
                    user,
                    password,
                    database,
                    port: port || 5432,
                    ssl: ssl ? { rejectUnauthorized: false } : false,
                });
                // Test connection
                await this.pgPool.query("SELECT 1");
            } else if (type === "mongodb") {
                if (this.mongoClient) await this.mongoClient.close();
                const uri = config.uri || `mongodb://${user}:${password}@${host}:${port || 27017}/${database}`;
                this.mongoClient = new MongoClient(uri);
                await this.mongoClient.connect();
            }
            return { success: true };
        } catch (error) {
            console.error(`Error connecting to ${type}:`, error);
            throw error;
        }
    }

    // ... (rest of DBManager methods remain unchanged but need to be careful with replace)
    // To safe complexity, I'll only replace the top part until connect ends, but I need to ensure I don't cut off other methods.
    // Wait, replace_file_content replaces a BLOCK. I need to be precise.
    // I will use two separate replace calls if needed or just replace the class start and connect method.

    async getDatabases() {
        const { type } = this.currentConfig;
        if (type === "mysql") {
            const [rows] = await this.mysqlPool.query("SHOW DATABASES");
            return rows.map(row => row.Database);
        } else if (type === "postgres") {
            const res = await this.pgPool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
            return res.rows.map(row => row.datname);
        } else if (type === "mongodb") {
            const res = await this.mongoClient.db().admin().listDatabases();
            return res.databases.map(db => db.name);
        }
    }

    // ... getTables, getTableStructure, executeQuery, getERD ...
    // Since I cannot use "..." in replacement, I must stick to editing `connect` specifically or use multi_replace.
    // Let's use multi_replace for safer edits.
    // Methods continuing inside DBManager class...


    async getDatabases() {
        const { type } = this.currentConfig;
        if (type === "mysql") {
            const [rows] = await this.mysqlPool.query("SHOW DATABASES");
            return rows.map(row => row.Database);
        } else if (type === "postgres") {
            const res = await this.pgPool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
            return res.rows.map(row => row.datname);
        } else if (type === "mongodb") {
            const res = await this.mongoClient.db().admin().listDatabases();
            return res.databases.map(db => db.name);
        }
    }

    async getTables(database) {
        const { type } = this.currentConfig;
        if (type === "mysql") {
            const connection = await this.mysqlPool.getConnection();
            await connection.changeUser({ database });
            const [rows] = await connection.query("SHOW TABLES");
            connection.release();
            return rows.map(row => row[Object.keys(row)[0]]);
        } else if (type === "postgres") {
            // For Postgres, we might need a separate client to switch DBs or just use the current one if it's the right DB
            const res = await this.pgPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            return res.rows.map(row => row.table_name);
        } else if (type === "mongodb") {
            const db = this.mongoClient.db(database);
            const collections = await db.listCollections().toArray();
            return collections.map(c => c.name);
        }
    }

    async getTableStructure(database, table) {
        const { type } = this.currentConfig;
        if (type === "mysql") {
            const connection = await this.mysqlPool.getConnection();
            await connection.changeUser({ database });
            const [rows] = await connection.query(`DESCRIBE ${table}`);
            connection.release();
            return rows;
        } else if (type === "postgres") {
            const res = await this.pgPool.query(`
                SELECT column_name as "Field", data_type as "Type", is_nullable as "Null"
                FROM information_schema.columns
                WHERE table_name = $1
            `, [table]);
            return res.rows;
        } else if (type === "mongodb") {
            const db = this.mongoClient.db(database);
            const doc = await db.collection(table).findOne();
            if (!doc) return [];
            return Object.keys(doc).map(key => ({ Field: key, Type: typeof doc[key] }));
        }
    }

    async executeQuery(query, database) {
        const { type } = this.currentConfig;
        if (type === "mysql") {
            const connection = await this.mysqlPool.getConnection();
            if (database) await connection.changeUser({ database });
            const [rows] = await connection.query(query);
            connection.release();
            return rows;
        } else if (type === "postgres") {
            const res = await this.pgPool.query(query);
            return res.rows;
        } else if (type === "mongodb") {
            // MongoDB queries will be sent as JSON strings representing the operation
            const db = this.mongoClient.db(database);
            const q = JSON.parse(query);
            const collection = db.collection(q.collection);
            let result;
            if (q.operation === "find") {
                result = await collection.find(q.filter || {}).toArray();
            } else if (q.operation === "aggregate") {
                result = await collection.aggregate(q.pipeline || []).toArray();
            } else if (q.operation === "insertOne") {
                result = await collection.insertOne(q.document);
            }
            // Add more operations as needed
            return result;
        }
    }

    async getERD(database) {
        const { type } = this.currentConfig;
        if (type === "mongodb") return "ERD not supported for MongoDB";
        try {
            const tableNames = await this.getTables(database);
            const tablesWithFields = [];
            const relationships = [];

            for (const table of tableNames) {
                const fields = await this.getTableStructure(database, table);
                tablesWithFields.push({ table, fields });

                if (type === "mysql") {
                    const [rows] = await this.mysqlPool.query(`
                        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_NAME = ?
                    `, [database, table]);
                    relationships.push(...rows);
                } else if (type === "postgres") {
                    const res = await this.pgPool.query(`
                        SELECT kcu.table_name as "TABLE_NAME", kcu.column_name as "COLUMN_NAME", 
                               rel_tco.table_name AS "REFERENCED_TABLE_NAME", rel_kcu.column_name AS "REFERENCED_COLUMN_NAME"
                        FROM information_schema.table_constraints tco
                        JOIN information_schema.key_column_usage kcu ON tco.constraint_name = kcu.constraint_name
                        JOIN information_schema.referential_constraints rco ON tco.constraint_name = rco.constraint_name
                        JOIN information_schema.table_constraints rel_tco ON rco.unique_constraint_name = rel_tco.constraint_name
                        JOIN information_schema.key_column_usage rel_kcu ON rel_tco.constraint_name = rel_kcu.constraint_name
                        WHERE tco.constraint_type = 'FOREIGN KEY' AND tco.table_name = $1
                    `, [table]);
                    relationships.push(...res.rows);
                }
            }
            return generateMermaidERD(tablesWithFields, relationships);
        } catch (error) {
            console.error("ERD Generation Error:", error);
            throw error;
        }
    }
}

const dbManager = new DBManager();

// --- Gemini Query Generation ---
// --- Gemini Query Generation ---
async function generateQuery(question, context) {
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-2.0-flash-exp"];
    const { dbType, database, table, structure } = context;

    let dialectPrompt = "";
    if (dbType === "mysql") dialectPrompt = "MySQL query";
    else if (dbType === "postgres") dialectPrompt = "PostgreSQL query";
    else if (dbType === "mongodb") {
        dialectPrompt = `MongoDB query in JSON format. 
        Example: {"collection": "users", "operation": "find", "filter": {"age": {"$gt": 20}}} 
        Wait, only provide the JSON object.`;
    }

    const prompt = `
        Convert the following English question into a valid ${dialectPrompt}.
        Database Context:
        - DB Type: ${dbType}
        - Database Name: ${database || "unknown"}
        - Current Table: ${table || "unknown"}
        - Schema Info: ${structure ? JSON.stringify(structure) : "Not provided"}

        Question: ${question}

        Return ONLY the query code. No markdown, no explanations.
    `;

    // Try multiple models
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            console.log("Sending Prompt to Gemini:", prompt.substring(0, 100) + "..."); // Short log
            const result = await model.generateContent(prompt);
            console.log(`SUCCESS with ${modelName}`);

            let text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) continue; // Try next model if response is empty

            text = text.replace(/```json/g, "").replace(/```sql/g, "").replace(/```/g, "").trim();
            console.log("Sanitized Query:", text);
            return text;

        } catch (error) {
            console.warn(`Failed with ${modelName}:`, error.message.split(']')[0] + ']');
            // Continue to next model
        }
    }

    throw new Error("AI failed to generate query with all attempted models.");
}

// --- Endpoints ---

app.post("/connect", async (req, res) => {
    try {
        await dbManager.connect(req.body);
        res.json({ success: true, message: "Connected successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/query", async (req, res) => {
    const { question, context } = req.body;
    try {
        const query = await generateQuery(question, context);
        res.json({ success: true, query });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/execute", async (req, res) => {
    const { query, database } = req.body;
    try {
        const result = await dbManager.executeQuery(query, database);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/databases", async (req, res) => {
    try {
        const databases = await dbManager.getDatabases();
        res.json({ success: true, databases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/tables/:database", async (req, res) => {
    try {
        const tables = await dbManager.getTables(req.params.database);
        res.json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/table/:database/:table", async (req, res) => {
    try {
        const structure = await dbManager.getTableStructure(req.params.database, req.params.table);
        res.json({ success: true, structure });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/erd/:database", async (req, res) => {
    try {
        const erd = await dbManager.getERD(req.params.database);
        res.json({ success: true, erd });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/chatbot", async (req, res) => {
    const { message, context } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Context: ${JSON.stringify(context)}
            Question: ${message}
            Provide a helpful explanation based on the context.
        `;
        const result = await model.generateContent(prompt);
        res.json({ success: true, response: result.response.text() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper for ERD
function generateMermaidERD(tablesWithFields, relationships) {
    if (tablesWithFields.length === 0) return "erDiagram\n    EMPTY_DB";

    let erd = "erDiagram\n";
    for (const { table, fields } of tablesWithFields) {
        // Sanitize table name: replace spaces/hyphens with underscores, or quote if necessary
        const escapedTable = table.replace(/[^a-zA-Z0-9]/g, "_");
        erd += `    ${escapedTable} {\n`;
        for (const field of fields) {
            // Simplify types for Mermaid and sanitize names
            const type = (field.Type || "unknown").split("(")[0].replace(/[^a-zA-Z0-9]/g, "_");
            const name = (field.Field || field.column_name || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
            erd += `        ${type} ${name}\n`;
        }
        erd += `    }\n`;
    }

    const seenRels = new Set();
    for (const rel of relationships) {
        const t1 = rel.TABLE_NAME.replace(/[^a-zA-Z0-9]/g, "_");
        const t2 = rel.REFERENCED_TABLE_NAME.replace(/[^a-zA-Z0-9]/g, "_");
        const relKey = `${t1}-${t2}`;

        if (!seenRels.has(relKey)) {
            erd += `    ${t1} ||--o{ ${t2} : "fk"\n`;
            seenRels.add(relKey);
        }
    }
    return erd;
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
