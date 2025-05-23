import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../StudentDashboardCardsCss/StudentStatsCard.css';

const StudentStatsCard = ({ profilePicture, name, className, rollNumber, studentId }) => {
    const navigate = useNavigate();

    const handleEditProfile = () => {
        navigate('/student/profile'); // Adjust the route to match your edit profile page
    };

    return (
        <div className="student-stats-card">
            <div className="stats-card-content">
                <div className="stats-card-info">
                    {profilePicture && (
                        <div className="profile-pic-container">
                            <img src={profilePicture} alt="Student Profile" className="profile-pic" />
                        </div>
                    )}
                    <div className="student-details">
                        <h3 className="stats-card-title">{name}</h3>
                        <p><strong>Class:</strong> {className}</p>
                        <p><strong>Roll No:</strong> {rollNumber}</p>
                        <p><strong>ID:</strong> #{studentId}</p>
                    </div>
                </div>
                <button className="edit-profile-button-card" onClick={handleEditProfile}>
                    <span className='edit-button-card'>Edit Profile</span>
                </button>
            </div>
        </div>
    );
};

export default StudentStatsCard;