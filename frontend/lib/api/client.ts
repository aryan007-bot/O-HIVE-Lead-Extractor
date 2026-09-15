const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    let url: URL;
    if (this.baseUrl && (this.baseUrl.startsWith("http://") || this.baseUrl.startsWith("https://"))) {
      url = new URL(endpoint, this.baseUrl);
    } else {
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      url = new URL(endpoint, base);
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "An error occurred" }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: FormData | unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: isFormData
        ? { "Bypass-Tunnel-Reminder": "true", "ngrok-skip-browser-warning": "true", ...options?.headers }
        : { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true", "ngrok-skip-browser-warning": "true", ...options?.headers },
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true", "ngrok-skip-browser-warning": "true", ...options?.headers },
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async download(endpoint: string, options?: RequestOptions): Promise<Blob> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Download failed" }));
      throw new Error(errorData.detail || "Download failed");
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
