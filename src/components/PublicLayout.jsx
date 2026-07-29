import {
  Outlet,
} from "react-router-dom";

import SiteHeader
  from "./SiteHeader";

import SiteFooter
  from "./SiteFooter";

import "./PublicLayout.css";


export default function PublicLayout() {

  return (

    <div className="public-layout">


      {/* -------------------------------------------------------
          PUBLIC HEADER
      -------------------------------------------------------- */}

      <SiteHeader />


      {/* -------------------------------------------------------
          CURRENT PUBLIC PAGE

          React Router renders:

          Login
          Register
          Forgot Password
          About
          Privacy
          Terms
          Contact
          etc.

          inside Outlet.
      -------------------------------------------------------- */}

      <main className="public-layout-main">

        <Outlet />

      </main>


      {/* -------------------------------------------------------
          PUBLIC FOOTER
      -------------------------------------------------------- */}

      <SiteFooter />


    </div>

  );

}