import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaTrash, FaSyncAlt, FaSearch } from 'react-icons/fa';
import '../TeacherPagesStyle/TeacherLibraryRequests.css';

const TeacherLibraryRequests = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch requests and books
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchRequests(), fetchBooks()]);
        } catch (error) {
            setError('Failed to load data. Please try again.');
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        const user = auth.currentUser;
        const requestsCollection = await getDocs(collection(db, 'bookRequests'));
        const teacherRequests = requestsCollection.docs
            .filter(doc => doc.data().userId === user.uid)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(teacherRequests);
        setFilteredRequests(teacherRequests); // Initialize filtered requests
    };

    const fetchBooks = async () => {
        const booksCollection = await getDocs(collection(db, 'books'));
        setBooks(booksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleCancelRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to cancel this request?')) {
            try {
                await deleteDoc(doc(db, 'bookRequests', requestId));
                toast.success('Request cancelled successfully');
                fetchRequests();
            } catch (error) {
                toast.error('Error cancelling request');
            }
        }
    };

    // Handle search filtering
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query.trim() === '') {
            setFilteredRequests(requests);
        } else {
            const filtered = requests.filter((request) => {
                const book = books.find(b => b.id === request.bookId);
                const bookTitle = book?.title?.toLowerCase() || '';
                const status = request.status.toLowerCase();
                return bookTitle.includes(query) || status.includes(query);
            });
            setFilteredRequests(filtered);
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
            className="requests-container"
        >
            <div className="requests-header">
                <h2>My Book Requests</h2>
                <div className="requests-actions">
                    <motion.div
                        className="requests-search-bar"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FaSearch className="requests-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by book title or status..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="requests-search-input"
                            aria-label="Search book requests by title or status"
                        />
                    </motion.div>
                    <motion.button
                        className="requests-refresh-button"
                        onClick={fetchData}
                        whileHover={{ scale: 1.05, boxShadow: '0 4px 8px rgba(106, 27, 154, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Refresh requests"
                    >
                        <FaSyncAlt /> Refresh
                    </motion.button>
                </div>
            </div>

            <motion.div
                className="requests-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="requests-card-body">
                    {loading ? (
                        <motion.div
                            className="requests-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FaSpinner className="requests-loading-spinner" />
                            <span>Loading...</span>
                        </motion.div>
                    ) : error ? (
                        <div className="requests-error">
                            {error}
                            <motion.button
                                className="requests-retry-button"
                                onClick={fetchData}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Retry loading data"
                            >
                                Retry
                            </motion.button>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="requests-empty">
                            {searchQuery ? 'No matching requests found.' : 'No book requests found.'}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="requests-table">
                                <thead>
                                    <tr>
                                        <th>Book Title</th>
                                        <th>Request Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredRequests.map(request => {
                                            const book = books.find(b => b.id === request.bookId);
                                            return (
                                                <motion.tr
                                                    key={request.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <td>{book?.title || 'Unknown'}</td>
                                                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`requests-status requests-status-${request.status.toLowerCase()}`}>
                                                            {request.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {request.status === 'pending' && (
                                                            <motion.button
                                                                className="requests-cancel-button"
                                                                onClick={() => handleCancelRequest(request.id)}
                                                                whileHover={{ scale: 1.05, boxShadow: '0 4px 8px rgba(240, 98, 146, 0.2)' }}
                                                                whileTap={{ scale: 0.95 }}
                                                                aria-label={`Cancel request for ${book?.title || 'Unknown'}`}
                                                            >
                                                                <FaTrash /> Cancel
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

export default TeacherLibraryRequests;