import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useApp } from '../context/AppContext';
import { getERD } from '../services/api';
import './ERDView.css';

const ERDView = () => {
    const { selectedDb } = useApp();
    const [erdDefinition, setErdDefinition] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const erdRef = useRef(null);

    useEffect(() => {
        if (selectedDb) {
            loadERD();
        }
    }, [selectedDb]);

    useEffect(() => {
        if (erdDefinition && erdRef.current) {
            mermaid.initialize({ startOnLoad: true, theme: 'dark' });
            mermaid.run({ nodes: [erdRef.current] });
        }
    }, [erdDefinition]);

    const loadERD = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getERD(selectedDb);
            // Verify if data.erd is a valid string, otherwise valid mermaid string
            if (data.erd && typeof data.erd === 'string' && data.erd.trim().length > 0) {
                setErdDefinition(data.erd);
            } else {
                setError("No ERD data available for this database.");
            }
        } catch (err) {
            console.error("Failed to load ERD", err);
            setError("Failed to generate ER Diagram. " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!selectedDb) {
        return <div className="placeholder-text">Please select a database first.</div>;
    }

    if (loading) return <div className="loader-container"><div className="loader"></div><div>Generating Diagram...</div></div>;
    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="erd-container">
            <pre className="mermaid" ref={erdRef}>
                {erdDefinition}
            </pre>
        </div>
    );
};

export default ERDView;
