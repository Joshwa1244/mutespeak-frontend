import { useState } from "react";
import {
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

import AuthWindow from "../components/AuthWindow";
import FormField from "../components/FormField";
import Button from "../components/Button";

import {
  verifyOtp,
  resendOtp,
} from "../services/authService";

export default function VerifyOtp() {

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // New state to toggle OTP visibility
  const [showOtp, setShowOtp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);


  // User should reach this page through registration.
  if (!email) {
    return (
      <Navigate
        to="/register"
        replace
      />
    );
  }


  async function handleSubmit(e) {

    e.preventDefault();

    setError("");
    setResent(false);

    if (otp.trim().length !== 6) {
      setError(
        "Enter the 6-digit verification code."
      );
      return;
    }

    setSubmitting(true);

    try {

      await verifyOtp(
        email,
        otp.trim()
      );

      /*
       * OTP verified successfully.
       *
       * Backend has now changed:
       *
       * verified = true
       */

      navigate("/", {
        state: {
          message:
            "Email verified — you can log in now.",
        },
      });

    } catch (error) {

      setError(
        error.message ||
          "Verification failed. Please try again."
      );

    } finally {

      setSubmitting(false);

    }
  }


  async function handleResend() {

    setError("");
    setResent(false);
    setResending(true);

    try {

      await resendOtp(email);

      setResent(true);

      // Clear previous OTP because it is now invalid.
      setOtp("");

    } catch (error) {

      setError(
        error.message ||
          "Couldn't resend the verification code."
      );

    } finally {

      setResending(false);

    }
  }


  return (

    <AuthWindow
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}.`}
    >

      {error && (
        <p className="banner-error">
          {error}
        </p>
      )}


      {resent && (
        <p className="banner-success">
          A new verification code was sent.
        </p>
      )}


      <form
        onSubmit={handleSubmit}
        noValidate
      >

        {/* OTP FIELD WITH TOGGLE BUTTON */}
        <div style={{ position: "relative" }}>
          <FormField
            name="otp"
            label="6-digit code"
            type={showOtp ? "text" : "password"}
            placeholder="123456"
            value={otp}
            onChange={(e) =>
              setOtp(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            maxLength={6}
            autoComplete="one-time-code"
            inputMode="numeric"
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


        <Button
          type="submit"
          disabled={
            submitting ||
            otp.length !== 6
          }
        >

          {submitting
            ? "Verifying…"
            : "Verify & finish registration"}

        </Button>


        <Button
          type="button"
          variant="secondary"
          onClick={handleResend}
          disabled={resending}
        >

          {resending
            ? "Resending…"
            : "Resend code"}

        </Button>

      </form>

    </AuthWindow>

  );
}