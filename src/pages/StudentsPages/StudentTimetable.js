import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import '../StudentPagesStyle/StudentTimetable.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Sub-component for loading state
const TimetableLoading = () => (
    <div className="student-timetable-loading">
        <span className="student-timetable-loading-spinner"></span>
        Loading timetable...
    </div>
);

// Sub-component for login prompt
const TimetableLoginPrompt = () => (
    <div className="student-timetable-login-prompt">
        Please log in to view your timetable.
    </div>
);

// Sub-component for no timetable message
const TimetableEmpty = () => (
    <div className="student-timetable-empty">
        No timetable assigned yet for your class.
    </div>
);

// Sub-component for the day filter
const DayFilter = ({ selectedDay, onDayChange, onReset }) => (
    <div className="student-timetable-filter-row">
        <div className="student-timetable-filter-col">
            <select
                className="student-timetable-filter-select"
                value={selectedDay}
                onChange={(e) => onDayChange(e.target.value)}
                aria-label="Select a day to filter the timetable"
            >
                <option value="">All Days</option>
                {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                ))}
            </select>
        </div>
        <button
            className="student-timetable-filter-reset"
            onClick={onReset}
            disabled={!selectedDay}
            aria-label="Reset day filter"
        >
            Reset
        </button>
    </div>
);

// Sub-component for the timetable grid
const TimetableGrid = ({ timeSlots, groupedByTimeSlot, getSubjectName, getTeacherName, getSubjectBackgroundColor }) => (
    <div className="student-timetable-grid-wrapper">
        <div className="student-timetable-grid">
            <div className="student-timetable-grid-header">
                <div className="student-timetable-header-time">Time Slot</div>
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="student-timetable-header-day">{day}</div>
                ))}
            </div>
            {timeSlots.map(timeSlot => (
                <div key={timeSlot} className="student-timetable-grid-row">
                    <div className="student-timetable-time-slot">{timeSlot}</div>
                    {DAYS_OF_WEEK.map(day => {
                        const entry = groupedByTimeSlot[timeSlot]?.[day];
                        return (
                            <div key={day} className="student-timetable-grid-cell">
                                {entry ? (
                                    <div
                                        className="student-timetable-grid-entry"
                                        style={{ backgroundColor: getSubjectBackgroundColor(entry.subjectId) }}
                                    >
                                        <div className="student-timetable-subject">{getSubjectName(entry.subjectId)}</div>
                                        <div className="student-timetable-teacher">{getTeacherName(entry.teacherId)}</div>
                                    </div>
                                ) : (
                                    <span className="student-timetable-empty-slot">-</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </div>
);

const StudentTimetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const studentId = auth.currentUser?.uid;

    useEffect(() => {
        if (!studentId) {
            toast.error('Please log in to view your timetable');
            setLoading(false);
            return;
        }

        const fetchStudentTimetable = async () => {
            try {
                setLoading(true);

                const studentMappingsQuery = query(
                    collection(db, 'studentAssignments'),
                    where('studentId', '==', studentId)
                );
                const mappingsSnap = await getDocs(studentMappingsQuery);
                const classIds = mappingsSnap.docs.map(doc => doc.data().classId);

                if (classIds.length === 0) {
                    toast.info('No class assigned yet');
                    setLoading(false);
                    return;
                }

                const timetablesQuery = query(
                    collection(db, 'timetables'),
                    where('classId', 'in', classIds)
                );
                const timetablesSnap = await getDocs(timetablesQuery);
                setTimetables(timetablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const classesSnap = await getDocs(collection(db, 'classes'));
                setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const subjectsSnap = await getDocs(collection(db, 'subjects'));
                setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const teachersSnap = await getDocs(collection(db, 'teacherLog'));
                setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                toast.error('Error fetching timetable: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentTimetable();
    }, [studentId]);

    const getSubjectName = (subjectId) => {
        const sub = subjects.find(s => s.id === subjectId);
        return sub ? sub.subjectName : 'N/A';
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher ? teacher.email : 'N/A';
    };

    // Define a mapping of subjects to soft, light background colors
    const subjectBackgroundColors = {
        'Maths': '#ffcccc', // Light red
        'Science': '#cceeff', // Light blue
        'English': '#e6ffe6', // Light green
        'History': '#fff0cc', // Light yellow
        'Geography': '#e6ccff', // Light purple
        'Physical Education': '#ccffe6', // Light teal
    };

    // Get or assign a background color for a subject
    const getSubjectBackgroundColor = (subjectId) => {
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            return subjectBackgroundColors[sub.subjectName] || Object.values(subjectBackgroundColors)[Math.floor(Math.random() * Object.values(subjectBackgroundColors).length)];
        }
        return '#f1f5f9'; // Default light gray for unknown subjects
    };

    const filteredTimetables = timetables.filter(timetable =>
        !selectedDay || timetable.day === selectedDay
    );

    const groupedByTimeSlot = filteredTimetables.reduce((acc, timetable) => {
        if (!acc[timetable.timeSlot]) {
            acc[timetable.timeSlot] = {};
        }
        acc[timetable.timeSlot][timetable.day] = timetable;
        return acc;
    }, {});

    const timeSlots = [...new Set(timetables.map(t => t.timeSlot))].sort();

    const handleResetFilter = () => {
        setSelectedDay('');
    };

    return (
        <div className="student-timetable-container">
            <h2 className="student-timetable-title">My Timetable</h2>

            {loading ? (
                <TimetableLoading />
            ) : !studentId ? (
                <TimetableLoginPrompt />
            ) : (
                <>
                    <DayFilter
                        selectedDay={selectedDay}
                        onDayChange={setSelectedDay}
                        onReset={handleResetFilter}
                    />

                    {timetables.length === 0 ? (
                        <TimetableEmpty />
                    ) : (
                        <TimetableGrid
                            timeSlots={timeSlots}
                            groupedByTimeSlot={groupedByTimeSlot}
                            getSubjectName={getSubjectName}
                            getTeacherName={getTeacherName}
                            getSubjectBackgroundColor={getSubjectBackgroundColor}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default StudentTimetable;