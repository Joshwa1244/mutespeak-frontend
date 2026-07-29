import {
  Link,
} from "react-router-dom";

import "./Privacy.css";


export default function Privacy() {

  const lastUpdated =
    "24 July 2026";


  return (

    <div className="privacy-page">


      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="privacy-hero">

        <div className="privacy-container">


          <span className="privacy-eyebrow">

            Legal

          </span>


          <h1>

            Privacy Policy

          </h1>


          <p className="privacy-intro">

            This Privacy Policy explains what information
            mutespeak; collects, why we use it, and how
            information is handled when you use the platform.

          </p>


          <p className="privacy-updated">

            Last updated: {lastUpdated}

          </p>


        </div>

      </section>


      {/* =========================================================
          PRIVACY CONTENT
      ========================================================== */}

      <section className="privacy-content">

        <div className="privacy-layout">


          {/* =====================================================
              SIDE NAVIGATION
          ====================================================== */}

          <aside className="privacy-sidebar">

            <span className="privacy-sidebar-label">

              On this page

            </span>


            <nav

              className="privacy-nav"

              aria-label="Privacy policy sections"

            >

              <a href="#overview">

                01. Overview

              </a>


              <a href="#information">

                02. Information we collect

              </a>


              <a href="#usage">

                03. How we use information

              </a>


              <a href="#visibility">

                04. What others can see

              </a>


              <a href="#sharing">

                05. Information sharing

              </a>


              <a href="#storage">

                06. Storage & security

              </a>


              <a href="#retention">

                07. Retention & deletion

              </a>


              <a href="#choices">

                08. Your choices

              </a>


              <a href="#changes">

                09. Policy changes

              </a>


              <a href="#contact">

                10. Contact

              </a>

            </nav>

          </aside>


          {/* =====================================================
              DOCUMENT
          ====================================================== */}

          <article className="privacy-document">


            {/* ===================================================
                01 — OVERVIEW
            ==================================================== */}

            <section

              id="overview"

              className="privacy-section"

            >

              <span className="privacy-number">

                01

              </span>


              <h2>

                Privacy at mutespeak;

              </h2>


              <p>

                mutespeak; is built for real college communities.
                We use information to verify users, operate the
                platform, show profiles and community content,
                maintain security, and improve the experience.

              </p>


              <p>

                We aim to collect and use information only where
                it serves a legitimate purpose in providing and
                protecting the service.

              </p>


              <div className="privacy-callout">

                <strong>

                  mutespeak; is not anonymous.

                </strong>


                <p>

                  Your profile and activity may identify you to
                  other members of your college community.
                  Consider this before posting, commenting, or
                  otherwise sharing information.

                </p>

              </div>

            </section>


            {/* ===================================================
                02 — INFORMATION WE COLLECT
            ==================================================== */}

            <section

              id="information"

              className="privacy-section"

            >

              <span className="privacy-number">

                02

              </span>


              <h2>

                Information we collect

              </h2>


              <p>

                The information we process depends on how you
                use mutespeak; and the features available to you.

              </p>


              <div className="privacy-info-group">

                <h3>

                  Account information

                </h3>


                <p>

                  When you register, we may collect information
                  such as your name, institutional email address,
                  and authentication information needed to create
                  and secure your account.

                </p>

              </div>


              <div className="privacy-info-group">

                <h3>

                  Profile information

                </h3>


                <p>

                  You may provide profile details such as your
                  name, department, course, batch year, bio,
                  and profile picture.

                </p>

              </div>


              <div className="privacy-info-group">

                <h3>

                  Content and activity

                </h3>


                <p>

                  We process content and interactions you create
                  through the platform, including posts, comments,
                  likes, and other community activity.

                </p>

              </div>


              <div className="privacy-info-group">

                <h3>

                  Technical information

                </h3>


                <p>

                  We may process limited technical information
                  necessary to operate, secure, diagnose, and
                  protect the service, such as request information,
                  device or browser information, and security logs.

                </p>

              </div>

            </section>


            {/* ===================================================
                03 — HOW INFORMATION IS USED
            ==================================================== */}

            <section

              id="usage"

              className="privacy-section"

            >

              <span className="privacy-number">

                03

              </span>


              <h2>

                How we use information

              </h2>


              <p>

                We use information to provide and maintain
                mutespeak; and to support the college community
                experience.

              </p>


              <ul>

                <li>

                  Create and authenticate user accounts.

                </li>


                <li>

                  Verify access to supported college communities.

                </li>


                <li>

                  Display profiles and user-generated content.

                </li>


                <li>

                  Enable search, posts, comments, likes,
                  and other community features.

                </li>


                <li>

                  Protect accounts and detect misuse,
                  abuse, or security threats.

                </li>


                <li>

                  Investigate reports and enforce our
                  Terms and community rules.

                </li>


                <li>

                  Maintain, troubleshoot, and improve
                  the platform.

                </li>

              </ul>

            </section>


            {/* ===================================================
                04 — VISIBILITY
            ==================================================== */}

            <section

              id="visibility"

              className="privacy-section"

            >

              <span className="privacy-number">

                04

              </span>


              <h2>

                What other users can see

              </h2>


              <p>

                mutespeak; is a social platform. Information you
                intentionally add to your profile or publish through
                community features may be visible to other users
                who have access to the relevant community.

              </p>


              <p>

                Depending on the features available, this may
                include your name, profile picture, college-related
                profile details, bio, posts, comments, and other
                visible interactions.

              </p>


              <div className="privacy-warning">

                <span>

                  Remember

                </span>


                <p>

                  Do not publish information that you would not
                  want visible to the intended college community.

                </p>

              </div>

            </section>


            {/* ===================================================
                05 — SHARING
            ==================================================== */}

            <section

              id="sharing"

              className="privacy-section"

            >

              <span className="privacy-number">

                05

              </span>


              <h2>

                How information may be shared

              </h2>


              <p>

                We do not make private account information public
                simply because you use mutespeak;. However,
                information may be processed or shared where
                necessary to operate and protect the service.

              </p>


              <ul>

                <li>

                  With other users when you intentionally make
                  information visible through your profile,
                  posts, comments, or other social features.

                </li>


                <li>

                  With service providers that help us operate
                  infrastructure such as hosting, storage,
                  authentication, or email delivery.

                </li>


                <li>

                  When reasonably necessary to investigate
                  abuse, security incidents, or violations
                  of our Terms.

                </li>


                <li>

                  When required to comply with applicable law,
                  valid legal process, or legitimate legal
                  obligations.

                </li>

              </ul>


              <p>

                Service providers should receive only the
                information reasonably necessary to perform
                the services they provide.

              </p>

            </section>


            {/* ===================================================
                06 — STORAGE AND SECURITY
            ==================================================== */}

            <section

              id="storage"

              className="privacy-section"

            >

              <span className="privacy-number">

                06

              </span>


              <h2>

                Storage and security

              </h2>


              <p>

                We use technical and organisational measures
                intended to protect information against
                unauthorised access, loss, misuse, or alteration.

              </p>


              <p>

                Different types of information may be stored using
                different systems. For example, account and
                community data may be stored in application
                databases, while uploaded media such as profile
                pictures may be stored through dedicated storage
                infrastructure.

              </p>


              <p>

                No internet service can guarantee absolute
                security. Users should also protect their
                accounts by using strong passwords and keeping
                login credentials private.

              </p>

            </section>


            {/* ===================================================
                07 — RETENTION
            ==================================================== */}

            <section

              id="retention"

              className="privacy-section"

            >

              <span className="privacy-number">

                07

              </span>


              <h2>

                Retention and deletion

              </h2>


              <p>

                We retain information for as long as reasonably
                necessary to provide the service, maintain
                security, comply with legal obligations, resolve
                disputes, and enforce applicable agreements.

              </p>


              <p>

                When content or account information is deleted,
                it may take time for all copies to disappear from
                backups, logs, caches, or other systems.

              </p>


              <p>

                Certain information may need to be retained for
                legitimate security, fraud-prevention, legal,
                or compliance purposes even after an account
                or item of content is removed.

              </p>

            </section>


            {/* ===================================================
                08 — USER CHOICES
            ==================================================== */}

            <section

              id="choices"

              className="privacy-section"

            >

              <span className="privacy-number">

                08

              </span>


              <h2>

                Your choices

              </h2>


              <p>

                Depending on the features available and applicable
                law, you may be able to manage certain information
                directly through your account or request assistance
                from us.

              </p>


              <ul>

                <li>

                  Update eligible profile information.

                </li>


                <li>

                  Delete content where deletion controls
                  are provided.

                </li>


                <li>

                  Change your profile picture or other
                  editable profile details.

                </li>


                <li>

                  Contact us about privacy-related questions
                  or requests.

                </li>

              </ul>


              <p>

                Additional rights may apply depending on where
                you live and the laws applicable to the service.

              </p>

            </section>


            {/* ===================================================
                09 — CHANGES
            ==================================================== */}

            <section

              id="changes"

              className="privacy-section"

            >

              <span className="privacy-number">

                09

              </span>


              <h2>

                Changes to this policy

              </h2>


              <p>

                We may update this Privacy Policy as mutespeak;
                develops, our technology or practices change,
                or legal requirements evolve.

              </p>


              <p>

                When material changes are made, we may provide
                reasonable notice through the platform or another
                appropriate method.

              </p>


              <p>

                The date at the top of this page shows when
                this policy was last updated.

              </p>

            </section>


            {/* ===================================================
                10 — CONTACT
            ==================================================== */}

            <section

              id="contact"

              className="privacy-section privacy-section-last"

            >

              <span className="privacy-number">

                10

              </span>


              <h2>

                Privacy questions?

              </h2>


              <p>

                If you have questions about this Privacy Policy
                or how information is handled on mutespeak;,
                contact us through our support page.

              </p>


              <Link

                to="/contact"

                className="privacy-contact-link"

              >

                Contact mutespeak;

                <span aria-hidden="true">

                  →

                </span>

              </Link>


            </section>


          </article>

        </div>

      </section>


    </div>

  );

}