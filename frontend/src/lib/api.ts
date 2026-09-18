import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiRequestOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { data, headers = {}, ...customConfig } = options;

  // Retrieve current session token if available
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const requestHeaders: Record<string, string> = {
    ...headers as Record<string, string>,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Handle JSON bodies automatically if not FormData
  let body: any = customConfig.body;
  if (data !== undefined) {
    if (data instanceof FormData) {
      body = data;
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...customConfig,
    headers: requestHeaders,
    body,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorMessage = errorJson.detail;
      } else if (Array.isArray(errorJson.detail) && errorJson.detail.length > 0) {
        errorMessage = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // If not JSON, use status text
      if (response.statusText) {
        errorMessage = response.statusText;
      }
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

apiClient.get = function<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

apiClient.post = function<T = any>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'POST', data });
};

apiClient.put = function<T = any>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'PUT', data });
};

apiClient.patch = function<T = any>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'PATCH', data });
};

apiClient.delete = function<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};

