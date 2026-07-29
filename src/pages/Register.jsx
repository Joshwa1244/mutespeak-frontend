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


  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [errors, setErrors] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------

  function validate() {

    const next = {};


    if (!name.trim()) {

      next.name =
        "Enter your name.";

    }


    if (!email.trim()) {

      next.email =
        "Enter your institutional email.";

    } else if (
      !isInstitutionalEmail(email)
    ) {

      next.email =
        "Only @loyolacollege.edu email addresses can register.";

    }


    if (!password) {

      next.password =
        "Choose a password.";

    } else if (
      password.length < 8
    ) {

      next.password =
        "Use at least 8 characters.";

    }


    if (
      confirmPassword !== password
    ) {

      next.confirmPassword =
        "Passwords don't match.";

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

        name:
          name.trim(),

        email:
          email
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

            email:
              email
                .trim()
                .toLowerCase(),

          },

        }

      );


    } catch (error) {

      setFormError(

        error.message ||

        "Registration failed. Please try again."

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


            <FormField

              name="password"

              label="Password"

              type="password"

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


            <FormField

              name="confirmPassword"

              label="Confirm password"

              type="password"

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