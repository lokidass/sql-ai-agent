import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { connectDB, getDatabases } from '../services/api';
import './ConnectionModal.css';

const ConnectionModal = ({ isOpen, onClose }) => {
    const { setCurrentConfig, setDatabases } = useApp();
    const [dbType, setDbType] = useState('mysql');
    const [formData, setFormData] = useState({
        host: 'localhost',
        port: '',
        user: 'root',
        password: '',
        uri: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { type: dbType, ...formData };
            const result = await connectDB(config);

            if (result.success) {
                setCurrentConfig(config);
                const dbsData = await getDatabases();
                if (dbsData.success) {
                    setDatabases(dbsData.databases);
                }
                onClose();
            } else {
                alert('Connection failed: ' + result.error);
            }
        } catch (error) {
            alert('Connection error: ' + error.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Connect Database</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Database Type</label>
                        <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                            <option value="mysql">MySQL</option>
                            <option value="postgres">PostgreSQL</option>
                            <option value="mongodb">MongoDB</option>
                        </select>
                    </div>

                    {dbType !== 'mongodb' ? (
                        <>
                            <div className="form-group">
                                <label>Host</label>
                                <input
                                    type="text"
                                    value={formData.host}
                                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Port</label>
                                <input
                                    type="text"
                                    placeholder="Default"
                                    value={formData.port}
                                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.user}
                                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <label>Connection URI (Optional)</label>
                            <input
                                type="text"
                                placeholder="mongodb://localhost:27017"
                                value={formData.uri}
                                onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" style={{ flex: 1 }}>
                            Connect
                        </button>
                        <button type="button" className="secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConnectionModal;
