import {
  Link,
} from "react-router-dom";

import "./SiteFooter.css";


export default function SiteFooter() {

  const currentYear =
    new Date()
      .getFullYear();


  return (

    <footer className="site-footer">


      {/* ---------------------------------------------------------
          MAIN FOOTER
      ---------------------------------------------------------- */}

      <div className="site-footer-main">


        {/* -------------------------------------------------------
            BRAND
        -------------------------------------------------------- */}

        <div className="site-footer-brand">


          <Link

            to="/"

            className="site-footer-wordmark"

            aria-label="mutespeak home"

          >

            mutespeak;

          </Link>


          <p>

            A space for college communities
            to speak, connect, and belong.

          </p>


        </div>


        {/* -------------------------------------------------------
            PRODUCT
        -------------------------------------------------------- */}

        <div className="site-footer-column">

          <h2>

            Product

          </h2>


          <Link to="/about">

            About

          </Link>


          <Link to="/how-it-works">

            How it works

          </Link>

          <Link to="/wall">

            The Wall

          </Link>


          <Link to="/register">

            Join mutespeak

          </Link>

        </div>


        {/* -------------------------------------------------------
            LEGAL
        -------------------------------------------------------- */}

        <div className="site-footer-column">

          <h2>

            Legal

          </h2>


          <Link to="/privacy">

            Privacy

          </Link>


          <Link to="/terms">

            Terms

          </Link>

        </div>


        {/* -------------------------------------------------------
            SUPPORT
        -------------------------------------------------------- */}

        <div className="site-footer-column">

          <h2>

            Support

          </h2>


          <Link to="/contact">

            Contact

          </Link>


          {/* 👇 NEW SUPPORT LINK ADDED HERE 👇 */}
          <Link to="/support">

            Buy me a coffee

          </Link>


          <Link to="/">

            Log in

          </Link>

        </div>


      </div>


      {/* ---------------------------------------------------------
          BOTTOM BAR
      ---------------------------------------------------------- */}

      <div className="site-footer-bottom">

        <p>

          © {currentYear} mutespeak

        </p>


        <p>

          a joshwa antony production

        </p>

      </div>


    </footer>

  );

}