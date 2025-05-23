import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminIDCardManagement.css';
import SchoolLogo from '../../assets/School-logo.jpg';

const AdminIDCardManagement = () => {
    const [idCards, setIdCards] = useState([]);
    const [selectedIDCard, setSelectedIDCard] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const SCHOOL_LOGO = SchoolLogo;

    const fetchIDCards = useCallback(async () => {
        try {
            setIsLoading(true);
            const idCardsCollection = collection(db, 'student-id-cards');
            const idCardsSnapshot = await getDocs(idCardsCollection);
            const idCardsList = idCardsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIdCards(idCardsList);
        } catch (error) {
            toast.error('Error fetching ID cards: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIDCards();
    }, [fetchIDCards]);

    const filteredCards = useMemo(() => {
        let result = idCards;
        if (filter !== 'all') {
            result = result.filter(card => card.status === filter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(card =>
                card.studentName.toLowerCase().includes(query) ||
                card.uniqueID.toLowerCase().includes(query) ||
                card.rollNumber.toLowerCase().includes(query)
            );
        }
        return result;
    }, [idCards, filter, searchQuery]);

    const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
    const paginatedCards = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredCards.slice(startIndex, endIndex);
    }, [filteredCards, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setIsLoading(true);
            const idCardRef = doc(db, 'student-id-cards', id);
            await updateDoc(idCardRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            toast.success(`ID Card ${newStatus} successfully!`);
            fetchIDCards();
            if (selectedIDCard?.id === id) {
                setSelectedIDCard({ ...selectedIDCard, status: newStatus });
            }
        } catch (error) {
            toast.error('Error updating status: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDF = (idCard) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85.6, 54],
        });

        doc.html(document.getElementById(`id-card-${idCard.id}`), {
            callback: (pdf) => {
                pdf.save(`${idCard.uniqueID}.pdf`);
            },
            x: 0,
            y: 0,
            width: 85.6,
            windowWidth: 400,
        });
    };

    const bulkDownload = async () => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        const approvedCards = idCards.filter(card => card.status === 'approved');
        let yOffset = 10;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);

        for (let i = 0; i < approvedCards.length; i++) {
            const card = approvedCards[i];
            const cardElement = document.createElement('div');
            cardElement.id = `temp-id-card-${card.id}`;
            cardElement.className = 'id-card-preview';
            cardElement.innerHTML = `
                <div class="id-card-front">
                    <div class="school-header">
                        <img src="${SCHOOL_LOGO}" alt="School Logo" class="school-logo" />
                        <h3>${card.schoolName}</h3>
                    </div>
                    <div class="student-details">
                        <img src="${card.profilePicture}" alt="Student" class="profile-pic" />
                        <div class="info">
                            <p><strong>Name:</strong> ${card.studentName}</p>
                            <p><strong>Roll No:</strong> ${card.rollNumber}</p>
                            <p><strong>Class:</strong> ${card.class}</p>
                            <p><strong>ID:</strong> ${card.uniqueID}</p>
                            <p><strong>DOB:</strong> ${card.dob}</p>
                            <p><strong>Gender:</strong> ${card.gender}</p>
                            <p><strong>Parent:</strong> ${card.parentName}</p>
                            <p><strong>Parent Contact:</strong> ${card.parentContact}</p>
                            <p><strong>Emergency Contact:</strong> ${card.emergencyContactNumber}</p>
                        </div>
                    </div>
                    <div class="dates">
                        <p><strong>Issue:</strong> ${card.issueDate}</p>
                        <p><strong>Expiry:</strong> ${card.expiryDate}</p>
                    </div>
                </div>
            `;
            tempContainer.appendChild(cardElement);

            const canvas = await html2canvas(cardElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 85.6;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (yOffset + imgHeight > 270) {
                doc.addPage();
                yOffset = 10;
            }

            doc.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);
            yOffset += imgHeight + 10;

            tempContainer.removeChild(cardElement);
        }

        document.body.removeChild(tempContainer);
        doc.save('bulk-id-cards.pdf');
    };

    if (isLoading) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading...</span>
        </div>
    );

    return (
        <div className="admin-id-card-management">
            <h2>ID Card Management</h2>

            <div className="controls">
                <input
                    type="text"
                    placeholder="Search by name, ID, or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="reissue-requested">Reissue Requested</option>
                    <option value="all">All</option>
                </select>
                {filter === 'approved' && (
                    <button
                        onClick={bulkDownload}
                        disabled={!idCards.some(card => card.status === 'approved')}
                    >
                        Bulk Download Approved IDs
                    </button>
                )}
            </div>

            <div className="id-card-list">
                {paginatedCards.map(card => (
                    <div
                        key={card.id}
                        className="id-card-item"
                        onClick={() => setSelectedIDCard(card)}
                    >
                        <p>{card.studentName} - {card.uniqueID}</p>
                        <p className={`status-${card.status}`}>Status: {card.status}</p>
                    </div>
                ))}
                {/* No data messages for specific statuses */}
                {filter === 'pending' && filteredCards.length === 0 && !searchQuery && (
                    <p className="no-results">No pending ID cards available.</p>
                )}
                {filter === 'rejected' && filteredCards.length === 0 && !searchQuery && (
                    <p className="no-results">No rejected ID cards available.</p>
                )}
                {filter === 'reissue-requested' && filteredCards.length === 0 && !searchQuery && (
                    <p className="no-results">No reissue requested ID cards available.</p>
                )}
                {/* Existing search no-results message */}
                {searchQuery && filteredCards.length === 0 && (
                    <p className="no-results">No ID cards found matching your search.</p>
                )}
            </div>

            {filteredCards.length > ITEMS_PER_PAGE && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-button"
                    >
                        Next
                    </button>
                </div>
            )}

            {selectedIDCard && (
                <div className="id-card-modal">
                    <div className="id-card-details">
                        <div className="id-card-preview" id={`id-card-${selectedIDCard.id}`}>
                            <div className="id-card-front">
                                <div className="school-header">
                                    <img src={SCHOOL_LOGO} alt="School Logo" className="school-logo" />
                                    <h3>{selectedIDCard.schoolName}</h3>
                                </div>
                                <div className="student-details">
                                    <img
                                        src={selectedIDCard.profilePicture}
                                        alt="Student"
                                        className="profile-pic"
                                    />
                                    <div className="info">
                                        <p><strong>Name:</strong> {selectedIDCard.studentName}</p>
                                        <p><strong>Roll No:</strong> {selectedIDCard.rollNumber}</p>
                                        <p><strong>Class:</strong> {selectedIDCard.class}</p>
                                        <p><strong>ID:</strong> {selectedIDCard.uniqueID}</p>
                                        <p><strong>DOB:</strong> {selectedIDCard.dob}</p>
                                        <p><strong>Gender:</strong> {selectedIDCard.gender}</p>
                                        <p><strong>Parent:</strong> {selectedIDCard.parentName}</p>
                                        <p><strong>Parent Contact:</strong> {selectedIDCard.parentContact}</p>
                                        <p><strong>Emergency Contact:</strong> {selectedIDCard.emergencyContactNumber}</p>
                                    </div>
                                </div>
                                <div className="dates">
                                    <p><strong>Issue:</strong> {selectedIDCard.issueDate}</p>
                                    <p><strong>Expiry:</strong> {selectedIDCard.expiryDate}</p>
                                </div>
                            </div>
                        </div>

                        <div className="actions">
                            {selectedIDCard.status === 'pending' && (
                                <>
                                    <button onClick={() => handleStatusUpdate(selectedIDCard.id, 'approved')}>
                                        Approve
                                    </button>
                                    <button onClick={() => handleStatusUpdate(selectedIDCard.id, 'rejected')}>
                                        Reject
                                    </button>
                                </>
                            )}
                            {selectedIDCard.status === 'reissue-requested' && (
                                <>
                                    <button onClick={() => handleStatusUpdate(selectedIDCard.id, 'approved')}>
                                        Approve Reissue
                                    </button>
                                    <button onClick={() => handleStatusUpdate(selectedIDCard.id, 'rejected')}>
                                        Reject Reissue
                                    </button>
                                </>
                            )}
                            {selectedIDCard.status === 'approved' && (
                                <button onClick={() => generatePDF(selectedIDCard)}>
                                    Download PDF
                                </button>
                            )}
                            <button onClick={() => setSelectedIDCard(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIDCardManagement;