import "./Contact.css";


export default function Contact() {

  return (

    <div className="contact-page">


      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="contact-hero">

        <div className="contact-container">

          <span className="contact-eyebrow">

            Contact mutespeak;

          </span>


          <h1>

            Need to reach us?

          </h1>


          <p>

            Whether you need help, want to report something,
            or have feedback about mutespeak;, we&apos;d like
            to hear from you.

          </p>

        </div>

      </section>


      {/* =========================================================
          CONTACT OPTIONS
      ========================================================== */}

      <section className="contact-options">

        <div className="contact-container">


          <div className="contact-options-heading">

            <span className="contact-section-number">

              01

            </span>


            <h2>

              How can we help?

            </h2>

          </div>


          <div className="contact-card-grid">


            {/* ---------------------------------------------------
                GENERAL SUPPORT
            ---------------------------------------------------- */}

            <article className="contact-card">

              <span className="contact-card-label">

                Support

              </span>


              <h3>

                Something not working?

              </h3>


              <p>

                If you&apos;re having trouble with your
                account, profile, login, or another part
                of mutespeak;, let us know what happened.

              </p>


              <a

                href="mailto:mutespeakfounder@gmail.com?subject=mutespeak%20Support"

                className="contact-card-link"

              >

                Contact support

                <span aria-hidden="true">

                  →

                </span>

              </a>

            </article>


            {/* ---------------------------------------------------
                SAFETY / REPORT
            ---------------------------------------------------- */}

            <article className="contact-card">

              <span className="contact-card-label">

                Safety

              </span>


              <h3>

                Report a concern.

              </h3>


              <p>

                If you encounter harmful content,
                harassment, impersonation, or something
                that may put another person at risk,
                please report it to us.

              </p>


              <a

                href="mailto:mutespeakfounder@gmail.com?subject=Safety%20Report"

                className="contact-card-link"

              >

                Report a concern

                <span aria-hidden="true">

                  →

                </span>

              </a>

            </article>


            {/* ---------------------------------------------------
                FEEDBACK
            ---------------------------------------------------- */}

            <article className="contact-card">

              <span className="contact-card-label">

                Feedback

              </span>


              <h3>

                Help us make it better.

              </h3>


              <p>

                Have an idea, suggestion, or something
                you think mutespeak; should improve?
                We&apos;re interested in hearing it.

              </p>


              <a

                href="mailto:mutespeakfounder@gmail.com?subject=mutespeak%20Feedback"

                className="contact-card-link"

              >

                Share feedback

                <span aria-hidden="true">

                  →

                </span>

              </a>

            </article>


          </div>

        </div>

      </section>


      {/* =========================================================
          DIRECT CONTACT
      ========================================================== */}

      <section className="contact-direct">

        <div className="contact-direct-inner">


          <div>

            <span className="contact-eyebrow">

              Direct contact

            </span>


            <h2>

              Prefer email?

            </h2>


            <p>

              Send us a message with enough detail to
              understand what you need help with.

            </p>

          </div>


          <a

            href="mailto:mutespeakfounder@gmail.com"

            className="contact-email"

          >

            <span className="contact-email-label">

              Email us

            </span>


            <strong>

              mutespeakfounder@gmail.com

            </strong>

          </a>


        </div>

      </section>


      {/* =========================================================
          RESPONSIBILITY NOTE
      ========================================================== */}

      <section className="contact-note">

        <div className="contact-note-inner">

          <span>

            A note on safety

          </span>


          <p>

            mutespeak; is built around real college
            communities and real identities. If you
            contact us about another person or a piece
            of content, please provide accurate information
            and avoid sharing unnecessary private or
            sensitive details.

          </p>

        </div>

      </section>


    </div>

  );

}