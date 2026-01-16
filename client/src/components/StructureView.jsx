import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getTables, getTableStructure } from '../services/api';
import './StructureView.css';

const StructureView = () => {
    const { selectedDb, tables, setTables, selectedTable, setSelectedTable } = useApp();
    const [structure, setStructure] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedDb && tables.length === 0) {
            loadTables();
        }
    }, [selectedDb]);

    useEffect(() => {
        if (selectedTable && selectedDb) {
            loadStructure(selectedTable);
        }
    }, [selectedTable, selectedDb]);

    const loadTables = async () => {
        setError(null);
        try {
            const data = await getTables(selectedDb);
            setTables(data.tables || []);
        } catch (error) {
            console.error("Failed to load tables", error);
            setError("Failed to load tables. " + (error.response?.data?.error || error.message));
        }
    };

    const loadStructure = async (table) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTableStructure(selectedDb, table);
            setStructure(data.structure || []);
        } catch (error) {
            console.error("Failed to load structure", error);
            setError("Failed to load structure. " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = (table) => {
        setSelectedTable(table);
    };

    if (!selectedDb) {
        return <div className="placeholder-text">Please select a database first.</div>;
    }

    return (
        <div className="structure-container">
            {error && <div className="error-banner">{error}</div>}
            <div className="tables-list">
                <h3>Tables</h3>
                <ul>
                    {tables.map((table) => {
                        const tableName = typeof table === 'object' ? table.name : table;
                        return (
                            <li
                                key={tableName}
                                onClick={() => handleTableClick(tableName)}
                                className={selectedTable === tableName ? 'active' : ''}
                            >
                                <span className="icon">📄</span> {tableName}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="table-details">
                {selectedTable ? (
                    <>
                        <h3>Structure: {selectedTable}</h3>
                        {loading ? (
                            <div className="loader"></div>
                        ) : (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Type</th>
                                            <th>Null</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {structure.map((col, idx) => (
                                            <tr key={idx}>
                                                <td>{col.Field || col.column_name}</td>
                                                <td>{col.Type || col.data_type}</td>
                                                <td>{col.Null || col.is_nullable || "YES"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="placeholder-text">Select a table to view its structure</div>
                )}
            </div>
        </div>
    );
};

export default StructureView;
