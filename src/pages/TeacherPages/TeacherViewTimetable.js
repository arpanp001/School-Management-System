import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import '../TeacherPagesStyle/TeacherTimetable.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Define color palettes for subjects and classes
const SUBJECT_COLORS = [
    '#fce7f3', // Pink (light)
    '#e0f7fa', // Teal (light)
    '#fef3c7', // Yellow (light)
    '#d1fae5', // Green (light)
    '#e0e7ff', // Indigo (light)
    '#fce7e0', // Orange (light)
    '#e0f2fe', // Blue (light)
];

const CLASS_COLORS = [
    '#f472b6', // Pink (border)
    '#06b6d4', // Teal (border)
    '#facc15', // Yellow (border)
    '#34d399', // Green (border)
    '#6366f1', // Indigo (border)
    '#fb923c', // Orange (border)
    '#3b82f6', // Blue (border)
];

// Utility function to assign colors based on ID
const getColorIndex = (id) => {
    // Simple hash to assign a consistent color based on ID
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % SUBJECT_COLORS.length;
};

// Loading spinner component
const LoadingSpinner = () => (
    <div className="timetable-loading">
        <span>Loading timetable...</span>
    </div>
);

// Component for day filter
const DayFilter = ({ selectedDay, setSelectedDay }) => (
    <div className="timetable-day-filter">
        <select
            className="timetable-day-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
        >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                    {day}
                </option>
            ))}
        </select>
    </div>
);

// Component for schedule grid
const ScheduleGrid = ({
    timeSlots,
    groupedByTimeSlot,
    getClassName,
    getSubjectName,
    currentDay,
}) => (
    <div className="timetable-schedule-grid">
        <div className="timetable-grid-header">
            <div className="timetable-grid-time-slot">Time Slot</div>
            {DAYS_OF_WEEK.map((day) => (
                <div
                    key={day}
                    className={`timetable-day-title ${day === currentDay ? 'timetable-current-day' : ''}`}
                >
                    {day}
                </div>
            ))}
        </div>
        {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="timetable-grid-row">
                <div className="timetable-grid-time-slot">{timeSlot}</div>
                {DAYS_OF_WEEK.map((day) => {
                    const entry = groupedByTimeSlot[timeSlot]?.[day];
                    return (
                        <div key={day} className="timetable-grid-cell">
                            {entry ? (
                                <div
                                    className="timetable-schedule-item"
                                    style={{
                                        backgroundColor: SUBJECT_COLORS[getColorIndex(entry.subjectId)],
                                        borderLeftColor: CLASS_COLORS[getColorIndex(entry.classId)],
                                    }}
                                >
                                    <div className="timetable-schedule-class">{getClassName(entry.classId)}</div>
                                    <div className="timetable-schedule-subject">{getSubjectName(entry.subjectId)}</div>
                                </div>
                            ) : (
                                <div className="timetable-no-schedule">-</div>
                            )}
                        </div>
                    );
                })}
            </div>
        ))}
    </div>
);

const TeacherTimetable = () => {
    // State management
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;

    // Determine current day
    const currentDate = new Date();
    const currentDay = DAYS_OF_WEEK[currentDate.getDay() - 1] || DAYS_OF_WEEK[0]; // Adjust for 0-based index

    // Data fetching
    const fetchTeacherTimetable = useCallback(async () => {
        if (!teacherId) {
            toast.error('Please log in to view your timetable');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const teacherMappingsQuery = query(
                collection(db, 'classTeacherMapping'),
                where('teacherId', '==', teacherId)
            );
            const mappingsSnap = await getDocs(teacherMappingsQuery);
            const classIds = mappingsSnap.docs.map((doc) => doc.data().classId);

            const timetablesQuery = query(
                collection(db, 'timetables'),
                where('teacherId', '==', teacherId),
                where('classId', 'in', classIds.length > 0 ? classIds : ['none'])
            );
            const timetablesSnap = await getDocs(timetablesQuery);
            setTimetables(timetablesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            setError('Error fetching timetable: ' + error.message);
            toast.error('Error fetching timetable: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [teacherId]);

    useEffect(() => {
        if (teacherId) {
            fetchTeacherTimetable();
        }
    }, [teacherId, fetchTeacherTimetable]);

    // Helper functions
    const getClassName = (classId) => {
        const cls = classes.find((c) => c.id === classId);
        return cls ? `${cls.className} - ${cls.section}` : 'N/A';
    };

    const getSubjectName = (subjectId) => {
        const sub = subjects.find((s) => s.id === subjectId);
        return sub ? sub.subjectName : 'N/A';
    };

    // Filter and group timetables
    const filteredTimetables = timetables.filter(
        (timetable) => !selectedDay || timetable.day === selectedDay
    );

    const groupedByTimeSlot = filteredTimetables.reduce((acc, timetable) => {
        if (!acc[timetable.timeSlot]) {
            acc[timetable.timeSlot] = {};
        }
        acc[timetable.timeSlot][timetable.day] = timetable;
        return acc;
    }, {});

    const timeSlots = [...new Set(timetables.map((t) => t.timeSlot))].sort();

    // Render states
    if (isLoading) {
        return (
            <div className="timetable-container">
                <h2 className="timetable-title">My Schedule</h2>
                <LoadingSpinner />
            </div>
        );
    }

    if (!teacherId) {
        return (
            <div className="timetable-container">
                <h2 className="timetable-title">My Schedule</h2>
                <div className="timetable-error">
                    Please log in to view your timetable.
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="timetable-container">
                <h2 className="timetable-title">My Schedule</h2>
                <div className="timetable-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="timetable-container">
            <h2 className="timetable-title">My Schedule</h2>
            <DayFilter selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
            {timetables.length === 0 ? (
                <div className="timetable-no-schedule-message">
                    No timetable assigned yet.
                </div>
            ) : (
                <ScheduleGrid
                    timeSlots={timeSlots}
                    groupedByTimeSlot={groupedByTimeSlot}
                    getClassName={getClassName}
                    getSubjectName={getSubjectName}
                    currentDay={currentDay}
                />
            )}
        </div>
    );
};

export default TeacherTimetable;