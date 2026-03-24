export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://barberpro-op6v.onrender.com/api';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export class HttpClient {
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  static setToken(token: string) {
    localStorage.setItem('token', token);
  }

  static clearToken() {
    localStorage.removeItem('token');
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }

        const errorData = await response.text();
        let errorMessage = 'Erro na requisição';

        try {
          const parsedError = JSON.parse(errorData) as ApiError | { message?: string };
          if (parsedError && typeof parsedError === 'object' && 'message' in parsedError && typeof parsedError.message === 'string') {
            errorMessage = parsedError.message;
          } else {
            errorMessage = errorData || `Erro ${response.status}`;
          }
        } catch {
          errorMessage = errorData || `Erro ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      if (response.status === 204 || response.status === 205) {
        return undefined as T;
      }

      const text = await response.text();

      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } catch (error) {
      console.error('Erro na requisição HTTP:', error);
      throw error;
    }
  }
}
