import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import { LoginPage, RegisterPage } from "./pages/Auth";
import QueryPage from "./pages/QueryPage";
import ComparePage from "./pages/ComparePage";
import Admin from "./pages/Admin";
import ABSPage from "./pages/ABSPage";

import { isAdmin } from "./services/api";
import Shader from "./components/Shader";
import { useRegimes, ErrorMessage, LoadingState } from "./components/ui";


/* =========================
   JURISDICTIONS PAGE
========================= */

function Jurisdictions() {
  const { list, err } = useRegimes();

  return (
    <div className="main wide">
      <h1>Jurisdictions</h1>

      <ErrorMessage m={err} />

      {!list && !err && (
        <LoadingState t="Loading jurisdictions..." />
      )}

      <div className="cmp">
        {list?.map((r) => (
          <NavLink
            key={r.code}
            to={`/query?regime=${r.code}`}
            className="glass pad"
          >
            <span className="tag">{r.code}</span>

            <h3>{r.label}</h3>

            <p className="tag">
              Language: {r.language}
            </p>
          </NavLink>
        ))}
      </div>
    </div>
  );
}


/* =========================
   PROTECTED APP SHELL
========================= */

function Shell() {
  const { email, logout } = useAuth();

  const nav = useNavigate();

  const [open, setOpen] = useState(false);

  const L = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "nv" + (isActive ? " on" : "")
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className="shell">
      <Shader k={0.35} />

      <button
        className="btn menu"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Menu
      </button>

      <nav className={"side" + (open ? " open" : "")}>
        <h4>IP-SAKTI Sahayak</h4>

        <L to="/query">
          Query Portal
        </L>

        <L to="/abs">
          ABS Compliance
        </L>

        <L to="/jurisdictions">
          Jurisdictions
        </L>

        {isAdmin(email) && (
          <L to="/admin">
            Admin Panel
          </L>
        )}

        <div className="grow" />

        <p
          className="tag"
          style={{ wordBreak: "break-all" }}
        >
          {email || "Signed in"}
        </p>

        <button
          className="nv"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      <Outlet />
    </div>
  );
}


/* =========================
   MAIN APP
========================= */

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <Routes>

          {/* =====================
              AUTH ROUTES
          ===================== */}

          <Route
            path="login"
            element={<LoginPage />}
          />

          <Route
            path="register"
            element={<RegisterPage />}
          />


          {/* =====================
              PROTECTED ROUTES
          ===================== */}

          <Route element={<ProtectedRoute />}>
            <Route element={<Shell />}>

              {/* /app → /app/query */}
              <Route
                index
                element={
                  <Navigate
                    to="query"
                    replace
                  />
                }
              />

              {/* /app/query */}
              <Route
                path="query"
                element={<QueryPage />}
              />

              <Route
                path="abs"
                element={<ABSPage />}
              />

              {/* /app/compare */}
              <Route
                path="compare"
                element={<ComparePage />}
              />

              {/* /app/jurisdictions */}
              <Route
                path="jurisdictions"
                element={<Jurisdictions />}
              />

            </Route>
          </Route>


          {/* =====================
              ADMIN ROUTE
          ===================== */}

          <Route element={<AdminRoute />}>
            <Route
              path="admin"
              element={<Admin />}
            />
          </Route>


          {/* =====================
              UNKNOWN ROUTES
          ===================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="login"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}