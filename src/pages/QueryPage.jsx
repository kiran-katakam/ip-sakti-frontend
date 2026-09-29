import { useState } from "react";
import { useTranslation } from "react-i18next";
import ComparePage from "./ComparePage";
import { useSearchParams } from "react-router-dom";

import {
  JurisdictionSelector,
  AnswerCard,
  CitationPanel,
  ErrorMessage,
  useRegimes,
} from "../components/ui";

import { query } from "../services/api";

function Single() {
  const [sp] = useSearchParams();
  const { label } = useRegimes();
  const { t } = useTranslation();

  const [regime, setRegime] = useState(
    sp.get("regime") || ""
  );
  const [q, setQ] = useState("");
  const [k, setK] = useState(5);
  const [lang, setLang] = useState("auto");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErr(
        t("query.voiceNotSupported")
      );
      return;
    }

    const recognition = new SpeechRecognition();

    const voiceLanguages = {
      en: "en-IN",
      hi: "hi-IN",
      te: "te-IN",
    };

    recognition.lang =
      voiceLanguages[lang] || "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setErr("");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setQ(transcript);
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error === "not-allowed") {
        setErr(
          t("query.micDenied")
        );
      } else if (event.error === "no-speech") {
        setErr(
          t("query.noSpeech")
        );
      } else {
        setErr(
          t("query.voiceFailed")
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Failed to start speech recognition:",
        error
      );
      setListening(false);
    }
  };

  const go = async (e) => {
    e.preventDefault();

    if (!regime) {
      setErr(t("query.selectJurisdiction"));
      return;
    }

    if (!q.trim()) {
      setErr(t("query.enterQuestion"));
      return;
    }

    setBusy(true);
    setErr("");
    setRes(null);
    setClarifyingQuestions([]);
    setOpen(false);

    try {
      const result = await query(
        q.trim(),
        regime,
        k,
        lang
      );

      console.log("QUERY RESPONSE:", result);

      if (result.needs_clarification) {
        setClarifyingQuestions(
          result.clarifying_questions || []
        );
        setRes(null);
        return;
      }

      setClarifyingQuestions([]);
      setRes(result);
    } catch (x) {
      console.error(x);

      setErr(
        x?.message ||
        t("query.queryError")
      );
    } finally {
      setBusy(false);
    }
  };

  const cites = res?.citations || [];
  const confidence = res?.confidence || null;

  return (
    <div className="work">
      <section className="main">
        <h1>{t("query.title")}</h1>

        <p className="muted">
          {t("query.subtitle")}
        </p>

        <form
          onSubmit={go}
          className="glass pad"
        >
          <label>{t("query.jurisdiction")}</label>

          <JurisdictionSelector
            value={regime}
            onChange={setRegime}
          />

          <label
            htmlFor="rl"
            style={{ marginTop: "14px" }}
          >
            {t("query.responseLang")}
          </label>

          <select
            id="rl"
            value={lang}
            onChange={(e) =>
              setLang(e.target.value)
            }
            disabled={busy}
          >
            <option value="auto">
              {t("query.autoDetect")}
            </option>

            <option value="en">
              {t("query.english")}
            </option>

            <option value="hi">
              {t("query.hindi")}
            </option>

            <option value="te">
              {t("query.telugu")}
            </option>
          </select>

          <label
            htmlFor="question"
            style={{ marginTop: "14px" }}
          >
            {t("query.yourQuestion")}
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <textarea
              id="question"
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder={t("query.questionPlaceholder")}
              disabled={busy}
              rows={5}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "12px 55px 12px 12px",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={startVoiceInput}
              disabled={busy || listening}
              title={
                listening
                  ? t("query.listening")
                  : t("query.speakQuestion")
              }
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "1px solid #555",
                background: listening
                  ? "#3a1a1a"
                  : "#222",
                color: "#fff",
                cursor:
                  busy || listening
                    ? "not-allowed"
                    : "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity:
                  busy || listening ? 0.6 : 1,
              }}
            >
              {listening ? "🔴" : "🎤"}
            </button>
          </div>

          {listening && (
            <p
              className="muted"
              style={{
                marginTop: "8px",
                marginBottom: "0",
              }}
            >
              {t("query.listeningPrompt")}
            </p>
          )}

          <label
            htmlFor="top-k"
            style={{ marginTop: "14px" }}
          >
            {t("query.numSources")}
          </label>

          <select
            id="top-k"
            value={k}
            onChange={(e) =>
              setK(Number(e.target.value))
            }
            disabled={busy}
          >
            <option value={3}>{t("query.sources_3")}</option>
            <option value={5}>{t("query.sources_5")}</option>
            <option value={8}>{t("query.sources_8")}</option>
            <option value={10}>{t("query.sources_10")}</option>
          </select>

          <button
            type="submit"
            className="btn"
            disabled={busy || listening}
            style={{
              marginTop: "15px",
            }}
          >
            {busy
              ? t("query.searching")
              : t("query.askIpSakti")}
          </button>
        </form>

        <ErrorMessage m={err} />

        {clarifyingQuestions.length > 0 && (
          <div
            style={{
              background: "#1a3a2e",
              border: "1px solid #2ecc71",
              borderRadius: "6px",
              padding: "16px",
              marginTop: "12px",
            }}
          >
            <strong>
              {t("query.clarifyMore")}
            </strong>

            <ul
              style={{
                marginTop: "10px",
                paddingLeft: "20px",
              }}
            >
              {clarifyingQuestions.map(
                (question, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    {question}
                  </li>
                )
              )}
            </ul>

            <p
              style={{
                fontSize: "13px",
                color: "#aaa",
                marginBottom: "0",
              }}
            >
              {t("query.clarifyHint")}
            </p>
          </div>
        )}

        {res && !res.needs_clarification && (
          <div
            style={{
              marginTop: "16px",
            }}
          >
            {confidence && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  marginTop: "12px",
                  marginBottom: "8px",
                  background:
                    confidence.level === "high"
                      ? "#1a4d2e"
                      : confidence.level === "medium"
                        ? "#4d4a1a"
                        : "#4d1a1a",
                  color:
                    confidence.level === "high"
                      ? "#4ade80"
                      : confidence.level === "medium"
                        ? "#facc15"
                        : "#f87171",
                }}
              >
                {t("query.confidence")}:{" "}
                {confidence.level
                  ? confidence.level.toUpperCase()
                  : t("query.unknown")}{" "}
                (
                {typeof confidence.score ===
                  "number"
                  ? confidence.score
                  : t("query.na")}
                )
              </div>
            )}

            {confidence?.note && (
              <p
                className="muted"
                style={{
                  marginTop: "0",
                  marginBottom: "12px",
                  fontSize: "13px",
                }}
              >
                {confidence.note}
              </p>
            )}

            {res.ip_type &&
              res.ip_type !== "GENERAL" && (
                <span
                  className="tag"
                  style={{
                    display: "inline-block",
                    marginBottom: "8px",
                  }}
                >
                  {t("query.legalDomain", { type: res.ip_type })}
                </span>
              )}

            <AnswerCard
              label={label(
                res.regime || regime
              )}
              answer={res.answer}
              count={cites.length}
              onCites={() => setOpen(true)}
            />
          </div>
        )}
      </section>

      <CitationPanel
        cites={cites}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

export default function Portal() {
  const [sp, setSp] =
    useSearchParams();
  const { t } = useTranslation();

  const mode =
    sp.get("mode") === "compare"
      ? "compare"
      : "single";

  const set = (m) => {
    setSp(
      m === "compare"
        ? { mode: "compare" }
        : {}
    );
  };

  return (
    <div>
      <div
        className="seg"
        role="group"
        aria-label={t("query.queryMode")}
      >
        {[
          [
            "single",
            t("query.singleJurisdiction"),
          ],
          [
            "compare",
            t("query.compareJurisdictions"),
          ],
        ].map(([m, text]) => (
          <button
            key={m}
            className={
              "reg" +
              (mode === m ? " on" : "")
            }
            aria-pressed={mode === m}
            onClick={() => set(m)}
          >
            {text}
          </button>
        ))}
      </div>

      {mode === "compare" ? (
        <ComparePage />
      ) : (
        <Single />
      )}
    </div>
  );
}
