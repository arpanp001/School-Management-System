import React, { useState, useEffect, useCallback } from "react";
import { db, auth } from "../../firebase/config";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import './../TeacherDashboardCardCss/AttendanceTrendChart.css'; // Updated path

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AttendanceTrendChart = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("weekly"); // Default to weekly
    const user = auth.currentUser;

    const fetchPunchRecords = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            let startDate, endDate, labels;
            const now = new Date();
            endDate = new Date(now);

            if (viewMode === "daily") {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                labels = [now.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })];
            } else if (viewMode === "weekly") {
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 6); // Last 7 days
                labels = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    labels.push(
                        date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
                    );
                }
            } else if (viewMode === "monthly") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                labels = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i.toString()); // Just day number for monthly
                }
            }

            const q = query(collection(db, "teacherAttendance"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            // Filter records for the selected period and current user
            const logs = querySnapshot.docs
                .filter(
                    (doc) =>
                        doc.data().teacherId === user.uid &&
                        new Date(doc.data().timestamp) >= startDate &&
                        new Date(doc.data().timestamp) <= endDate &&
                        doc.data().punchCategory === "main" // Only main punches
                )
                .map((doc) => ({
                    timestamp: new Date(doc.data().timestamp),
                    status: doc.data().status,
                    punchType: doc.data().punchType,
                    workHours: doc.data().workHours ? parseFloat(doc.data().workHours) : null,
                }));

            // Initialize status counts and work hours
            const statusCounts = {
                Present: Array(labels.length).fill(0),
                "Half-Day": Array(labels.length).fill(0),
                Invalid: Array(labels.length).fill(0),
                Normal: Array(labels.length).fill(0),
                "Early Exit": Array(labels.length).fill(0),
                Overtime: Array(labels.length).fill(0),
            };
            const workHoursPerDay = Array(labels.length).fill(0);

            // Process logs for status counts and work hours
            logs.forEach((log) => {
                let logDate;
                if (viewMode === "daily") {
                    logDate = labels[0]; // Only one label for daily
                } else if (viewMode === "weekly") {
                    logDate = log.timestamp.toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                    });
                } else if (viewMode === "monthly") {
                    logDate = log.timestamp.getDate().toString();
                }

                const index = labels.indexOf(logDate);
                if (index !== -1) {
                    // Count statuses
                    if (statusCounts[log.status]) {
                        statusCounts[log.status][index]++;
                    }
                    // Sum work hours for punch-outs
                    if (log.punchType === "out" && log.workHours) {
                        workHoursPerDay[index] += log.workHours;
                    }
                }
            });

            // Prepare Chart.js data
            setChartData({
                labels,
                datasets: [
                    {
                        label: "Present",
                        data: statusCounts.Present,
                        backgroundColor: "rgba(40, 167, 69, 0.6)", // Green
                        stack: "statuses", // Stack group for statuses
                    },
                    {
                        label: "Half-Day",
                        data: statusCounts["Half-Day"],
                        backgroundColor: "rgba(255, 193, 7, 0.6)", // Yellow
                        stack: "statuses",
                    },
                    {
                        label: "Invalid",
                        data: statusCounts.Invalid,
                        backgroundColor: "rgba(108, 117, 125, 0.6)", // Gray
                        stack: "statuses",
                    },
                    {
                        label: "Normal",
                        data: statusCounts.Normal,
                        backgroundColor: "rgba(23, 162, 184, 0.6)", // Cyan
                        stack: "statuses",
                    },
                    {
                        label: "Early Exit",
                        data: statusCounts["Early Exit"],
                        backgroundColor: "rgba(220, 53, 69, 0.6)", // Red
                        stack: "statuses",
                    },
                    {
                        label: "Overtime",
                        data: statusCounts.Overtime,
                        backgroundColor: "rgba(111, 66, 193, 0.6)", // Purple
                        stack: "statuses",
                    },
                    {
                        label: "Work Hours",
                        data: workHoursPerDay,
                        backgroundColor: "rgba(0, 123, 255, 0.6)", // Blue
                        barThickness: 20, // Narrower to distinguish
                        stack: "hours", // Separate stack to keep unstacked
                    },
                ],
            });
        } catch (error) {
            console.error("Error fetching punch records:", error);
        } finally {
            setLoading(false);
        }
    }, [user, viewMode]);

    useEffect(() => {
        fetchPunchRecords();
    }, [fetchPunchRecords]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: `Teacher Punch Records and Work Hours (${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)
                    })`,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || "";
                        const value = context.parsed.y;
                        if (label === "Work Hours") {
                            return `${label}: ${value.toFixed(2)} hrs`;
                        }
                        return `${label}: ${value}`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true, // Stack bars on x-axis
                title: {
                    display: true,
                    text: viewMode === "monthly" ? "Day of Month" : "Date",
                },
            },
            y: {
                stacked: true, // Stack bars on y-axis
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: "Count / Hours",
                },
            },
        },
    };

    return (
        <div className="card chart-card">
            <h3>Teacher Punch Records and Work Hours</h3>
            <div className="btn-group mb-3">
                <button
                    className={`btn btn-outline-primary ${viewMode === "daily" ? "active" : ""}`}
                    onClick={() => setViewMode("daily")}
                    disabled={loading}
                >
                    Daily
                </button>
                <button
                    className={`btn btn-outline-primary ${viewMode === "weekly" ? "active" : ""}`}
                    onClick={() => setViewMode("weekly")}
                    disabled={loading}
                >
                    Weekly
                </button>
                <button
                    className={`btn btn-outline-primary ${viewMode === "monthly" ? "active" : ""}`}
                    onClick={() => setViewMode("monthly")}
                    disabled={loading}
                >
                    Monthly
                </button>
            </div>
            <div className="chart-container">
                {loading ? (
                    <div className="chart-placeholder">
                        <p>Loading chart...</p>
                    </div>
                ) : chartData ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <div className="chart-placeholder">
                        <p>No data available for the selected period.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceTrendChart;