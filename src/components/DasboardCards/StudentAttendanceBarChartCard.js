import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaChartBar } from 'react-icons/fa';
import '../../components/DasboardCardsCss/StudentAttendanceBarChartCard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudentAttendanceBarChartCard = ({ title, data, classes, selectedClass, setSelectedClass, loading }) => {
    const [showPercentage, setShowPercentage] = useState(false);

    const getChartData = () => {
        const presentData = showPercentage
            ? data.present.map((count, i) => Math.round((count / data.totalStudentsPerDay[i]) * 100))
            : data.present;
        const absentData = showPercentage
            ? data.absent.map((count, i) => Math.round((count / data.totalStudentsPerDay[i]) * 100))
            : data.absent;

        return {
            labels: data.labels,
            datasets: [
                {
                    label: 'Present',
                    data: presentData,
                    backgroundColor: '#48bb78', // Professional green
                    borderColor: '#38a169',
                    borderWidth: 1,
                    borderRadius: 4, // Subtle rounding
                    hoverBackgroundColor: '#2f855a', // Darker green on hover
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: '#f56565', // Professional red
                    borderColor: '#e53e3e',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: '#c53030', // Darker red on hover
                },
            ],
        };
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800, // Subtle, professional animation
            easing: 'easeInOutQuart',
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 12 : 14,
                        family: 'Inter', // Professional font
                        weight: '600',
                    },
                    color: '#2d3748', // Darker, professional gray
                    padding: 12,
                },
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#2d3748',
                titleFont: { family: 'Inter', size: 14, weight: '600' },
                bodyFont: { family: 'Inter', size: 12 },
                cornerRadius: 6,
                padding: 8,
                borderColor: '#e2e8f0',
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const datasetLabel = context.dataset.label || '';
                        const value = context.raw;
                        const total = data.totalStudentsPerDay[context.dataIndex];
                        const percentage = Math.round((value / total) * 100);
                        return showPercentage
                            ? `${datasetLabel}: ${value}%`
                            : `${datasetLabel}: ${value} (${percentage}%) of ${total}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Days',
                    font: {
                        size: window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 12 : 14,
                        family: 'Inter',
                        weight: '600',
                    },
                    color: '#2d3748',
                    padding: { top: 10 },
                },
                ticks: {
                    font: {
                        size: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
                        family: 'Inter',
                    },
                    color: '#4a5568',
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: showPercentage ? 'Percentage (%)' : 'Number of Students',
                    font: {
                        size: window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 12 : 14,
                        family: 'Inter',
                        weight: '600',
                    },
                    color: '#2d3748',
                    padding: { bottom: 10 },
                },
                ticks: {
                    font: {
                        size: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
                        family: 'Inter',
                    },
                    color: '#4a5568',
                    stepSize: showPercentage ? 20 : undefined, // Cleaner percentage steps
                },
                beginAtZero: true,
                grid: {
                    color: '#e2e8f0', // Subtle grid lines
                    borderDash: [3, 3], // Professional dashed style
                },
            },
        },
    };

    const handleClassChange = (e) => {
        console.log('Class selected:', e.target.value);
        setSelectedClass(e.target.value);
    };

    return (
        <div className="student-attendance-bar-chart-card">
            <div className="chart-header">
                <h6 className="chart-title">{title}</h6>
                <FaChartBar className="chart-icon" />
            </div>
            <div className="controls">
                <div className="class-selector">
                    <label htmlFor="classSelect">Class:</label>
                    <select
                        id="classSelect"
                        value={selectedClass}
                        onChange={handleClassChange}
                        disabled={loading || !classes.length}
                    >
                        <option value="">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.className} - {cls.section}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="toggle-container">
                    <label htmlFor="percentageToggle">
                        Show as %:
                        <input
                            type="checkbox"
                            id="percentageToggle"
                            checked={showPercentage}
                            onChange={() => setShowPercentage(!showPercentage)}
                            disabled={loading}
                        />
                    </label>
                </div>
            </div>
            <div className="chart-container">
                {loading ? (
                    <div className="spinner">
                        <div className="spinner-circle"></div>
                        Loading...
                    </div>
                ) : (
                    <Bar data={getChartData()} options={options} />
                )}
            </div>
        </div>
    );
};

export default StudentAttendanceBarChartCard;