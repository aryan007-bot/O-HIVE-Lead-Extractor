const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return "";
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0 && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl.trim();
  }
  return "";
};

const API_BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    let urlStr: string;

    if (this.baseUrl) {
      try {
        const base = new URL(this.baseUrl);
        urlStr = new URL(endpoint, base).toString();
      } catch {
        urlStr = endpoint;
      }
    } else {
      urlStr = endpoint;
    }

    if (params && Object.keys(params).length > 0) {
      const url = new URL(urlStr, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      urlStr = url.pathname + url.search;
    }

    return urlStr;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("503") ||
        message.includes("502") ||
        message.includes("504") ||
        message.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("econnrefused") ||
        message.includes("econnreset") ||
        message.includes("etimedout") ||
        message.includes("aborted")
      );
    }
    return false;
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {},
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries && this.isRetryableError(error)) {
          const delay = Math.min(5000 * Math.pow(2, attempt) + Math.random() * 2000, 15000);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "An error occurred" }));
        const error = new Error(errorData.detail || `Request failed with status ${response.status}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: FormData | unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: isFormData
        ? { ...options?.headers }
        : { "Content-Type": "application/json", ...options?.headers },
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.requestWithRetry<T>(endpoint, { ...options, method: "DELETE" });
  }

  async download(endpoint: string, options?: RequestOptions): Promise<Blob> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Download failed" }));
      throw new Error(errorData.detail || "Download failed");
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
