const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const text = await response.text();

    let data = {};
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        data = { error: `Invalid server response (${response.status}): ${text.substring(0, 100)}` };
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to backend server. Please make sure the Flask backend is running on http://localhost:5000.');
    }
    throw err;
  }
}
