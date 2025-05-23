import React from 'react';
import { motion } from 'framer-motion';
import '../../components/DasboardCardsCss/FeeCollectionCard.css'; // Adjust the path as necessary

const FeeCollectionCard = ({ title, total, paid: todayCollected, pending }) => {
    // Calculate progress (capped at 100%)
    const rawProgress = pending > 0 ? (todayCollected / pending) * 100 : 0;
    const progress = Math.min(rawProgress, 100); // Cap at 100%
    const isOverflow = rawProgress > 100; // Check for overflow
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Dynamic color based on progress
    const progressColor = progress < 25 ? '#dc3545' : progress < 75 ? '#ffc107' : '#28a745';

    return (
        <div className="fee-collection-card">
            <h6 className="fee-title">{title}</h6>
            <div className="fee-stats">
                <div className="stat-item">
                    <span className="stat-label">Total Fees</span>
                    <span className="stat-value">${total.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Collected Today</span>
                    <span className="stat-value paid">${todayCollected.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Pending</span>
                    <span className="stat-value pending">${pending.toLocaleString()}</span>
                </div>
            </div>
            <div className="progress-circle-container" data-tooltip="Collected Today vs. Pending Fees">
                <svg className="progress-circle" width="50" height="50">
                    <circle
                        className="progress-circle-bg"
                        cx="25"
                        cy="25"
                        r={radius}
                        strokeWidth="5"
                    />
                    <motion.circle
                        className="progress-circle-fill"
                        cx="25"
                        cy="25"
                        r={radius}
                        strokeWidth="5"
                        stroke={progressColor}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <span className="progress-text">
                    {Math.round(progress)}%
                    {isOverflow && <span className="overflow-badge">!</span>}
                </span>
                <span className="progress-label">Today vs. Pending</span>
            </div>
        </div>
    );
};

export default FeeCollectionCard;