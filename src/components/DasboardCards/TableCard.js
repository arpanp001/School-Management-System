import React, { useState } from 'react';
import { FaTable } from 'react-icons/fa';
import '../../components/DasboardCardsCss/TableCard.css';

// Subcomponent for the header (title and icon)
const TableHeader = ({ title }) => (
    <div className="table-header">
        <h6 className="table-title">{title}</h6>
        <FaTable className="table-icon" />
    </div>
);

// Subcomponent for the class selector
const ClassSelector = ({ classes, selectedClass, setSelectedClass, loading }) => (
    <div className="class-selector mb-3">
        <label htmlFor="classSelect" className="form-label">
            Select Class:
        </label>
        <select
            id="classSelect"
            className="form-control"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loading}
        >
            <option value="">All Classes</option>
            {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                    {cls.className} - {cls.section}
                </option>
            ))}
        </select>
    </div>
);

// Subcomponent for the table
const TopStudentsTable = ({ topStudents, loading }) => (
    <div className="table-container">
        <table className="table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Average Marks</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="4" className="text-center" data-label="Status">
                            <div className="loading-spinner">Loading...</div>
                        </td>
                    </tr>
                ) : topStudents.length > 0 ? (
                    topStudents.map((student, index) => (
                        <tr key={index} className="table-row">
                            <td data-label="Rank">
                                <span className={`rank-badge rank-${student.rank}`}>
                                    {student.rank}
                                </span>
                            </td>
                            <td data-label="Student Name">{student.studentName}</td>
                            <td data-label="Class">{student.className}</td>
                            <td data-label="Average Marks">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill positive-fill"
                                        style={{ width: student.averageMarks }}
                                    ></div>
                                </div>
                                <span className="marks-text">{student.averageMarks}</span>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="text-center" data-label="Status">
                            No grades available
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

// Main TableCard component
const TableCard = ({ title, classes, grades, students, loading }) => {
    const [selectedClass, setSelectedClass] = useState('');

    // Compute top students for the selected class
    const getTopStudents = () => {
        const filteredGrades = selectedClass
            ? grades.filter((grade) => grade.classId === selectedClass)
            : grades;

        // Aggregate grades by student
        const studentGrades = filteredGrades.reduce((acc, grade) => {
            const studentId = grade.studentId;
            if (!acc[studentId]) {
                acc[studentId] = {
                    studentId,
                    classId: grade.classId,
                    marks: [],
                };
            }
            acc[studentId].marks.push(grade.marks);
            return acc;
        }, {});

        // Calculate average marks and prepare table data
        const topStudents = Object.values(studentGrades)
            .map((student) => {
                const studentData = students.find((s) => s.id === student.studentId);
                const averageMarks = student.marks.length > 0
                    ? (student.marks.reduce((sum, mark) => sum + mark, 0) / student.marks.length).toFixed(2)
                    : 0;
                return {
                    studentId: student.studentId,
                    studentName: studentData ? studentData.email : 'Unknown',
                    classId: student.classId,
                    averageMarks,
                };
            })
            .sort((a, b) => b.averageMarks - a.averageMarks)
            .slice(0, 3)
            .map((student, index) => ({
                rank: index + 1,
                studentName: student.studentName,
                className: classes.find((c) => c.id === student.classId)?.className || 'N/A',
                averageMarks: `${student.averageMarks}%`,
            }));

        return topStudents;
    };

    const topStudents = getTopStudents();

    return (
        <div className="table-card">
            <div className="table-card-wrapper">
                <TableHeader title={title} />
                <ClassSelector
                    classes={classes}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    loading={loading}
                />
                <TopStudentsTable topStudents={topStudents} loading={loading} />
            </div>
        </div>
    );
};

export default TableCard;