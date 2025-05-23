// src/pages/AdminPages/AdminViewTimetable.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminViewTimetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDay, setSelectedDay] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const timetablesSnap = await getDocs(collection(db, 'timetables'));
            setTimetables(timetablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const teachersSnap = await getDocs(collection(db, 'teacherLog'));
            setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching data: ' + error.message);
        }
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.className} - ${cls.section}` : 'N/A';
    };

    const getSubjectName = (subjectId) => {
        const sub = subjects.find(s => s.id === subjectId);
        return sub ? sub.subjectName : 'N/A';
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher ? teacher.email : 'N/A';
    };

    const filteredTimetables = timetables.filter(timetable => {
        return (!selectedClass || timetable.classId === selectedClass) &&
            (!selectedDay || timetable.day === selectedDay);
    });

    const groupedByTimeSlot = filteredTimetables.reduce((acc, timetable) => {
        if (!acc[timetable.timeSlot]) {
            acc[timetable.timeSlot] = {};
        }
        acc[timetable.timeSlot][timetable.day] = timetable;
        return acc;
    }, {});

    const timeSlots = [...new Set(timetables.map(t => t.timeSlot))].sort();

    return (
        <div className="container mt-4">
            <h2>View Timetable</h2>

            <div className="mb-4">
                <div className="row g-3">
                    <div className="col-md-6">
                        <select
                            className="form-control"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.className} - {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-control"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                        >
                            <option value="">All Days</option>
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Time Slot</th>
                            {DAYS_OF_WEEK.map(day => (
                                <th key={day}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(timeSlot => (
                            <tr key={timeSlot}>
                                <td>{timeSlot}</td>
                                {DAYS_OF_WEEK.map(day => {
                                    const entry = groupedByTimeSlot[timeSlot]?.[day];
                                    return (
                                        <td key={day}>
                                            {entry ? (
                                                <>
                                                    <div>{getClassName(entry.classId)}</div>
                                                    <div>{getSubjectName(entry.subjectId)}</div>
                                                    <div>{getTeacherName(entry.teacherId)}</div>
                                                </>
                                            ) : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminViewTimetable;