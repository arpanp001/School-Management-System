import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { BookMarked, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import '../StudentPagesStyle/StudentLibraryRequests.css';

const StudentLibraryRequests = () => {
    const [requests, setRequests] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
        fetchBooks();
    }, []);

    // Fetch user's book requests from Firestore
    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error('Authentication error. Please log in again.');
                return;
            }

            const requestsCollection = await getDocs(collection(db, 'bookRequests'));
            const studentRequests = requestsCollection.docs
                .filter(doc => doc.data().userId === user.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date, newest first

            setRequests(studentRequests);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Error fetching your book requests', {
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

    // Handle request cancellation
    const handleCancelRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to cancel this request?')) {
            try {
                await deleteDoc(doc(db, 'bookRequests', requestId));
                toast.success('Request cancelled successfully', {
                    icon: <CheckCircle className="slr-toast-icon" size={20} />
                });
                fetchRequests(); // Refresh the requests list
            } catch (error) {
                console.error('Error cancelling request:', error);
                toast.error('Error cancelling request', {
                    icon: <AlertCircle className="slr-toast-icon" size={20} />
                });
            }
        }
    };

    // Helper function to get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'slr-status-approved';
            case 'rejected':
                return 'slr-status-rejected';
            case 'issued':
                return 'slr-status-issued';
            case 'returned':
                return 'slr-status-returned';
            default:
                return 'slr-status-pending';
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

    return (
        <div className="slr-container">
            <div className="slr-header">
                <BookMarked className="slr-header-icon" size={24} />
                <h2 className="slr-title">My Library Requests</h2>
            </div>

            <div className="slr-card">
                {isLoading ? (
                    <div className="slr-loading">
                        <Clock className="slr-loading-icon" size={24} />
                        <span>Loading your book requests...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="slr-no-requests">
                        <BookMarked className="slr-no-requests-icon" size={48} />
                        <p className="slr-no-requests-text">You don't have any book requests yet.</p>
                        <p className="slr-no-requests-hint">
                            Visit the library catalog to browse and request books.
                        </p>
                    </div>
                ) : (
                    <div className="slr-table-container">
                        <table className="slr-table">
                            <thead className="slr-table-header">
                                <tr>
                                    <th className="slr-table-cell slr-cell-title">Book Title</th>
                                    <th className="slr-table-cell slr-cell-date">Request Date</th>
                                    <th className="slr-table-cell slr-cell-status">Status</th>
                                    <th className="slr-table-cell slr-cell-action">Action</th>
                                </tr>
                            </thead>
                            <tbody className="slr-table-body">
                                {requests.map(request => {
                                    const book = books.find(b => b.id === request.bookId);
                                    return (
                                        <tr key={request.id} className="slr-table-row">
                                            <td className="slr-table-cell slr-cell-title">
                                                {book?.title || 'Unknown Book'}
                                            </td>
                                            <td className="slr-table-cell slr-cell-date">
                                                {formatDate(request.createdAt)}
                                            </td>
                                            <td className="slr-table-cell slr-cell-status">
                                                <span className={`slr-status-badge ${getStatusBadgeClass(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="slr-table-cell slr-cell-action">
                                                {request.status === 'pending' && (
                                                    <button
                                                        className="slr-cancel-button"
                                                        onClick={() => handleCancelRequest(request.id)}
                                                    >
                                                        <XCircle size={16} className="slr-cancel-icon" />
                                                        Cancel
                                                    </button>
                                                )}
                                                {request.status !== 'pending' && (
                                                    <span className="slr-no-action">—</span>
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

            <div className="slr-info-section">
                <div className="slr-info-card">
                    <h4 className="slr-info-title">Request Status Guide</h4>
                    <ul className="slr-info-list">
                        <li><span className="slr-status-badge slr-status-pending">pending</span> - Your request is awaiting librarian approval</li>
                        <li><span className="slr-status-badge slr-status-approved">approved</span> - Request approved, visit the library to collect your book</li>
                        <li><span className="slr-status-badge slr-status-issued">issued</span> - Book has been issued to you</li>
                        <li><span className="slr-status-badge slr-status-returned">returned</span> - Book has been returned to the library</li>
                        <li><span className="slr-status-badge slr-status-rejected">rejected</span> - Request could not be fulfilled</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentLibraryRequests;