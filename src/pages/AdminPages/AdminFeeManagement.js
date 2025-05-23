import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faHourglassHalf, faExclamationTriangle, faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import emailjs from '@emailjs/browser';
import '../../pages/AdminPagesStyle/AdminFeeManagement.css';

const AdminFeeManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeCategories, setFeeCategories] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [statusFilter, setStatusFilter] = useState("All");

    const defaultCategory = { name: "", totalFees: 0, paidAmount: 0, pendingAmount: 0, fine: 0, status: "Pending" };
    const FINE_RATE = 0.05;

    const EMAILJS_SERVICE_ID = "service_l0fenxj";
    const EMAILJS_TEMPLATE_ID = "template_tdsymj8";
    const EMAILJS_PUBLIC_KEY = "sss-GrBLqM_2bdune";

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const studentsSnapshot = await getDocs(collection(db, "studentLog"));
                const studentsData = await Promise.all(
                    studentsSnapshot.docs.map(async (studentDoc) => {
                        const studentData = studentDoc.data();
                        const feeDoc = await getDocs(collection(db, "studentLog", studentDoc.id, "fees"));
                        let feeData = feeDoc.docs[0]?.data()?.categories || [defaultCategory];
                        feeData = feeData.map(category => {
                            if (category.status === "Overdue" && category.pendingAmount > 0) {
                                const fine = (category.totalFees - category.paidAmount) * FINE_RATE;
                                return { ...category, fine: fine || 0, pendingAmount: (category.totalFees - category.paidAmount) + (fine || 0) };
                            }
                            return { ...category, fine: category.fine || 0 };
                        });
                        return {
                            id: studentDoc.id,
                            ...studentData,
                            fees: feeData,
                        };
                    })
                );
                setStudents(studentsData);
            } catch (error) {
                toast.error("Error fetching students: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const fetchPaymentHistory = async (studentId) => {
        try {
            const historySnapshot = await getDocs(collection(db, "studentLog", studentId, "paymentHistory"));
            const historyData = historySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPaymentHistory(historyData);
        } catch (error) {
            toast.error("Error fetching payment history: " + error.message);
            setPaymentHistory([]);
        }
    };

    const sendEmailNotification = (studentEmail, newCategories) => {
        const pendingOrOverdueCategories = newCategories.filter(
            (cat) => cat.status === "Pending" || cat.status === "Overdue"
        );

        if (pendingOrOverdueCategories.length === 0) return;

        const templateParams = {
            to_email: studentEmail,
            student_email: studentEmail,
            fee_details: pendingOrOverdueCategories
                .map((cat) => `${cat.name}: $${cat.pendingAmount.toLocaleString()} (${cat.status}, Fine: $${(cat.fine || 0).toLocaleString()})`)
                .join("\n"),
            total_pending: pendingOrOverdueCategories
                .reduce((sum, cat) => sum + cat.pendingAmount, 0)
                .toLocaleString(),
        };

        emailjs
            .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
            .then(() => {
                toast.success(`Email notification sent to ${studentEmail}`);
            })
            .catch((error) => {
                toast.error("Failed to send email notification: " + error.text);
            });
    };

    const handleFeeUpdate = async (studentId) => {
        try {
            const studentRef = doc(db, "studentLog", studentId, "fees", "current");
            const student = students.find((s) => s.id === studentId);
            const existingCategories = student.fees || [];

            // Identify new categories
            const newCategories = feeCategories.filter(
                (newCat) => !existingCategories.some((oldCat) => oldCat.name === newCat.name)
            );

            // Create notifications for new categories
            if (newCategories.length > 0) {
                const notifRef = collection(db, "studentLog", studentId, "notifications");
                for (const category of newCategories) {
                    await addDoc(notifRef, {
                        message: `New fee category "${category.name}" added with $${category.totalFees.toLocaleString()} total fees.`,
                        type: "fee_added",
                        createdAt: Timestamp.now(),
                        read: false,
                        relatedId: category.name,
                    });
                }
            }

            // Update fee details
            await setDoc(studentRef, {
                categories: feeCategories,
                lastUpdated: new Date().toISOString(),
            });

            const updatedStudents = students.map((student) =>
                student.id === studentId ? { ...student, fees: feeCategories } : student
            );
            setStudents(updatedStudents);

            if (student && student.email) {
                sendEmailNotification(student.email, feeCategories);
            }

            toast.success("Fee details updated successfully!");
            setSelectedStudent(null);
            setFeeCategories([]);
        } catch (error) {
            toast.error("Error updating fees: " + error.message);
        }
    };

    const calculatePending = (total, paid, fine = 0) => {
        const pending = total - paid + fine;
        return pending >= 0 ? pending : 0;
    };

    const handleCategoryChange = (index, field, value) => {
        setFeeCategories((prev) => {
            const updatedCategories = [...prev];
            updatedCategories[index] = {
                ...updatedCategories[index],
                [field]: field === "name" ? value : parseFloat(value) || 0,
            };
            if (field === "totalFees" || field === "paidAmount") {
                const fine = updatedCategories[index].status === "Overdue" ?
                    (updatedCategories[index].totalFees - updatedCategories[index].paidAmount) * FINE_RATE :
                    updatedCategories[index].fine || 0;
                updatedCategories[index].fine = fine;
                updatedCategories[index].pendingAmount = calculatePending(
                    updatedCategories[index].totalFees,
                    updatedCategories[index].paidAmount,
                    fine
                );
                updatedCategories[index].status = updatedCategories[index].pendingAmount === 0 ? "Paid" : updatedCategories[index].status || "Pending";
            }
            return updatedCategories;
        });
    };

    const handleStatusChange = (index, value) => {
        setFeeCategories((prev) => {
            const updatedCategories = [...prev];
            updatedCategories[index].status = value;
            if (value === "Overdue" && updatedCategories[index].pendingAmount > 0) {
                updatedCategories[index].fine = (updatedCategories[index].totalFees - updatedCategories[index].paidAmount) * FINE_RATE;
                updatedCategories[index].pendingAmount = calculatePending(
                    updatedCategories[index].totalFees,
                    updatedCategories[index].paidAmount,
                    updatedCategories[index].fine
                );
            } else if (value !== "Overdue") {
                updatedCategories[index].fine = 0;
                updatedCategories[index].pendingAmount = calculatePending(
                    updatedCategories[index].totalFees,
                    updatedCategories[index].paidAmount
                );
            }
            return updatedCategories;
        });
    };

    const addCategory = () => {
        setFeeCategories((prev) => [...prev, { ...defaultCategory }]);
    };

    const removeCategory = (index) => {
        setFeeCategories((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = [...students].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue, bValue;
        switch (sortConfig.key) {
            case 'email':
                aValue = a.email.toLowerCase();
                bValue = b.email.toLowerCase();
                break;
            case 'totalFees':
                aValue = a.fees.reduce((sum, cat) => sum + cat.totalFees, 0);
                bValue = b.fees.reduce((sum, cat) => sum + cat.totalFees, 0);
                break;
            case 'paidAmount':
                aValue = a.fees.reduce((sum, cat) => sum + cat.paidAmount, 0);
                bValue = b.fees.reduce((sum, cat) => sum + cat.paidAmount, 0);
                break;
            case 'pendingAmount':
                aValue = a.fees.reduce((sum, cat) => sum + cat.pendingAmount, 0);
                bValue = b.fees.reduce((sum, cat) => sum + cat.pendingAmount, 0);
                break;
            case 'fines':
                aValue = a.fees.reduce((sum, cat) => sum + (cat.fine || 0), 0);
                bValue = b.fees.reduce((sum, cat) => sum + (cat.fine || 0), 0);
                break;
            case 'status':
                aValue = a.fees.every(cat => cat.status === "Paid") ? "Paid" : a.fees.some(cat => cat.status === "Overdue") ? "Overdue" : "Pending";
                bValue = b.fees.every(cat => cat.status === "Paid") ? "Paid" : b.fees.some(cat => cat.status === "Overdue") ? "Overdue" : "Pending";
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredStudents = sortedStudents.filter((student) => {
        const matchesSearch = student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const overallStatus = student.fees.every(cat => cat.status === "Paid")
            ? "Paid"
            : student.fees.some(cat => cat.status === "Overdue")
                ? "Overdue"
                : "Pending";
        const matchesStatus = statusFilter === "All" || overallStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleEdit = (student) => {
        setSelectedStudent(student.id);
        setFeeCategories(student.fees);
    };

    const toggleHistory = (studentId) => {
        if (showHistory === studentId) {
            setShowHistory(null);
        } else {
            setShowHistory(studentId);
            fetchPaymentHistory(studentId);
        }
    };

    const calculateAnalytics = () => {
        const totalCollected = students.reduce((sum, student) =>
            sum + student.fees.reduce((catSum, cat) => catSum + cat.paidAmount, 0), 0);
        const totalPending = students.reduce((sum, student) =>
            sum + student.fees.reduce((catSum, cat) => catSum + cat.pendingAmount, 0), 0);
        const totalFines = students.reduce((sum, student) =>
            sum + student.fees.reduce((catSum, cat) => catSum + (cat.fine || 0), 0), 0);
        const overdueStudents = students.filter(student =>
            student.fees.some(cat => cat.status === "Overdue")).length;
        const totalOverdue = students.reduce((sum, student) =>
            sum + student.fees.reduce((catSum, cat) =>
                cat.status === "Overdue" ? catSum + cat.pendingAmount : catSum, 0), 0);

        return {
            totalCollected,
            totalPending,
            totalFines,
            overdueStudents,
            totalOverdue,
        };
    };

    const analytics = calculateAnalytics();

    if (loading) {
        return <div className="loading">Loading fee management data...</div>;
    }

    return (
        <div className="admin-fee-management">
            <h2 className="page-title">Fees Management</h2>

            <div className="analytics-dashboard">
                <div className="analytics-card">
                    <h3><FontAwesomeIcon icon={faDollarSign} /> Total Fees Collected</h3>
                    <p className="amount paid">${analytics.totalCollected.toLocaleString()}</p>
                </div>
                <div className="analytics-card">
                    <h3><FontAwesomeIcon icon={faHourglassHalf} /> Total Pending Amount</h3>
                    <p className="amount pending">${analytics.totalPending.toLocaleString()}</p>
                </div>
                <div className="analytics-card">
                    <h3><FontAwesomeIcon icon={faExclamationTriangle} /> Overdue Statistics</h3>
                    <p>{analytics.overdueStudents} Students</p>
                    <p className="amount overdue">${analytics.totalOverdue.toLocaleString()}</p>
                    <p>Fines: ${analytics.totalFines.toLocaleString()}</p>
                </div>
            </div>

            <div className="controls-container">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search students by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                </div>
                <div className="filter-container">
                    <label>Filter by Status: </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="All">All</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="filter-icon" />
                </div>
            </div>

            <div className="fee-table-container">
                <table className="fee-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('email')} className="sortable">
                                Email {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('totalFees')} className="sortable">
                                Total Fees {sortConfig.key === 'totalFees' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('paidAmount')} className="sortable">
                                Paid Amount {sortConfig.key === 'paidAmount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('pendingAmount')} className="sortable">
                                Pending Amount {sortConfig.key === 'pendingAmount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('fines')} className="sortable">
                                Fines {sortConfig.key === 'fines' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('status')} className="sortable">
                                Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student) => {
                            const totalFees = student.fees.reduce((sum, cat) => sum + cat.totalFees, 0);
                            const paidAmount = student.fees.reduce((sum, cat) => sum + cat.paidAmount, 0);
                            const pendingAmount = student.fees.reduce((sum, cat) => sum + cat.pendingAmount, 0);
                            const totalFines = student.fees.reduce((sum, cat) => sum + (cat.fine || 0), 0);
                            const overallStatus = student.fees.every(cat => cat.status === "Paid")
                                ? "Paid"
                                : student.fees.some(cat => cat.status === "Overdue")
                                    ? "Overdue"
                                    : "Pending";

                            return (
                                <React.Fragment key={student.id}>
                                    <tr onClick={() => toggleHistory(student.id)} className="clickable-row">
                                        <td>{student.email}</td>
                                        <td>${totalFees.toLocaleString()}</td>
                                        <td>${paidAmount.toLocaleString()}</td>
                                        <td>${pendingAmount.toLocaleString()}</td>
                                        <td>${totalFines.toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${overallStatus.toLowerCase()}`}>
                                                {overallStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="edit-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(student);
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                    {showHistory === student.id && (
                                        <tr className="history-row">
                                            <td colSpan="7">
                                                <div className="payment-history">
                                                    <h4>Payment History</h4>
                                                    {paymentHistory.length > 0 ? (
                                                        <table className="history-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Amount</th>
                                                                    <th>Method</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {paymentHistory.map((payment) => (
                                                                    <tr key={payment.id}>
                                                                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                                                                        <td>${payment.amount.toLocaleString()}</td>
                                                                        <td>{payment.method}</td>
                                                                        <td>{payment.status}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p>No payment history available.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedStudent && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="fee-update-form" onClick={(e) => e.stopPropagation()}>
                        <h3>Update Fee Details</h3>
                        {feeCategories.map((category, index) => (
                            <div key={index} className="category-section">
                                <div className="form-group">
                                    <label>Category Name:</label>
                                    <input
                                        type="text"
                                        value={category.name}
                                        onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                                        placeholder="e.g., Tuition"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total Fees:</label>
                                    <input
                                        type="number"
                                        value={category.totalFees}
                                        onChange={(e) => handleCategoryChange(index, "totalFees", e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Paid Amount:</label>
                                    <input
                                        type="number"
                                        value={category.paidAmount}
                                        onChange={(e) => handleCategoryChange(index, "paidAmount", e.target.value)}
                                        min="0"
                                        max={category.totalFees}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pending Amount:</label>
                                    <input type="number" value={category.pendingAmount} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Fine:</label>
                                    <input type="number" value={category.fine} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Status:</label>
                                    <select
                                        value={category.status}
                                        onChange={(e) => handleStatusChange(index, e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() => removeCategory(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button className="add-btn" onClick={addCategory}>
                            Add Category
                        </button>
                        <div className="form-actions">
                            <button className="save-btn" onClick={() => handleFeeUpdate(selectedStudent)}>
                                Save Changes
                            </button>
                            <button className="cancel-btn" onClick={() => setSelectedStudent(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeeManagement;