import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, LoadingState, useRegimes } from "../components/ui";
import LanguageSwitcher from "../components/LanguageSwitcher";
import * as api from "../services/api";

function Dashboard({ go }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState(null), [users, setUsers] = useState(undefined), [dErr, setDErr] = useState(""), [uErr, setUErr] = useState("");
  useEffect(() => {
    api.listDocuments().then(d => setDocs(Array.isArray(d) ? d : d?.documents || [])).catch(e => setDErr(e.message));
    api.getUserCount().then(setUsers).catch(e => setUErr(e.message));
  }, []);
  const by = {}; docs?.forEach(d => { by[d.regime] = (by[d.regime] || 0) + 1; });
  const chunks = docs?.reduce((a, d) => a + (d.chunk_count || 0), 0);
  const Card = ({ title, v, err, children }) => (<div className="glass pad"><span className="tag">{title}</span>{err ? <p className="muted">{err}</p> : v === undefined || v === null ? <LoadingState t={t("admin.loading")} /> : <div className="num">{v}</div>}{children}</div>);
  return (<><div className="cmp">
    <Card title={t("admin.registeredUsers")} v={users} err={uErr} />
    <Card title={t("admin.documentsLabel")} v={docs?.length} err={dErr} />
    <Card title={t("admin.indexedChunks")} v={chunks} err={dErr} />
  </div>
    <div className="glass pad"><span className="tag">{t("admin.docsByRegime")}</span>{dErr ? <p className="muted">{dErr}</p> : !docs ? <LoadingState t={t("admin.loading")} /> : Object.keys(by).length ? Object.entries(by).map(([r, n]) => <p key={r}><b>{r}</b> <span className="muted">{t("admin.document", { count: n })}</span></p>) : <p className="muted">{t("admin.noDocsYet")}</p>}</div>
    <div className="row2"><span className="muted">{t("admin.addPdfs")}</span><button className="btn pri" onClick={() => go("Upload")}>{t("admin.uploadDocument")}</button></div></>);
}
function Documents({ v }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState(null), [err, setErr] = useState(""), [busy, setBusy] = useState(true);
  const load = useCallback(() => { setBusy(true); api.listDocuments().then(d => { setDocs(Array.isArray(d) ? d : d?.documents || []); setErr(""); }).catch(e => setErr(e.message)).finally(() => setBusy(false)); }, []);
  useEffect(load, [load, v]);
  const del = async d => { if (!confirm(t("admin.deleteConfirm", { title: d.title }))) return; try { await api.deleteDocument(d.id); load(); } catch (e) { setErr(e.message); } };
  return (<div className="glass pad docs" style={{ overflowX: "auto" }}>{busy && <LoadingState t={t("admin.loadingDocs")} />}<ErrorMessage m={err} />
    <table><thead><tr>{[t("admin.tableTitle"), t("admin.tableRegime"), t("admin.tableStatus"), t("admin.tableChunks"), ""].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{docs?.map(d => <tr key={d.id}><td>{d.title}</td><td>{d.regime}</td><td>{d.status}</td><td>{d.chunk_count}</td><td><button className="btn" onClick={() => del(d)}>{t("admin.delete")}</button></td></tr>)}
        {docs && !docs.length && <tr><td colSpan={5} className="muted">{t("admin.noDocsUploaded")}</td></tr>}</tbody></table></div>);
}
function Upload({ done }) {
  const { t } = useTranslation();
  const { list } = useRegimes(), ref = useRef();
  const [f, setF] = useState({
    title: "",
    regime: "",
    language: "en",
    doc_type: "regulation",
    source_url: "",

    authority: "",
    instrument_name: "",
    instrument_type: "",
    citation: "",
    version: "",
    effective_date: "",
    last_verified: "",
    official_source: false,
  });
  const [err, setErr] = useState(""), [ok, setOk] = useState(""), [pct, setPct] = useState(null), [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);
  const pick = x => { setErr(""); if (x && !/\.pdf$/i.test(x.name)) return setErr(t("admin.pdfOnly")); setFile(x || null); };
  const go = async e => {
    e.preventDefault(); setErr(""); setOk(""); if (!file) return setErr(t("admin.choosePdf")); if (!f.regime) return setErr(t("admin.selectRegime"));
    const fd = new FormData(); fd.append("file", file); Object.entries(f).forEach(([k, v]) => v && fd.append(k, v)); setPct(0);
    try { await api.uploadDocument(fd, setPct); setOk(t("admin.docUploaded")); setFile(null); done(); } catch (x) { setErr(x.message); } finally { setPct(null); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<form onSubmit={go} className="glass pad"><h3>{t("admin.uploadTitle")}</h3>
    <label>{t("admin.title")}</label><input required value={f.title} onChange={set("title")} />
    <label>{t("admin.authority")}</label>
    <input
      value={f.authority}
      onChange={set("authority")}
      placeholder={t("admin.authorityPlaceholder")}
    />

    <label>{t("admin.instrumentName")}</label>
    <input
      value={f.instrument_name}
      onChange={set("instrument_name")}
      placeholder={t("admin.instrumentNamePlaceholder")}
    />

    <label>{t("admin.instrumentType")}</label>
    <select
      value={f.instrument_type}
      onChange={set("instrument_type")}
    >
      <option value="">{t("admin.selectOption")}</option>
      <option value="Act">{t("admin.act")}</option>
      <option value="Rule">{t("admin.rule")}</option>
      <option value="Regulation">{t("admin.regulation")}</option>
      <option value="Treaty">{t("admin.treaty")}</option>
      <option value="Guideline">{t("admin.guideline")}</option>
      <option value="Order">{t("admin.order")}</option>
      <option value="Record">{t("admin.record")}</option>
    </select>

    <label>{t("admin.citation")}</label>
    <input
      value={f.citation}
      onChange={set("citation")}
      placeholder={t("admin.citationPlaceholder")}
    />

    <label>{t("admin.version")}</label>
    <input
      value={f.version}
      onChange={set("version")}
      placeholder={t("admin.versionPlaceholder")}
    />

    <label>{t("admin.effectiveDate")}</label>
    <input
      type="date"
      value={f.effective_date}
      onChange={set("effective_date")}
    />

    <label>{t("admin.lastVerified")}</label>
    <input
      type="date"
      value={f.last_verified}
      onChange={set("last_verified")}
    />

    <label>
      <input
        type="checkbox"
        checked={f.official_source}
        onChange={(e) =>
          setF({
            ...f,
            official_source: e.target.checked,
          })
        }
      />

      {t("admin.officialSource")}
    </label>
    <label>{t("admin.regime")}</label><select required value={f.regime} onChange={set("regime")}><option value="">{t("admin.selectOption")}</option>{list?.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}</select>
    <label>{t("admin.language")}</label><select value={f.language} onChange={set("language")}>{[["en", t("query.english")], ["hi", t("query.hindi")], ["te", t("query.telugu")], ["zh", t("admin.chinese")]].map(([c, label]) => <option key={c} value={c}>{label}</option>)}</select>
    <label>{t("admin.docType")}</label><select value={f.doc_type} onChange={set("doc_type")}>{["regulation", "guideline", "patent"].map(typ => <option key={typ}>{typ}</option>)}</select>
    <label>{t("admin.sourceUrl")}</label><input type="url" value={f.source_url} onChange={set("source_url")} />
    <div className={"drop" + (drag ? " on" : "")} role="button" tabIndex={0} onClick={() => ref.current.click()} onKeyDown={e => e.key === "Enter" && ref.current.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
      {file ? file.name : t("admin.dropzone")}<input ref={ref} type="file" accept="application/pdf" hidden onChange={e => pick(e.target.files[0])} /></div>
    {pct !== null && <div className="bar"><i style={{ width: pct + "%" }} /></div>}<ErrorMessage m={err} />{ok && <div className="ok" role="status">{ok}</div>}
    <button className="btn pri" disabled={pct !== null}>{pct !== null ? t("admin.uploading", { pct }) : t("admin.uploadDocument")}</button></form>);
}
export default function Admin() {
  const { t } = useTranslation();
  const { logout, email } = useAuth(), nav = useNavigate(), [tab, setTab] = useState("Dashboard"), [v, setV] = useState(0);

  const tabLabels = {
    Dashboard: t("admin.dashboard"),
    Documents: t("admin.documents"),
    Upload: t("admin.upload"),
  };

  return (<div className="shell admin"><nav className="side"><h4>{t("app.adminName")}</h4>
    {["Dashboard", "Documents", "Upload"].map(tabKey => <button key={tabKey} className={"nv" + (tabKey === tab ? " on" : "")} onClick={() => setTab(tabKey)}>{tabLabels[tabKey]}</button>)}
    <NavLink className="nv" to="/query">{t("nav.queryPortalArrow")}</NavLink>
    <LanguageSwitcher />
    <div className="grow" /><p className="tag" style={{ wordBreak: "break-all" }}>{email}</p>
    <button className="nv" onClick={() => { logout(); nav("/login"); }}>{t("nav.logout")}</button></nav>
    <div className="main wide"><h1>{tab === "Upload" ? t("admin.uploadDocument") : tabLabels[tab]}</h1>{tab === "Upload" ? <Upload done={() => setV(v + 1)} /> : tab === "Documents" ? <Documents v={v} /> : <Dashboard go={setTab} key={v} />}</div></div>);
}
