import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/TeacherPagesStyle/TeacherLibraryBooks.css';

// Component for the search input
const BookSearch = ({ searchTerm, setSearchTerm, setCurrentPage }) => (
    <div className="search-panel">
        <input
            type="text"
            className="form-input"
            placeholder="Search books by title, author, or ISBN"
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
            }}
        />
    </div>
);

// Component for the book table
const BookTable = ({ currentBooks, handleRequestBook }) => (
    <div className="table-wrapper">
        <div className="table-header">
            <h4>Available Books</h4>
        </div>
        <div className="table-container">
            <table className="book-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Genre</th>
                        <th>Available</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {currentBooks.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="no-data">
                                No books found
                            </td>
                        </tr>
                    ) : (
                        currentBooks.map((book) => (
                            <tr key={book.id}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.isbn}</td>
                                <td>{book.genre}</td>
                                <td>{book.availableQuantity}</td>
                                <td>
                                    {book.availableQuantity > 0 && (
                                        <button className="btn btn-primary" onClick={() => handleRequestBook(book.id)}>
                                            Request
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Component for pagination
const BookPagination = ({ currentPage, totalPages, paginate, filteredBooks }) => (
    <nav className="pagination-container">
        <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                    Previous
                </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(i + 1)}>
                        {i + 1}
                    </button>
                </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                    Next
                </button>
            </li>
        </ul>
        <div className="pagination-info">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, filteredBooks.length)} of{' '}
            {filteredBooks.length} books
        </div>
    </nav>
);

const TeacherLibraryBooks = () => {
    // State management
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const booksPerPage = 10;

    // Data fetching
    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            const booksCollection = await getDocs(collection(db, 'books'));
            const booksData = booksCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
            setCurrentPage(1); // Reset to first page when books are fetched
        } catch (error) {
            toast.error('Error fetching books: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestBook = async (bookId) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error('Please log in to request a book');
                return;
            }

            const existingRequests = await getDocs(collection(db, 'bookRequests'));
            const userRequests = existingRequests.docs.filter(
                (doc) =>
                    doc.data().userId === user.uid &&
                    doc.data().status === 'pending' &&
                    doc.data().bookId === bookId
            );

            if (userRequests.length > 0) {
                toast.error('You already have a pending request for this book');
                return;
            }

            await addDoc(collection(db, 'bookRequests'), {
                userId: user.uid,
                bookId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                role: 'teacher',
            });
            toast.success('Book request submitted successfully');
        } catch (error) {
            console.error('Error requesting book:', error);
            toast.error('Error requesting book: ' + error.message);
        }
    };

    // Filter books based on search term
    const filteredBooks = books.filter(
        (book) =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
    const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top when changing pages
    };

    return (
        <div className="container">
            <h2 className="page-title">Available Books</h2>
            <BookSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage}
            />
            <BookTable currentBooks={currentBooks} handleRequestBook={handleRequestBook} />
            {totalPages > 1 && (
                <BookPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                    filteredBooks={filteredBooks} // Pass filteredBooks as a prop
                />
            )}
        </div>
    );
};

export default TeacherLibraryBooks;