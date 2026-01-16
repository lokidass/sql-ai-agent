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
    const [status, setStatus] = useState({ loading: false, error: null });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: null });

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
                setStatus({ loading: false, error: result.error || 'Connection failed' });
            }
        } catch (error) {
            console.error("Connection Error:", error);
            const errorMessage = error.response?.data?.error || error.message || 'Network error';
            setStatus({ loading: false, error: errorMessage });
        } finally {
            if (!status.error) setStatus(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Connect Database</h2>
                {status.error && <div className="error-message">{status.error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Database Type</label>
                        <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                            <option value="mysql">MySQL</option>
                            <option value="postgres">PostgreSQL</option>
                            <option value="mongodb">MongoDB</option>
                        </select>
                    </div>

                    {dbType === 'mongodb' || (dbType === 'postgres' && formData.useConnectionString) ? (
                        <div className="form-group">
                            <label>Connection URI</label>
                            <input
                                type="text"
                                placeholder={dbType === 'postgres' ? "postgresql://user:password@host/dbname?sslmode=require" : "mongodb://localhost:27017"}
                                value={formData.uri}
                                onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                            />
                        </div>
                    ) : (
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
                    )}

                    {dbType === 'postgres' && (
                        <div className="form-group checkbox-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.useConnectionString || false}
                                    onChange={(e) => setFormData({ ...formData, useConnectionString: e.target.checked })}
                                />
                                Use Connection String (Best for Neon/Supabase)
                            </label>

                            {!formData.useConnectionString && (
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.ssl || false}
                                        onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                                    />
                                    Enable SSL (Required for Remote)
                                </label>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" style={{ flex: 1 }} disabled={status.loading}>
                            {status.loading ? 'Connecting...' : 'Connect'}
                        </button>
                        <button type="button" className="secondary" onClick={onClose} disabled={status.loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConnectionModal;
