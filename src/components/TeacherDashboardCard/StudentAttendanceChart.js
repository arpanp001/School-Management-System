// src/components/TeacherDashboardCard/StudentAttendanceChart.js
import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import "../TeacherDashboardCardCss/StudentAttendanceChart.css";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper function to format dates (e.g., "Apr 14")
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const StudentAttendanceChart = () => {
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("weekly"); // daily, weekly, monthly
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("all"); // subjectId or 'all'
    const [showPercentage, setShowPercentage] = useState(false);
    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const classTeacherQuery = query(
                    collection(db, "classTeacherMapping"),
                    where("teacherId", "==", teacherId)
                );
                const classTeacherSnap = await getDocs(classTeacherQuery);
                const classIds = classTeacherSnap.docs.map((doc) => doc.data().classId);

                if (classIds.length === 0) return;

                const subjectIds = new Set();
                for (const classId of classIds) {
                    const assignmentsQuery = query(
                        collection(db, "studentAssignments"),
                        where("classId", "==", classId)
                    );
                    const assignmentsSnap = await getDocs(assignmentsQuery);
                    assignmentsSnap.forEach((doc) => {
                        const subjects = doc.data().subjects || [];
                        subjects.forEach((subjectId) => subjectIds.add(subjectId));
                    });
                }

                const subjectsSnap = await getDocs(collection(db, "subjects"));
                const subjectList = subjectsSnap.docs
                    .filter((doc) => subjectIds.has(doc.id))
                    .map((doc) => ({ id: doc.id, name: doc.data().subjectName }));
                setSubjects(subjectList);
            } catch (error) {
                console.error("Error fetching subjects:", error);
                toast.error("Failed to load subjects: " + error.message);
            }
        };

        if (teacherId) {
            fetchSubjects();
        }
    }, [teacherId]);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const classTeacherQuery = query(
                    collection(db, "classTeacherMapping"),
                    where("teacherId", "==", teacherId)
                );
                const classTeacherSnap = await getDocs(classTeacherQuery);
                const classIds = classTeacherSnap.docs.map((doc) => doc.data().classId);

                if (classIds.length === 0) {
                    throw new Error("No classes assigned to this teacher.");
                }

                const today = new Date();
                let labels = [];
                const dateMap = new Map();
                const dateSet = new Set();
                let weeks = [];

                if (filter === "daily") {
                    const dateStr = selectedDate;
                    labels = [formatDate(dateStr)];
                    dateSet.add(dateStr);
                    dateMap.set(dateStr, { present: 0, absent: 0 });
                } else if (filter === "weekly") {
                    for (let i = 5; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(today.getDate() - i);
                        if (date.getDay() === 0) continue;
                        const dateStr = date.toISOString().split("T")[0];
                        labels.push(formatDate(dateStr));
                        dateSet.add(dateStr);
                        dateMap.set(dateStr, { present: 0, absent: 0 });
                    }
                } else if (filter === "monthly") {
                    for (let i = 29; i >= 0; i -= 7) {
                        const weekEnd = new Date(today);
                        weekEnd.setDate(today.getDate() - i);
                        const weekStart = new Date(weekEnd);
                        weekStart.setDate(weekEnd.getDate() - 6);
                        const label = `${weekStart.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })} - ${weekEnd.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}`;
                        weeks.push({ label, start: new Date(weekStart), end: weekEnd });
                        for (let j = 0; j < 7 && i - j >= 0; j++) {
                            const date = new Date(today);
                            date.setDate(today.getDate() - (i - j));
                            const dateStr = date.toISOString().split("T")[0];
                            dateSet.add(dateStr);
                        }
                    }
                    labels = weeks.map((w) => w.label);
                    weeks.forEach((_, index) => {
                        dateMap.set(index.toString(), { present: 0, absent: 0 });
                    });
                }

                let hasRecords = false;
                for (const classId of classIds) {
                    const attendanceQuery = query(
                        collection(db, "studentAttendance"),
                        where("classId", "==", classId)
                    );
                    const attendanceSnap = await getDocs(attendanceQuery);
                    if (!attendanceSnap.empty) {
                        hasRecords = true;
                    }
                    attendanceSnap.forEach((doc) => {
                        const data = doc.data();
                        const dateStr = data.date;
                        if (
                            dateSet.has(dateStr) &&
                            (selectedSubject === "all" || data.subjectId === selectedSubject)
                        ) {
                            if (filter === "monthly") {
                                const recordDate = new Date(dateStr);
                                const weekIndex = weeks.findIndex(
                                    (week) =>
                                        recordDate >= week.start && recordDate <= week.end
                                );
                                if (weekIndex !== -1) {
                                    const counts = dateMap.get(weekIndex.toString());
                                    if (data.status === "present") counts.present += 1;
                                    else if (data.status === "absent") counts.absent += 1;
                                    dateMap.set(weekIndex.toString(), counts);
                                }
                            } else {
                                const counts = dateMap.get(dateStr);
                                if (counts) {
                                    if (data.status === "present") counts.present += 1;
                                    else if (data.status === "absent") counts.absent += 1;
                                    dateMap.set(dateStr, counts);
                                }
                            }
                        }
                    });
                }

                if (!hasRecords) {
                    throw new Error("No attendance records found for your classes.");
                }

                const presentData = [];
                const absentData = [];
                if (filter === "monthly") {
                    for (const [, counts] of dateMap) {
                        presentData.push(counts.present);
                        absentData.push(counts.absent);
                    }
                } else {
                    for (const dateStr of dateSet) {
                        const counts = dateMap.get(dateStr) || {
                            present: 0,
                            absent: 0,
                        };
                        presentData.push(counts.present);
                        absentData.push(counts.absent);
                    }
                }

                const finalChartData = {
                    labels,
                    datasets: [
                        {
                            label: showPercentage ? "Present (%)" : "Present",
                            data: showPercentage
                                ? presentData.map((p, i) => {
                                    const total = p + absentData[i];
                                    return total ? ((p / total) * 100).toFixed(1) : 0;
                                })
                                : presentData,
                            backgroundColor: "rgba(40, 167, 69, 0.6)",
                        },
                        {
                            label: showPercentage ? "Absent (%)" : "Absent",
                            data: showPercentage
                                ? absentData.map((a, i) => {
                                    const total = presentData[i] + a;
                                    return total ? ((a / total) * 100).toFixed(1) : 0;
                                })
                                : absentData,
                            backgroundColor: "rgba(220, 53, 69, 0.6)",
                        },
                    ],
                };

                setChartData(finalChartData);
            } catch (error) {
                setError(error.message);
                toast.error(error.message);
                console.error("Error in fetchAttendanceData:", error);
                setChartData(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (teacherId) {
            fetchAttendanceData();
        } else {
            setIsLoading(false);
            setError("Teacher not authenticated.");
            toast.error("Please log in to view attendance data.");
        }
    }, [teacherId, filter, selectedDate, selectedSubject, showPercentage]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setChartData(null);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        setChartData(null);
    };

    const handleSubjectChange = (e) => {
        setSelectedSubject(e.target.value);
        setChartData(null);
    };

    const handlePercentageToggle = () => {
        setShowPercentage((prev) => !prev);
        setChartData(null);
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: `Student Attendance (${filter.charAt(0).toUpperCase() + filter.slice(1)}${selectedSubject !== "all"
                        ? ` - ${subjects.find((s) => s.id === selectedSubject)?.name || "Subject"}`
                        : ""
                    })`,
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || "";
                        const value = context.parsed.y;
                        return showPercentage
                            ? `${label}: ${value}%`
                            : `${label}: ${value} student${value !== 1 ? "s" : ""}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: filter === "monthly" ? "Week" : "Date",
                },
            },
            y: {
                max: showPercentage ? 100 : undefined,
                beginAtZero: true,
                ticks: {
                    stepSize: showPercentage ? 10 : 1,
                    callback: (value) => (showPercentage ? `${value}%` : value),
                },
                title: {
                    display: true,
                    text: showPercentage ? "Percentage of Students" : "Number of Students",
                },
            },
        },
    };

    return (
        <div className="card student-attendance-chart-card">
            <h3>Student Attendance</h3>
            <div className="filter-container">
                {isLoading ? (
                    <>
                        {/* CHANGE: Skeleton for subject selector */}
                        <div className="skeleton skeleton-select"></div>
                        {/* CHANGE: Skeleton for filter buttons */}
                        <div className="skeleton skeleton-button"></div>
                        <div className="skeleton skeleton-button"></div>
                        <div className="skeleton skeleton-button"></div>
                        {/* CHANGE: Skeleton for date picker (only when daily) */}
                        {filter === "daily" && <div className="skeleton skeleton-date-picker"></div>}
                        {/* CHANGE: Skeleton for percentage toggle */}
                        <div className="skeleton skeleton-toggle">
                            <div className="skeleton skeleton-checkbox"></div>
                            <div className="skeleton skeleton-toggle-text"></div>
                        </div>
                    </>
                ) : (
                    <>
                        <select
                            className="subject-select"
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className={`filter-button ${filter === "daily" ? "active" : ""}`}
                            onClick={() => handleFilterChange("daily")}
                        >
                            Daily
                        </button>
                        <button
                            className={`filter-button ${filter === "weekly" ? "active" : ""}`}
                            onClick={() => handleFilterChange("weekly")}
                        >
                            Weekly
                        </button>
                        <button
                            className={`filter-button ${filter === "monthly" ? "active" : ""}`}
                            onClick={() => handleFilterChange("monthly")}
                        >
                            Monthly
                        </button>
                        {filter === "daily" && (
                            <input
                                type="date"
                                className="date-picker"
                                value={selectedDate}
                                onChange={handleDateChange}
                                max={new Date().toISOString().split("T")[0]}
                            />
                        )}
                        <label className="percentage-toggle">
                            <input
                                type="checkbox"
                                checked={showPercentage}
                                onChange={handlePercentageToggle}
                            />
                            Show as Percentage
                        </label>
                    </>
                )}
            </div>
            <div className="chart-container">
                {isLoading ? (
                    // CHANGE: Skeleton for chart
                    <div className="skeleton-chart">
                        <div className="skeleton skeleton-bar"></div>
                        <div className="skeleton skeleton-bar"></div>
                        <div className="skeleton skeleton-bar"></div>
                        <div className="skeleton skeleton-bar"></div>
                        <div className="skeleton skeleton-bar"></div>
                    </div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : chartData ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <div>No attendance data available.</div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendanceChart;