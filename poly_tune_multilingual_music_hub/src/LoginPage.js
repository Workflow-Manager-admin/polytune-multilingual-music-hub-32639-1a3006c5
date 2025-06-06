import React, { useState } from "react";
import "./App.css";

/**
 * LoginPage component for PolyTune
 * This page appears first, before any app features.
 * - Allows login via email/username and password.
 * - Shows validation and error/success feedback.
 * - Integrates with parent via onLogin (expects boolean true on auth).
 * - Placeholder for sign-up link.
 */
// PUBLIC_INTERFACE
function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ user: false, password: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple validation: required, and password at least 4 chars
  const validate = () => {
    if (!user || !password) return "All fields are required.";
    if (password.length < 4) return "Password must be at least 4 characters.";
    return "";
  };

  // Simulated authentication (no backend yet)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ user: true, password: true });
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate API/auth check: accept "test"/"password" or any non-empty for demo.
    setTimeout(() => {
      setLoading(false);
      if (user === "test" && password === "password") {
        setSuccess("Login successful.");
        setError("");
        if (onLogin) onLogin({ username: user });
      } else {
        setError("Incorrect username/email or password.");
        setSuccess("");
      }
    }, 1000);
  };

  const handleInput = (setter) => (e) => {
    setter(e.target.value);
    setError("");
    setSuccess("");
  };

  // PUBLIC_INTERFACE
  // Handles registration via a simple in-memory user approach
  const handleSignup = async (e) => {
    e.preventDefault();
    setTouched({ user: true, password: true });
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }
    setError("");
    setLoading(true);

    // Fake user registration: in a real app, replace with server-side API call.
    setTimeout(() => {
      setLoading(false);
      // For demo, treat "exists" if user is "test"
      if (user === "test") {
        setError("Username/email already taken.");
        setSuccess("");
      } else {
        setSuccess("Registration successful. You can now log in.");
        setError("");
      }
    }, 1000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#151d2b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "rgba(0, 35, 70, 0.15)",
        borderRadius: 12,
        padding: 36,
        width: 350,
        boxShadow: "0 4px 24px 0 rgba(10,30,50,0.25)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span style={{
            fontWeight: 800, fontSize: 28, color: "var(--base-light)", letterSpacing:1
          }}>
            PolyTune
          </span>
          <div style={{color:"var(--text-secondary)",fontSize:13,marginTop:4}}>
            Sign in to Multilingual Music Hub
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{
          display: "flex", flexDirection: "column", gap: 12
        }}>
          <input
            type="text"
            placeholder="Email or Username"
            value={user}
            autoComplete="username"
            onBlur={() => setTouched(t => ({ ...t, user: true }))}
            onChange={handleInput(setUser)}
            style={{
              padding: 10, borderRadius: 4, border: "1px solid var(--border-color)"
            }}
          />
          {touched.user && !user && (
            <div style={{ color: "#ff6a87", fontSize: 12 }}>This field is required.</div>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            onChange={handleInput(setPassword)}
            style={{
              padding: 10, borderRadius: 4, border: "1px solid var(--border-color)"
            }}
          />
          {touched.password && !password && (
            <div style={{ color: "#ff6a87", fontSize: 12 }}>This field is required.</div>
          )}
          <button
            className="btn btn-large"
            style={{ marginTop: 8 }}
            disabled={loading}
            type="submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <div style={{
              color: "#ff5270", marginTop: 8, fontSize: 13
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              color: "#57ff99", marginTop: 8, fontSize: 13
            }}>{success}</div>
          )}
        </form>
        <div style={{
          textAlign: "center",
          marginTop: 18,
        }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Don't have an account? </span>
          <a href="#signup" style={{
            color: "var(--base-light)", textDecoration: "underline", cursor: "pointer", fontWeight: 600
          }} onClick={handleSignup}
          >Sign up</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
