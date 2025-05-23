import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from "../../firebase/config";
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import '../../pages/StudentPagesStyle/StudentIDCard.css';
import SchoolLogo from '../../assets/School-logo.jpg';

const StudentIDCard = () => {
    const [idCardData, setIdCardData] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const idCardRef = useRef(null);
    const user = auth.currentUser;
    const SCHOOL_NAME = "Education School";
    const SCHOOL_LOGO = SchoolLogo;

    const generateNewIDCard = useCallback(async (profileData) => {
        try {
            const uniqueID = `SID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const issueDate = new Date().toISOString().split('T')[0];
            const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split('T')[0];

            const idCardDetails = {
                studentName: profileData.name,
                profilePicture: profileData.profilePicture,
                rollNumber: profileData.rollNumber,
                class: profileData.class,
                schoolName: SCHOOL_NAME,
                dob: profileData.dob,
                gender: profileData.gender,
                parentName: profileData.parentName,
                parentContact: profileData.parentContact,
                emergencyContactNumber: profileData.emergencyContactNumber,
                issueDate,
                expiryDate,
                uniqueID,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            const idCardRef = doc(db, 'student-id-cards', user.uid);
            await setDoc(idCardRef, idCardDetails);
            setIdCardData(idCardDetails);
            setPreviewVisible(true);
            toast.success('ID Card generated successfully!');
        } catch (error) {
            toast.error('Error generating ID card: ' + error.message);
        }
    }, [user]);

    const fetchProfileAndGenerateID = useCallback(async () => {
        try {
            setIsLoading(true);
            const profileRef = doc(db, 'students-profile', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                const idCardRef = doc(db, 'student-id-cards', user.uid);
                const idCardSnap = await getDoc(idCardRef);

                if (!idCardSnap.exists()) {
                    await generateNewIDCard(profileData);
                } else {
                    const idCardData = idCardSnap.data();
                    await updateDoc(idCardRef, {
                        studentName: profileData.name,
                        profilePicture: profileData.profilePicture,
                        rollNumber: profileData.rollNumber,
                        class: profileData.class,
                        dob: profileData.dob,
                        gender: profileData.gender,
                        parentName: profileData.parentName,
                        parentContact: profileData.parentContact,
                        emergencyContactNumber: profileData.emergencyContactNumber,
                        updatedAt: new Date().toISOString(),
                    });
                    setIdCardData({
                        ...idCardData,
                        studentName: profileData.name,
                        profilePicture: profileData.profilePicture,
                        rollNumber: profileData.rollNumber,
                        class: profileData.class,
                        dob: profileData.dob,
                        gender: profileData.gender,
                        parentName: profileData.parentName,
                        parentContact: profileData.parentContact,
                        emergencyContactNumber: profileData.emergencyContactNumber,
                    });
                }
            }
        } catch (error) {
            toast.error('Error fetching profile: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user, generateNewIDCard]);

    useEffect(() => {
        if (user) {
            fetchProfileAndGenerateID();
        }
    }, [user, fetchProfileAndGenerateID]);

    const requestReissue = async () => {
        try {
            setIsLoading(true);
            const idCardRef = doc(db, 'student-id-cards', user.uid);
            await updateDoc(idCardRef, {
                status: 'reissue-requested',
                reissueRequestedAt: new Date().toISOString(),
            });
            toast.success('Reissue request submitted successfully!');
        } catch (error) {
            toast.error('Error requesting reissue: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPDF = () => {
        // Create PDF with landscape orientation to match ID card layout
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85.6, 54] // Standard ID card size
        });

        // Set background color
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 85.6, 54, 'F');

        // Add border around the card
        pdf.setDrawColor(0, 102, 204); // #0066cc
        pdf.setLineWidth(0.5);
        pdf.rect(1, 1, 83.6, 52);

        // School header with blue background
        pdf.setFillColor(0, 102, 204); // #0066cc
        pdf.rect(0, 0, 85.6, 12, 'F');

        // Add school logo
        try {
            pdf.addImage(SCHOOL_LOGO, 'JPEG', 15, 2, 8, 8);
        } catch (error) {
            console.error("Error adding school logo:", error);
        }

        // Add school name
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(SCHOOL_NAME, 30, 7);

        // Student details section
        try {
            // Profile picture
            pdf.addImage(idCardData.profilePicture, 'JPEG', 5, 15, 20, 25);
        } catch (error) {
            console.error("Error adding profile picture:", error);
            // Fallback - draw a placeholder rectangle
            pdf.setDrawColor(150, 150, 150);
            pdf.setFillColor(240, 240, 240);
            pdf.rect(5, 15, 20, 25, 'FD');
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.text("Photo", 15, 27.5);
        }

        // Student information
        const infoX = 30;
        let infoY = 18;

        // Student name
        pdf.setTextColor(0, 51, 102); // #003366
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(idCardData.studentName, infoX, infoY);
        infoY += 5;

        // Student details
        pdf.setTextColor(68, 68, 68); // #444
        pdf.setFontSize(8);

        const details = [
            { label: "Roll No:", value: idCardData.rollNumber },
            { label: "Class:", value: idCardData.class },
            { label: "ID:", value: idCardData.uniqueID },
            { label: "DOB:", value: idCardData.dob },
            { label: "Gender:", value: idCardData.gender },
            { label: "Parent:", value: idCardData.parentName }
        ];

        details.forEach(item => {
            pdf.setFont("helvetica", "bold");
            pdf.text(item.label, infoX, infoY);
            pdf.setFont("helvetica", "normal");
            pdf.text(item.value, infoX + 15, infoY);
            infoY += 4;
        });

        // Contact section
        infoY += 1;
        pdf.setDrawColor(224, 224, 224); // #e0e0e0
        pdf.setLineWidth(0.2);
        pdf.line(infoX, infoY - 2, 80, infoY - 2);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(85, 85, 85); // #555
        pdf.text("Contact Details", infoX, infoY);
        infoY += 3;

        pdf.setFont("helvetica", "normal");
        pdf.text(`Parent: ${idCardData.parentContact}`, infoX, infoY);
        infoY += 3;
        pdf.text(`Emergency: ${idCardData.emergencyContactNumber}`, infoX, infoY);

        // Dates section at bottom
        pdf.setFillColor(240, 240, 245); // #f0f0f5
        pdf.rect(0, 45, 85.6, 9, 'F');

        pdf.setDrawColor(0, 102, 204); // #0066cc
        pdf.setLineWidth(0.3);
        pdf.line(0, 45, 85.6, 45);

        pdf.setTextColor(51, 51, 51); // #333
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text("Issue:", 5, 49);
        pdf.setFont("helvetica", "normal");
        pdf.text(idCardData.issueDate, 15, 49);

        pdf.setFont("helvetica", "bold");
        pdf.text("Expiry:", 50, 49);
        pdf.setFont("helvetica", "normal");
        pdf.text(idCardData.expiryDate, 62, 49);

        // Save the PDF with student name
        pdf.save(`${idCardData.studentName}_ID_Card.pdf`);
    };

    if (isLoading) return <div className="loading">Loading...</div>;
    if (!idCardData) return <div className="no-data">No ID card available</div>;

    return (
        <div className="id-card-container">
            <h2>Your Student ID Card</h2>

            <div className="id-card-wrapper" ref={idCardRef}>
                <div className="id-card-front">
                    <div className="school-header">
                        <img src={SCHOOL_LOGO} alt="School Logo" className="school-logo" />
                        <h3>{SCHOOL_NAME}</h3>
                    </div>
                    <div className="student-details">
                        <img
                            src={idCardData.profilePicture}
                            alt="Student"
                            className="profile-pic"
                        />
                        <div className="info">
                            <p className="student-name">{idCardData.studentName}</p>
                            <p><strong>Roll No:</strong> {idCardData.rollNumber}</p>
                            <p><strong>Class:</strong> {idCardData.class}</p>
                            <p><strong>ID:</strong> {idCardData.uniqueID}</p>
                            <p><strong>DOB:</strong> {idCardData.dob}</p>
                            <p><strong>Gender:</strong> {idCardData.gender}</p>
                            <p><strong>Parent:</strong> {idCardData.parentName}</p>

                            <div className="contact-section">
                                <h4>Contact Details</h4>
                                <p><strong>Parent:</strong> {idCardData.parentContact}</p>
                                <p><strong>Emergency:</strong> {idCardData.emergencyContactNumber}</p>
                            </div>
                        </div>
                    </div>
                    <div className="dates">
                        <p><strong>Issue:</strong> {idCardData.issueDate}</p>
                        <p><strong>Expiry:</strong> {idCardData.expiryDate}</p>
                    </div>
                </div>
            </div>

            {previewVisible && (
                <div className="preview-actions">
                    <p>Please wait for admin approval</p>
                </div>
            )}

            {!previewVisible && (
                <div className="id-card-actions">
                    <button onClick={downloadPDF} disabled={idCardData.status !== 'approved'}>
                        Download PDF
                    </button>
                    <button onClick={requestReissue} disabled={isLoading}>
                        {isLoading ? 'Requesting...' : 'Request Reissue'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentIDCard;