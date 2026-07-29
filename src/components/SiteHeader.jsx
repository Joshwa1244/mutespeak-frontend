import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  isLoggedIn,
} from "../services/authService";

import BrandWordmark
  from "./BrandWordmark";

import "./SiteHeader.css";


export default function SiteHeader() {

  const authenticated =
    isLoggedIn();


  return (

    <header className="site-header">

      <div className="site-header-inner">


        {/* -------------------------------------------------------
            BRAND

            Logged out:
            → Login / landing page

            Logged in:
            → Home feed

            Uses the shared BrandWordmark component so the
            branding is identical across the entire application.
        -------------------------------------------------------- */}

        <BrandWordmark

          to={
            authenticated
              ? "/home"
              : "/"
          }

        />


        {/* -------------------------------------------------------
            PUBLIC NAVIGATION

            Only shown before login.
        -------------------------------------------------------- */}

        {!authenticated && (

          <nav

            className="site-header-nav"

            aria-label="Main navigation"

          >


            <NavLink

              to="/about"

              className={({
                isActive,
              }) =>

                isActive

                  ? "site-nav-link site-nav-link-active"

                  : "site-nav-link"

              }

            >

              About

            </NavLink>


            <NavLink

              to="/how-it-works"

              className={({
                isActive,
              }) =>

                isActive

                  ? "site-nav-link site-nav-link-active"

                  : "site-nav-link"

              }

            >

              How it works

            </NavLink>


          </nav>

        )}


        {/* -------------------------------------------------------
            PUBLIC ACTIONS

            Login + Sign up are only shown before authentication.
        -------------------------------------------------------- */}

        {!authenticated && (

          <div className="site-header-actions">


            <Link

              to="/"

              className="site-header-login"

            >

              Log in

            </Link>


            <Link

              to="/register"

              className="site-header-register"

            >

              Sign up

            </Link>


          </div>

        )}


        {/* -------------------------------------------------------
            AUTHENTICATED STATE

            Currently kept minimal.

            AppShell handles:
            - Home
            - Search
            - Profile

            No footer is displayed inside the authenticated app.
        -------------------------------------------------------- */}

        {authenticated && (

          <div className="site-header-authenticated">

            <span className="site-header-community-label">

              College community

            </span>

          </div>

        )}


      </div>

    </header>

  );

}