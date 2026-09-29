import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { register, isAdmin } from "../services/api";
import { ErrorMessage } from "../components/ui";
import Shader from "../components/Shader";
import LanguageSwitcher from "../components/LanguageSwitcher";

function Frame({ title, sub, children }) {
  return (
    <main className="auth">
      <Shader k={0.8} />
      <div className="glass box">
        <div className="auth-top-bar">
          <a href="/" className="tag">
            {useTranslation().t("auth.backToOverview")}
          </a>
          <LanguageSwitcher />
        </div>
        <h2>{title}</h2>
        <p className="muted">{sub}</p>
        {children}
      </div>
    </main>
  );
}

export function LoginPage() {
  const { login, isAuthenticated, email } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated)
    return (
      <Navigate
        to={isAdmin(email) ? "/admin" : "/query"}
        replace
      />
    );

  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(f.email, f.password);
      nav(isAdmin(f.email) ? "/admin" : "/query");
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <Frame title={t("auth.loginTitle")} sub={t("auth.loginSub")}>
      <form onSubmit={go}>
        <label htmlFor="e">{t("auth.email")}</label>
        <input
          id="e"
          type="email"
          required
          autoComplete="username"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
        <label htmlFor="p">{t("auth.password")}</label>
        <input
          id="p"
          type="password"
          required
          autoComplete="current-password"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
        <ErrorMessage m={err} />
        <button className="btn pri" disabled={busy}>
          {busy ? t("auth.loggingIn") : t("auth.logIn")}
        </button>
      </form>
      <p className="muted">
        {t("auth.noAccount")}{" "}
        <Link to="/register">{t("auth.createOne")}</Link>
      </p>
    </Frame>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [f, setF] = useState({ email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.password !== f.confirm) return setErr(t("auth.passwordsNoMatch"));
    setBusy(true);
    try {
      await register(f.email, f.password);
      setOk(true);
      setTimeout(() => nav("/login"), 1400);
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  const fieldLabels = {
    email: t("auth.email"),
    password: t("auth.password"),
    confirm: t("auth.confirmPassword"),
  };

  return (
    <Frame title={t("auth.registerTitle")} sub={t("auth.registerSub")}>
      <form onSubmit={go}>
        {["email", "password", "confirm"].map((k) => (
          <div key={k}>
            <label htmlFor={k}>{fieldLabels[k]}</label>
            <input
              id={k}
              type={k === "email" ? "email" : "password"}
              required
              minLength={k === "email" ? undefined : 8}
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </div>
        ))}
        <ErrorMessage m={err} />
        {ok && (
          <div className="ok" role="status">
            {t("auth.accountCreated")}
          </div>
        )}
        <button className="btn pri" disabled={busy}>
          {busy ? t("auth.creatingAccount") : t("auth.register")}
        </button>
      </form>
      <p className="muted">
        {t("auth.alreadyRegistered")}{" "}
        <Link to="/login">{t("auth.logInLink")}</Link>
      </p>
    </Frame>
  );
}
