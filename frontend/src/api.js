import axios from 'axios';

// Generate a persistent session ID for this browser
const getSessionId = () => {
  let sid = localStorage.getItem('phishguard_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('phishguard_session', sid);
  }
  return sid;
};

const SESSION_ID = getSessionId();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export const scanInput = (text, type) =>
  api.post('/api/scan', {
    input_text: text,
    input_type: type,
    session_id: SESSION_ID
  }).then(r => r.data);

export const getHistory = (limit = 20) =>
  api.get(`/api/history?limit=${limit}&session_id=${SESSION_ID}`).then(r => r.data);

export const getStats = () =>
  api.get(`/api/stats?session_id=${SESSION_ID}`).then(r => r.data);

export const deleteScan = (id) =>
  api.delete(`/api/scan/${id}`).then(r => r.data);