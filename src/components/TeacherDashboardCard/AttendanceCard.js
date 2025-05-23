// src/components/TeacherDashboardCard/AttendanceCard.js
import React from "react";
import useTeacherAssignments from '../hooks/useTeacherAssignments';
import "./../TeacherDashboardCardCss/AttendanceCard.css";

const AttendanceCard = () => {
    const { assignments, getClassDetails, getSubjectNames, loading } = useTeacherAssignments();

    if (loading) {
        return (
            <div className="card">
                <h3>Assigned Classes & Subjects</h3>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Assigned Classes & Subjects</h3>
            {assignments.length > 0 ? (
                assignments.map((assignment) => (
                    <div key={assignment.id} className="assignment-item">
                        <p>
                            <strong>Class:</strong> {getClassDetails(assignment.classId).name} - {getClassDetails(assignment.classId).section}
                        </p>
                        <p>
                            <strong>Subjects:</strong> {getSubjectNames(assignment.subjectIds)}
                        </p>
                    </div>
                ))
            ) : (
                <p>No assignments found</p>
            )}
        </div>
    );
};

export default AttendanceCard;