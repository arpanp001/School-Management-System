import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AdminAssignTimetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedTimetable, setSelectedTimetable] = useState(null);
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Adjust this number as needed

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

    const handleSelectTimetable = (timetable) => {
        setSelectedTimetable({ ...timetable });
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedTimetable) {
            toast.error('Please select a timetable to assign');
            return;
        }

        try {
            await updateDoc(doc(db, 'timetables', selectedTimetable.id), {
                classId: selectedTimetable.classId,
                subjectId: selectedTimetable.subjectId,
                teacherId: selectedTimetable.teacherId,
                updatedAt: new Date().toISOString()
            });
            toast.success('Timetable assigned successfully');
            fetchData();
            setSelectedTimetable(null);
        } catch (error) {
            toast.error('Error assigning timetable: ' + error.message);
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

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = timetables.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(timetables.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h2>Assign Timetable</h2>

            {selectedTimetable && (
                <form onSubmit={handleAssign} className="mb-4 p-3 bg-light rounded">
                    <h4>Assign Selected Timetable</h4>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <select
                                className="form-control"
                                value={selectedTimetable.classId}
                                onChange={(e) => setSelectedTimetable({ ...selectedTimetable, classId: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.className} - {cls.section}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-control"
                                value={selectedTimetable.subjectId}
                                onChange={(e) => setSelectedTimetable({ ...selectedTimetable, subjectId: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-control"
                                value={selectedTimetable.teacherId}
                                onChange={(e) => setSelectedTimetable({ ...selectedTimetable, teacherId: e.target.value })}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100">Assign</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Class</th>
                            <th>Day</th>
                            <th>Time Slot</th>
                            <th>Subject</th>
                            <th>Teacher</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((timetable) => (
                            <tr key={timetable.id}>
                                <td>{getClassName(timetable.classId)}</td>
                                <td>{timetable.day}</td>
                                <td>{timetable.timeSlot}</td>
                                <td>{getSubjectName(timetable.subjectId)}</td>
                                <td>{getTeacherName(timetable.teacherId)}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleSelectTimetable(timetable)}
                                    >
                                        Select
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    No timetable entries found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {timetables.length > itemsPerPage && (
                    <nav>
                        <ul className="pagination justify-content-center">
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
        </div>
    );
};

export default AdminAssignTimetable;