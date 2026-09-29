import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, LoadingState, useRegimes } from "../components/ui";
import * as api from "../services/api";

function Dashboard({ go }) {
  const [docs, setDocs] = useState(null), [users, setUsers] = useState(undefined), [dErr, setDErr] = useState(""), [uErr, setUErr] = useState("");
  useEffect(() => {
    api.listDocuments().then(d => setDocs(Array.isArray(d) ? d : d?.documents || [])).catch(e => setDErr(e.message));
    api.getUserCount().then(setUsers).catch(e => setUErr(e.message));
  }, []);
  const by = {}; docs?.forEach(d => { by[d.regime] = (by[d.regime] || 0) + 1; });
  const chunks = docs?.reduce((a, d) => a + (d.chunk_count || 0), 0);
  const Card = ({ t, v, err, children }) => (<div className="glass pad"><span className="tag">{t}</span>{err ? <p className="muted">{err}</p> : v === undefined || v === null ? <LoadingState t="Loading..." /> : <div className="num">{v}</div>}{children}</div>);
  return (<><div className="cmp">
    <Card t="Registered users" v={users} err={uErr} />
    <Card t="Documents" v={docs?.length} err={dErr} />
    <Card t="Indexed chunks" v={chunks} err={dErr} />
  </div>
    <div className="glass pad"><span className="tag">Documents by regime</span>{dErr ? <p className="muted">{dErr}</p> : !docs ? <LoadingState t="Loading..." /> : Object.keys(by).length ? Object.entries(by).map(([r, n]) => <p key={r}><b>{r}</b> <span className="muted">{n} document{n === 1 ? "" : "s"}</span></p>) : <p className="muted">No documents yet.</p>}</div>
    <div className="row2"><span className="muted">Add regulatory PDFs to the knowledge base.</span><button className="btn pri" onClick={() => go("Upload")}>Upload Document</button></div></>);
}
function Documents({ v }) {
  const [docs, setDocs] = useState(null), [err, setErr] = useState(""), [busy, setBusy] = useState(true);
  const load = useCallback(() => { setBusy(true); api.listDocuments().then(d => { setDocs(Array.isArray(d) ? d : d?.documents || []); setErr(""); }).catch(e => setErr(e.message)).finally(() => setBusy(false)); }, []);
  useEffect(load, [load, v]);
  const del = async d => { if (!confirm(`Delete "${d.title}"?`)) return; try { await api.deleteDocument(d.id); load(); } catch (e) { setErr(e.message); } };
  return (<div className="glass pad docs" style={{ overflowX: "auto" }}>{busy && <LoadingState t="Loading documents..." />}<ErrorMessage m={err} />
    <table><thead><tr>{["Title", "Regime", "Status", "Chunks", ""].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{docs?.map(d => <tr key={d.id}><td>{d.title}</td><td>{d.regime}</td><td>{d.status}</td><td>{d.chunk_count}</td><td><button className="btn" onClick={() => del(d)}>Delete</button></td></tr>)}
        {docs && !docs.length && <tr><td colSpan={5} className="muted">No documents uploaded yet.</td></tr>}</tbody></table></div>);
}
function Upload({ done }) {
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
  const pick = x => { setErr(""); if (x && !/\.pdf$/i.test(x.name)) return setErr("Only PDF files are supported."); setFile(x || null); };
  const go = async e => {
    e.preventDefault(); setErr(""); setOk(""); if (!file) return setErr("Choose a PDF to upload."); if (!f.regime) return setErr("Select a regime.");
    const fd = new FormData(); fd.append("file", file); Object.entries(f).forEach(([k, v]) => v && fd.append(k, v)); setPct(0);
    try { await api.uploadDocument(fd, setPct); setOk("Document uploaded."); setFile(null); done(); } catch (x) { setErr(x.message); } finally { setPct(null); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<form onSubmit={go} className="glass pad"><h3>Upload Regulatory Document</h3>
    <label>Title</label><input required value={f.title} onChange={set("title")} />
    <label>Authority</label>
    <input
      value={f.authority}
      onChange={set("authority")}
      placeholder="e.g. Government of India"
    />

    <label>Instrument name</label>
    <input
      value={f.instrument_name}
      onChange={set("instrument_name")}
      placeholder="e.g. Patents Act, 1970"
    />

    <label>Instrument type</label>
    <select
      value={f.instrument_type}
      onChange={set("instrument_type")}
    >
      <option value="">Select…</option>
      <option value="Act">Act</option>
      <option value="Rule">Rule</option>
      <option value="Regulation">Regulation</option>
      <option value="Treaty">Treaty</option>
      <option value="Guideline">Guideline</option>
      <option value="Order">Order</option>
      <option value="Record">Record</option>
    </select>

    <label>Citation</label>
    <input
      value={f.citation}
      onChange={set("citation")}
      placeholder="e.g. Section 3(p)"
    />

    <label>Version</label>
    <input
      value={f.version}
      onChange={set("version")}
      placeholder="e.g. 2024"
    />

    <label>Effective date</label>
    <input
      type="date"
      value={f.effective_date}
      onChange={set("effective_date")}
    />

    <label>Last verified</label>
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

      Official source
    </label>
    <label>Regime</label><select required value={f.regime} onChange={set("regime")}><option value="">Select…</option>{list?.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}</select>
    <label>Language</label><select value={f.language} onChange={set("language")}>{[["en", "English"], ["hi", "Hindi"], ["te", "Telugu"], ["zh", "Chinese"]].map(([c, t]) => <option key={c} value={c}>{t}</option>)}</select>
    <label>Document type</label><select value={f.doc_type} onChange={set("doc_type")}>{["regulation", "guideline", "patent"].map(t => <option key={t}>{t}</option>)}</select>
    <label>Source URL</label><input type="url" value={f.source_url} onChange={set("source_url")} />
    <div className={"drop" + (drag ? " on" : "")} role="button" tabIndex={0} onClick={() => ref.current.click()} onKeyDown={e => e.key === "Enter" && ref.current.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
      {file ? file.name : "Drag & drop a PDF here, or click to browse"}<input ref={ref} type="file" accept="application/pdf" hidden onChange={e => pick(e.target.files[0])} /></div>
    {pct !== null && <div className="bar"><i style={{ width: pct + "%" }} /></div>}<ErrorMessage m={err} />{ok && <div className="ok" role="status">{ok}</div>}
    <button className="btn pri" disabled={pct !== null}>{pct !== null ? `Uploading ${pct}%` : "Upload Document"}</button></form>);
}
export default function Admin() {
  const { logout, email } = useAuth(), nav = useNavigate(), [tab, setTab] = useState("Dashboard"), [v, setV] = useState(0);
  return (<div className="shell admin"><nav className="side"><h4>IP-SAKTI Admin</h4>
    {["Dashboard", "Documents", "Upload"].map(t => <button key={t} className={"nv" + (t === tab ? " on" : "")} onClick={() => setTab(t)}>{t}</button>)}
    <NavLink className="nv" to="/query">Query Portal →</NavLink><div className="grow" /><p className="tag" style={{ wordBreak: "break-all" }}>{email}</p>
    <button className="nv" onClick={() => { logout(); nav("/login"); }}>Logout</button></nav>
    <div className="main wide"><h1>{tab === "Upload" ? "Upload Document" : tab}</h1>{tab === "Upload" ? <Upload done={() => setV(v + 1)} /> : tab === "Documents" ? <Documents v={v} /> : <Dashboard go={setTab} key={v} />}</div></div>);
}
