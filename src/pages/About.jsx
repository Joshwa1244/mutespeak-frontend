import {
  Link,
} from "react-router-dom";

import "./About.css";


export default function About() {

  return (

    <div className="about-page">


      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="about-hero">

        <div className="about-container">

          <div className="about-hero-content">

            <span className="about-eyebrow">
              About mutespeak
            </span>

            <h1>
              College has more to say
              than what happens in class.
            </h1>

            <p className="about-hero-description">

              mutespeak; is a private social space built
              around college communities — a place to share,
              discover, discuss, and connect with the people
              around campus.

            </p>


            <div className="about-hero-actions">

              <Link
                to="/register"
                className="about-primary-button"
              >
                Join mutespeak
              </Link>

              <Link
                to="/"
                className="about-secondary-button"
              >
                Log in
              </Link>

            </div>

          </div>


          {/* -----------------------------------------------------
              BRAND VISUAL
          ------------------------------------------------------ */}

          <div
            className="about-brand-card"
            aria-hidden="true"
          >

            <div className="about-brand-card-inner">

              <span className="about-brand-wordmark">
                mutespeak;
              </span>

              <span className="about-brand-line" />

              <p>
                your campus.
                <br />
                your people.
                <br />
                your conversations.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          WHY MUTESPEAK
      ========================================================== */}

      <section className="about-story">

        <div className="about-story-grid">


          <div className="about-section-heading">

            <span className="about-section-number">
              01
            </span>

            <h2>
              Why mutespeak
            </h2>

          </div>


          <div className="about-story-content">

            <p className="about-large-text">

              A college is already a community.
              The problem is that most of that community
              is fragmented.

            </p>

            <p>

              Conversations happen across classrooms,
              corridors, friend groups, messaging apps,
              clubs, departments, and countless private
              circles.

            </p>

            <p>

              Yet students often have no simple digital
              space built specifically around the people
              who share the same campus.

            </p>

            <p>

              mutespeak; is being built to create that
              space — somewhere students can discover
              what&apos;s happening, express themselves,
              interact with others, and feel more connected
              to the community they are already part of.

            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          PRINCIPLES
      ========================================================== */}

      <section className="about-principles">

        <div className="about-section-container">

          <div className="about-principles-header">

            <span className="about-eyebrow">
              What we&apos;re building around
            </span>

            <h2>
              A social experience that
              starts with your community.
            </h2>

          </div>


          <div className="about-principles-grid">


            <article className="about-principle">

              <span className="about-principle-number">
                01
              </span>

              <h3>
                Campus first
              </h3>

              <p>

                mutespeak begins with the community
                immediately around you — students who
                understand the same campus, culture,
                events, and everyday experiences.

              </p>

            </article>


            <article className="about-principle">

              <span className="about-principle-number">
                02
              </span>

              <h3>
                Real people
              </h3>

              <p>

                The goal is meaningful participation
                within real college communities rather
                than another endless network of strangers
                competing for attention.

              </p>

            </article>


            <article className="about-principle">

              <span className="about-principle-number">
                03
              </span>

              <h3>
                Expression matters
              </h3>

              <p>

                Students should have room to share ideas,
                conversations, experiences, opinions,
                creativity, and the small moments that
                shape campus life.

              </p>

            </article>

          </div>

        </div>

      </section>


      {/* =========================================================
          WHAT YOU CAN DO
      ========================================================== */}

      <section className="about-experience">

        <div className="about-story-grid">


          <div className="about-section-heading">

            <span className="about-section-number">
              02
            </span>

            <h2>
              One community.
              More ways to connect.
            </h2>

          </div>


          <div className="about-experience-list">


            <div className="about-experience-item">

              <span>
                Share
              </span>

              <div>

                <h3>
                  Post what&apos;s on your mind.
                </h3>

                <p>

                  Share thoughts and moments with
                  students across your college community.

                </p>

              </div>

            </div>


            <div className="about-experience-item">

              <span>
                Discuss
              </span>

              <div>

                <h3>
                  Join the conversation.
                </h3>

                <p>

                  React, comment, and take part in
                  conversations happening around campus.

                </p>

              </div>

            </div>


            <div className="about-experience-item">

              <span>
                Discover
              </span>

              <div>

                <h3>
                  Find the people around you.
                </h3>

                <p>

                  Discover students and explore profiles
                  across your college community.

                </p>

              </div>

            </div>


            <div className="about-experience-item">

              <span>
                Belong
              </span>

              <div>

                <h3>
                  Be part of something familiar.
                </h3>

                <p>

                  A digital community becomes more useful
                  when the people in it share a real-world
                  connection.

                </p>

              </div>

            </div>


          </div>

        </div>

      </section>


      {/* =========================================================
          EARLY STAGE / VISION
      ========================================================== */}

      <section className="about-vision">

        <div className="about-vision-inner">

          <span className="about-eyebrow about-eyebrow-light">
            Where we&apos;re going
          </span>

          <h2>

            We&apos;re starting with college.
            <br />

            The bigger idea is belonging.

          </h2>

          <p>

            mutespeak; is still evolving. We&apos;re building
            the foundation first: profiles, posts,
            conversations, discovery, and the identity
            of a real campus community.

          </p>

          <p>

            From there, the product can grow around how
            students actually communicate and connect —
            not around features added simply because every
            other social platform has them.

          </p>

        </div>

      </section>


      {/* =========================================================
          FOUNDER
      ========================================================== */}

      <section className="about-founder">

        <div className="about-founder-inner">


          {/* -----------------------------------------------------
              SMALL FOUNDER IDENTITY
          ------------------------------------------------------ */}

          <div className="about-founder-identity">

            <div
              className="about-founder-avatar"
              aria-hidden="true"
            >

              JA

            </div>


            <div>

              <span className="about-founder-label">

                Behind mutespeak;

              </span>

              <h3>

                Joshwa Antony

              </h3>

              <p>

                Founder · Builder

              </p>

            </div>

          </div>


          {/* -----------------------------------------------------
              FOUNDER STORY
          ------------------------------------------------------ */}

          <div className="about-founder-story">

            <span className="about-founder-kicker">

              It started with a thought.

            </span>


            <h2>

              What if the people you
              haven&apos;t met yet are already
              around you?

            </h2>


            <p>

              mutespeak; began from something surprisingly
              ordinary — being surrounded by thousands of
              people on the same campus, while knowing only
              a small part of the community.

            </p>


            <p>

              Built by <strong>Joshwa Antony</strong>,
              the idea is simple: technology shouldn&apos;t
              replace real communities. It should make them
              easier to discover.

            </p>


            <blockquote className="about-founder-quote">

              <span
                className="about-founder-quote-mark"
                aria-hidden="true"
              >

                “

              </span>


              <p>

                The people are already here.
                <br />

                The connection is what&apos;s missing.

              </p>

            </blockquote>


            <div className="about-founder-foot">

              <span>

                Built from campus.

              </span>

              <span className="about-founder-foot-dot">

                •

              </span>

              <span>

                Built for campus.

              </span>

            </div>

          </div>


        </div>

      </section>


      {/* =========================================================
          CTA
      ========================================================== */}

      <section className="about-cta">

        <div className="about-cta-inner">

          <div>

            <span className="about-eyebrow">
              Your community is already here.
            </span>

            <h2>
              Be part of the conversation.
            </h2>

          </div>


          <Link
            to="/register"
            className="about-primary-button"
          >
            Join mutespeak
          </Link>

        </div>

      </section>


    </div>

  );

}