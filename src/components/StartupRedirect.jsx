import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import Login from "../pages/Login";

import {
  getToken,
  getCurrentUser,
  removeToken,
} from "../services/authService";

export default function StartupRedirect() {

  const [loading, setLoading] =
    useState(true);

  const [destination, setDestination] =
    useState(null);

  useEffect(() => {

    async function initialize() {

      const token = getToken();

      if (!token) {

        setLoading(false);
        return;

      }

      try {

        const user =
          await getCurrentUser();

        if (user.profileCompleted) {

          setDestination("/home");

        } else {

          setDestination("/complete-profile");

        }

      } catch {

        removeToken();

      } finally {

        setLoading(false);

      }

    }

    initialize();

  }, []);

  if (loading) {

    return null;

  }

  if (destination) {

    return (
      <Navigate
        to={destination}
        replace
      />
    );

  }

  return <Login />;

}