import { Routes, Route, Outlet } from "react-router-dom";

// ---------------------------------------------------------------
// GLOBAL COMPONENTS
// ---------------------------------------------------------------
import NetworkStatus from "./components/NetworkStatus";
import InstallPrompt from "./components/InstallPrompt";
// ❌ UpdateBanner imported removed
import { Analytics } from '@vercel/analytics/react';
import ScrollToTop from "./components/ScrollToTop";

// ---------------------------------------------------------------
// LAYOUTS
// ---------------------------------------------------------------
import PublicLayout from "./components/PublicLayout";
import AppShell from "./components/AppShell"; // ✅ Brought back AppShell

// ---------------------------------------------------------------
// PUBLIC / AUTH PAGES
// ---------------------------------------------------------------
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import HowItWorks from "./pages/HowItWorks";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support"; // Ensure the path matches your folder structure
import StartupRedirect from "./components/StartupRedirect";
import WallPage from "./pages/wall";
// ---------------------------------------------------------------
// AUTHENTICATED PAGES
// ---------------------------------------------------------------
import Home from "./pages/Home";
import CompleteProfile from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import PublicProfile from "./pages/PublicProfile";
import Notifications from "./pages/Notifications";
import Hub from "./pages/Hub";
import News from "./pages/News";
// ✅ We create a wrapper so AppShell can act as a Router Layout
function AppShellLayout() {
  return (
    <AppShell>
      <Outlet /> 
    </AppShell>
  );
}

export default function App() {
  return (
    <>
      {/* Mounted once for the entire application */}
      <NetworkStatus />
      <InstallPrompt />
      {/* ❌ <UpdateBanner /> removed */}
      <Analytics />
       {/* Scroll to top on every route change */}
      <ScrollToTop />

      <Routes>
        {/* =========================================================
            PUBLIC ROUTES (No bottom nav, public header)
        ========================================================== */}
        <Route element={<PublicLayout />}>
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/" element={<StartupRedirect />}/>
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/support" element={<Support />} />
          <Route path="/wall" element={<WallPage/>}/>
        </Route>

        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* =========================================================
            AUTHENTICATED ROUTES (Uses AppShell: Header + Bottom Nav)
        ========================================================== */}
        <Route element={<AppShellLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/news" element={<News />} />
        </Route>
      </Routes>
    </>
  );
}