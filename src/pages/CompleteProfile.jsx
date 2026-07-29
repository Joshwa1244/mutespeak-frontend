import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthWindow from "../components/AuthWindow";
import FormField from "../components/FormField";
import Button from "../components/Button";

import {
  getCurrentUser,
  updateProfile,
  logout
} from "../services/authService";


export default function CompleteProfile() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [bio, setBio] = useState("");

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);


  // -------------------------------------------------------------
  // LOAD CURRENT USER
  // -------------------------------------------------------------

  useEffect(() => {

    async function loadUser() {

      try {

        const user = await getCurrentUser();

        /*
         * Registration already collected the user's name,
         * so pre-fill it here.
         */
        setName(user.name || "");


        /*
         * If profile is already completed,
         * the user should not remain on onboarding.
         */
        if (user.profileCompleted) {

          navigate(
            "/home",
            { replace: true }
          );

          return;
        }

      } catch {

        /*
         * Invalid / expired JWT.
         */
        logout();

        navigate(
          "/",
          {
            replace: true,

            state: {
              message:
                "Please log in to continue."
            }
          }
        );

      } finally {

        setLoading(false);

      }
    }


    loadUser();

  }, [navigate]);


  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------

  function validate() {

    const next = {};


    if (!name.trim()) {

      next.name =
        "Enter your name.";

    }


    if (!department.trim()) {

      next.department =
        "Enter your department.";

    }


    if (!course.trim()) {

      next.course =
        "Enter your course.";

    }


    if (!batchYear) {

      next.batchYear =
        "Enter your graduation year.";

    } else {

      const year =
        Number(batchYear);

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {

        next.batchYear =
          "Enter a valid year.";

      }

    }


    if (bio.length > 500) {

      next.bio =
        "Bio cannot exceed 500 characters.";

    }


    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  }


  // -------------------------------------------------------------
  // SUBMIT PROFILE
  // -------------------------------------------------------------

  async function handleSubmit(e) {

    e.preventDefault();

    setFormError("");


    if (!validate()) {
      return;
    }


    setSubmitting(true);


    try {

      await updateProfile({

        name:
          name.trim(),

        department:
          department.trim(),

        course:
          course.trim(),

        batchYear:
          Number(batchYear),

        bio:
          bio.trim()

      });


      /*
       * Profile successfully completed.
       */

      navigate(
        "/home",
        { replace: true }
      );


    } catch (error) {

      setFormError(

        error.message ||

        "Couldn't save your profile. Please try again."

      );

    } finally {

      setSubmitting(false);

    }
  }


  // -------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------

  if (loading) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Inter, sans-serif"
        }}
      >

        Loading profile...

      </div>

    );

  }


  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------

  return (

    <AuthWindow
      title="Complete your profile"
      subtitle="Tell other students a little about yourself."
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
            setName(e.target.value)
          }

          error={errors.name}

          autoComplete="name"

        />


        <FormField

          name="department"

          label="Department"

          placeholder="e.g. Computer Science"

          value={department}

          onChange={(e) =>
            setDepartment(
              e.target.value
            )
          }

          error={errors.department}

        />


        <FormField

          name="course"

          label="Course"

          placeholder="e.g. B.Sc Computer Science"

          value={course}

          onChange={(e) =>
            setCourse(
              e.target.value
            )
          }

          error={errors.course}

        />


        <FormField

          name="batchYear"

          label="Graduation year"

          type="number"

          placeholder="2026"

          value={batchYear}

          onChange={(e) =>
            setBatchYear(
              e.target.value
            )
          }

          error={errors.batchYear}

          inputMode="numeric"

        />


        <div
          style={{
            marginBottom: 16
          }}
        >

          <label
            htmlFor="bio"

            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600
            }}
          >

            Bio

          </label>


          <textarea

            id="bio"

            name="bio"

            placeholder="Tell people a little about yourself..."

            value={bio}

            onChange={(e) =>
              setBio(
                e.target.value.slice(
                  0,
                  500
                )
              )
            }

            rows={4}

            maxLength={500}

            style={{
              width: "100%",
              resize: "vertical",
              padding: 12,
              fontFamily:
                "Inter, sans-serif",
              fontSize: 14,
              boxSizing:
                "border-box"
            }}

          />


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginTop: 4,
              fontSize: 11
            }}
          >

            <span>

              {errors.bio || ""}

            </span>

            <span>

              {bio.length}/500

            </span>

          </div>

        </div>


        <Button

          type="submit"

          disabled={submitting}

        >

          {submitting

            ? "Saving profile…"

            : "Continue"}

        </Button>


      </form>

    </AuthWindow>

  );
}