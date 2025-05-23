import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminLibraryRequests.css';

// Component for the request filter
const RequestFilter = ({ filterStatus, setFilterStatus }) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Filter by Status:</label>
            <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
            >
                <option value="All">All</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
            </select>
        </div>
    </div>
);

// Component for the request table with pagination
const RequestTable = ({
    requests,
    users,
    books,
    handleRequestAction,
    currentPage,
    totalPages,
    paginate,
    filterStatus,
}) => {
    // Filter requests based on status
    const filteredRequests = requests.filter((request) => {
        if (filterStatus === 'All') return true;
        return request.status === filterStatus;
    });

    // Pagination logic
    const requestsPerPage = 5;
    const indexOfLastRequest = currentPage * requestsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
    const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

    return (
        <div className="table-wrapper">
            <div className="table-header">
                <h4>Book Requests</h4>
            </div>
            <div className="table-container">
                <table className="request-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Book</th>
                            <th>Request Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRequests.map((request) => {
                            const user = users.find((u) => u.id === request.userId);
                            const book = books.find((b) => b.id === request.bookId);
                            return (
                                <tr key={request.id}>
                                    <td>{user?.email}</td>
                                    <td>{book?.title}</td>
                                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                                    <td>{request.status}</td>
                                    <td>
                                        {request.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-approve"
                                                    onClick={() => handleRequestAction(request.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-reject"
                                                    onClick={() => handleRequestAction(request.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {currentRequests.length === 0 && (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    No book requests found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <nav className="pagination-container">
                    <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => paginate(currentPage - 1)}
                            >
                                Previous
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <li
                                key={i}
                                className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => paginate(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => paginate(currentPage + 1)}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

const AdminLibraryRequests = () => {
    // State management
    const [requests, setRequests] = useState([]);
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Data fetching
    useEffect(() => {
        fetchRequests();
        fetchBooks();
        fetchUsers();
    }, []);

    const fetchRequests = async () => {
        const requestsCollection = await getDocs(collection(db, 'bookRequests'));
        setRequests(requestsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchBooks = async () => {
        const booksCollection = await getDocs(collection(db, 'books'));
        setBooks(booksCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchUsers = async () => {
        const usersCollection = await getDocs(collection(db, 'users'));
        setUsers(usersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    // Request action handler (approve/reject)
    const handleRequestAction = async (requestId, status) => {
        try {
            const requestRef = doc(db, 'bookRequests', requestId);
            await updateDoc(requestRef, {
                status,
                updatedAt: new Date().toISOString(),
            });
            toast.success(`Request ${status} successfully`);
            fetchRequests();
        } catch (error) {
            toast.error('Error processing request');
        }
    };

    // Pagination logic
    const requestsPerPage = 5;
    const filteredRequests = requests.filter((request) => {
        if (filterStatus === 'All') return true;
        return request.status === filterStatus;
    });
    const indexOfLastRequest = currentPage * requestsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
    // eslint-disable-next-line
    const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Book Requests</h2>
            <RequestFilter filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
            <RequestTable
                requests={requests}
                users={users}
                books={books}
                handleRequestAction={handleRequestAction}
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
                filterStatus={filterStatus}
            />
        </div>
    );
};

export default AdminLibraryRequests;