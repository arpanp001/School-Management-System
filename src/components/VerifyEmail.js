import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "react-toastify";
import "./Login.css";

const VerifyEmail = () => {
    const navigate = useNavigate();

    const handleResendEmail = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await auth.currentUser.reload(); // Refresh user data
                if (user.emailVerified) {
                    toast.success("Email verified! Redirecting to login...", { autoClose: 1500 });
                    setTimeout(() => navigate("/"), 1500);
                } else {
                    await sendEmailVerification(user);
                    toast.success("Verification email resent. Please check your inbox.", { autoClose: 3000 });
                }
            } else {
                toast.error("No user is currently signed in.", { autoClose: 3000 });
                navigate("/signup");
            }
        } catch (error) {
            toast.error("Failed to resend verification email: " + error.message, { autoClose: 3000 });
        }
    };

    const handleLoginRedirect = () => navigate("/");

    return (
        <div className="auth-wrapper">
            <div className="auth-split">
                <div className="auth-content">
                    <div className="auth-card glass-effect tilt-effect" data-tilt>
                        <div className="auth-header">
                            <h2 className="auth-title chalkboard-title">Verify Your Email</h2>
                            <p className="auth-subtitle">Check your inbox to continue</p>
                        </div>
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                            <p>
                                We've sent a verification email to <strong>{auth.currentUser?.email || "your email"}</strong>.
                                Please click the link in the email to verify your account.
                            </p>
                            <button
                                className="captcha-button"
                                onClick={handleResendEmail}
                                style={{ marginTop: "1rem" }}
                            >
                                Resend Verification Email
                            </button>
                            <div className="auth-footer" style={{ marginTop: "1rem" }}>
                                <p>
                                    Already verified?{" "}
                                    <button
                                        className="auth-link"
                                        onClick={handleLoginRedirect}
                                        type="button"
                                        aria-label="Go to login"
                                    >
                                        Sign In
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="particle-background">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
};

export default VerifyEmail;