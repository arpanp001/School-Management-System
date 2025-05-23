import React from 'react';
import '../DasboardCardsCss/TeacherAttendanceCard.css'; // Adjust the path as necessary

const TeacherAttendanceCard = ({ title, present, absent, onLeave, halfDay, overtime, earlyExit }) => {
    return (
        <div className="teacher-attendance-card">
            <h6 className="attendance-title">{title}</h6>
            <div className="attendance-stats">
                <div className="stat-item">
                    <span className="stat-label">Present</span>
                    <span className="stat-value present">{present}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Absent</span>
                    <span className="stat-value absent">{absent}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">On Leave</span>
                    <span className="stat-value on-leave">{onLeave}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Half-Day</span>
                    <span className="stat-value half-day">{halfDay}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Overtime</span>
                    <span className="stat-value overtime">{overtime}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Early Exit</span>
                    <span className="stat-value early-exit">{earlyExit}</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendanceCard;