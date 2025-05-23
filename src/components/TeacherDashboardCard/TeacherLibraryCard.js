import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config'; // Adjust path to your Firebase config
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherDashboardCardCss/TeacherLibraryCard.css';

const TeacherLibraryCard = () => {
    const [newBooks, setNewBooks] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [overdueCount, setOverdueCount] = useState(0);
    const [booksMap, setBooksMap] = useState({}); // Map book IDs to titles for requests

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            toast.error('Please log in to view library data');
            return;
        }

        // Fetch all books to build booksMap
        const booksQueryAll = query(collection(db, 'books'));
        const unsubscribeBooksAll = onSnapshot(booksQueryAll, (snapshot) => {
            const newBooksMap = {};
            snapshot.docs.forEach(doc => {
                newBooksMap[doc.id] = doc.data().title;
            });
            setBooksMap(newBooksMap);
        }, (error) => {
            console.error('Error fetching all books:', error);
            toast.error('Failed to load book titles');
        });

        // Fetch newly added books (top 3, sorted by createdAt descending)
        const booksQuery = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(3));
        const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
            const booksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNewBooks(booksData);
        }, (error) => {
            console.error('Error fetching new books:', error);
            toast.error('Failed to load new books');
        });

        // Fetch recent book requests (top 3, sorted by createdAt descending)
        const requestsQuery = query(
            collection(db, 'bookRequests'),
            orderBy('createdAt', 'desc'),
            limit(10) // Fetch more to filter by userId
        );
        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            const requestsData = snapshot.docs
                .filter(doc => doc.data().userId === user.uid)
                .slice(0, 3) // Take top 3 after filtering
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
            setRecentRequests(requestsData);
        }, (error) => {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load book requests');
        });

        // Fetch overdue books count
        const issuedBooksQuery = query(collection(db, 'issuedBooks'));
        const unsubscribeIssuedBooks = onSnapshot(issuedBooksQuery, (snapshot) => {
            const issuedBooks = snapshot.docs
                .filter(doc => doc.data().userId === user.uid)
                .map(doc => doc.data());
            const today = new Date();
            const overdue = issuedBooks.filter(
                record => !record.returned && new Date(record.dueDate) < today
            ).length;
            setOverdueCount(overdue);
        }, (error) => {
            console.error('Error fetching issued books:', error);
            toast.error('Failed to load borrowing history');
        });

        return () => {
            unsubscribeBooksAll();
            unsubscribeBooks();
            unsubscribeRequests();
            unsubscribeIssuedBooks();
        };
    }, []);

    return (
        <div className="library-card-container">
            <h3>Teacher Library</h3>
            <div className="library-content">
                {/* Overdue Books Count */}
                <div className="overdue-section">
                    <span className="overdue-label">Overdue Books:</span>
                    <span className={`overdue-count ${overdueCount > 0 ? 'has-overdue' : 'no-overdue'}`}>
                        {overdueCount}
                    </span>
                </div>

                {/* Newly Added Books */}
                <div className="new-books-section">
                    <h4>New Books</h4>
                    {newBooks.length > 0 ? (
                        <ul className="new-books-list">
                            {newBooks.map((book, index) => (
                                <li key={book.id} className={`new-book-item color-${index % 3}`}>
                                    <span className="book-title">{book.title}</span>
                                    <span className="book-author">{book.author}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">No new books available.</p>
                    )}
                </div>

                {/* Recent Book Requests */}
                <div className="requests-section">
                    <h4>Recent Requests</h4>
                    {recentRequests.length > 0 ? (
                        <ul className="requests-list">
                            {recentRequests.map(request => (
                                <li
                                    key={request.id}
                                    className={`request-item ${request.status.toLowerCase()}`}
                                >
                                    <span className="request-title">{booksMap[request.bookId] || 'Unknown'}</span>
                                    <span className="request-date">
                                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <span className={`request-status ${request.status.toLowerCase()}`}>
                                        {request.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">No recent requests.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherLibraryCard;