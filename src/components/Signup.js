import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength checker
  useEffect(() => {
    const calculateStrength = (pwd) => {
      let strength = 0;
      if (pwd.length >= 6) strength += 1;
      if (pwd.match(/[A-Z]/)) strength += 1;
      if (pwd.match(/[0-9]/)) strength += 1;
      if (pwd.match(/[^A-Za-z0-9]/)) strength += 1;
      setPasswordStrength(strength);
    };
    calculateStrength(password);
  }, [password]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        role,
        createdAt: new Date().toISOString(),
      });

      const collectionName = "studentLog";

      await setDoc(doc(db, collectionName, user.uid), {
        email,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: "active",
        profileComplete: false,
        emailVerified: false,
      });

      await sendEmailVerification(user);
      toast.info("A verification email has been sent to your email address. Please verify your email to continue.", {
        autoClose: 5000,
      });
      navigate("/verify-email");
    } catch (error) {
      setError(error.message);
      toast.error(error.message, { autoClose: 1500 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => navigate("/");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="auth-wrapper">
      {/* Add flowing lines for background effect */}
      <div className="flowing-line"></div>
      <div className="flowing-line"></div>
      <div className="flowing-line"></div>

      <div className="auth-split">
        <div className="auth-illustration">
          <div className="illustration-content">
            {/* Illustration content could go here if needed */}
          </div>
        </div>
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="welcome-back">Welcome Student</h2>
              <h3 className="auth-title">Create your account</h3>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Username</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder=""
                  disabled={isLoading}
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder=""
                    minLength="6"
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="toggle-password"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>
                {password && (
                  <div
                    className="password-strength"
                    data-strength={passwordStrength}
                    aria-label={`Password strength: ${passwordStrength} out of 4`}
                  ></div>
                )}
              </div>

              <button
                type="submit"
                className={`auth-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
                aria-label="Sign up"
              >
                {isLoading ? "Loading..." : "Create Account"}
              </button>
            </form>

            <div className="auth-footer">
              <button
                className="auth-link"
                onClick={handleLoginRedirect}
                disabled={isLoading}
                type="button"
                aria-label="Go to login"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;