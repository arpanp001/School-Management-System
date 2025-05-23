import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminLibraryBooks.css';

// Component for the book form
const BookForm = ({ newBook, setNewBook, handleAddBook, isEditing, setIsEditing }) => (
    <div className="book-form-wrapper">
        <h4 className="form-title">{isEditing ? 'Edit Book' : 'Add New Book'}</h4>
        <form onSubmit={handleAddBook} className="book-form">
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Title"
                        value={newBook.title}
                        onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Author</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Author"
                        value={newBook.author}
                        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="ISBN"
                        value={newBook.isbn}
                        onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Genre</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Genre"
                        value={newBook.genre}
                        onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="Quantity"
                        value={newBook.quantity}
                        onChange={(e) => setNewBook({ ...newBook, quantity: parseInt(e.target.value) })}
                        required
                        min="1"
                    />
                </div>
                <div className="form-group form-buttons">
                    <button type="submit" className="btn btn-primary">
                        {isEditing ? 'Update Book' : 'Add Book'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setIsEditing(false);
                                setNewBook({ title: '', author: '', isbn: '', genre: '', quantity: 0 });
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </form>
    </div>
);

// Component for the book table
const BookTable = ({
    currentBooks,
    handleEdit,
    handleDelete,
    currentPage,
    totalPages,
    paginate,
}) => (
    <div className="table-wrapper">
        <div className="table-header">
            <h4>All Books</h4>
        </div>
        <div className="table-container">
            <table className="book-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Genre</th>
                        <th>Quantity</th>
                        <th>Available</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentBooks.map((book) => (
                        <tr key={book.id}>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.isbn}</td>
                            <td>{book.genre}</td>
                            <td>{book.quantity}</td>
                            <td>{book.availableQuantity}</td>
                            <td>
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEdit(book)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(book.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {currentBooks.length === 0 && (
                        <tr>
                            <td colSpan="7" className="no-data">
                                No books found
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

const AdminLibraryBooks = () => {
    // State management
    const [books, setBooks] = useState([]);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        quantity: 0,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editBookId, setEditBookId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [booksPerPage] = useState(5);

    // Data fetching
    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const booksCollection = await getDocs(collection(db, 'books'));
            const booksData = booksCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
        } catch (error) {
            toast.error('Error fetching books');
            console.error('Error fetching books:', error);
        }
    };

    // Fetch all student UIDs
    const fetchStudentUids = async () => {
        try {
            const usersCollection = await getDocs(collection(db, 'users'));
            const students = usersCollection.docs
                .filter((doc) => doc.data().role === 'student')
                .map((doc) => doc.id);
            return students;
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Error fetching student data');
            return [];
        }
    };

    // Send notification to all students
    const sendNotificationsToStudents = async (bookTitle) => {
        const studentUids = await fetchStudentUids();
        if (studentUids.length === 0) {
            console.warn('No students found to notify');
            return;
        }

        const notificationPromises = studentUids.map(async (uid) => {
            try {
                await addDoc(collection(db, 'studentLog', uid, 'notifications'), {
                    message: `New book added: ${bookTitle}`,
                    read: false,
                    createdAt: new Date(),
                    type: 'new_book',
                    link: '/student/library/books',
                });
            } catch (error) {
                console.error(`Error sending notification to student ${uid}:`, error);
            }
        });

        await Promise.all(notificationPromises);
        console.log(`Notifications sent to ${studentUids.length} students`);
    };

    // Form submission handler
    const handleAddBook = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const bookRef = doc(db, 'books', editBookId);
                await updateDoc(bookRef, newBook);
                toast.success('Book updated successfully');
                setIsEditing(false);
                setEditBookId(null);
            } else {
                const bookRef = await addDoc(collection(db, 'books'), {
                    ...newBook,
                    availableQuantity: newBook.quantity,
                    createdAt: new Date().toISOString(),
                });
                toast.success('Book added successfully');
                // Send notifications to all students
                await sendNotificationsToStudents(newBook.title);
            }
            setNewBook({ title: '', author: '', isbn: '', genre: '', quantity: 0 });
            fetchBooks();
        } catch (error) {
            toast.error('Error saving book');
            console.error('Error saving book:', error);
        }
    };

    // Edit handler
    const handleEdit = (book) => {
        setNewBook(book);
        setIsEditing(true);
        setEditBookId(book.id);
    };

    // Delete handler
    const handleDelete = async (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await deleteDoc(doc(db, 'books', bookId));
                toast.success('Book deleted successfully');
                fetchBooks();
            } catch (error) {
                toast.error('Error deleting book');
                console.error('Error deleting book:', error);
            }
        }
    };

    // Pagination logic
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
    const totalPages = Math.ceil(books.length / booksPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Manage Books</h2>
            <BookForm
                newBook={newBook}
                setNewBook={setNewBook}
                handleAddBook={handleAddBook}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
            />
            <BookTable
                currentBooks={currentBooks}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
            />
        </div>
    );
};

export default AdminLibraryBooks;