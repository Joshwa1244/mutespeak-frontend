import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthWindow from "../components/AuthWindow";
import FormField from "../components/FormField";
import Button from "../components/Button";

import {
  register,
  isInstitutionalEmail,
} from "../services/authService";


export default function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // New states to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");


  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------
  function validate() {

    const next = {};

    if (!name.trim()) {
      next.name = "Enter your name.";
    }

    if (!email.trim()) {
      next.email = "Enter your institutional email.";
    } else if (
      !isInstitutionalEmail(email)
    ) {
      next.email = "Only @loyolacollege.edu email addresses can register.";
    }

    if (!password) {
      next.password = "Choose a password.";
    } else if (
      password.length < 8
    ) {
      next.password = "Use at least 8 characters.";
    }

    if (
      confirmPassword !== password
    ) {
      next.confirmPassword = "Passwords don't match.";
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );

  }


  // -------------------------------------------------------------
  // REGISTER
  // -------------------------------------------------------------
  async function handleSubmit(e) {

    e.preventDefault();

    setFormError("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {

      /*
       * Backend /register handles:
       *
       * 1. Creating the user
       * 2. Hashing the password
       * 3. Generating the OTP
       * 4. Saving the OTP
       * 5. Sending the OTP email
       */
      await register({
        name: name.trim(),
        email: email
          .trim()
          .toLowerCase(),
        password,
      });

      /*
       * Registration succeeded.
       *
       * Only pass the email to the OTP page.
       * The actual OTP must never be passed
       * through frontend state.
       */
      navigate(
        "/verify-otp",
        {
          state: {
            email: email
              .trim()
              .toLowerCase(),
          },
        }
      );

    } catch (error) {

      setFormError(
        error.message || "Registration failed. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  }


  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (

    <div className="register-layout">

      {/* =========================================================
          PRODUCT INTRO
      ========================================================== */}
      <aside className="register-product-intro">
        <span className="register-product-eyebrow">
          Welcome to mutespeak;
        </span>

        <h2>
          Your college network,
          <br />
          in one place.
        </h2>

        <p>
          Join your verified college community
          to discover people, find classmates,
          share what&apos;s happening, and stay
          connected beyond your immediate circle.
        </p>

        <div className="register-product-points">

          <div className="register-product-point">
            <span>01</span>
            <p>
              Discover people across your college.
            </p>
          </div>

          <div className="register-product-point">
            <span>02</span>
            <p>
              Find classmates and grow your network.
            </p>
          </div>

          <div className="register-product-point">
            <span>03</span>
            <p>
              Share and connect with your campus community.
            </p>
          </div>

        </div>

        <p className="register-product-note">
          Real students. Real profiles.
          One college community.
        </p>
      </aside>

      {/* =========================================================
          REGISTRATION
      ========================================================== */}
      <div className="register-auth-section">
        <AuthWindow
          title="Register"
          subtitle="Only @loyolacollege.edu email addresses can create an account."
        >

          {formError && (
            <p className="banner-error">
              {formError}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            <FormField
              name="name"
              label="Name"
              placeholder="Your full name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              error={errors.name}
              autoComplete="name"
            />

            <FormField
              name="email"
              label="Institutional email"
              type="email"
              placeholder="yourname@loyolacollege.edu"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              error={errors.email}
              autoComplete="email"
            />


            {/* PASSWORD FIELD WITH TOGGLE BUTTON */}
            <div style={{ position: "relative" }}>
              <FormField
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                error={errors.password}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
                className="password-toggle-btn"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "32px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: "var(--ink-soft, #666)"
                }}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>


            {/* CONFIRM PASSWORD FIELD WITH TOGGLE BUTTON */}
            <div style={{ position: "relative" }}>
              <FormField
                name="confirmPassword"
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
                className="password-toggle-btn"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "32px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: "var(--ink-soft, #666)"
                }}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>


            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Sending code…"
                : "Send OTP"}
            </Button>

          </form>

          <p className="auth-switch">
            Already registered?{" "}
            <Link to="/">
              Log in
            </Link>
          </p>

        </AuthWindow>
      </div>

    </div>

  );

}