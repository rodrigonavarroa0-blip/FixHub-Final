/* SUPABASE - JAVASCRIPT */
/* Small client for the Supabase REST APIs written with fetch(), so every request the
   app makes is visible and easy to explain (no external SDK needed).
   - Data:      {url}/rest/v1/...       (PostgREST)
   - Auth:      {url}/auth/v1/...       (GoTrue)
   - Functions: {url}/functions/v1/...  (Edge Functions) */

import { CONFIG, isSupabaseConfigured } from "../config.js";

const SESSION_KEY = "fixhub_admin_session";

//Error with an HTTP status and a message that can be shown to the user.
export class ApiError extends Error {
    constructor(message, status = 0, code = "") {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

//Throws a clear error when the project keys were not added to js/config.js yet.
function assertConfigured() {
    if (!isSupabaseConfigured()) {
        throw new ApiError("Supabase is not configured. Add your project URL and key in js/config.js.", 0, "not_configured");
    }
}

//Reads the error body returned by Supabase (each API uses slightly different field names).
async function toApiError(response) {
    let message = `Request failed (${response.status})`;
    let code = "";
    try {
        const body = await response.json();
        message = body.message || body.msg || body.error_description || body.error || message;
        code = body.code || body.error_code || "";
    } catch {
        //Body was not JSON; keep the generic message.
    }
    return new ApiError(message, response.status, code);
}

//Wraps fetch() so network failures become ApiError too.
async function send(url, options) {
    let response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new ApiError("Network error. Check your internet connection and try again.", 0, "network");
    }
    if (!response.ok) {
        throw await toApiError(response);
    }
    //204 No Content (or return=minimal) has no body to parse.
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

/* -------------------------------------------------------------- */
/* AUTH (admin session)                                           */
/* -------------------------------------------------------------- */

function saveSession(data) {
    const session = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        //expires_in is in seconds; we store an absolute time in milliseconds.
        expiresAt: Date.now() + data.expires_in * 1000,
        email: data.user?.email ?? "",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function readSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

export async function signIn(email, password) {
    assertConfigured();
    const data = await send(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return saveSession(data);
}

//Returns a valid session, refreshing the access token when it is about to expire.
export async function getSession() {
    const session = readSession();
    if (!session) {
        return null;
    }
    const oneMinute = 60 * 1000;
    if (session.expiresAt - Date.now() > oneMinute) {
        return session;
    }
    try {
        const data = await send(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: session.refreshToken }),
        });
        return saveSession(data);
    } catch {
        clearSession();
        return null;
    }
}

export async function signOut() {
    const session = readSession();
    clearSession();
    if (session && isSupabaseConfigured()) {
        //Best effort: the local session is already gone even if this call fails.
        fetch(`${CONFIG.supabaseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${session.accessToken}` },
        }).catch(() => {});
    }
}

/* -------------------------------------------------------------- */
/* DATA (PostgREST)                                               */
/* -------------------------------------------------------------- */

//Generic request to a table or RPC. `auth: true` sends the admin's token.
async function rest(path, { method = "GET", body, auth = false, prefer } = {}) {
    assertConfigured();
    const headers = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };
    if (auth) {
        const session = await getSession();
        if (!session) {
            throw new ApiError("Your session expired. Please log in again.", 401, "session_expired");
        }
        headers.Authorization = `Bearer ${session.accessToken}`;
    }
    if (prefer) {
        headers.Prefer = prefer;
    }
    return send(`${CONFIG.supabaseUrl}/rest/v1/${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

const SERVICE_COLUMNS = "id,name_en,name_es,description_en,description_es,category,price,duration_minutes,is_active,sort_order";

//Public catalog: RLS only returns active services to visitors.
export function listServices({ includeInactive = false } = {}) {
    const filter = includeInactive ? "" : "&is_active=eq.true";
    return rest(`services?select=${SERVICE_COLUMNS}${filter}&order=sort_order.asc,id.asc`, { auth: includeInactive });
}

export async function createService(service) {
    const rows = await rest("services", { method: "POST", body: service, auth: true, prefer: "return=representation" });
    return rows[0];
}

export async function updateService(id, changes) {
    const rows = await rest(`services?id=eq.${Number(id)}`, { method: "PATCH", body: changes, auth: true, prefer: "return=representation" });
    return rows[0];
}

export function deleteService(id) {
    return rest(`services?id=eq.${Number(id)}`, { method: "DELETE", auth: true });
}

//Visitors cannot read messages back, so we ask for "return=minimal" (no response body).
export function sendContactMessage(message) {
    return rest("contact_messages", { method: "POST", body: message, prefer: "return=minimal" });
}

export function listMessages() {
    return rest("contact_messages?select=id,name,email,phone,message,status,created_at,service_id&order=created_at.desc", { auth: true });
}

export function updateMessageStatus(id, status) {
    return rest(`contact_messages?id=eq.${Number(id)}`, { method: "PATCH", body: { status }, auth: true });
}

export function deleteMessage(id) {
    return rest(`contact_messages?id=eq.${Number(id)}`, { method: "DELETE", auth: true });
}

export function isCurrentUserAdmin() {
    return rest("rpc/is_admin", { method: "POST", body: {}, auth: true });
}

/* -------------------------------------------------------------- */
/* EDGE FUNCTIONS                                                 */
/* -------------------------------------------------------------- */

export function invokeFunction(name, body) {
    assertConfigured();
    return send(`${CONFIG.supabaseUrl}/functions/v1/${name}`, {
        method: "POST",
        headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}
