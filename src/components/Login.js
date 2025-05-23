import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData) throw new Error("User data not found");

      if (userData.status === "inactive" || userData.status === "deleted") {
        throw new Error("Your account has been deactivated. Please contact the administrator.");
      }

      if (userData.role === "student" && !user.emailVerified) {
        toast.error("Please verify your email before logging in.", { autoClose: 3000 });
        navigate("/verify-email");
        return;
      }

      const roleCollectionMap = {
        admin: "adminLog",
        teacher: "teacherLog",
        student: "studentLog",
      };

      const collectionName = roleCollectionMap[userData.role];
      const roleDoc = await getDoc(doc(db, collectionName, user.uid));
      const roleData = roleDoc.data();

      if (!roleData) throw new Error("Role-specific data not found");

      await updateDoc(doc(db, collectionName, user.uid), {
        lastLogin: new Date().toISOString(),
        lastLoginIP: window.clientInformation?.platform || "unknown",
        emailVerified: user.emailVerified,
      });

      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userData", JSON.stringify({
        ...roleData,
        lastLogin: new Date().toISOString(),
      }));

      toast.success(`Welcome back, ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}!`, { autoClose: 1500 });
      if (userData.role === "student") {
        const studentDoc = await getDoc(doc(db, "studentLog", user.uid));
        if (studentDoc.exists() && !studentDoc.data().profileComplete) {
          navigate("/student/profile");
        } else {
          navigate("/student/dashboard");
        }
      } else if (userData.role === "admin") {
        navigate("/admin/home");
      } else if (userData.role === "teacher") {
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      const errorMessage = error.message || "Invalid credentials. Try again.";
      if (errorMessage.includes("deactivated")) {
        setError(errorMessage);
        toast.error(errorMessage, { autoClose: 3000 });
      } else if (errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/wrong-password")) {
        setError("Invalid credentials. Try again.");
        toast.error("Login failed.", { autoClose: 1500 });
      } else {
        setError(errorMessage);
        toast.error("Login failed: " + errorMessage, { autoClose: 3000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => navigate("/signup");

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
              <h2 className="welcome-back">Welcome back</h2>
              <h3 className="auth-title">Login to your account</h3>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
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
                    disabled={isLoading}
                    autoComplete="current-password"
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
              </div>

              <button
                type="submit"
                className={`auth-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
                aria-label="Sign in"
              >
                {isLoading ? "Loading..." : "Login"}
              </button>
            </form>

            <div className="auth-footer">
              <button
                className="auth-link"
                onClick={handleSignupRedirect}
                disabled={isLoading}
                type="button"
                aria-label="Go to signup"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;