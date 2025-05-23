// src/components/TeacherDashboardCard/GradesCard.js
import React from "react";
import useTeacherGrades from '../hooks/useTeacherGrades';
import "./../TeacherDashboardCardCss/GradesCard.css";

const GradesCard = () => {
    const {
        classes,
        subjects,
        averageGrades,
        selectedClass,
        setSelectedClass,
        selectedSubject,
        setSelectedSubject,
        loading,
    } = useTeacherGrades();

    if (loading) {
        return (
            <div className="card">
                <h3>Average Grades</h3>
                <p>Loading...</p>
            </div>
        );
    }

    const handleClassChange = (e) => {
        setSelectedClass(e.target.value);
        setSelectedSubject(''); // Reset subject when class changes
    };

    const handleSubjectChange = (e) => {
        setSelectedSubject(e.target.value);
    };
    // eslint-disable-next-line
    const getClassName = (classId) =>
        classes.find(c => c.id === classId)?.className || 'All Classes';
    const getSubjectName = (subjectId) =>
        subjects.find(s => s.id === subjectId)?.subjectName || 'All Subjects';

    const displayAverages = () => {
        const relevantAverages = selectedClass
            ? averageGrades[selectedClass] || {}
            : Object.keys(averageGrades).reduce((acc, classId) => ({
                ...acc,
                ...averageGrades[classId],
            }), {});

        const filteredAverages = selectedSubject
            ? { [selectedSubject]: relevantAverages[selectedSubject] }
            : relevantAverages;

        return Object.entries(filteredAverages).map(([subjectId, avg]) => (
            <p key={subjectId}>
                {getSubjectName(subjectId)}: {avg}%
            </p>
        ));
    };

    return (
        <div className="card">
            <h3>Average Grades</h3>
            <div className="dropdowns">
                <select value={selectedClass} onChange={handleClassChange} className="form-control mb-2">
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
                <select value={selectedSubject} onChange={handleSubjectChange} className="form-control" disabled={!selectedClass}>
                    <option value="">All Subjects</option>
                    {subjects
                        .filter(sub => !selectedClass || Object.keys(averageGrades[selectedClass] || {}).includes(sub.id))
                        .map(sub => (
                            <option key={sub.id} value={sub.id}>
                                {sub.subjectName}
                            </option>
                        ))}
                </select>
            </div>
            {displayAverages().length > 0 ? (
                displayAverages()
            ) : (
                <p>No grades available</p>
            )}
        </div>
    );
};

export default GradesCard;