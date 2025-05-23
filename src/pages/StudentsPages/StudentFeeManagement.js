import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import '../../pages/StudentPagesStyle/StudentFeeManagement.css';

// Luhn algorithm for credit card validation - unchanged
const luhnCheck = (cardNumber) => {
    const cleaned = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
};

const StudentFeeManagement = () => {
    // State management - unchanged
    const [feeCategories, setFeeCategories] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({
        method: "Card",
        cardNumber: "",
        expiry: "",
        cvv: "",
        bankAccount: "",
        upiId: "",
        paypalEmail: "",
        amount: "",
        category: "",
    });

    // Data fetching effect - unchanged logic, improved error handling
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) throw new Error("User not authenticated");

                const feeDocRef = doc(db, "studentLog", user.uid, "fees", "current");
                const feeDoc = await getDoc(feeDocRef);
                if (feeDoc.exists()) {
                    const categories = feeDoc.data().categories || [];
                    setFeeCategories(categories.map(cat => ({
                        ...cat,
                        fine: cat.fine || 0, // Ensure fine field exists
                        pendingAmount: cat.pendingAmount || (cat.totalFees - cat.paidAmount + (cat.fine || 0))
                    })));
                } else {
                    toast.info("No fee data found. Please contact your administrator.");
                }

                const historySnapshot = await getDocs(collection(db, "studentLog", user.uid, "paymentHistory"));
                const historyData = historySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setPaymentHistory(historyData.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (error) {
                toast.error("Error fetching data: " + error.message);
                console.error("Fee data fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Payment input handling with formatting - unchanged
    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "cardNumber") {
            const cleaned = value.replace(/\D/g, '').slice(0, 16);
            formattedValue = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
        }
        if (name === "expiry") {
            const cleaned = value.replace(/\D/g, '').slice(0, 4);
            formattedValue = cleaned.length > 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
        }

        setPaymentDetails((prev) => ({
            ...prev,
            [name]: formattedValue,
        }));
    };

    // Real-time validation on blur - unchanged
    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (name === "cardNumber" && value) {
            if (!luhnCheck(value)) {
                toast.error("Invalid card number (fails Luhn check)");
            }
        }
        if (name === "expiry" && value) {
            if (!/^\d{2}\/\d{2}$/.test(value) || new Date(`20${value.split('/')[1]}-${value.split('/')[0]}-01`) < new Date()) {
                toast.error("Invalid or expired date (MM/YY)");
            }
        }
        if (name === "cvv" && value) {
            if (!/^\d{3,4}$/.test(value)) {
                toast.error("CVV must be 3 or 4 digits");
            }
        }
        if (name === "bankAccount" && value) {
            if (!/^\d{10,12}$/.test(value)) {
                toast.error("Bank account must be 10-12 digits");
            }
        }
        if (name === "upiId" && value) {
            if (!/^[a-zA-Z0-9]+@[a-zA-Z]+$/.test(value)) {
                toast.error("Invalid UPI ID (e.g., user@bank)");
            }
        }
        if (name === "paypalEmail" && value) {
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                toast.error("Invalid email format");
            }
        }
    };

    // Generate PDF receipt with enhanced styling - improved layout
    const generateReceipt = (payment) => {
        const doc = new jsPDF();
        const user = auth.currentUser;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const tableWidth = pageWidth - 2 * margin;

        // Enhanced Header
        doc.setFillColor(0, 73, 123); // Professional blue
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255); // White text
        doc.text("Payment Receipt", pageWidth / 2, 20, { align: "center" });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Receipt Details Table
        doc.setFontSize(12);
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);

        const startY = 40;
        const rowHeight = 10;
        const colWidths = [80, tableWidth - 80]; // Wider label column

        const selectedCategory = feeCategories.find(cat => cat.name === payment.category);
        const finePaid = Math.min(payment.amount, selectedCategory?.fine || 0);

        const details = [
            ["Student Email", user.email],
            ["Payment Date", new Date(payment.date).toLocaleString()],
            ["Amount", `$${payment.amount.toLocaleString()}`],
            ["Category", payment.category],
            ["Fine Paid", `$${finePaid.toLocaleString()}`],
            ["Payment Method", payment.method],
            ["Status", payment.status],
            ["Transaction ID", payment.id],
        ];

        // Draw table with alternating row background
        details.forEach((row, index) => {
            const y = startY + index * rowHeight;
            // Light gray background for even rows
            if (index % 2 === 0) {
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, y, tableWidth, rowHeight, 'F');
            }

            doc.rect(margin, y, colWidths[0], rowHeight); // Label cell
            doc.rect(margin + colWidths[0], y, colWidths[1], rowHeight); // Value cell
            doc.text(row[0], margin + 3, y + 7); // Label with padding
            doc.text(row[1], margin + colWidths[0] + 3, y + 7); // Value with padding
        });

        // Enhanced Footer
        const footerY = startY + details.length * rowHeight + 30;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, footerY - 15, tableWidth, 20, 'F');

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50); // Darker gray text
        doc.text("Thank you for your payment!", margin + tableWidth / 2, footerY, { align: "center" });
        doc.text("This is a system-generated receipt.", margin + tableWidth / 2, footerY + 10, { align: "center" });

        // Add institution logo placeholder
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(margin, footerY + 20, 30, 15, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("INSTITUTION", margin + 15, footerY + 28, { align: "center" });

        doc.save(`receipt_${payment.id}.pdf`);
    };

    // Simulate fee payment with enhanced validation - logic unchanged
    const handlePayment = async (e) => {
        e.preventDefault();

        const { method, cardNumber, expiry, cvv, bankAccount, upiId, paypalEmail, amount, category } = paymentDetails;
        if (!amount || !category) {
            toast.error("Please fill amount and category");
            return;
        }

        const selectedCategory = feeCategories.find(cat => cat.name === category);
        if (!selectedCategory) {
            toast.error("Please select a valid category");
            return;
        }

        if (parseFloat(amount) > selectedCategory.pendingAmount) {
            toast.error("Payment amount cannot exceed pending amount for this category");
            return;
        }

        if (method === "Card") {
            if (!cardNumber || !expiry || !cvv) {
                toast.error("Please fill all card details");
                return;
            }
            if (!luhnCheck(cardNumber)) {
                toast.error("Invalid card number (fails Luhn check)");
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(expiry) || new Date(`20${expiry.split('/')[1]}-${expiry.split('/')[0]}-01`) < new Date()) {
                toast.error("Invalid or expired date (MM/YY)");
                return;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
                toast.error("CVV must be 3 or 4 digits");
                return;
            }
        }
        if (method === "Bank Transfer") {
            if (!bankAccount) {
                toast.error("Please enter bank account number");
                return;
            }
            if (!/^\d{10,12}$/.test(bankAccount)) {
                toast.error("Bank account must be 10-12 digits");
                return;
            }
        }
        if (method === "UPI") {
            if (!upiId) {
                toast.error("Please enter UPI ID");
                return;
            }
            if (!/^[a-zA-Z0-9]+@[a-zA-Z]+$/.test(upiId)) {
                toast.error("Invalid UPI ID (e.g., user@bank)");
                return;
            }
        }
        if (method === "PayPal") {
            if (!paypalEmail) {
                toast.error("Please enter PayPal email");
                return;
            }
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(paypalEmail)) {
                toast.error("Invalid email format");
                return;
            }
        }

        try {
            setLoading(true);
            const user = auth.currentUser;
            const feeDocRef = doc(db, "studentLog", user.uid, "fees", "current");

            const updatedCategories = feeCategories.map(cat => {
                if (cat.name === category) {
                    const paymentAmount = parseFloat(amount);
                    const finePaid = Math.min(paymentAmount, cat.fine); // Pay fine first
                    const remainingAmount = paymentAmount - finePaid; // Remaining goes to original fee
                    const newPaidAmount = cat.paidAmount + remainingAmount;
                    const newPendingAmount = cat.totalFees - newPaidAmount;
                    const newFine = Math.max(0, cat.fine - finePaid);

                    return {
                        ...cat,
                        paidAmount: newPaidAmount,
                        pendingAmount: newPendingAmount + newFine, // Include remaining fine in pending
                        fine: newFine,
                        status: (newPendingAmount + newFine) <= 0 ? "Paid" : cat.status,
                    };
                }
                return cat;
            });

            await updateDoc(feeDocRef, {
                categories: updatedCategories,
                lastUpdated: new Date().toISOString(),
            });

            const paymentRef = await addDoc(collection(db, "studentLog", user.uid, "paymentHistory"), {
                amount: parseFloat(amount),
                date: new Date().toISOString(),
                status: "Completed",
                method: method,
                category: category,
            });

            const newPayment = {
                id: paymentRef.id,
                amount: parseFloat(amount),
                date: new Date().toISOString(),
                status: "Completed",
                method: method,
                category: category,
            };

            setPaymentHistory((prev) => [
                newPayment,
                ...prev,
            ].sort((a, b) => new Date(b.date) - new Date(a.date)));

            setFeeCategories(updatedCategories);
            setPaymentDetails({
                method: "Card",
                cardNumber: "",
                expiry: "",
                cvv: "",
                bankAccount: "",
                upiId: "",
                paypalEmail: "",
                amount: "",
                category: "",
            });
            setShowPaymentModal(false);
            toast.success(`Payment successful via ${method}! Thank you for your payment.`, { autoClose: 3000 });
            generateReceipt(newPayment); // Generate receipt immediately after payment
        } catch (error) {
            toast.error("Payment failed: " + error.message);
            console.error("Payment processing error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="sfm-loading-container">
                <div className="sfm-loading-spinner"></div>
                <p>Loading fee details...</p>
            </div>
        );
    }

    const totalFees = feeCategories.reduce((sum, cat) => sum + cat.totalFees, 0);
    const paidAmount = feeCategories.reduce((sum, cat) => sum + cat.paidAmount, 0);
    const pendingAmount = feeCategories.reduce((sum, cat) => sum + cat.pendingAmount, 0);
    const totalFines = feeCategories.reduce((sum, cat) => sum + (cat.fine || 0), 0);
    const overallStatus = pendingAmount > 0 ? "Pending" : "Paid";

    return (
        <div className="sfm-container">
            <header className="sfm-header">
                <h2 className="sfm-page-title">Fee Management</h2>
                <p className="sfm-subtitle">Manage and track your academic fees</p>
            </header>

            {/* Fee Overview Cards */}
            <section className="sfm-overview-section">
                <div className="sfm-card-grid">
                    <div className="sfm-card sfm-total-card">
                        <h3>Total Fees</h3>
                        <p className="sfm-amount">${totalFees.toLocaleString()}</p>
                    </div>
                    <div className="sfm-card sfm-paid-card">
                        <h3>Paid Amount</h3>
                        <p className="sfm-amount sfm-amount-paid">${paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="sfm-card sfm-pending-card">
                        <h3>Pending Amount</h3>
                        <p className="sfm-amount sfm-amount-pending">${pendingAmount.toLocaleString()}</p>
                    </div>
                    <div className="sfm-card sfm-fine-card">
                        <h3>Total Fines</h3>
                        <p className="sfm-amount sfm-amount-fine">${totalFines.toLocaleString()}</p>
                    </div>
                    <div className="sfm-card sfm-status-card">
                        <h3>Status</h3>
                        <span className={`sfm-status-badge sfm-status-${overallStatus.toLowerCase()}`}>
                            {overallStatus}
                        </span>
                    </div>
                </div>
            </section>

            {/* Fee Categories Section */}
            <section className="sfm-categories-section">
                <div className="sfm-section-header">
                    <h3>Fee Categories</h3>
                    <div className="sfm-section-line"></div>
                </div>
                <div className="sfm-table-container">
                    <table className="sfm-table sfm-categories-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Pending</th>
                                <th>Fine</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeCategories.map((cat, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'sfm-row-even' : 'sfm-row-odd'}>
                                    <td className="sfm-category-name">{cat.name || "Unnamed"}</td>
                                    <td>${cat.totalFees.toLocaleString()}</td>
                                    <td>${cat.paidAmount.toLocaleString()}</td>
                                    <td>${cat.pendingAmount.toLocaleString()}</td>
                                    <td>${(cat.fine || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`sfm-status-badge sfm-status-${cat.status.toLowerCase()}`}>
                                            {cat.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Payment History Section */}
            <section className="sfm-history-section">
                <div className="sfm-section-header">
                    <h3>Payment History</h3>
                    <div className="sfm-section-line"></div>
                </div>
                {paymentHistory.length > 0 ? (
                    <div className="sfm-table-container">
                        <table className="sfm-table sfm-history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map((payment, index) => (
                                    <tr key={payment.id} className={index % 2 === 0 ? 'sfm-row-even' : 'sfm-row-odd'}>
                                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                                        <td>${payment.amount.toLocaleString()}</td>
                                        <td>{payment.category}</td>
                                        <td>{payment.method}</td>
                                        <td>
                                            <span className={`sfm-status-badge sfm-status-${payment.status.toLowerCase()}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="sfm-download-btn"
                                                onClick={() => generateReceipt(payment)}
                                                title="Download receipt as PDF"
                                            >
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="sfm-empty-state">
                        <p>No payment history available.</p>
                        <small>Your payment records will appear here once you make a payment.</small>
                    </div>
                )}
            </section>

            {/* Payment Button */}
            {pendingAmount > 0 && (
                <div className="sfm-action-container">
                    <button
                        className="sfm-pay-btn"
                        onClick={() => setShowPaymentModal(true)}
                        disabled={loading}
                    >
                        Make Payment
                    </button>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="sfm-modal-overlay">
                    <div className="sfm-modal">
                        <div className="sfm-modal-header">
                            <h3>Make a Payment</h3>
                            <button
                                className="sfm-modal-close"
                                onClick={() => setShowPaymentModal(false)}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handlePayment} className="sfm-payment-form">
                            <div className="sfm-form-group">
                                <label htmlFor="sfm-category">Fee Category</label>
                                <select
                                    id="sfm-category"
                                    name="category"
                                    value={paymentDetails.category}
                                    onChange={handlePaymentChange}
                                    required
                                    className="sfm-form-control"
                                >
                                    <option value="">Select Category</option>
                                    {feeCategories.filter(cat => cat.pendingAmount > 0).map((cat, index) => (
                                        <option key={index} value={cat.name}>
                                            {cat.name} (${cat.pendingAmount.toLocaleString()} pending, Fine: ${(cat.fine || 0).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sfm-form-group">
                                <label htmlFor="sfm-payment-method">Payment Method</label>
                                <select
                                    id="sfm-payment-method"
                                    name="method"
                                    value={paymentDetails.method}
                                    onChange={handlePaymentChange}
                                    required
                                    className="sfm-form-control"
                                >
                                    <option value="Card">Credit/Debit Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="PayPal">PayPal</option>
                                </select>
                            </div>

                            {/* Conditional Fields with Validation */}
                            {paymentDetails.method === "Card" && (
                                <div className="sfm-payment-method-fields">
                                    <div className="sfm-form-group">
                                        <label htmlFor="sfm-card-number">Card Number</label>
                                        <input
                                            id="sfm-card-number"
                                            type="text"
                                            name="cardNumber"
                                            value={paymentDetails.cardNumber}
                                            onChange={handlePaymentChange}
                                            onBlur={handleBlur}
                                            placeholder="1234 5678 1234 5678"
                                            maxLength="19"
                                            required
                                            className="sfm-form-control"
                                        />
                                    </div>
                                    <div className="sfm-form-row">
                                        <div className="sfm-form-group">
                                            <label htmlFor="sfm-expiry">Expiry Date</label>
                                            <input
                                                id="sfm-expiry"
                                                type="text"
                                                name="expiry"
                                                value={paymentDetails.expiry}
                                                onChange={handlePaymentChange}
                                                onBlur={handleBlur}
                                                placeholder="MM/YY"
                                                maxLength="5"
                                                required
                                                className="sfm-form-control"
                                            />
                                        </div>
                                        <div className="sfm-form-group">
                                            <label htmlFor="sfm-cvv">CVV</label>
                                            <input
                                                id="sfm-cvv"
                                                type="text"
                                                name="cvv"
                                                value={paymentDetails.cvv}
                                                onChange={handlePaymentChange}
                                                onBlur={handleBlur}
                                                placeholder="123"
                                                maxLength="4"
                                                required
                                                className="sfm-form-control"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {paymentDetails.method === "Bank Transfer" && (
                                <div className="sfm-payment-method-fields">
                                    <div className="sfm-form-group">
                                        <label htmlFor="sfm-bank-account">Bank Account Number</label>
                                        <input
                                            id="sfm-bank-account"
                                            type="text"
                                            name="bankAccount"
                                            value={paymentDetails.bankAccount}
                                            onChange={handlePaymentChange}
                                            onBlur={handleBlur}
                                            placeholder="e.g., 123456789012"
                                            maxLength="12"
                                            required
                                            className="sfm-form-control"
                                        />
                                    </div>
                                </div>
                            )}
                            {paymentDetails.method === "UPI" && (
                                <div className="sfm-payment-method-fields">
                                    <div className="sfm-form-group">
                                        <label htmlFor="sfm-upi">UPI ID</label>
                                        <input
                                            id="sfm-upi"
                                            type="text"
                                            name="upiId"
                                            value={paymentDetails.upiId}
                                            onChange={handlePaymentChange}
                                            onBlur={handleBlur}
                                            placeholder="e.g., user@upi"
                                            required
                                            className="sfm-form-control"
                                        />
                                    </div>
                                </div>
                            )}
                            {paymentDetails.method === "PayPal" && (
                                <div className="sfm-payment-method-fields">
                                    <div className="sfm-form-group">
                                        <label htmlFor="sfm-paypal">PayPal Email</label>
                                        <input
                                            id="sfm-paypal"
                                            type="email"
                                            name="paypalEmail"
                                            value={paymentDetails.paypalEmail}
                                            onChange={handlePaymentChange}
                                            onBlur={handleBlur}
                                            placeholder="e.g., user@example.com"
                                            required
                                            className="sfm-form-control"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="sfm-form-group">
                                <label htmlFor="sfm-amount">Amount to Pay</label>
                                <input
                                    id="sfm-amount"
                                    type="number"
                                    name="amount"
                                    value={paymentDetails.amount}
                                    onChange={handlePaymentChange}
                                    placeholder="Enter amount"
                                    min="1"
                                    max={feeCategories.find(cat => cat.name === paymentDetails.category)?.pendingAmount || 0}
                                    required
                                    className="sfm-form-control"
                                />
                                <small className="sfm-form-helper">
                                    Max: ${feeCategories.find(cat => cat.name === paymentDetails.category)?.pendingAmount.toLocaleString() || 0} (includes fine)
                                </small>
                            </div>

                            <div className="sfm-modal-actions">
                                <button type="submit" className="sfm-submit-btn" disabled={loading}>
                                    {loading ? "Processing..." : "Pay Now"}
                                </button>
                                <button
                                    type="button"
                                    className="sfm-cancel-btn"
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentFeeManagement;