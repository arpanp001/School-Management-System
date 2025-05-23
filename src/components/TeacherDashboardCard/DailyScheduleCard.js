import React, { useState, useEffect } from "react";
import "../TeacherDashboardCardCss/DailyScheduleCard.css";
import { FaCalendarAlt } from "react-icons/fa";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

const DailyScheduleCard = () => {
    const [scheduleItems, setScheduleItems] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState(null);

    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;
    // Standardize current day to match Firestore data (e.g., "Monday")
    const currentDate = new Date();
    const currentDay = currentDate.toLocaleDateString("en-US", { weekday: "long" }); // e.g., "Monday"

    useEffect(() => {
        const fetchTeacherSchedule = async () => {
            if (!teacherId) {
                toast.error("Please log in to view your schedule");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setDebugInfo("Starting fetch...");

                // Fetch class-teacher mappings
                const teacherMappingsQuery = query(
                    collection(db, "classTeacherMapping"),
                    where("teacherId", "==", teacherId)
                );
                const mappingsSnap = await getDocs(teacherMappingsQuery);
                const classIds = mappingsSnap.docs.map((doc) => doc.data().classId);

                if (classIds.length === 0) {
                    setDebugInfo("No class mappings found for teacher.");
                    setScheduleItems([]);
                    setLoading(false);
                    return;
                }

                // Fetch timetables for the teacher and current day
                const timetablesQuery = query(
                    collection(db, "timetables"),
                    where("teacherId", "==", teacherId),
                    where("day", "==", currentDay),
                    where("classId", "in", classIds.length > 0 ? classIds : ["none"])
                );
                const timetablesSnap = await getDocs(timetablesQuery);
                const timetableData = timetablesSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Log query results for debugging
                setDebugInfo(
                    `Queried timetables: ${timetablesSnap.size} found for day "${currentDay}", teacherId "${teacherId}", classIds: ${classIds.join(", ")}`
                );

                // Fetch classes
                const classesSnap = await getDocs(collection(db, "classes"));
                const classesData = classesSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setClasses(classesData);

                // Fetch subjects
                const subjectsSnap = await getDocs(collection(db, "subjects"));
                const subjectsData = subjectsSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSubjects(subjectsData);

                // Map timetable data to schedule items
                const formattedSchedule = timetableData.map((item) => ({
                    day: item.day,
                    timing: item.timeSlot,
                    class: item.classId,
                    subject: item.subjectId,
                }));

                // Sort by time slot
                formattedSchedule.sort((a, b) => a.timing.localeCompare(b.timing));
                setScheduleItems(formattedSchedule);

                if (formattedSchedule.length === 0) {
                    setDebugInfo((prev) => `${prev} | No schedules after formatting.`);
                }
            } catch (error) {
                toast.error("Error fetching schedule: " + error.message);
                setDebugInfo(`Error: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (teacherId) {
            fetchTeacherSchedule();
        }
    }, [teacherId, currentDay]);

    const getClassName = (classId) => {
        const cls = classes.find((c) => c.id === classId);
        return cls ? `${cls.className} - ${cls.section}` : "N/A";
    };

    const getSubjectName = (subjectId) => {
        const sub = subjects.find((s) => s.id === subjectId);
        return sub ? sub.subjectName : "N/A";
    };

    return (
        <div className="daily-schedule-container">
            <div className="schedule-header">
                <h3>Today's Schedule ({currentDay})</h3>
                <FaCalendarAlt className="schedule-icon" />
            </div>
            {loading ? (
                <div className="loading-message">Loading schedule...</div>
            ) : scheduleItems.length === 0 ? (
                <div className="empty-schedule">
                    No classes scheduled for today.
                    {debugInfo && (
                        <small className="debug-message">Debug: {debugInfo}</small>
                    )}
                </div>
            ) : (
                <ul className="schedule-list">
                    {scheduleItems.map((item, index) => (
                        <li key={index} className="schedule-item">
                            <div className="schedule-info">
                                <span className="class-name">{getClassName(item.class)}</span>
                                <span className="subject-name">{getSubjectName(item.subject)}</span>
                            </div>
                            <span className="schedule-time">{item.timing}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DailyScheduleCard;