import axios from 'axios';

const API_BASE = 'http://localhost:3002';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const connectDB = async (config) => {
    const response = await api.post('/connect', config);
    return response.data;
};

export const getDatabases = async () => {
    const response = await api.get('/databases');
    return response.data;
};

export const getTables = async (database) => {
    const response = await api.get(`/tables/${database}`);
    return response.data;
};

export const getTableStructure = async (database, table) => {
    const response = await api.get(`/table/${database}/${table}`);
    return response.data;
};

export const generateQuery = async (question, context) => {
    const response = await api.post('/query', { question, context });
    return response.data;
};

export const executeQuery = async (query, database) => {
    const response = await api.post('/execute', { query, database });
    return response.data;
};

export const getERD = async (database) => {
    const response = await api.get(`/erd/${database}`);
    return response.data;
};

export const getTableData = async (database, table) => {
    const response = await api.get(`/table-data/${database}/${table}`);
    return response.data;
};

export const sendChatMessage = async (message, context) => {
    const response = await api.post('/chatbot', { message, context });
    return response.data;
};

export default api;
