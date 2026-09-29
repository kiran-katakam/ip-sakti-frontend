import { useState } from "react";
import { useTranslation } from "react-i18next";
import { JurisdictionSelector, QuestionInput, AnswerCard, CitationCard, ErrorMessage, useRegimes } from "../components/ui";
import { compareQuery } from "../services/api";

export default function ComparePage() {
  const { label } = useRegimes();
  const { t } = useTranslation();
  const [rs, setRs] = useState([]), [q, setQ] = useState(""), [k, setK] = useState(5);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [res, setRes] = useState(null);
  const go = async e => {
    e.preventDefault(); if (rs.length < 2) return setErr(t("compare.selectTwo"));
    setBusy(true); setErr(""); setRes(null);
    try { setRes(await compareQuery(q.trim(), rs, k)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="main wide">
      <h1>{t("compare.title")}</h1><p className="muted">{t("compare.subtitle")}</p>
      <form onSubmit={go} className="glass pad">
        <label>{t("compare.jurisdictions")}</label><JurisdictionSelector multi value={rs} onChange={setRs} />
        <QuestionInput value={q} onChange={setQ} k={k} onK={setK} busy={busy} label={t("compare.compare")} pending={t("compare.retrieving")} />
      </form>
      <ErrorMessage m={err} />
      {res && <>
        {res?.ip_type &&
          res.ip_type !== "GENERAL" && (
            <span
              className="tag"
              style={{
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              {t("compare.legalDomain", { type: res.ip_type })}
            </span>
          )}
        <div className="cmp">{res.per_regime_answers?.map(p => (
          <div key={p.regime} className="cc">
            <AnswerCard label={label(p.regime)} answer={p.answer} count={p.citations?.length || 0} />
            <details className="glass pad"><summary>{t("compare.sources", { count: p.citations?.length || 0 })}</summary>{p.citations?.map((c, i) => <CitationCard key={i} c={c} n={i + 1} />)}</details>
          </div>))}</div>
        <article className="glass syn"><span className="tag">{t("compare.synthesisTag")}</span><h3>{t("compare.synthesisTitle")}</h3>
          <p className="muted">{t("compare.synthesisNote")}</p><p>{res.synthesis || t("compare.noSynthesis")}</p></article>
      </>}
    </div>
  );
}
