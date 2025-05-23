import React from 'react';
import '../../components/DasboardCardsCss/ChartCard.css'; // Adjust the path as necessary

const ChartCard = ({ title, value, percentage, isPositive, statusBreakdown, avgHoursPerTeacher, additionalDetails, icon, chartType }) => {
    const IconComponent = icon;
    const percentageValue = percentage ? parseFloat(percentage.replace('%', '')) : 0;

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title-wrapper">
                    <h6 className="chart-title">{title}</h6>
                    {IconComponent && <IconComponent className="chart-icon" />}
                </div>
                <div className="chart-stats">
                    <span className="chart-value">{value}</span>
                    {percentage && (
                        <span className={`chart-percentage ${isPositive ? 'positive' : 'negative'}`}>
                            {percentage}
                        </span>
                    )}
                </div>
            </div>
            <div className="chart-body">
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${percentageValue}%` }}
                    ></div>
                </div>
            </div>
            <div className="chart-details">
                {avgHoursPerTeacher && (
                    <p className="chart-detail">Avg Hours/Teacher: {avgHoursPerTeacher} hrs</p>
                )}
                {statusBreakdown && Object.keys(statusBreakdown).length > 0 && (
                    <div className="status-breakdown">
                        <h6>Status Breakdown:</h6>
                        <ul>
                            {Object.entries(statusBreakdown).map(([status, count]) => (
                                <li key={status}>{status}: {count}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {additionalDetails && (
                    <div className="additional-details">
                        {additionalDetails.totalFees && (
                            <p className="chart-detail">Total Fees: {additionalDetails.totalFees}</p>
                        )}
                        {additionalDetails.totalPending && (
                            <p className="chart-detail">Total Pending: {additionalDetails.totalPending}</p>
                        )}
                        {additionalDetails.overdue && (
                            <p className="chart-detail overdue-highlight">Overdue: {additionalDetails.overdue}</p>
                        )}
                        {additionalDetails.totalBooks && (
                            <p className="chart-detail">Total Titles: {additionalDetails.totalBooks}</p>
                        )}
                        {additionalDetails.totalQuantity && (
                            <p className="chart-detail">Total Copies: {additionalDetails.totalQuantity}</p>
                        )}
                        {additionalDetails.pendingRequests && (
                            <p className="chart-detail">Pending Requests: {additionalDetails.pendingRequests}</p>
                        )}
                        {additionalDetails.overdueBooks && (
                            <p className="chart-detail overdue-highlight">Overdue Books: {additionalDetails.overdueBooks}</p>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartCard;