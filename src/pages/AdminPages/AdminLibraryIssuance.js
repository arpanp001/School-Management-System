import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminLibraryIssuance.css';

// Component for the issuance form
const IssuanceForm = ({ issuance, setIssuance, books, users, handleIssueBook }) => (
    <div className="issuance-form-wrapper">
        <h4 className="form-title">Issue New Book</h4>
        <form onSubmit={handleIssueBook} className="issuance-form">
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Select User</label>
                    <select
                        className="form-input"
                        value={issuance.userId}
                        onChange={(e) => setIssuance({ ...issuance, userId: e.target.value })}
                        required
                    >
                        <option value="">Select User</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.email} ({user.role})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Select Book</label>
                    <select
                        className="form-input"
                        value={issuance.bookId}
                        onChange={(e) => setIssuance({ ...issuance, bookId: e.target.value })}
                        required
                    >
                        <option value="">Select Book</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.title} ({book.availableQuantity} available)
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={issuance.dueDate}
                        onChange={(e) => setIssuance({ ...issuance, dueDate: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group form-buttons">
                    <button type="submit" className="btn btn-primary">
                        Issue Book
                    </button>
                </div>
            </div>
        </form>
    </div>
);

// Component for the filter control
const IssuanceFilter = ({ filterStatus, setFilterStatus }) => (
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

// Component for the issuance table with pagination
const IssuanceTable = ({
    issuedBooks,
    users,
    books,
    handleReturnBook,
    currentPage,
    totalPages,
    paginate,
    filterStatus,
}) => {
    // Filter issued books based on status
    const filteredBooks = issuedBooks.filter((issue) => {
        const isOverdue = !issue.returned && new Date(issue.dueDate) < new Date();
        if (filterStatus === 'Overdue') return isOverdue;
        if (filterStatus === 'Returned') return issue.returned;
        return true; // All if filterStatus is "All"
    });

    // Pagination logic
    const booksPerPage = 5;
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentIssuedBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

    return (
        <div className="table-wrapper">
            <div className="table-header">
                <h4>Issued Books</h4>
            </div>
            <div className="table-container">
                <table className="issuance-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Book</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentIssuedBooks.map((issue) => {
                            const user = users.find((u) => u.id === issue.userId);
                            const book = books.find((b) => b.id === issue.bookId);
                            const isOverdue = !issue.returned && new Date(issue.dueDate) < new Date();
                            return (
                                <tr key={issue.id}>
                                    <td>{user?.email}</td>
                                    <td>{book?.title}</td>
                                    <td>{new Date(issue.issueDate).toLocaleDateString()}</td>
                                    <td>{new Date(issue.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        {issue.returned ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}
                                    </td>
                                    <td>
                                        {!issue.returned && (
                                            <button
                                                className="btn btn-return"
                                                onClick={() => handleReturnBook(issue.id, issue.bookId)}
                                            >
                                                Return
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {currentIssuedBooks.length === 0 && (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    No issued books found
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

const AdminLibraryIssuance = () => {
    // State management
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [issuance, setIssuance] = useState({
        userId: '',
        bookId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
    });
    const [issuedBooks, setIssuedBooks] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const BORROWING_LIMITS = { student: 3, teacher: 5 };

    // Data fetching
    useEffect(() => {
        fetchBooks();
        fetchUsers();
        fetchIssuedBooks();
    }, []);

    const fetchBooks = async () => {
        const booksCollection = await getDocs(collection(db, 'books'));
        setBooks(booksCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchUsers = async () => {
        const usersCollection = await getDocs(collection(db, 'users'));
        setUsers(usersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchIssuedBooks = async () => {
        const issuedCollection = await getDocs(collection(db, 'issuedBooks'));
        setIssuedBooks(issuedCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    // Issue book handler
    const handleIssueBook = async (e) => {
        e.preventDefault();
        try {
            const user = users.find((u) => u.id === issuance.userId);
            const currentBorrowed = issuedBooks.filter(
                (ib) => ib.userId === issuance.userId && !ib.returned
            ).length;

            if (currentBorrowed >= BORROWING_LIMITS[user.role]) {
                toast.error(`Maximum borrowing limit reached (${BORROWING_LIMITS[user.role]} books)`);
                return;
            }

            const book = books.find((b) => b.id === issuance.bookId);
            if (book.availableQuantity <= 0) {
                toast.error('Book not available');
                return;
            }

            await addDoc(collection(db, 'issuedBooks'), {
                ...issuance,
                returned: false,
                createdAt: new Date().toISOString(),
            });

            const bookRef = doc(db, 'books', issuance.bookId);
            await updateDoc(bookRef, {
                availableQuantity: book.availableQuantity - 1,
            });

            toast.success('Book issued successfully');
            setIssuance({
                userId: '',
                bookId: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: '',
            });
            fetchIssuedBooks();
            fetchBooks();
        } catch (error) {
            toast.error('Error issuing book');
        }
    };

    // Return book handler
    const handleReturnBook = async (issueId, bookId) => {
        try {
            const issueRef = doc(db, 'issuedBooks', issueId);
            await updateDoc(issueRef, {
                returned: true,
                returnDate: new Date().toISOString(),
            });

            const book = books.find((b) => b.id === bookId);
            const bookRef = doc(db, 'books', bookId);
            await updateDoc(bookRef, {
                availableQuantity: book.availableQuantity + 1,
            });

            toast.success('Book returned successfully');
            fetchIssuedBooks();
            fetchBooks();
        } catch (error) {
            toast.error('Error returning book');
        }
    };

    // Pagination logic
    const booksPerPage = 5;
    const filteredBooks = issuedBooks.filter((issue) => {
        const isOverdue = !issue.returned && new Date(issue.dueDate) < new Date();
        if (filterStatus === 'Overdue') return isOverdue;
        if (filterStatus === 'Returned') return issue.returned;
        return true; // All if filterStatus is "All"
    });
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    // eslint-disable-next-line
    const currentIssuedBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
    const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Book Issuance</h2>
            <IssuanceForm
                issuance={issuance}
                setIssuance={setIssuance}
                books={books}
                users={users}
                handleIssueBook={handleIssueBook}
            />
            <IssuanceFilter filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
            <IssuanceTable
                issuedBooks={issuedBooks}
                users={users}
                books={books}
                handleReturnBook={handleReturnBook}
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
                filterStatus={filterStatus}
            />
        </div>
    );
};

export default AdminLibraryIssuance;