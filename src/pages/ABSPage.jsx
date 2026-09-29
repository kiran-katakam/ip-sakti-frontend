import { useState } from "react";
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
  const [scenario, setScenario] = useState("");
  const [language, setLanguage] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (!scenario.trim()) {
      setError(
        "Describe the biological resource, its use, and what you plan to do with it."
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
          "ABS analysis failed."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main wide">
      <h1>ABS Compliance Helper</h1>

      <p className="muted">
        Screen an Ayurveda-related activity for
        potential Access and Benefit-Sharing
        requirements using authoritative sources.
      </p>

      <form
        onSubmit={submit}
        className="glass pad"
      >
        <label>Describe your situation</label>

        <textarea
          value={scenario}
          onChange={(e) =>
            setScenario(e.target.value)
          }
          rows={7}
          disabled={busy}
          placeholder={
            "Example: We are an Indian company developing an Ayurvedic product using neem obtained in India and plan to commercialise it and apply for an IP right."
          }
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
          Response language
        </label>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
          disabled={busy}
        >
          <option value="auto">
            Auto-detect
          </option>
          <option value="en">
            English
          </option>
          <option value="hi">
            Hindi
          </option>
          <option value="te">
            Telugu
          </option>
        </select>

        <button
          className="btn pri"
          type="submit"
          disabled={busy}
          style={{ marginTop: "15px" }}
        >
          {busy
            ? "Checking ABS sources..."
            : "Analyse ABS"}
        </button>
      </form>

      <ErrorMessage m={error} />

      {result && (
        <div style={{ marginTop: "18px" }}>
          <article className="glass pad">
            <span className="tag">
              Screening status
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
                  Information still needed
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
                ABS guidance
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
                Extracted facts
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
                Authoritative sources
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