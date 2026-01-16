import { useApp } from '../context/AppContext';
import './ResultsTable.css';

const ResultsTable = () => {
    const { queryResults } = useApp();

    if (!queryResults || queryResults.length === 0) {
        return <p className="no-data">Run a query to see results...</p>;
    }

    const headers = Object.keys(queryResults[0]);

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {queryResults.map((row, idx) => (
                        <tr key={idx}>
                            {headers.map((header) => (
                                <td key={header}>{row[header]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsTable;
