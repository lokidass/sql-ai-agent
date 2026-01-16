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

    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (selectedDb) {
            loadERD();
        }
    }, [selectedDb]);

    useEffect(() => {
        if (erdDefinition && erdRef.current) {
            mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
            mermaid.run({ nodes: [erdRef.current] });
        }
    }, [erdDefinition]);

    const loadERD = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getERD(selectedDb);
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

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
    const handleReset = () => setScale(1);

    const handleDownload = () => {
        const svg = erdRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Get actual size from SVG
        const svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width * 2; // High res
        canvas.height = svgSize.height * 2;

        img.onload = () => {
            ctx.fillStyle = '#1e1e2e'; // Dark background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `${selectedDb}_ERD.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    if (!selectedDb) {
        return <div className="placeholder-text">Please select a database first.</div>;
    }

    if (loading) return <div className="loader-container"><div className="loader"></div><div>Generating Diagram...</div></div>;
    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="erd-container">
            <div className="erd-controls">
                <button onClick={handleZoomIn} title="Zoom In">➕</button>
                <button onClick={handleZoomOut} title="Zoom Out">➖</button>
                <button onClick={handleReset} title="Reset View">🔄</button>
                <button onClick={handleDownload} className="download-btn" title="Download PNG">💾 Download</button>
            </div>
            <div className="erd-scroll-wrapper">
                <div
                    className="erd-content"
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                >
                    <pre className="mermaid" ref={erdRef}>
                        {erdDefinition}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ERDView;
