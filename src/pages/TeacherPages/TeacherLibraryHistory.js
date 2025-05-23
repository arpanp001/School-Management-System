import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaSyncAlt, FaSearch, FaBook } from 'react-icons/fa';
import '../../pages/TeacherPagesStyle/TeacherLibraryHistory.css';

const TeacherLibraryHistory = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchHistory(), fetchBooks()]);
        } catch (error) {
            setError('Failed to load borrowing history. Please try again.');
            toast.error('Error fetching history');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        const user = auth.currentUser;
        const historyCollection = await getDocs(collection(db, 'issuedBooks'));
        const teacherHistory = historyCollection.docs
            .filter(doc => doc.data().userId === user.uid)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(teacherHistory);
        setFilteredHistory(teacherHistory);
    };

    const fetchBooks = async () => {
        const booksCollection = await getDocs(collection(db, 'books'));
        setBooks(booksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleReturnBook = async (issueId, bookId) => {
        try {
            const issueRef = doc(db, 'issuedBooks', issueId);
            await updateDoc(issueRef, {
                returned: true,
                returnDate: new Date().toISOString(),
            });

            const book = books.find(b => b.id === bookId);
            const bookRef = doc(db, 'books', bookId);
            await updateDoc(bookRef, {
                availableQuantity: book.availableQuantity + 1,
            });

            toast.success('Book returned successfully');
            fetchHistory();
            fetchBooks();
        } catch (error) {
            toast.error('Error returning book');
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query.trim() === '') {
            setFilteredHistory(history);
        } else {
            const filtered = history.filter((record) => {
                const book = books.find(b => b.id === record.bookId);
                const bookTitle = book?.title?.toLowerCase() || '';
                const status = record.returned
                    ? 'returned'
                    : new Date(record.dueDate) < new Date()
                        ? 'overdue'
                        : 'issued';
                return bookTitle.includes(query) || status.includes(query);
            });
            setFilteredHistory(filtered);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="history-container"
        >
            <div className="history-header">
                <h2>My Borrowing History</h2>
                <div className="history-actions">
                    <motion.button
                        className="history-refresh-button"
                        onClick={fetchData}
                        whileHover={{ scale: 1.05, boxShadow: '0 4px 8px rgba(106, 27, 154, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Refresh borrowing history"
                    >
                        <FaSyncAlt /> Refresh
                    </motion.button>
                </div>
            </div>

            <motion.div
                className="history-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="history-card-body">
                    <motion.div
                        className="history-search-bar"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FaSearch className="history-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by book title or status..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="history-search-input"
                            aria-label="Search borrowing history by title or status"
                        />
                    </motion.div>

                    {loading ? (
                        <motion.div
                            className="history-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FaSpinner className="history-loading-spinner" />
                            <span>Loading...</span>
                        </motion.div>
                    ) : error ? (
                        <div className="history-error">
                            {error}
                            <motion.button
                                className="history-retry-button"
                                onClick={fetchData}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Retry loading history"
                            >
                                Retry
                            </motion.button>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="history-empty">
                            {searchQuery ? 'No matching history found.' : 'No borrowing history found.'}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Book Title</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th>Return Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredHistory.map(record => {
                                            const book = books.find(b => b.id === record.bookId);
                                            const isOverdue = !record.returned && new Date(record.dueDate) < new Date();
                                            const status = record.returned
                                                ? 'Returned'
                                                : isOverdue
                                                    ? 'Overdue'
                                                    : 'Issued';
                                            return (
                                                <motion.tr
                                                    key={record.id}
                                                    className={isOverdue ? 'overdue' : ''}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <td data-label="Book Title">{book?.title || 'Unknown'}</td>
                                                    <td data-label="Issue Date">{new Date(record.issueDate).toLocaleDateString()}</td>
                                                    <td data-label="Due Date">{new Date(record.dueDate).toLocaleDateString()}</td>
                                                    <td data-label="Return Date">
                                                        {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td data-label="Status">
                                                        <span className={`history-status history-status-${status.toLowerCase()}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td data-label="Action">
                                                        {!record.returned && (
                                                            <motion.button
                                                                className="history-return-button"
                                                                onClick={() => handleReturnBook(record.id, record.bookId)}
                                                                whileHover={{ scale: 1.05, boxShadow: '0 4px 8px rgba(38, 166, 154, 0.2)' }}
                                                                whileTap={{ scale: 0.95 }}
                                                                aria-label={`Return book ${book?.title || 'Unknown'}`}
                                                            >
                                                                <FaBook /> Return
                                                            </motion.button>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TeacherLibraryHistory;