/**
 * api.js — Central API client for SmartHospital frontend
 * All HTTP communication goes through this module.
 */

const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

// ── Token & User Storage ───────────────────────────────────────────────────────
const getToken  = ()      => localStorage.getItem('sh_token');
const setToken  = (tok)   => localStorage.setItem('sh_token', tok);
const removeToken = ()    => localStorage.removeItem('sh_token');

const getUser   = ()      => { try { return JSON.parse(localStorage.getItem('sh_user')); } catch { return null; } };
const setUser   = (user)  => localStorage.setItem('sh_user', JSON.stringify(user));
const removeUser = ()     => localStorage.removeItem('sh_user');

const isLoggedIn = ()     => !!getToken();

const redirectToLogin = () => {
  removeToken(); removeUser();
  const base = window.location.origin;
  // If we are in a subfolder like /pages/, we need to go to /pages/login.html
  // If we are at the root, we go to /pages/login.html
  // Using absolute path from origin for stability
  window.location.href = `${base}/pages/login.html`;
};

// ── Core Request ───────────────────────────────────────────────────────────────
const request = async (method, endpoint, body = null, isFormData = false) => {
  const headers = {};
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  try {
    const res  = await fetch(`${BASE_URL}${endpoint}`, opts);
    const json = await res.json();

    if (res.status === 401) {
      redirectToLogin();
      return { ok: false, data: json };
    }

    return { ok: res.ok, status: res.status, data: json };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, data: { success: false, message: 'Network error — could not reach the server.' } };
  }
};

// ── Convenience Methods ────────────────────────────────────────────────────────
const api = {
  get:    (ep)        => request('GET',    ep),
  post:   (ep, body)  => request('POST',   ep, body),
  put:    (ep, body)  => request('PUT',    ep, body),
  patch:  (ep, body)  => request('PATCH',  ep, body),
  del:    (ep)        => request('DELETE', ep),
  upload: (ep, fd)    => request('POST',   ep, fd, true),

  // Auth helpers
  getToken, setToken, removeToken,
  getUser,  setUser,  removeUser,
  isLoggedIn, redirectToLogin,
};

window.api = api;
