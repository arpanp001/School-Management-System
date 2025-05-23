import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import '../StudentDashboardCardsCss/StudentTransactionsCard.css';

const StudentTransactionsCard = () => {
    const [transactions, setTransactions] = useState([]);
    const [pendingFees, setPendingFees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    const getIcon = (method, category, isPending = false) => {
        if (isPending) {
            const categoryIcons = {
                Tuition: '🎓',
                Library: '📚',
                Transport: '🚌',
                Cafeteria: '🍽️',
                Miscellaneous: '💰',
            };
            return categoryIcons[category] || '💵';
        }
        const methodIcons = {
            Card: '💳',
            'Bank Transfer': '🏦',
            UPI: '📱',
            PayPal: '💸',
        };
        const categoryIcons = {
            Tuition: '🎓',
            Library: '📚',
            Transport: '🚌',
            Cafeteria: '🍽️',
            Miscellaneous: '💰',
        };
        return methodIcons[method] || categoryIcons[category] || '💵';
    };

    const getTransactionType = (method) => {
        const methodTypes = {
            Card: 'card',
            'Bank Transfer': 'bank',
            UPI: 'upi',
            PayPal: 'paypal',
        };
        return methodTypes[method] || 'transfer';
    };

    const getDueDateStatus = (dueDate) => {
        if (!dueDate) return 'normal';
        const today = new Date();
        const due = new Date(dueDate);
        return due < today ? 'overdue' : 'normal';
    };

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) {
                toast.error('Please log in to view transactions and fees');
                setLoading(false);
                return;
            }

            try {
                // Fetch payment history
                const historySnapshot = await getDocs(collection(db, 'studentLog', user.uid, 'paymentHistory'));
                const historyData = historySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const formattedTransactions = historyData
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(payment => ({
                        type: getTransactionType(payment.method),
                        name: payment.category || 'Miscellaneous',
                        details: `${payment.method} Payment`,
                        amount: payment.amount * (payment.status === 'Completed' ? -1 : 1),
                        icon: getIcon(payment.method, payment.category),
                        status: payment.status || 'Unknown',
                    }));

                // Fetch fees
                const feeDocRef = doc(db, 'studentLog', user.uid, 'fees', 'current');
                const feeDoc = await getDoc(feeDocRef);
                let pendingFeeData = [];
                let categoryList = [];
                if (feeDoc.exists()) {
                    const categories = feeDoc.data().categories || [];
                    pendingFeeData = categories
                        .filter(cat => cat.pendingAmount > 0)
                        .map(cat => ({
                            type: 'pending',
                            name: cat.name || 'Miscellaneous',
                            details: `Pending${cat.fine > 0 ? ` (Fine: $${cat.fine})` : ''}`,
                            amount: cat.pendingAmount,
                            icon: getIcon(null, cat.name, true),
                            dueDate: cat.dueDate,
                        }));
                    categoryList = categories.map(cat => cat.name || 'Miscellaneous');
                }

                setTransactions(formattedTransactions);
                setPendingFees(pendingFeeData);
                setCategories([...new Set(categoryList)]);
            } catch (error) {
                toast.error('Error fetching data: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredTransactions = selectedCategory === 'all'
        ? transactions
        : transactions.filter(t => t.name === selectedCategory);

    const filteredPendingFees = selectedCategory === 'all'
        ? pendingFees
        : pendingFees.filter(f => f.name === selectedCategory);

    const totalPending = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = transactions
        .filter(t => t.status === 'Completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return (
        <div className="student-transactions-card" role="region" aria-label="Transaction and fee overview">
            <div className="transactions-card-header">
                <h3 className="transactions-card-title">Fees & Transactions</h3>
                {/* <button className="more-button" aria-label="More options">
                    <FaEllipsisH />
                </button> */}
            </div>

            <div className="summary-metrics">
                <div className="metric">
                    <span className="metric-label">Total Pending</span>
                    <span className="metric-value pending">${totalPending.toLocaleString()}</span>
                </div>
                <div className="metric">
                    <span className="metric-label">Total Paid</span>
                    <span className="metric-value paid">${totalPaid.toLocaleString()}</span>
                </div>
            </div>

            <div className="category-filter">
                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    aria-label="Filter by fee category"
                    className="category-filter-select"
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-spinner" aria-live="polite" aria-busy="true">
                    Loading fees and transactions...
                </div>
            ) : (
                <>
                    <div className="section-header">
                        <h4>Pending Fees</h4>
                    </div>
                    {filteredPendingFees.length === 0 ? (
                        <p className="no-pending">No pending fees</p>
                    ) : (
                        <div
                            className="scrollable-list pending-list"
                            tabIndex="0"
                            aria-label="Scrollable pending fees list"
                        >
                            {filteredPendingFees.map((fee, index) => (
                                <div key={`pending-${index}`} className="pending-item">
                                    <div className="pending-icon">
                                        <span>{fee.icon}</span>
                                    </div>
                                    <div className="pending-info">
                                        <h4 className="pending-name">{fee.name}</h4>
                                        <p className="pending-details">
                                            {fee.details}
                                            {fee.dueDate && (
                                                <span className={`due-date ${getDueDateStatus(fee.dueDate)}`}>
                                                    {' '}Due: {new Date(fee.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="pending-amount-container">
                                        <span className="pending-amount">${fee.amount}</span>
                                        <Link
                                            to={`/student/fee-management?category=${encodeURIComponent(fee.name)}`}
                                            className="pay-now-btn"
                                            aria-label={`Pay now for ${fee.name}`}
                                        >
                                            Pay Now
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="section-header">
                        <h4>Recent Transactions</h4>
                    </div>
                    {filteredTransactions.length === 0 ? (
                        <p className="no-transactions">No transactions available</p>
                    ) : (
                        <div
                            className="scrollable-list transactions-list"
                            tabIndex="0"
                            aria-label="Scrollable transactions list"
                        >
                            {filteredTransactions.map((transaction, index) => (
                                <div key={`transaction-${index}`} className="transaction-item">
                                    <div className="transaction-icon">
                                        <span>{transaction.icon}</span>
                                    </div>
                                    <div className="transaction-info">
                                        <h4 className="transaction-name">{transaction.name}</h4>
                                        <p className="transaction-details">
                                            {transaction.details}
                                            <span
                                                className={`status-badge ${transaction.status.toLowerCase()}`}
                                                aria-label={`Transaction status: ${transaction.status}`}
                                            >
                                                {transaction.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                                        {transaction.amount >= 0 ? '+ ' : '- '}
                                        ${Math.abs(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            <div className="view-all">
                <Link to="/student/fee-management" className="view-all-link" aria-label="View all fees and transactions">
                    View All
                </Link>
            </div>
        </div>
    );
};

export default StudentTransactionsCard;