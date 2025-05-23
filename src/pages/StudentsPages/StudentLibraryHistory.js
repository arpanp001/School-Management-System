import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { BookCheck, Clock, AlertCircle, CheckCircle, History, Archive } from 'lucide-react';
import '../StudentPagesStyle/StudentLibraryHistory.css';

const StudentLibraryHistory = () => {
    const [history, setHistory] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
        fetchBooks();
    }, []);

    // Fetch user's borrowing history from Firestore
    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error('Authentication error. Please log in again.');
                return;
            }

            const historyCollection = await getDocs(collection(db, 'issuedBooks'));
            const studentHistory = historyCollection.docs
                .filter(doc => doc.data().userId === user.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    // Sort by return status first (active loans first)
                    if (a.returned !== b.returned) {
                        return a.returned ? 1 : -1;
                    }
                    // Then sort by date (most recent first)
                    return new Date(b.issueDate) - new Date(a.issueDate);
                });

            setHistory(studentHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Error fetching your borrowing history', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all books to display titles
    const fetchBooks = async () => {
        try {
            const booksCollection = await getDocs(collection(db, 'books'));
            setBooks(booksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching books:', error);
            toast.error('Error loading book information');
        }
    };

    // Handle book return process
    const handleReturnBook = async (issueId, bookId) => {
        try {
            // Update the issue record to mark as returned
            const issueRef = doc(db, 'issuedBooks', issueId);
            await updateDoc(issueRef, {
                returned: true,
                returnDate: new Date().toISOString()
            });

            // Update the book's available quantity
            const book = books.find(b => b.id === bookId);
            if (book) {
                const bookRef = doc(db, 'books', bookId);
                await updateDoc(bookRef, {
                    availableQuantity: book.availableQuantity + 1
                });
            }

            toast.success('Book returned successfully', {
                icon: <CheckCircle className="slh-toast-icon" size={20} />
            });

            // Refresh data
            fetchHistory();
            fetchBooks();
        } catch (error) {
            console.error('Error returning book:', error);
            toast.error('Error processing book return', {
                icon: <AlertCircle className="slh-toast-icon" size={20} />
            });
        }
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate days remaining or overdue days
    const getDaysStatus = (dueDate, returnDate) => {
        const today = new Date();
        const due = new Date(dueDate);

        if (returnDate) {
            return null; // Already returned
        }

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { overdue: true, days: Math.abs(diffDays) };
        } else {
            return { overdue: false, days: diffDays };
        }
    };

    // Get status badge styling
    const getStatusBadgeClass = (record) => {
        if (record.returned) {
            return 'slh-status-returned';
        }

        const daysStatus = getDaysStatus(record.dueDate, record.returnDate);
        if (daysStatus && daysStatus.overdue) {
            return 'slh-status-overdue';
        }

        return 'slh-status-issued';
    };

    return (
        <div className="slh-container">
            <div className="slh-header">
                <History className="slh-header-icon" size={24} />
                <h2 className="slh-title">My Borrowing History</h2>
            </div>

            <div className="slh-card">
                {isLoading ? (
                    <div className="slh-loading">
                        <Clock className="slh-loading-icon" size={24} />
                        <span>Loading your borrowing history...</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="slh-no-history">
                        <Archive className="slh-no-history-icon" size={48} />
                        <p className="slh-no-history-text">You haven't borrowed any books yet.</p>
                        <p className="slh-no-history-hint">
                            Visit the library catalog to find books you might like.
                        </p>
                    </div>
                ) : (
                    <div className="slh-table-container">
                        <table className="slh-table">
                            <thead className="slh-table-header">
                                <tr>
                                    <th className="slh-table-cell slh-cell-title">Book Title</th>
                                    <th className="slh-table-cell slh-cell-issue-date">Issue Date</th>
                                    <th className="slh-table-cell slh-cell-due-date">Due Date</th>
                                    <th className="slh-table-cell slh-cell-return-date">Return Date</th>
                                    <th className="slh-table-cell slh-cell-status">Status</th>
                                    <th className="slh-table-cell slh-cell-action">Action</th>
                                </tr>
                            </thead>
                            <tbody className="slh-table-body">
                                {history.map(record => {
                                    const book = books.find(b => b.id === record.bookId);
                                    const isOverdue = !record.returned && new Date(record.dueDate) < new Date();
                                    const daysStatus = getDaysStatus(record.dueDate, record.returnDate);

                                    return (
                                        <tr key={record.id} className="slh-table-row">
                                            <td className="slh-table-cell slh-cell-title">
                                                {book?.title || 'Unknown Book'}
                                            </td>
                                            <td className="slh-table-cell slh-cell-issue-date">
                                                {formatDate(record.issueDate)}
                                            </td>
                                            <td className="slh-table-cell slh-cell-due-date">
                                                {formatDate(record.dueDate)}
                                            </td>
                                            <td className="slh-table-cell slh-cell-return-date">
                                                {record.returnDate ? formatDate(record.returnDate) : '—'}
                                            </td>
                                            <td className="slh-table-cell slh-cell-status">
                                                <span className={`slh-status-badge ${getStatusBadgeClass(record)}`}>
                                                    {record.returned ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}

                                                    {daysStatus && (
                                                        <span className="slh-days-count">
                                                            {daysStatus.overdue ? `(${daysStatus.days} day${daysStatus.days !== 1 ? 's' : ''} late)` :
                                                                `(${daysStatus.days} day${daysStatus.days !== 1 ? 's' : ''} left)`}
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="slh-table-cell slh-cell-action">
                                                {!record.returned && (
                                                    <button
                                                        className="slh-return-button"
                                                        onClick={() => handleReturnBook(record.id, record.bookId)}
                                                    >
                                                        <BookCheck size={16} className="slh-return-icon" />
                                                        Return
                                                    </button>
                                                )}
                                                {record.returned && (
                                                    <span className="slh-no-action">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="slh-info-section">
                <div className="slh-info-card">
                    <h4 className="slh-info-title">Library Borrowing Guidelines</h4>
                    <ul className="slh-info-list">
                        <li><strong>Loan Period:</strong> Books are issued for 14 days</li>
                        <li><strong>Renewal:</strong> You may renew books once if no one else has requested them</li>
                        <li><strong>Late Fees:</strong> Overdue books incur a fee of $0.50 per day</li>
                        <li><strong>Lost Books:</strong> Lost books will be charged at full replacement cost</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentLibraryHistory;