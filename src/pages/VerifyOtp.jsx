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

  const [submitting, setSubmitting] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [resent, setResent] =
    useState(false);


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

        <FormField
          name="otp"
          label="6-digit code"
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