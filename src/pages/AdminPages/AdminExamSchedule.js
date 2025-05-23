import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Select from 'react-select';
import '../../pages/AdminPagesStyle/AdminExamSchedule.css';

const EXAM_TYPES = ['Midterm', 'Final', 'Unit Test', 'Practical'];

// Component for the exam schedule form
const ExamScheduleForm = ({
    formData,
    setFormData,
    classes,
    subjects,
    teachers,
    examHalls,
    isEditing,
    handleSubmit,
    resetForm
}) => {
    // Format teachers for react-select options
    const invigilatorOptions = teachers.map((teacher) => ({
        value: teacher.id,
        label: teacher.email,
    }));

    // Handle react-select change for invigilators
    const handleInvigilatorChange = (selectedOptions) => {
        setFormData({
            ...formData,
            invigilators: selectedOptions ? selectedOptions.map((option) => option.value) : [],
        });
    };

    return (
        <form onSubmit={handleSubmit} className="exam-form">
            <div className="form-group">
                <label className="form-label">Class</label>
                <select
                    className="form-input"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Exam Type</label>
                <select
                    className="form-input"
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    required
                >
                    <option value="">Select Exam Type</option>
                    {EXAM_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                    className="form-input"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    required
                >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Date</label>
                <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Exam Hall</label>
                <select
                    className="form-input"
                    value={formData.examHall}
                    onChange={(e) => setFormData({ ...formData, examHall: e.target.value })}
                    required
                >
                    <option value="">Select Exam Hall</option>
                    {examHalls.map((hall) => (
                        <option key={hall.id} value={hall.id}>
                            {hall.name} (Capacity: {hall.capacity})
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="Enter duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Invigilators</label>
                <Select
                    isMulti
                    options={invigilatorOptions}
                    value={invigilatorOptions.filter((option) => formData.invigilators.includes(option.value))}
                    onChange={handleInvigilatorChange}
                    placeholder="Select invigilators..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    required
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                />
                <small className="form-hint">Select multiple invigilators as needed</small>
            </div>
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Update Schedule' : 'Create Schedule'}
                </button>
                {isEditing && (
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        Cancel Edit
                    </button>
                )}
            </div>
        </form>
    );
};

// Component for filter and search controls
const ExamFilter = ({ examTypeFilter, setExamTypeFilter, classFilter, setClassFilter, searchQuery, setSearchQuery, classes }) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Filter by Exam Type</label>
            <select
                className="form-input"
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
            >
                <option value="All">All Exam Types</option>
                {EXAM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <label className="form-label">Filter by Class</label>
            <select
                className="form-input"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
            >
                <option value="All">All Classes</option>
                {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.section}
                    </option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <label className="form-label">Search</label>
            <input
                type="text"
                className="form-input"
                placeholder="Search by subject or date"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    </div>
);

// Component for the exam schedule table
const ExamScheduleTable = ({
    examSchedules,
    classes,
    subjects,
    teachers,
    examHalls,
    handleEdit,
    handleDelete,
    currentPage,
    itemsPerPage,
    totalPages,
    paginate
}) => (
    <div className="table-container">
        <table className="exam-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Exam Type</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Hall</th>
                    <th>Invigilators</th>
                    <th>Duration</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {examSchedules.map((exam) => {
                    const classData = classes.find((c) => c.id === exam.classId);
                    const subjectData = subjects.find((s) => s.id === exam.subjectId);
                    const hallData = examHalls.find((h) => h.id === exam.examHall);
                    return (
                        <tr key={exam.id}>
                            <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                            <td>{exam.examType}</td>
                            <td>{subjectData ? subjectData.subjectName : 'N/A'}</td>
                            <td>{exam.date}</td>
                            <td>{`${exam.startTime} - ${exam.endTime}`}</td>
                            <td>{hallData ? hallData.name : 'N/A'}</td>
                            <td>
                                {exam.invigilators
                                    .map((inv) => teachers.find((t) => t.id === inv)?.email || 'N/A')
                                    .join(', ')}
                            </td>
                            <td>{exam.duration} min</td>
                            <td>
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEdit(exam)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(exam.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {examSchedules.length === 0 && (
                    <tr>
                        <td colSpan="9" className="no-data">
                            No exam schedules found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        {examSchedules.length > itemsPerPage && (
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

const AdminExamSchedule = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [examSchedules, setExamSchedules] = useState([]);
    const [examHalls] = useState([
        { id: 'hall1', name: 'Hall 1', capacity: 50 },
        { id: 'hall2', name: 'Hall 2', capacity: 40 },
        { id: 'hall3', name: 'Hall 3', capacity: 30 },
    ]);
    const [formData, setFormData] = useState({
        classId: '',
        examType: '',
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        examHall: '',
        invigilators: [],
        duration: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [examTypeFilter, setExamTypeFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Data fetching
    useEffect(() => {
        fetchData();
        fetchExamSchedules();
    }, []);

    const fetchData = async () => {
        try {
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const teachersSnap = await getDocs(collection(db, 'teacherLog'));
            setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching data: ' + error.message);
        }
    };

    const fetchExamSchedules = async () => {
        try {
            const schedulesSnap = await getDocs(collection(db, 'examSchedules'));
            setExamSchedules(schedulesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching schedules: ' + error.message);
        }
    };

    // Overlap checking
    const checkOverlaps = (newExam) => {
        const newStart = new Date(`${newExam.date}T${newExam.startTime}`);
        const newEnd = new Date(`${newExam.date}T${newExam.endTime}`);

        const classOverlap = examSchedules.some(
            (exam) =>
                exam.classId === newExam.classId &&
                exam.id !== (editId || '') &&
                new Date(`${exam.date}T${exam.startTime}`) < newEnd &&
                new Date(`${exam.date}T${exam.endTime}`) > newStart
        );

        const hallOverlap = examSchedules.some(
            (exam) =>
                exam.examHall === newExam.examHall &&
                exam.id !== (editId || '') &&
                new Date(`${exam.date}T${exam.startTime}`) < newEnd &&
                new Date(`${exam.date}T${exam.endTime}`) > newStart
        );

        const invigilatorOverlap = examSchedules.some(
            (exam) =>
                exam.id !== (editId || '') &&
                exam.invigilators.some((inv) => newExam.invigilators.includes(inv)) &&
                new Date(`${exam.date}T${exam.startTime}`) < newEnd &&
                new Date(`${exam.date}T${exam.endTime}`) > newStart
        );

        return { classOverlap, hallOverlap, invigilatorOverlap };
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.invigilators.length === 0) {
            toast.error('At least one invigilator is required');
            return;
        }

        const overlaps = checkOverlaps(formData);
        if (overlaps.classOverlap) {
            toast.error('This exam overlaps with another exam for the same class');
            return;
        }
        if (overlaps.hallOverlap) {
            toast.error('This exam hall is already booked for this time slot');
            return;
        }
        if (overlaps.invigilatorOverlap) {
            toast.error('One or more invigilators are already assigned to another exam');
            return;
        }

        try {
            let scheduleId;
            if (isEditing) {
                await updateDoc(doc(db, 'examSchedules', editId), {
                    ...formData,
                    updatedAt: new Date().toISOString(),
                });
                scheduleId = editId;
                toast.success('Exam schedule updated successfully');
            } else {
                const scheduleDoc = await addDoc(collection(db, 'examSchedules'), {
                    ...formData,
                    createdAt: new Date().toISOString(),
                });
                scheduleId = scheduleDoc.id;
                toast.success('Exam schedule created successfully');

                // Notify students in the class
                const classData = classes.find((c) => c.id === formData.classId);
                const subjectData = subjects.find((s) => s.id === formData.subjectId);
                const notificationMessage = `New exam scheduled: ${formData.examType} exam for ${subjectData?.subjectName || 'Subject'} `;

                // Fetch students in the class
                const studentAssignmentsSnap = await getDocs(collection(db, 'studentAssignments'));
                const studentsInClass = studentAssignmentsSnap.docs
                    .filter((doc) => doc.data().classId === formData.classId)
                    .map((doc) => doc.data().studentId);

                // Create notification for each student
                const notificationPromises = studentsInClass.map((studentId) =>
                    addDoc(collection(db, 'studentLog', studentId, 'notifications'), {
                        message: notificationMessage,
                        type: 'exam_schedule',
                        read: false,
                        createdAt: serverTimestamp(),
                        link: '/student/exam-schedule'
                    })
                );

                await Promise.all(notificationPromises);
            }
            resetForm();
            fetchExamSchedules();
        } catch (error) {
            toast.error('Error saving exam schedule: ' + error.message);
        }
    };

    // Edit and delete handlers
    const handleEdit = (exam) => {
        setIsEditing(true);
        setEditId(exam.id);
        setFormData({
            classId: exam.classId,
            examType: exam.examType,
            subjectId: exam.subjectId,
            date: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            examHall: exam.examHall,
            invigilators: exam.invigilators,
            duration: exam.duration,
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this exam schedule?')) {
            try {
                await deleteDoc(doc(db, 'examSchedules', id));
                toast.success('Exam schedule deleted successfully');
                fetchExamSchedules();
            } catch (error) {
                toast.error('Error deleting exam schedule: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            classId: '',
            examType: '',
            subjectId: '',
            date: '',
            startTime: '',
            endTime: '',
            examHall: '',
            invigilators: [],
            duration: '',
        });
        setIsEditing(false);
        setEditId(null);
    };

    // Filter and search logic
    const filteredSchedules = examSchedules.filter((exam) => {
        const matchesExamType = examTypeFilter === 'All' || exam.examType === examTypeFilter;
        const matchesClass = classFilter === 'All' || exam.classId === classFilter;
        const subjectData = subjects.find((s) => s.id === exam.subjectId);
        const searchText = `${exam.date} ${subjectData?.subjectName || ''}`.toLowerCase();
        const matchesSearch = searchText.includes(searchQuery.toLowerCase());
        return matchesExamType && matchesClass && matchesSearch;
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSchedules = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Exam Schedule Management</h2>
            <ExamScheduleForm
                formData={formData}
                setFormData={setFormData}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                examHalls={examHalls}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
                resetForm={resetForm}
            />
            <ExamFilter
                examTypeFilter={examTypeFilter}
                setExamTypeFilter={setExamTypeFilter}
                classFilter={classFilter}
                setClassFilter={setClassFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                classes={classes}
            />
            <div className="table-wrapper">
                <ExamScheduleTable
                    examSchedules={currentSchedules}
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    examHalls={examHalls}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            </div>
        </div>
    );
};

export default AdminExamSchedule;