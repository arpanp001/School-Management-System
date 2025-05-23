import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../AdminPagesStyle/AdminCreateTimetable.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
];

// Component for the timetable form
const TimetableForm = ({
    selectedClass, setSelectedClass,
    selectedDay, setSelectedDay,
    selectedTimeSlot, setSelectedTimeSlot,
    selectedSubject, setSelectedSubject,
    selectedTeacher, setSelectedTeacher,
    classes, subjects, teachers,
    isEditing, handleSubmit
}) => {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClass || !selectedDay || !selectedTimeSlot || !selectedSubject || !selectedTeacher) {
            toast.error('All fields are required');
            return;
        }
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="timetable-form">
            <div className="form-group">
                <select
                    className="form-input"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <select
                    className="form-input"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    required
                >
                    <option value="">Select Day</option>
                    {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <select
                    className="form-input"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    required
                >
                    <option value="">Select Time Slot</option>
                    {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <select
                    className="form-input"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <select
                    className="form-input"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                    ))}
                </select>
            </div>
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Update Timetable' : 'Add Timetable'}
                </button>
            </div>
        </form>
    );
};

// Component for the timetable table
const TimetableTable = ({ timetables, handleEdit, handleDelete, getClassName, getSubjectName, getTeacherName, currentPage, itemsPerPage, totalPages, paginate }) => (
    <div className="table-container">
        <table className="timetable-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {timetables.map((timetable) => (
                    <tr key={timetable.id}>
                        <td>{getClassName(timetable.classId)}</td>
                        <td>{timetable.day}</td>
                        <td>{timetable.timeSlot}</td>
                        <td>{getSubjectName(timetable.subjectId)}</td>
                        <td>{getTeacherName(timetable.teacherId)}</td>
                        <td>
                            <button
                                className="btn btn-edit"
                                onClick={() => handleEdit(timetable)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn btn-delete"
                                onClick={() => handleDelete(timetable.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                {timetables.length === 0 && (
                    <tr>
                        <td colSpan="6" className="no-data">
                            No timetable entries found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        {timetables.length > itemsPerPage && (
            <nav className="pagination-container">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                        >
                            Previous
                        </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i + 1}
                            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => paginate(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        )}
    </div>
);

const AdminCreateTimetable = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Data fetching
    useEffect(() => {
        fetchData();
        fetchTimetables();
    }, []);

    const fetchData = async () => {
        try {
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

    const fetchTimetables = async () => {
        try {
            const timetablesSnap = await getDocs(collection(db, 'timetables'));
            setTimetables(timetablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching timetables: ' + error.message);
        }
    };

    // Firebase operations
    const checkTeacherAvailability = async (teacherId, day, timeSlot, currentEditId = null) => {
        const q = query(
            collection(db, 'timetables'),
            where('teacherId', '==', teacherId),
            where('day', '==', day),
            where('timeSlot', '==', timeSlot)
        );
        const querySnapshot = await getDocs(q);
        if (currentEditId) {
            return querySnapshot.docs.every(doc => doc.id === currentEditId);
        }
        return querySnapshot.empty;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const isTeacherAvailable = await checkTeacherAvailability(
                selectedTeacher,
                selectedDay,
                selectedTimeSlot,
                isEditing ? editId : null
            );

            if (!isTeacherAvailable) {
                toast.error('Teacher is already assigned to another class at this time');
                return;
            }

            const timetableData = {
                classId: selectedClass,
                day: selectedDay,
                timeSlot: selectedTimeSlot,
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                updatedAt: new Date().toISOString()
            };

            if (isEditing) {
                await updateDoc(doc(db, 'timetables', editId), timetableData);
                toast.success('Timetable updated successfully');
                setIsEditing(false);
                setEditId(null);
            } else {
                await addDoc(collection(db, 'timetables'), {
                    ...timetableData,
                    createdAt: new Date().toISOString()
                });
                toast.success('Timetable entry created successfully');
            }

            resetForm();
            fetchTimetables();
        } catch (error) {
            toast.error('Error saving timetable: ' + error.message);
        }
    };

    const handleEdit = (timetable) => {
        setIsEditing(true);
        setEditId(timetable.id);
        setSelectedClass(timetable.classId);
        setSelectedDay(timetable.day);
        setSelectedTimeSlot(timetable.timeSlot);
        setSelectedSubject(timetable.subjectId);
        setSelectedTeacher(timetable.teacherId);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this timetable entry?')) {
            try {
                await deleteDoc(doc(db, 'timetables', id));
                toast.success('Timetable entry deleted successfully');
                fetchTimetables();
            } catch (error) {
                toast.error('Error deleting timetable: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setSelectedClass('');
        setSelectedDay('');
        setSelectedTimeSlot('');
        setSelectedSubject('');
        setSelectedTeacher('');
        setIsEditing(false);
        setEditId(null);
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

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = timetables.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(timetables.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">{isEditing ? 'Edit Timetable' : 'Create Timetable'}</h2>

            <TimetableForm
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                selectedTimeSlot={selectedTimeSlot}
                setSelectedTimeSlot={setSelectedTimeSlot}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
            />

            <div className="table-wrapper">
                <TimetableTable
                    timetables={currentItems}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    getClassName={getClassName}
                    getSubjectName={getSubjectName}
                    getTeacherName={getTeacherName}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            </div>
        </div>
    );
};

export default AdminCreateTimetable;