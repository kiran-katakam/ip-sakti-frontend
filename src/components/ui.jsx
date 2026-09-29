import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRegimes } from "../services/api";

export const ErrorMessage = ({ m }) => (m ? <div role="alert" className="err">{m}</div> : null);
export const LoadingState = ({ t }) => <div className="load" role="status"><i />{t}</div>;

export function useRegimes() {
  const [list, setList] = useState(null), [err, setErr] = useState("");
  useEffect(() => { getRegimes().then(setList).catch(e => setErr(e.message)); }, []);
  return { list, err, label: c => list?.find(r => r.code === c)?.label || c };
}

export function JurisdictionSelector({ value, onChange, multi }) {
  const { list, err } = useRegimes();
  const { t } = useTranslation();
  if (err) return <ErrorMessage m={err} />;
  if (!list) return <LoadingState t={t("jurisdictions.loading")} />;
  const has = c => (multi ? value.includes(c) : value === c);
  const tog = c => onChange(multi ? (has(c) ? value.filter(x => x !== c) : [...value, c]) : c);
  return (
    <div className="regs" role="group" aria-label={t("query.jurisdiction")}>
      {list.map(r => (
        <button type="button" key={r.code} className={"reg" + (has(r.code) ? " on" : "")} aria-pressed={has(r.code)} onClick={() => tog(r.code)}>
          <b>{r.label}</b><span className="tag">{r.code} · {r.language}</span>
        </button>
      ))}
    </div>
  );
}

function Md({ text }) { // basic markdown: paragraphs, bullets, headings, **bold**
  const inl = s => s.split(/(\*\*[^*]+\*\*)/g).map((x, i) => (x.startsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : x));
  return (text || "").split(/\n{2,}/).map((b, i) => {
    const ls = b.split("\n"), bu = /^\s*[-*•]\s+/;
    if (ls.every(l => bu.test(l))) return <ul key={i}>{ls.map((l, j) => <li key={j}>{inl(l.replace(bu, ""))}</li>)}</ul>;
    const h = b.match(/^#{1,4}\s+(.*)/);
    return h && ls.length === 1 ? <h4 key={i}>{inl(h[1])}</h4> : <p key={i}>{inl(b)}</p>;
  });
}

export function AnswerCard({ label, answer, count, onCites }) {
  const { t } = useTranslation();
  const empty = !answer?.trim();
  return (
    <article className="glass ans">
      <header><span className="tag">{t("ui.aiAnswer")}</span><h3>{label}</h3>
        {onCites && <button className="btn ghost" onClick={onCites}>{t("ui.citation", { count })}</button>}</header>
      {empty ? <p className="muted">{t("ui.noInfoAnswer")}</p> : <div className="md"><Md text={answer} /></div>}
    </article>
  );
}

export function CitationCard({ c, n }) {
  const { t } = useTranslation();
  return (
    <article className="cite">
      <span className="tag">
        {t("ui.sourceN", { n })}
      </span>

      <h5>
        {c.title || t("ui.untitledDoc")}
      </h5>

      <dl>
        <div>
          <dt>{t("ui.authority")}</dt>
          <dd>
            {c.authority || "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.instrument")}</dt>
          <dd>
            {c.instrument_name || "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.type")}</dt>
          <dd>
            {c.instrument_type ||
              c.doc_type ||
              "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.citation")}</dt>
          <dd>
            {c.citation || "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.page")}</dt>
          <dd>
            {c.page_start
              ? c.page_end &&
                c.page_end !== c.page_start
                ? `${c.page_start}-${c.page_end}`
                : c.page_start
              : "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.version")}</dt>
          <dd>
            {c.version || "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.effectiveDate")}</dt>
          <dd>
            {c.effective_date || "—"}
          </dd>
        </div>

        <div>
          <dt>{t("ui.lastVerified")}</dt>
          <dd>
            {c.last_verified || "—"}
          </dd>
        </div>
      </dl>

      {c.official_source && (
        <span className="tag">
          {t("ui.officialSource")}
        </span>
      )}

      <span className="tag">
        {t("ui.retrievedPassage")}
      </span>

      <blockquote>
        {c.chunk_text}
      </blockquote>

      {c.source_url ? (
        <a
          className="btn"
          href={c.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("ui.openSource")}
        </a>
      ) : (
        <button
          className="btn"
          disabled
        >
          {t("ui.openSource")}
        </button>
      )}
    </article>
  );
}

export function CitationPanel({ cites = [], open, onClose }) {
  const { t } = useTranslation();
  return (
    <aside className={"cites" + (open ? " open" : "")} aria-label={t("ui.citation", { count: cites.length })}>
      <div className="ch"><h4>{t("ui.sourcesCount", { count: cites.length })}</h4><button className="btn ghost close" onClick={onClose}>{t("ui.close")}</button></div>
      {cites.length ? cites.map((c, i) => <CitationCard key={i} c={c} n={i + 1} />) : <p className="muted">{t("ui.citationHere")}</p>}
    </aside>
  );
}

export function QuestionInput({ value, onChange, k, onK, busy, label, pending }) {
  const { t } = useTranslation();
  return (
    <>
      <label htmlFor="q">{t("ui.question")}</label>
      <textarea id="q" rows={4} required value={value} onChange={e => onChange(e.target.value)} placeholder={t("query.questionPlaceholder")} />
      <div className="row2"><div><label htmlFor="k">{t("ui.topK")}</label><input id="k" type="number" min={1} max={20} value={k} onChange={e => onK(+e.target.value)} style={{ width: 90 }} /></div>
        <button className="btn pri" disabled={busy || !value.trim()}>{busy ? t("ui.working") : label}</button></div>
      {busy && <LoadingState t={pending} />}
    </>
  );
}
