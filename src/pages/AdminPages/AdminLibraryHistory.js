import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import '../../pages/AdminPagesStyle/AdminLibraryHistory.css';

// Component for the search input
const HistorySearch = ({ searchQuery, setSearchQuery }) => (
    <div className="search-container">
        <div className="form-group">
            <label className="form-label">Search by User or Book:</label>
            <input
                type="text"
                className="form-input"
                placeholder="Search by user email or book title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    </div>
);

// Component for the filter control
const HistoryFilter = ({ filterStatus, setFilterStatus }) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Filter by Status:</label>
            <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
            >
                <option value="All">All</option>
                <option value="Overdue">Overdue</option>
                <option value="Returned">Returned</option>
            </select>
        </div>
    </div>
);

// Component for the history table with pagination
const HistoryTable = ({
    history,
    users,
    books,
    searchQuery,
    filterStatus,
    currentPage,
    totalPages,
    paginate,
}) => {
    // Filter history based on status
    const filteredHistory = history.filter((record) => {
        const isOverdue = !record.returned && new Date(record.dueDate) < new Date();
        if (filterStatus === 'Overdue') return isOverdue;
        if (filterStatus === 'Returned') return record.returned;
        return true; // All if filterStatus is "All"
    });

    // Search history based on user email or book title
    const searchedHistory = filteredHistory.filter((record) => {
        const user = users.find((u) => u.id === record.userId);
        const book = books.find((b) => b.id === record.bookId);
        const searchLower = searchQuery.toLowerCase();
        return (
            (user?.email?.toLowerCase().includes(searchLower) || false) ||
            (book?.title?.toLowerCase().includes(searchLower) || false)
        );
    });

    // Pagination logic
    const recordsPerPage = 5;
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentHistory = searchedHistory.slice(indexOfFirstRecord, indexOfLastRecord);

    return (
        <div className="table-wrapper">
            <div className="table-header">
                <h4>Borrowing History</h4>
            </div>
            <div className="table-container">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Book</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Return Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHistory.map((record) => {
                            const user = users.find((u) => u.id === record.userId);
                            const book = books.find((b) => b.id === record.bookId);
                            const isOverdue = !record.returned && new Date(record.dueDate) < new Date();
                            return (
                                <tr key={record.id}>
                                    <td>{user?.email}</td>
                                    <td>{book?.title}</td>
                                    <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                                    <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                                    <td>{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}</td>
                                    <td>{record.returned ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}</td>
                                </tr>
                            );
                        })}
                        {currentHistory.length === 0 && (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    No borrowing history found
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

const AdminLibraryHistory = () => {
    // State management
    const [history, setHistory] = useState([]);
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Data fetching
    useEffect(() => {
        fetchHistory();
        fetchBooks();
        fetchUsers();
    }, []);

    const fetchHistory = async () => {
        const historyCollection = await getDocs(collection(db, 'issuedBooks'));
        setHistory(historyCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchBooks = async () => {
        const booksCollection = await getDocs(collection(db, 'books'));
        setBooks(booksCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchUsers = async () => {
        const usersCollection = await getDocs(collection(db, 'users'));
        setUsers(usersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    // Pagination logic
    const recordsPerPage = 5;
    const filteredHistory = history.filter((record) => {
        const isOverdue = !record.returned && new Date(record.dueDate) < new Date();
        if (filterStatus === 'Overdue') return isOverdue;
        if (filterStatus === 'Returned') return record.returned;
        return true; // All if filterStatus is "All"
    });
    const searchedHistory = filteredHistory.filter((record) => {
        const user = users.find((u) => u.id === record.userId);
        const book = books.find((b) => b.id === record.bookId);
        const searchLower = searchQuery.toLowerCase();
        return (
            (user?.email?.toLowerCase().includes(searchLower) || false) ||
            (book?.title?.toLowerCase().includes(searchLower) || false)
        );
    });
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    searchedHistory.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(searchedHistory.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Borrowing History</h2>
            <HistorySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <HistoryFilter filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
            <HistoryTable
                history={history}
                users={users}
                books={books}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
            />
        </div>
    );
};

export default AdminLibraryHistory;