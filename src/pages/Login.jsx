import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import AuthWindow
  from "../components/AuthWindow";

import FormField
  from "../components/FormField";

import Button
  from "../components/Button";

import {
  login,
  saveToken,
  getCurrentUser,
  removeToken,
  isInstitutionalEmail,
} from "../services/authService";


export default function Login() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const successMessage =
    location.state?.message;


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    errors,
    setErrors,
  ] = useState({});


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    formError,
    setFormError,
  ] = useState("");


  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------

  function validate() {

    const next = {};


    if (
      !email.trim()
    ) {

      next.email =
        "Enter your institutional email.";

    } else if (
      !isInstitutionalEmail(
        email
      )
    ) {

      next.email =
        "Use your @loyolacollege.edu email address.";

    }


    if (
      !password
    ) {

      next.password =
        "Enter your password.";

    }


    setErrors(
      next
    );


    return (
      Object.keys(
        next
      ).length === 0
    );

  }


  // -------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------

  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    setFormError(
      ""
    );


    if (
      !validate()
    ) {

      return;

    }


    setSubmitting(
      true
    );


    try {


      // ---------------------------------------------------------
      // 1. AUTHENTICATE
      // ---------------------------------------------------------

      const result =
        await login({

          email:
            email
              .trim()
              .toLowerCase(),

          password,

        });


      /*
       * Expected:
       *
       * {
       *   token: "eyJ...",
       *   tokenType: "Bearer"
       * }
       */

      if (
        !result?.token
      ) {

        throw new Error(

          "Login succeeded but no authentication token was received."

        );

      }


      // ---------------------------------------------------------
      // 2. STORE JWT
      // ---------------------------------------------------------

      saveToken(
        result.token
      );


      // ---------------------------------------------------------
      // 3. FETCH AUTHENTICATED USER
      // ---------------------------------------------------------

      const user =
        await getCurrentUser();


      // ---------------------------------------------------------
      // 4. ROUTE USER
      // ---------------------------------------------------------

      if (
        user.profileCompleted
      ) {

        navigate(

          "/home",

          {
            replace: true,
          }

        );

      } else {

        navigate(

          "/complete-profile",

          {
            replace: true,
          }

        );

      }


    } catch (error) {


      /*
       * Don't leave a potentially unusable
       * JWT in localStorage.
       */

      removeToken();


      setFormError(

        error.message ||

        "Couldn't log in. Check your details and try again."

      );


    } finally {

      setSubmitting(
        false
      );

    }

  }


  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------

  return (

    <div className="login-page-layout">


      {/* =========================================================
          ABOUT MUTESPEAK

          Desktop:
          Appears beside the login card.

          Mobile:
          Appears below the login card.
      ========================================================== */}

      <aside className="login-about-section">


        <span className="login-about-label">

          What is this?!

        </span>


        <h1>

          Your college community,
          connected.

        </h1>


        <p className="login-about-intro">

          muteSpeak connects you with the people
          and community around your college.

        </p>


        <ul className="login-about-list">

          <li>

            Discover people across campus

          </li>


          <li>

            Connect with classmates and friends

          </li>


          <li>

            Explore people beyond your usual circle

          </li>


          <li>

            Share and join campus conversations

          </li>

        </ul>


        {/* -------------------------------------------------------
            IDENTITY / RESPONSIBILITY NOTICE
        -------------------------------------------------------- */}

        <div className="login-about-notice">

          <strong>

            Real people. Real responsibility.

          </strong>


          <p>

            mutespeak is not anonymous.
            Share thoughtfully, speak responsibly,
            and respect the person behind every profile.
            Consider Visting Terms Page .

          </p>

        </div>


        <Link

          to="/about"

          className="login-about-link"

        >

          Learn more about this.

          <span aria-hidden="true">

            →

          </span>

        </Link>


      </aside>


      {/* =========================================================
          LOGIN
      ========================================================== */}

      <div className="login-auth-section">


        <AuthWindow

          title="Log in"

          subtitle="Log in with your institutional mail address (@loyolacollege.edu)"

        >


          {/* -----------------------------------------------------
              SUCCESS
          ------------------------------------------------------ */}

          {successMessage && (

            <p className="banner-success">

              {successMessage}

            </p>

          )}


          {/* -----------------------------------------------------
              ERROR
          ------------------------------------------------------ */}

          {formError && (

            <p className="banner-error">

              {formError}

            </p>

          )}


          {/* -----------------------------------------------------
              LOGIN FORM
          ------------------------------------------------------ */}

          <form

            onSubmit={
              handleSubmit
            }

            noValidate

          >


            <FormField

              name="email"

              label="Institutional email"

              type="email"

              placeholder="yourname@loyolacollege.edu"

              value={
                email
              }

              onChange={(event) =>

                setEmail(
                  event.target.value
                )

              }

              error={
                errors.email
              }

              autoComplete="email"

            />


            <FormField

              name="password"

              label="Password"

              type="password"

              placeholder="••••••••"

              value={
                password
              }

              onChange={(event) =>

                setPassword(
                  event.target.value
                )

              }

              error={
                errors.password
              }

              autoComplete="current-password"

            />


            {/* ---------------------------------------------------
                FORGOT PASSWORD
            ---------------------------------------------------- */}

            <div className="auth-links-row">

              <Link

                to="/forgot-password"

                className="auth-link"

              >

                Forgot password?

              </Link>

            </div>


            {/* ---------------------------------------------------
                LOGIN BUTTON
            ---------------------------------------------------- */}

            <Button

              type="submit"

              disabled={
                submitting
              }

            >

              {submitting

                ? "Logging in…"

                : "Log in"}

            </Button>


          </form>


          {/* -----------------------------------------------------
              REGISTER
          ------------------------------------------------------ */}

          <p className="auth-switch">

            New user?{" "}

            <Link to="/register">

              Register

            </Link>

          </p>


        </AuthWindow>


      </div>


    </div>

  );

}