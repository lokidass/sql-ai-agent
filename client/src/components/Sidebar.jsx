import { useApp } from '../context/AppContext';
import { getTables, getTableStructure, executeQuery, getTableData } from '../services/api';
import './Sidebar.css';

const Sidebar = ({ onConnectClick }) => {
    const { databases, selectedDb, setSelectedDb, tables, setTables, setSelectedTable, setActiveTab, setQueryResults } = useApp();

    const handleSelectDb = async (db) => {
        setSelectedDb(db);
        try {
            const result = await getTables(db);
            if (result.success) {
                setTables(result.tables);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const handleSelectTable = async (table) => {
        setSelectedTable(table);
        setActiveTab('visualization'); // Auto-switch to visualization view
        setQueryResults([]); // Clear previous results to avoid confusion

        // We can't access setLoading directly here because it might not be in useApp destructuring for Sidebar
        // Let's verify AppContext has it (it does).
        // Sidebar destructuring needs update if setLoading is missing (it is missing in destructure above).

        try {
            // First get structure (optional but good for context)
            await getTableStructure(selectedDb, table);

            // Fetch data for visualization safely using the new endpoint
            const result = await getTableData(selectedDb, table);

            console.log(`[Sidebar] Data fetched for ${table}:`, result);
            if (result.success) {
                console.log(`[Sidebar] Setting query results: ${result.data?.length} rows`);
                setQueryResults(result.data);
            } else {
                console.error("Failed to fetch table data for visualization:", result.error);
                // Optional: setQueryResults([]) is already done
            }
        } catch (error) {
            console.error('Error fetching table data:', error);
            if (error.response) {
                console.error('Server Error Details:', error.response.data);
            }
        }
    };

    return (
        <div className="sidebar">
            <h3>
                <span className="icon">📦</span> Databases
            </h3>
            <div className="db-list">
                {databases.map((db) => (
                    <div key={db}>
                        <div
                            className={`database-item ${selectedDb === db ? 'active' : ''}`}
                            onClick={() => handleSelectDb(db)}
                        >
                            {db}
                        </div>
                        {selectedDb === db &&
                            tables.map((table) => {
                                let tableName = typeof table === 'object' ? table.name : table;
                                const rowCount = typeof table === 'object' ? table.count : null;

                                // Safety check: if tableName is still an object, something is wrong with data structure
                                if (typeof tableName === 'object') {
                                    console.error("Invalid table name (object):", tableName);
                                    tableName = "Unknown Table"; // Prevent crash
                                }

                                return (
                                    <div
                                        key={tableName}
                                        className="table-item"
                                        onClick={() => handleSelectTable(tableName)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        title={typeof table === 'object' ? JSON.stringify(table) : table}
                                    >
                                        <span>{tableName}</span>
                                        {/* Ensure we verify rowCount is strictly not null/undefined */}
                                        {(rowCount !== null && rowCount !== undefined) ? (
                                            <span style={{ fontSize: '0.8em', color: '#ccc', background: '#444', padding: '2px 6px', borderRadius: '4px' }}>
                                                {rowCount}
                                            </span>
                                        ) : null}
                                    </div>
                                );
                            })}
                    </div>
                ))}
            </div>
            <button className="secondary connect-btn" onClick={onConnectClick}>
                <span>🔌</span> Connect New DB
            </button>
        </div>
    );
};

export default Sidebar;
