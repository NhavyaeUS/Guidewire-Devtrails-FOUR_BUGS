const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // For admin requests, add password if available
  const adminPassword = localStorage.getItem('adminPassword');
  if (adminPassword) {
    headers['x-admin-password'] = adminPassword;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data: any, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  patch: (endpoint: string, data: any, options?: RequestInit) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
