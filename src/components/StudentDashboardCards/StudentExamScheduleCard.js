import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import '../StudentDashboardCardsCss/StudentExamScheduleCard.css';

const StudentExamScheduleCard = () => {
    const [recentBooks, setRecentBooks] = useState([]);
    const [bookRequests, setBookRequests] = useState([]);
    const [booksMap, setBooksMap] = useState({});
    const [overdueCount, setOverdueCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) {
                console.log('No user logged in');
                setError('Please log in to view library activity');
                setLoading(false);
                return;
            }
            console.log('Logged-in user UID:', user.uid);

            try {
                // Fetch all books to create a lookup map for titles
                const booksSnapshot = await getDocs(collection(db, 'books'));
                const booksData = booksSnapshot.docs.reduce((acc, doc) => {
                    acc[doc.id] = doc.data();
                    return acc;
                }, {});
                console.log('Books map:', booksData);
                setBooksMap(booksData);

                // Fetch three most recently added books
                const booksQuery = query(
                    collection(db, 'books'),
                    // orderBy('createdAt', 'desc'), // Temporarily remove to avoid index requirement
                    // limit(3)
                );
                const booksSnap = await getDocs(booksQuery);
                const booksList = booksSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                console.log('All books:', booksList);
                // Sort client-side and take the top 3
                const recentBooksList = booksList
                    .filter(book => book.createdAt) // Ensure createdAt exists
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3);
                console.log('Recent books (after sorting):', recentBooksList);
                setRecentBooks(recentBooksList);

                // Fetch overdue books count
                const issuedQuery = query(
                    collection(db, 'issuedBooks'),
                    where('userId', '==', user.uid),
                    where('returned', '==', false)
                );
                const issuedSnap = await getDocs(issuedQuery);
                const today = new Date();
                const overdueBooks = issuedSnap.docs.filter(doc => {
                    const dueDate = new Date(doc.data().dueDate);
                    return dueDate < today;
                });
                console.log('Overdue books:', overdueBooks);
                setOverdueCount(overdueBooks.length);

                // Fetch book requests without orderBy to avoid index requirement
                const requestsQuery = query(
                    collection(db, 'bookRequests'),
                    where('userId', '==', user.uid)
                );
                const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
                    const requestsList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    console.log('All book requests:', requestsList);
                    // Sort client-side and take the top 3
                    const sortedRequests = requestsList
                        .filter(request => request.createdAt) // Ensure createdAt exists
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 3);
                    console.log('Sorted book requests (top 3):', sortedRequests);
                    setBookRequests(sortedRequests);
                }, (err) => {
                    console.error('Error listening to book requests:', err);
                    setError('Failed to load book requests: ' + err.message);
                });

                // Cleanup listener on unmount
                return () => unsubscribe();
            } catch (err) {
                console.error('Error fetching library data:', err);
                setError('Failed to load library activity: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="student-exam-schedule-card" aria-live="polite" aria-busy="true">
                <h2>Library Activity</h2>
                <p>Loading library activity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-exam-schedule-card">
                <h2>Library Activity</h2>
                <p className="error">{error}</p>
            </div>
        );
    }

    return (
        <div className="student-exam-schedule-card" role="region" aria-label="Student library activity">
            <h2>Library Activity</h2>

            <div className="activity-section">
                <h3 className="recent-books">Recently Added Books</h3>
                {recentBooks.length > 0 ? (
                    <ul>
                        {recentBooks.map(book => (
                            <li key={book.id}>
                                <span>{book.title}</span>
                                <span>{book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-data">No recent books added.</p>
                )}
            </div>

            <div className="activity-section">
                <h3 className="book-requests">Recent Book Requests</h3>
                {bookRequests.length > 0 ? (
                    <ul>
                        {bookRequests.map(request => (
                            <li key={request.id}>
                                <span>{booksMap[request.bookId]?.title || 'Unknown'}</span>
                                <span className={`status status-${request.status}`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-data">No recent book requests.</p>
                )}
            </div>

            <div className="activity-section">
                <h3 className="overdue-books">Overdue Books</h3>
                <p className={overdueCount > 0 ? 'overdue-count' : ''}>
                    {overdueCount} {overdueCount === 1 ? 'book' : 'books'} overdue
                </p>
            </div>
        </div>
    );
};

export default StudentExamScheduleCard;