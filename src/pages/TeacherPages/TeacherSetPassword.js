import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { db } from "../../firebase/config";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";

const TeacherSetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { tempPassword } = useParams();
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            // Find teacher with this temp password
            const teachersRef = collection(db, "teacherLog");
            const q = query(teachersRef, where("tempPassword", "==", tempPassword));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("Invalid or expired password setup link");
            }

            const teacherDoc = snapshot.docs[0];
            const teacherData = teacherDoc.data();

            // Check if the link has expired
            const now = new Date();
            const expiresAt = new Date(teacherData.expiresAt);
            if (now > expiresAt) {
                // Mark account as inactive if expired
                await updateDoc(doc(db, "teacherLog", teacherDoc.id), { status: "inactive" });
                await updateDoc(doc(db, "users", teacherDoc.id), { status: "inactive" });
                throw new Error("This password setup link has expired. Please contact the admin.");
            }

            // Check if password has already been set
            if (teacherData.passwordSet) {
                throw new Error("This password setup link has already been used. Please contact the admin for assistance.");
            }

            // Sign in with temporary credentials
            const userCredential = await signInWithEmailAndPassword(
                auth,
                teacherData.email,
                tempPassword
            );
            const user = userCredential.user;

            // Update password
            await updatePassword(user, newPassword);

            // Update teacher status and mark password as set
            await updateDoc(doc(db, "teacherLog", teacherDoc.id), {
                tempPassword: null,
                status: "active",
                emailVerified: true,
                passwordSet: true, // Mark password as set
            });

            await updateDoc(doc(db, "users", teacherDoc.id), {
                tempPassword: null,
                status: "active",
                passwordSet: true,
            });

            toast.success("Password set successfully! Please login.");
            navigate("/teacher/dashboard");
        } catch (error) {
            toast.error("Error setting password: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-content">
                <div className="auth-card glass-effect">
                    <h2 className="auth-title">Set Your Password</h2>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="form-input"
                                required
                                minLength="6"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-input"
                                required
                                minLength="6"
                            />
                        </div>
                        <button
                            type="submit"
                            className="auth-button"
                            disabled={isLoading}
                        >
                            {isLoading ? "Setting..." : "Set Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeacherSetPassword;