const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const K = "access_token";
export const getToken = () => localStorage.getItem(K);
export const logout = () => { localStorage.removeItem(K); localStorage.removeItem("ipsakti_email"); };
export class ApiError extends Error { constructor(m, status) { super(m); this.status = status; } }

async function req(path, { method = "GET", json, form, redirect401 = true } = {}) {
  const headers = {}; let body;
  if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  if (form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = form; }
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let r;
  try { r = await fetch(API_BASE_URL + path, { method, headers, body }); }
  catch { throw new ApiError("Unable to connect to IP-SAKTI backend.", 0); }
  if (r.status === 401 && redirect401) {
    logout(); window.dispatchEvent(new Event("auth:expired"));
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }
  if (!r.ok) {
    let d = ""; try { const j = await r.json(); d = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j); } catch {}
    throw new ApiError(r.status >= 500 ? "Something went wrong on the server." : d || `Request failed (${r.status})`, r.status);
  }
  return r.status === 204 ? null : r.json().catch(() => null);
}

export const register = (email, password) => req("/api/v1/auth/register", { method: "POST", json: { email, password }, redirect401: false });
export async function login(email, password) {
  const form = new URLSearchParams(); form.append("username", email); form.append("password", password); // OAuth2PasswordRequestForm
  const d = await req("/api/v1/auth/login", { method: "POST", form, redirect401: false });
  localStorage.setItem(K, d.access_token); localStorage.setItem("ipsakti_email", email);
  return d.access_token;
}
let cache; // regimes are fetched once per session
export const getRegimes = () => cache || (cache = req("/api/v1/regimes", { redirect401: false }).catch(e => { cache = null; throw e; }));
export const query = (question, regime, top_k = 5, response_language = "auto") => req("/api/v1/query", { method: "POST", json: { question, regime, top_k, response_language } });
export const compareQuery = (question, regimes, top_k = 5) => req("/api/v1/query/compare", { method: "POST", json: { question, regimes, top_k } });

// Admin account = VITE_ADMIN_EMAIL (backend exposes no role). The backend must still enforce admin rights.
export const isAdmin = e => !!e && e.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase();
// Users count: the provided backend contract has no such endpoint. Set VITE_USERS_COUNT_PATH (e.g. /api/v1/admin/users/count)
// to an admin endpoint returning a number, {count|total}, or an array of users.
export const getUserCount = async () => {
  const path = import.meta.env.VITE_USERS_COUNT_PATH;
  if (!path) throw new ApiError("Users endpoint not connected. Set VITE_USERS_COUNT_PATH.", 501);
  const d = await req(path);
  return Array.isArray(d) ? d.length : typeof d === "number" ? d : d?.count ?? d?.total ?? null;
};
export const listDocuments = () => req("/api/v1/documents");
export const deleteDocument = id => req(`/api/v1/documents/${id}`, { method: "DELETE" });
// multipart via XHR so upload progress is real. Fields: file, title, regime, language, doc_type, source_url
export const uploadDocument = (fd, onProgress) => new Promise((ok, no) => {
  const x = new XMLHttpRequest(); x.open("POST", API_BASE_URL + "/api/v1/documents/upload");
  x.setRequestHeader("Authorization", `Bearer ${getToken()}`);
  x.upload.onprogress = e => e.lengthComputable && onProgress?.(Math.round(e.loaded / e.total * 100));
  x.onerror = () => no(new ApiError("Unable to connect to IP-SAKTI backend.", 0));
  x.onload = () => {
    if (x.status === 401) { logout(); window.dispatchEvent(new Event("auth:expired")); return no(new ApiError("Your session has expired. Please log in again.", 401)); }
    let d = {}; try { d = JSON.parse(x.responseText); } catch {}
    x.status < 300 ? ok(d) : no(new ApiError(x.status >= 500 ? "Something went wrong on the server." : (typeof d.detail === "string" ? d.detail : `Upload failed (${x.status})`), x.status));
  };
  x.send(fd);
});
export const analyzeABS = (
  scenario,
  response_language = "auto"
) =>
  req("/api/v1/abs/analyze", {
    method: "POST",
    json: {
      scenario,
      response_language,
    },
  });
