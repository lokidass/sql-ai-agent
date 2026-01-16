import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuery, executeQuery } from '../services/api';
import './QueryPanel.css';

const QueryPanel = () => {
    const { currentConfig, selectedDb, selectedTable, setQueryResults, setActiveTab } = useApp();
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastQuery, setLastQuery] = useState('');

    const handleSend = async () => {
        if (!question) return;

        setLoading(true);
        try {
            const context = {
                dbType: currentConfig?.type || 'mysql',
                database: selectedDb,
                table: selectedTable,
            };

            // Generate query
            const genResult = await generateQuery(question, context);
            if (!genResult.success) {
                alert('Query generation error: ' + genResult.error);
                setLoading(false);
                return;
            }

            setLastQuery(genResult.query);

            // Execute query automatically
            const execResult = await executeQuery(genResult.query, selectedDb);
            if (execResult.success) {
                setQueryResults(execResult.result);
                setActiveTab('results');
            } else {
                alert('Execution Error: ' + execResult.error);
            }
        } catch (error) {
            alert('Connection Failed. Make sure server is running on port 3002.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="query-container">
            <div className="input-group">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything about your data... (e.g., 'Show top 5 users by age')"
                />
                <button onClick={handleSend} disabled={loading}>
                    {loading ? (
                        <span className="loader"></span>
                    ) : (
                        <span className="btn-text">📤 Send</span>
                    )}
                </button>
            </div>

            {lastQuery && (
                <div className="query-output-container">
                    <div className="code-block-label">Last Query:</div>
                    <div className="code-block">{lastQuery}</div>
                </div>
            )}
        </section>
    );
};

export default QueryPanel;
