import { useEffect, useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';
import './VisualizationView.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const VisualizationView = () => {
    const { queryResults } = useApp();
    const [chartType, setChartType] = useState('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');

    const columns = useMemo(() => {
        if (!queryResults || queryResults.length === 0) return [];
        return Object.keys(queryResults[0]);
    }, [queryResults]);

    useEffect(() => {
        if (columns.length > 0) {
            // Smart defaults: First string col for X, first number col for Y
            const firstString = columns.find(key => typeof queryResults[0][key] === 'string') || columns[0];
            const firstNumber = columns.find(key => typeof queryResults[0][key] === 'number');

            setXAxis(firstString);
            if (firstNumber) setYAxis(firstNumber);
        }
    }, [columns, queryResults]);

    if (!queryResults || queryResults.length === 0) {
        return <div className="placeholder-text">No data to visualize. Run a query first.</div>;
    }

    const chartData = {
        labels: queryResults.map(row => row[xAxis]),
        datasets: [
            {
                label: yAxis,
                data: queryResults.map(row => row[yAxis]),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#e0e0e0' }
            },
            title: {
                display: true,
                text: `Visualizing ${yAxis} by ${xAxis}`,
                color: '#e0e0e0'
            },
        },
        scales: {
            x: { ticks: { color: '#b0b0b0' }, grid: { color: '#444' } },
            y: { ticks: { color: '#b0b0b0' }, grid: { color: '#444' } }
        }
    };

    return (
        <div className="visualization-container">
            <div className="controls">
                <div className="control-group">
                    <label>Chart Type:</label>
                    <div className="chart-toggles">
                        <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>📊 Bar</button>
                        <button className={chartType === 'pie' ? 'active' : ''} onClick={() => setChartType('pie')}>🥧 Pie</button>
                        <button className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')}>📈 Line</button>
                    </div>
                </div>
                <div className="control-group">
                    <label>X-Axis (Category):</label>
                    <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div className="control-group">
                    <label>Y-Axis (Value):</label>
                    <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
            </div>

            <div className="chart-area">
                {chartType === 'bar' && <Bar options={options} data={chartData} />}
                {chartType === 'pie' && <Pie options={options} data={chartData} />}
                {chartType === 'line' && <Line options={options} data={chartData} />}
            </div>
        </div>
    );
};

export default VisualizationView;
