const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status = 500, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = RequestInit & {
  authToken?: string | null;
};

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("telefya_access_token");
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const body = payload as {
    message?: string;
    error?: string | boolean;
  };

  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;

  return "";
}

function getPayloadStatus(payload: unknown, fallback: number) {
  if (!payload || typeof payload !== "object") return fallback;

  const body = payload as {
    status?: number;
  };

  return body.status || fallback;
}

function isSuccessfulPayload(payload: unknown, responseOk: boolean) {
  if (!payload || typeof payload !== "object") return responseOk;

  const body = payload as {
    success?: boolean;
    error?: boolean | string;
    status?: number;
  };

  if (body.success === true) return true;
  if (body.error === false) return true;
  if (body.status && body.status >= 200 && body.status < 300) return true;

  return responseOk;
}

function isExplicitFailure(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;

  const body = payload as {
    success?: boolean;
    error?: boolean | string;
    status?: number;
  };

  if (body.success === true) return false;
  if (body.error === false) return false;
  if (body.status && body.status >= 200 && body.status < 300) return false;

  if (body.success === false) return true;
  if (body.error === true) return true;

  return false;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.authToken ?? getStoredToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const payload = isJson ? await response.json() : await response.text();

  const payloadSucceeded = isSuccessfulPayload(payload, response.ok);

  if ((!response.ok && !payloadSucceeded) || isExplicitFailure(payload)) {
    throw new ApiError(
      getPayloadMessage(payload) || "Request failed",
      getPayloadStatus(payload, response.status),
      payload,
    );
  }

  return payload as T;
}

export const apiClient = {
  get<T>(path: string, options?: ApiRequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "GET",
    });
  },

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  put<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  delete<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};