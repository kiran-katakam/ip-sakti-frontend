import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ErrorMessage,
  CitationCard,
} from "../components/ui";
import { analyzeABS } from "../services/api";

function formatValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
}

export default function ABSPage() {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState("");
  const [language, setLanguage] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (!scenario.trim()) {
      setError(
        t("abs.describeError")
      );
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeABS(
        scenario.trim(),
        language
      );

      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          t("abs.analysisFailed")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main wide">
      <h1>{t("abs.title")}</h1>

      <p className="muted">
        {t("abs.subtitle")}
      </p>

      <form
        onSubmit={submit}
        className="glass pad"
      >
        <label>{t("abs.describeSituation")}</label>

        <textarea
          value={scenario}
          onChange={(e) =>
            setScenario(e.target.value)
          }
          rows={7}
          disabled={busy}
          placeholder={t("abs.placeholder")}
          style={{
            width: "100%",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <label
          style={{
            marginTop: "14px",
          }}
        >
          {t("abs.responseLang")}
        </label>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
          disabled={busy}
        >
          <option value="auto">
            {t("abs.autoDetect")}
          </option>
          <option value="en">
            {t("abs.english")}
          </option>
          <option value="hi">
            {t("abs.hindi")}
          </option>
          <option value="te">
            {t("abs.telugu")}
          </option>
        </select>

        <button
          className="btn pri"
          type="submit"
          disabled={busy}
          style={{ marginTop: "15px" }}
        >
          {busy
            ? t("abs.checkingSources")
            : t("abs.analyse")}
        </button>
      </form>

      <ErrorMessage m={error} />

      {result && (
        <div style={{ marginTop: "18px" }}>
          <article className="glass pad">
            <span className="tag">
              {t("abs.screeningStatus")}
            </span>

            <h2>
              {formatValue(
                result.screening?.status
              )}
            </h2>

            {result.screening?.flags?.map(
              (flag, i) => (
                <p
                  key={i}
                  className="muted"
                >
                  • {flag}
                </p>
              )
            )}

            {result.screening
              ?.missing_information?.length >
              0 && (
              <>
                <h4>
                  {t("abs.infoNeeded")}
                </h4>

                {result.screening.missing_information.map(
                  (item, i) => (
                    <p
                      key={i}
                      className="muted"
                    >
                      • {item}
                    </p>
                  )
                )}
              </>
            )}
          </article>

          <article
            className="glass ans"
            style={{ marginTop: "12px" }}
          >
            <header>
              <span className="tag">
                {t("abs.absGuidance")}
              </span>
            </header>

            <div className="md">
              <p>{result.answer}</p>
            </div>
          </article>

          {result.facts && (
            <article
              className="glass pad"
              style={{ marginTop: "12px" }}
            >
              <span className="tag">
                {t("abs.extractedFacts")}
              </span>

              {Object.entries(
                result.facts
              ).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    padding: "9px 0",
                    borderBottom:
                      "1px solid #333",
                  }}
                >
                  <span>
                    {formatValue(key)}
                  </span>

                  <span className="muted">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </article>
          )}

          {result.citations?.length > 0 && (
            <article
              className="glass pad"
              style={{ marginTop: "12px" }}
            >
              <span className="tag">
                {t("abs.authoritativeSources")}
              </span>

              {result.citations.map(
                (citation, index) => (
                  <CitationCard
                    key={index}
                    c={citation}
                    n={index + 1}
                  />
                )
              )}
            </article>
          )}

          <p
            className="muted"
            style={{
              marginTop: "12px",
              fontSize: "13px",
            }}
          >
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}