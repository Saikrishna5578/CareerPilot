import { supabase } from './supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (e) {
      console.warn("Failed to get supabase session for auth header:", e);
    }
  }
  
  // Clean path to prevent double slash if API has trailing slash and path has leading slash
  const apiBase = API.endsWith('/') ? API.slice(0, -1) : API;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return fetch(`${apiBase}${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}
