import { toast } from "sonner";

// Use local Flask port by default
const BASE_URL = "http://localhost:5000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isBlob?: boolean;
};

async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, isBlob = false } = options;
  
  const token = localStorage.getItem("busgo_token");
  
  const reqHeaders: Record<string, string> = {
    ...headers,
  };
  
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }
  
  let reqBody: BodyInit | undefined;
  if (body) {
    if (body instanceof FormData) {
      reqBody = body;
    } else {
      reqHeaders["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }
  }
  
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  
  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: reqBody,
    });
    
    if (!res.ok) {
      // Parse error response
      let errMsg = "An unexpected error occurred";
      try {
        const errData = await res.json();
        errMsg = errData.error || errData.message || errMsg;
      } catch {
        errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      }
      
      // If unauthorized, clear local storage
      if (res.status === 401 && (errMsg.includes("Token") || errMsg.includes("expired") || errMsg.includes("signature"))) {
        localStorage.removeItem("busgo_token");
        localStorage.removeItem("busgo_user");
        // Dispatch event so layout header updates
        window.dispatchEvent(new Event("auth_change"));
      }
      
      throw new Error(errMsg);
    }
    
    if (isBlob) {
      return (await res.blob()) as T;
    }
    
    return (await res.json()) as T;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`API Error on ${method} ${path}:`, message);
    throw err;
  }
}

export const api = {
  get: <T = unknown>(path: string, headers?: Record<string, string>) => 
    apiRequest<T>(path, { method: "GET", headers }),
    
  post: <T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) => 
    apiRequest<T>(path, { method: "POST", body, headers }),
    
  put: <T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) => 
    apiRequest<T>(path, { method: "PUT", body, headers }),
    
  delete: <T = unknown>(path: string, headers?: Record<string, string>) => 
    apiRequest<T>(path, { method: "DELETE", headers }),
    
  getBlob: (path: string, headers?: Record<string, string>) => 
    apiRequest<Blob>(path, { method: "GET", headers, isBlob: true }),
};
