import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [currentConfig, setCurrentConfig] = useState(null);
    const [selectedDb, setSelectedDb] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [databases, setDatabases] = useState([]);
    const [tables, setTables] = useState([]);
    const [queryResults, setQueryResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('results');

    const value = {
        currentConfig,
        setCurrentConfig,
        selectedDb,
        setSelectedDb,
        selectedTable,
        setSelectedTable,
        databases,
        setDatabases,
        tables,
        setTables,
        queryResults,
        setQueryResults,
        loading,
        setLoading,
        activeTab,
        setActiveTab,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
