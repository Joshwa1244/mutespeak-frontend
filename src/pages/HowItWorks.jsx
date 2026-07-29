import {
  Link,
} from "react-router-dom";

import "./HowItWorks.css";


export default function HowItWorks() {

  return (

    <div className="how-page">


      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="how-hero">

        <div className="how-container">

          <span className="how-eyebrow">

            How it works

          </span>


          <h1>

            Your college.
            <br />
            Your people.

          </h1>


          <p>

            mutespeak; helps you discover, connect,
            and interact with the real people around
            your college community.

          </p>

        </div>

      </section>


      {/* =========================================================
          STEPS
      ========================================================== */}

      <section className="how-steps">

        <div className="how-container">


          <div className="how-step-grid">


            {/* ---------------------------------------------------
                STEP 01
            ---------------------------------------------------- */}

            <article className="how-step">

              <span className="how-step-number">

                01

              </span>


              <h2>

                Join your college

              </h2>


              <p>

                Sign up with your institutional email
                to enter your verified college community.

              </p>

            </article>


            {/* ---------------------------------------------------
                STEP 02
            ---------------------------------------------------- */}

            <article className="how-step">

              <span className="how-step-number">

                02

              </span>


              <h2>

                Be yourself

              </h2>


              <p>

                Build your profile so people know
                who they&apos;re connecting with.

              </p>

            </article>


            {/* ---------------------------------------------------
                STEP 03
            ---------------------------------------------------- */}

            <article className="how-step">

              <span className="how-step-number">

                03

              </span>


              <h2>

                Discover people

              </h2>


              <p>

                Find classmates, friends, and people
                across your wider college network.

              </p>

            </article>


            {/* ---------------------------------------------------
                STEP 04
            ---------------------------------------------------- */}

            <article className="how-step">

              <span className="how-step-number">

                04

              </span>


              <h2>

                Speak & connect

              </h2>


              <p>

                Share what&apos;s happening, join conversations,
                and connect with your campus community.

              </p>

            </article>


          </div>

        </div>

      </section>


      {/* =========================================================
          PRINCIPLE
      ========================================================== */}

      <section className="how-principle">

        <div className="how-principle-inner">


          <span className="how-principle-label">

            One thing to remember

          </span>


          <div>

            <h2>

              Real people.
              <br />
              Real responsibility.

            </h2>


            <p>

              mutespeak; is not anonymous.
              Think before you post, respect the person
              behind every profile, and speak responsibly.

            </p>

          </div>


        </div>

      </section>


      {/* =========================================================
          CTA
      ========================================================== */}

      <section className="how-cta">

        <div className="how-cta-inner">

          <div>

            <span className="how-eyebrow">

              Start here

            </span>


            <h2>

              Find your people.

            </h2>

          </div>


          <Link

            to="/register"

            className="how-cta-button"

          >

            Sign up

            <span aria-hidden="true">

              →

            </span>

          </Link>

        </div>

      </section>


    </div>

  );

}