import { useApp } from '../context/AppContext';
import { getTables, getTableStructure } from '../services/api';
import './Sidebar.css';

const Sidebar = ({ onConnectClick }) => {
    const { databases, selectedDb, setSelectedDb, tables, setTables, setSelectedTable, setActiveTab } = useApp();

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
        setActiveTab('structure'); // Auto-switch to structure view
        try {
            await getTableStructure(selectedDb, table);
        } catch (error) {
            console.error('Error fetching table structure:', error);
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
                            tables.map((table) => (
                                <div
                                    key={table}
                                    className="table-item"
                                    onClick={() => handleSelectTable(table)}
                                >
                                    {table}
                                </div>
                            ))}
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
