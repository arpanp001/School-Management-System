import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FaSpinner } from 'react-icons/fa';
import CountUp from 'react-countup';
import '../StudentDashboardCardsCss/StudentRevenueReportCard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudentRevenueReportCard = () => {
    const [viewMode, setViewMode] = useState('monthly'); // daily, weekly, monthly
    const [selectedSubject, setSelectedSubject] = useState('all'); // Subject filter
    const [subjects, setSubjects] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [totalAttendance, setTotalAttendance] = useState(0);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true); // Loading state
    const auth = getAuth();
    const studentId = auth.currentUser?.uid;

    // Define today in component scope for use in tooltip callbacks
    const today = useMemo(() => new Date(), []);

    // Fetch subjects for the dropdown
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            try {
                const studentAssignmentQuery = query(
                    collection(db, 'studentAssignments'),
                    where('studentId', '==', studentId)
                );
                const studentAssignmentSnap = await getDocs(studentAssignmentQuery);
                if (!studentAssignmentSnap.empty) {
                    const assignmentData = studentAssignmentSnap.docs[0].data();
                    const subjectsSnap = await getDocs(collection(db, 'subjects'));
                    const classSubjects = subjectsSnap.docs
                        .filter(doc => assignmentData.subjects.includes(doc.id))
                        .map(doc => ({ id: doc.id, name: doc.data().subjectName }));
                    setSubjects([{ id: 'all', name: 'All Subjects' }, ...classSubjects]);
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, [studentId]);

    // Fetch attendance data based on view mode and subject
    useEffect(() => {
        const fetchAttendanceData = async () => {
            setLoading(true);
            try {
                let attendanceQuery = query(
                    collection(db, 'studentAttendance'),
                    where('studentId', '==', studentId)
                );
                if (selectedSubject !== 'all') {
                    attendanceQuery = query(
                        collection(db, 'studentAttendance'),
                        where('studentId', '==', studentId),
                        where('subjectId', '==', selectedSubject)
                    );
                }
                const attendanceSnap = await getDocs(attendanceQuery);
                const records = attendanceSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: new Date(doc.data().date),
                    subjectName: subjects.find(sub => sub.id === doc.data().subjectId)?.name || 'Unknown',
                }));

                // Process data based on viewMode
                let labels = [];
                let presentData = [];
                let absentData = [];

                if (viewMode === 'daily') {
                    // Last 7 days
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(today);
                        date.setDate(today.getDate() - i);
                        return date.toISOString().split('T')[0];
                    }).reverse();

                    labels = last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' }));
                    presentData = last7Days.map(date => {
                        return records.filter(record =>
                            record.date.toISOString().split('T')[0] === date && record.status === 'present'
                        ).length;
                    });
                    absentData = last7Days.map(date => {
                        return records.filter(record =>
                            record.date.toISOString().split('T')[0] === date && record.status === 'absent'
                        ).length;
                    });
                } else if (viewMode === 'weekly') {
                    // Last 4 weeks
                    labels = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
                    presentData = Array(4).fill(0);
                    absentData = Array(4).fill(0);

                    records.forEach(record => {
                        const diffTime = today - record.date;
                        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                        if (diffWeeks < 4) {
                            const index = 3 - diffWeeks;
                            if (record.status === 'present') {
                                presentData[index]++;
                            } else {
                                absentData[index]++;
                            }
                        }
                    });
                } else {
                    // Monthly (last 6 months)
                    const months = Array.from({ length: 6 }, (_, i) => {
                        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        return date.toLocaleString('en-US', { month: 'short' });
                    }).reverse();

                    labels = months;
                    presentData = Array(6).fill(0);
                    absentData = Array(6).fill(0);

                    records.forEach(record => {
                        const monthIndex = 5 - (today.getMonth() - record.date.getMonth() + (today.getFullYear() - record.date.getFullYear()) * 12);
                        if (monthIndex >= 0 && monthIndex < 6) {
                            if (record.status === 'present') {
                                presentData[monthIndex]++;
                            } else {
                                absentData[monthIndex]++;
                            }
                        }
                    });
                }

                setAttendanceData(records);
                setTotalAttendance(records.filter(record => record.status === 'present').length);
                setTotalSessions(records.length);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Present',
                            data: presentData,
                            backgroundColor: '#22c55e', // Green for present
                            borderRadius: 4,
                        },
                        {
                            label: 'Absent',
                            data: absentData,
                            backgroundColor: '#ef4444', // Red for absent
                            borderRadius: 4,
                        },
                    ],
                });
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendanceData();
    }, [viewMode, selectedSubject, subjects, today, studentId]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                    },
                    color: '#374151',
                },
                onClick: (e, legendItem, legend) => {
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    ci.toggleDataVisibility(index);
                    ci.update();
                },
            },
            title: {
                display: true,
                text: 'Attendance Overview',
                font: {
                    size: 16,
                    weight: 'bold',
                },
                color: '#111827',
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                callbacks: {
                    label: (context) => {
                        const datasetLabel = context.dataset.label;
                        const value = context.parsed.y;
                        const index = context.dataIndex;
                        const relevantRecords = attendanceData.filter(record => {
                            if (viewMode === 'daily') {
                                return record.date.toISOString().split('T')[0] === chartData.labels[index].toLowerCase();
                            } else if (viewMode === 'weekly') {
                                const weekStart = new Date(today);
                                weekStart.setDate(today.getDate() - (3 - index) * 7);
                                return record.date >= weekStart && record.date < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                            } else {
                                const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
                                return record.date.getMonth() === monthDate.getMonth() && record.date.getFullYear() === monthDate.getFullYear();
                            }
                        });
                        const subjectNames = [...new Set(relevantRecords.map(r => r.subjectName))].join(', ');
                        return `${datasetLabel}: ${value} session(s) (${subjectNames || 'All Subjects'})`;
                    },
                    title: (tooltipItems) => {
                        return viewMode === 'daily'
                            ? `Date: ${tooltipItems[0].label}`
                            : viewMode === 'weekly'
                                ? `Week ${tooltipItems[0].label}`
                                : `Month: ${tooltipItems[0].label}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Sessions',
                    font: {
                        size: 14,
                    },
                    color: '#374151',
                },
                grid: {
                    color: '#e5e7eb',
                },
                ticks: {
                    color: '#374151',
                },
            },
            x: {
                title: {
                    display: true,
                    text: viewMode.charAt(0).toUpperCase() + viewMode.slice(1),
                    font: {
                        size: 14,
                    },
                    color: '#374151',
                },
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#374151',
                },
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuad',
        },
    };

    return (
        <div className="student-revenue-report-card" role="region" aria-label="Attendance report card">
            {loading ? (
                <div className="loading-spinner" aria-live="polite" aria-busy="true">
                    <FaSpinner className="spinner" aria-label="Loading attendance data" />
                </div>
            ) : (
                <>
                    <div className="revenue-card-header">
                        <h3 className="revenue-card-title">Attendance Report</h3>
                        <div className="revenue-card-legend">
                            <div
                                className="legend-item"
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        const chart = document.querySelector('canvas').chartjs;
                                        chart.toggleDataVisibility(0);
                                        chart.update();
                                    }
                                }}
                            >
                                <span className="legend-dot green"></span>
                                <span>Present</span>
                            </div>
                            <div
                                className="legend-item"
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        const chart = document.querySelector('canvas').chartjs;
                                        chart.toggleDataVisibility(1);
                                        chart.update();
                                    }
                                }}
                            >
                                <span className="legend-dot red"></span>
                                <span>Absent</span>
                            </div>
                        </div>
                        <div className="revenue-filters">
                            <select
                                className="revenue-select"
                                value={viewMode}
                                onChange={e => setViewMode(e.target.value)}
                                aria-label="Select attendance view mode"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            <select
                                className="revenue-select"
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                aria-label="Select subject for attendance"
                            >
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="revenue-card-body">
                        <div className="revenue-total" aria-live="polite">
                            <h2>
                                <CountUp end={totalAttendance} duration={1.5} />/
                                <CountUp end={totalSessions} duration={1.5} />
                            </h2>
                            <p>
                                Attendance Rate:{' '}
                                <CountUp
                                    end={totalSessions > 0 ? (totalAttendance / totalSessions) * 100 : 0}
                                    decimals={1}
                                    duration={1.5}
                                    suffix="%"
                                />
                            </p>
                        </div>

                        <motion.div
                            className="revenue-chart"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            role="region"
                            aria-label="Attendance bar chart"
                        >
                            <Bar data={chartData} options={chartOptions} height={200} />
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentRevenueReportCard;