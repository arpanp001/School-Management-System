import React, { useState } from "react";
import { db } from "../../firebase/config";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";
import '../../pages/AdminPagesStyle/AdminTeacherManagement.css';

const AdminTeacherManagement = () => {
    const [teacherData, setTeacherData] = useState({
        fullName: "",
        age: "",
        department: "",
        phone: "",
        address: "",
        personalEmail: "",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const auth = getAuth();

    const validateForm = () => {
        const newErrors = {};

        // Full Name validation
        if (!teacherData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (teacherData.fullName.length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        // Age validation
        if (!teacherData.age) {
            newErrors.age = "Age is required";
        } else if (isNaN(teacherData.age) || teacherData.age < 18 || teacherData.age > 100) {
            newErrors.age = "Age must be between 18 and 100";
        }

        // Department validation
        if (!teacherData.department.trim()) {
            newErrors.department = "Department is required";
        }

        // Phone validation
        if (!teacherData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\+?[\d\s-]{10,}$/.test(teacherData.phone)) {
            newErrors.phone = "Invalid phone number format";
        }

        // Address validation
        if (!teacherData.address.trim()) {
            newErrors.address = "Address is required";
        } else if (teacherData.address.length < 5) {
            newErrors.address = "Address must be at least 5 characters";
        }

        // Email validation
        if (!teacherData.personalEmail.trim()) {
            newErrors.personalEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherData.personalEmail)) {
            newErrors.personalEmail = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setTeacherData({ ...teacherData, [e.target.name]: e.target.value });
        // Clear error for the field being edited
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const generateTeacherEmail = (fullName) => {
        const baseEmail = fullName.toLowerCase().replace(/\s+/g, ".");
        return `${baseEmail}@school.edu`;
    };

    const sendTeacherEmail = async (teacherEmail, personalEmail, fullName, passwordLink, dashboardLink) => {
        const templateParams = {
            to_email: personalEmail,
            teacher_name: fullName,
            generated_email: teacherEmail,
            password_link: passwordLink,
            dashboard_link: dashboardLink,
            from_name: "School Admin",
        };

        try {
            await emailjs.send(
                "service_l0fenxj",
                "template_tdsymj8",
                templateParams,
                "sss-GrBLqM_2bdune"
            );
            return true;
        } catch (error) {
            console.error("Email sending failed:", error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the form errors");
            return;
        }

        setIsLoading(true);

        try {
            const teacherEmail = generateTeacherEmail(teacherData.fullName);
            const tempPassword = uuidv4().slice(0, 8);
            const passwordLink = `${window.location.origin}/teacher/set-password/${tempPassword}`;
            const dashboardLink = `${window.location.origin}/teacher/dashboard`;

            const userCredential = await createUserWithEmailAndPassword(auth, teacherEmail, tempPassword);
            const user = userCredential.user;

            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const teacherDataToStore = {
                ...teacherData,
                email: teacherEmail,
                role: "teacher",
                createdAt: new Date().toISOString(),
                status: "pending",
                tempPassword: tempPassword,
                expiresAt: expiresAt,
                passwordSet: false,
            };

            await setDoc(doc(db, "users", user.uid), teacherDataToStore);
            await setDoc(doc(db, "teacherLog", user.uid), {
                ...teacherDataToStore,
                userId: user.uid,
                profileComplete: false,
                emailVerified: false,
            });

            const emailSent = await sendTeacherEmail(
                teacherEmail,
                teacherData.personalEmail,
                teacherData.fullName,
                passwordLink,
                dashboardLink
            );

            if (emailSent) {
                toast.success("Teacher created successfully! Email sent to teacher.");
                setTeacherData({
                    fullName: "",
                    age: "",
                    department: "",
                    phone: "",
                    address: "",
                    personalEmail: "",
                });
                setErrors({});
            } else {
                throw new Error("Failed to send email");
            }
        } catch (error) {
            toast.error("Error creating teacher: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-teacher-management-container">
            <h2 className="admin-teacher-management-title">Add New Teacher</h2>
            <form onSubmit={handleSubmit} className="teacher-form">
                <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={teacherData.fullName}
                        onChange={handleChange}
                        className={`form-input ${errors.fullName ? 'error' : ''}`}
                        required
                    />
                    {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="age">Age</label>
                    <input
                        type="number"
                        id="age"
                        name="age"
                        value={teacherData.age}
                        onChange={handleChange}
                        className={`form-input ${errors.age ? 'error' : ''}`}
                        required
                    />
                    {errors.age && <span className="error-message">{errors.age}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                        type="text"
                        id="department"
                        name="department"
                        value={teacherData.department}
                        onChange={handleChange}
                        className={`form-input ${errors.department ? 'error' : ''}`}
                        required
                    />
                    {errors.department && <span className="error-message">{errors.department}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={teacherData.phone}
                        onChange={handleChange}
                        className={`form-input ${errors.phone ? 'error' : ''}`}
                        required
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={teacherData.address}
                        onChange={handleChange}
                        className={`form-input ${errors.address ? 'error' : ''}`}
                        required
                    />
                    {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="personalEmail">Teacher's Email</label>
                    <input
                        type="email"
                        id="personalEmail"
                        name="personalEmail"
                        value={teacherData.personalEmail}
                        onChange={handleChange}
                        className={`form-input ${errors.personalEmail ? 'error' : ''}`}
                        required
                    />
                    {errors.personalEmail && <span className="error-message">{errors.personalEmail}</span>}
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Teacher"}
                </button>
            </form>
        </div>
    );
};

export default AdminTeacherManagement;