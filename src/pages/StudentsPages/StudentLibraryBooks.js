import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { BookOpen, Search, AlertCircle, CheckCircle, Book } from 'lucide-react';
import '../../pages/StudentPagesStyle/StudentLibraryBooks.css';

const StudentLibraryBooks = () => {
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    // Fetch all books from Firestore
    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            const booksCollection = await getDocs(collection(db, 'books'));
            const booksData = booksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBooks(booksData);
        } catch (error) {
            toast.error('Error fetching books', {
                position: 'top-right',
                autoClose: 3000
            });
            console.error('Error fetching books:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle book request submission
    const handleRequestBook = async (bookId) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error('You must be logged in to request books');
                return;
            }

            // Check if user already has a pending request for this book
            const existingRequests = await getDocs(collection(db, 'bookRequests'));
            const userRequests = existingRequests.docs.filter(doc =>
                doc.data().userId === user.uid &&
                doc.data().status === 'pending' &&
                doc.data().bookId === bookId
            );

            if (userRequests.length > 0) {
                toast.error('You already have a pending request for this book', {
                    icon: <AlertCircle className="slb-toast-icon" size={20} />
                });
                return;
            }

            // Check borrowing limit
            const issuedBooks = await getDocs(collection(db, 'issuedBooks'));
            const currentBorrowed = issuedBooks.docs.filter(doc =>
                doc.data().userId === user.uid && !doc.data().returned
            ).length;

            if (currentBorrowed >= 3) { // Student borrowing limit
                toast.error('You have reached your borrowing limit of 3 books', {
                    icon: <AlertCircle className="slb-toast-icon" size={20} />
                });
                return;
            }

            // Add the book request to Firestore
            await addDoc(collection(db, 'bookRequests'), {
                userId: user.uid,
                bookId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                role: 'student'
            });

            toast.success('Book request submitted successfully', {
                icon: <CheckCircle className="slb-toast-icon" size={20} />
            });
        } catch (error) {
            toast.error('Error requesting book');
            console.error('Error requesting book:', error);
        }
    };

    // Filter books based on search term
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="slb-container">
            <div className="slb-header">
                <BookOpen className="slb-header-icon" size={25} />
                <h2 className="slb-title">Library Resources</h2>
            </div>

            <div className="slb-search-container">
                <div className="slb-search-wrapper">
                    <Search className="slb-search-icon" size={18} />
                    <input
                        type="text"
                        className="slb-search-input"
                        placeholder="Search books by title, author, or ISBN"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="slb-search-results">
                    {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
                </span>
            </div>

            <div className="slb-card">
                {isLoading ? (
                    <div className="slb-loading">Loading book inventory...</div>
                ) : (
                    <>
                        {filteredBooks.length === 0 ? (
                            <div className="slb-no-results">
                                <Book className="slb-no-results-icon" size={48} />
                                <p>No books match your search criteria</p>
                            </div>
                        ) : (
                            <div className="slb-table-container">
                                <table className="slb-table">
                                    <thead className="slb-table-header">
                                        <tr>
                                            <th className="slb-table-cell slb-cell-title">Title</th>
                                            <th className="slb-table-cell slb-cell-author">Author</th>
                                            <th className="slb-table-cell slb-cell-isbn">ISBN</th>
                                            <th className="slb-table-cell slb-cell-genre">Genre</th>
                                            <th className="slb-table-cell slb-cell-available">Available</th>
                                            <th className="slb-table-cell slb-cell-action">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="slb-table-body">
                                        {filteredBooks.map(book => (
                                            <tr key={book.id} className="slb-table-row">
                                                <td className="slb-table-cell slb-cell-title">{book.title}</td>
                                                <td className="slb-table-cell slb-cell-author">{book.author}</td>
                                                <td className="slb-table-cell slb-cell-isbn">{book.isbn}</td>
                                                <td className="slb-table-cell slb-cell-genre">{book.genre}</td>
                                                <td className="slb-table-cell slb-cell-available">
                                                    <span className={`slb-availability ${book.availableQuantity > 0 ? 'slb-available' : 'slb-unavailable'}`}>
                                                        {book.availableQuantity}
                                                    </span>
                                                </td>
                                                <td className="slb-table-cell slb-cell-action">
                                                    {book.availableQuantity > 0 ? (
                                                        <button
                                                            className="slb-request-button"
                                                            onClick={() => handleRequestBook(book.id)}
                                                        >
                                                            Request
                                                        </button>
                                                    ) : (
                                                        <span className="slb-unavailable-text">Unavailable</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="slb-info-section">
                <div className="slb-info-card">
                    <h4 className="slb-info-title">Borrowing Rules</h4>
                    <ul className="slb-info-list">
                        <li>Maximum of 3 books can be borrowed at a time</li>
                        <li>Books are issued for 14 days</li>
                        <li>Late returns may incur fines</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentLibraryBooks;