import { useState } from "react";
import { Link } from "react-router-dom";

import AuthWindow from "../components/AuthWindow";
import FormField from "../components/FormField";
import Button from "../components/Button";

import {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
  isInstitutionalEmail,
} from "../services/authService";

// ---------------------------------------------------------------
// FORGOT PASSWORD
//
// STEP 1
// Email
//
// STEP 2
// OTP verification
//
// STEP 3
// New password
//
// STEP 4
// Success
// ---------------------------------------------------------------

export default function ForgotPassword() {

  // -------------------------------------------------------------
  // FLOW STATE
  // -------------------------------------------------------------
  const [step, setStep] = useState("email");

  // -------------------------------------------------------------
  // FORM STATE
  // -------------------------------------------------------------
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // -------------------------------------------------------------
  // UI STATE
  // -------------------------------------------------------------
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New toggle states for visibility
  const [showOtp, setShowOtp] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -------------------------------------------------------------
  // STEP 1
  // REQUEST PASSWORD RESET OTP
  // -------------------------------------------------------------
  async function handleRequestOtp(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    // -----------------------------------------------------------
    // VALIDATE EMAIL
    // -----------------------------------------------------------
    if (!cleanEmail) {
      setError("Enter your institutional email.");
      return;
    }

    if (!isInstitutionalEmail(cleanEmail)) {
      setError("Use your @loyolacollege.edu email address.");
      return;
    }

    setSubmitting(true);

    try {
      await requestPasswordReset(cleanEmail);

      /*
       * Store normalized email for the next step.
       */
      setEmail(cleanEmail);

      /*
       * Always move to OTP verification.
       *
       * Backend intentionally does not reveal whether
       * the account exists.
       */
      setStep("otp");
      setMessage(
        "If an account exists for this email, a verification code has been sent."
      );
    } catch (error) {
      setError(error.message || "Couldn't send the verification code.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // STEP 2
  // VERIFY RESET OTP
  // -------------------------------------------------------------
  async function handleVerifyOtp(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setMessage("");

    const cleanOtp = otp.trim();

    // -----------------------------------------------------------
    // VALIDATE OTP
    // -----------------------------------------------------------
    if (!cleanOtp) {
      setError("Enter the verification code.");
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await verifyResetOtp(email, cleanOtp);

      // ---------------------------------------------------------
      // VERIFY RESET TOKEN RESPONSE
      // ---------------------------------------------------------
      if (!response?.resetToken) {
        throw new Error(
          "Password reset authorization could not be created. Please try again."
        );
      }

      /*
       * Keep resetToken only in React memory.
       *
       * Do NOT store it in localStorage.
       */
      setResetToken(response.resetToken);

      /*
       * OTP is no longer needed after verification.
       */
      setOtp("");
      setStep("password");
    } catch (error) {
      setError(error.message || "The verification code is invalid.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // STEP 3
  // RESET PASSWORD
  // -------------------------------------------------------------
  async function handleResetPassword(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setMessage("");

    // -----------------------------------------------------------
    // VALIDATE PASSWORD
    // -----------------------------------------------------------
    if (!newPassword) {
      setError("Enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword.length > 100) {
      setError("Password must not exceed 100 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Your password reset session has expired. Please start again.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(resetToken, newPassword);

      // ---------------------------------------------------------
      // CLEAR SENSITIVE STATE
      // ---------------------------------------------------------
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      // ---------------------------------------------------------
      // SUCCESS
      // ---------------------------------------------------------
      setStep("success");
    } catch (error) {
      setError(error.message || "Couldn't reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // RESEND / RESTART OTP
  //
  // Because requesting another OTP invalidates the previous OTP
  // and any previous reset token on the backend, we call the
  // forgot-password endpoint again.
  // -------------------------------------------------------------
  async function handleResendOtp() {
    if (submitting) {
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await requestPasswordReset(email);

      setOtp("");
      setMessage("A new verification code has been requested.");
    } catch (error) {
      setError(error.message || "Couldn't resend the verification code.");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // CHANGE EMAIL
  //
  // Returns to Step 1.
  // -------------------------------------------------------------
  function handleChangeEmail() {
    if (submitting) {
      return;
    }

    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
    setStep("email");
  }

  // -------------------------------------------------------------
  // AUTH WINDOW CONTENT
  // -------------------------------------------------------------
  return (
    <AuthWindow
      title={getTitle(step)}
      subtitle={getSubtitle(step, email)}
    >
      {/* =======================================================
          SUCCESS MESSAGE
      ======================================================== */}
      {message && (
        <p className="banner-success">
          {message}
        </p>
      )}

      {/* =======================================================
          GENERAL ERROR
      ======================================================== */}
      {error && (
        <p className="banner-error">
          {error}
        </p>
      )}

      {/* =======================================================
          STEP 1
          ENTER EMAIL
      ======================================================== */}
      {step === "email" && (
        <form onSubmit={handleRequestOtp} noValidate>
          <FormField
            name="email"
            label="Institutional email"
            type="email"
            placeholder="yourname@loyolacollege.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send verification code"}
          </Button>
        </form>
      )}

      {/* =======================================================
          STEP 2
          VERIFY OTP
      ======================================================== */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} noValidate>
          
          <div style={{ position: "relative" }}>
            <FormField
              name="otp"
              label="Verification code"
              type={showOtp ? "text" : "password"}
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(event) => {
                /*
                 * Allow digits only.
                 */
                const value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);
                setOtp(value);
              }}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              onClick={() => setShowOtp(!showOtp)}
              aria-label={showOtp ? "Hide OTP" : "Show OTP"}
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
              {showOtp ? (
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

          <Button type="submit" disabled={submitting || otp.length !== 6}>
            {submitting ? "Verifying…" : "Verify code"}
          </Button>

          <div className="auth-switch">
            <button
              type="button"
              className="auth-link-button"
              onClick={handleResendOtp}
              disabled={submitting}
            >
              Resend code
            </button>
            <span>{" · "}</span>
            <button
              type="button"
              className="auth-link-button"
              onClick={handleChangeEmail}
              disabled={submitting}
            >
              Change email
            </button>
          </div>
        </form>
      )}

      {/* =======================================================
          STEP 3
          NEW PASSWORD
      ======================================================== */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} noValidate>
          
          <div style={{ position: "relative" }}>
            <FormField
              name="newPassword"
              label="New password"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
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
              {showNewPassword ? (
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

          <div style={{ position: "relative" }}>
            <FormField
              name="confirmPassword"
              label="Confirm new password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter your new password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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

          <Button type="submit" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}

      {/* =======================================================
          STEP 4
          SUCCESS
      ======================================================== */}
      {step === "success" && (
        <div className="forgot-password-success">
          <p className="banner-success">
            Your password has been reset successfully.
          </p>
          <p>
            You can now sign in using your new password.
          </p>
          <Link to="/" className="auth-primary-link">
            Back to login
          </Link>
        </div>
      )}

      {/* =======================================================
          BACK TO LOGIN

          Hidden on final success because success already has
          its own login link.
      ======================================================== */}
      {step !== "success" && (
        <p className="auth-switch">
          <Link to="/">
            Back to login
          </Link>
        </p>
      )}

    </AuthWindow>
  );
}

// ---------------------------------------------------------------
// PAGE TITLE
// ---------------------------------------------------------------
function getTitle(step) {
  switch (step) {
    case "otp":
      return "Check your email";
    case "password":
      return "Create a new password";
    case "success":
      return "Password updated";
    default:
      return "Reset your password";
  }
}

// ---------------------------------------------------------------
// PAGE SUBTITLE
// ---------------------------------------------------------------
function getSubtitle(step, email) {
  switch (step) {
    case "otp":
      return `Enter the verification code sent to ${email}.`;
    case "password":
      return "Choose a new password for your account.";
    case "success":
      return "Your account is ready to use again.";
    default:
      return "Enter your institutional email and we'll send you a verification code.";
  }
}