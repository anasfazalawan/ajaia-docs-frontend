const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type GetToken = () => Promise<string | null>;

let inFlightTokenPromise: Promise<string | null> | null = null;

async function resolveToken(getToken: GetToken): Promise<string | null> {
  const direct = await getToken();
  if (direct) return direct;
  if (typeof window === 'undefined') return null;

  if (inFlightTokenPromise) return inFlightTokenPromise;

  inFlightTokenPromise = (async () => {
    try {
      const { createClient } = await import('./supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    } finally {
      inFlightTokenPromise = null;
    }
  })();

  return inFlightTokenPromise;
}

/**
 * Builds a bound API client. Every call fetches the current Supabase
 * access token right before the request (the Supabase client refreshes
 * it silently in the background), so this never holds a stale credential.
 */
export function createApi(getToken: GetToken) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await resolveToken(getToken);

    const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
      } catch {
        // fall back to default message
      }
      throw new ApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    me: () => request<{ id: string; email: string; name: string }>('/auth/me'),
    listDocuments: () => request<import('@/types').DocumentListResponse>('/documents'),
    createDocument: (title?: string) =>
      request<import('@/types').DocumentSummary>('/documents', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    getDocument: (id: string) => request<import('@/types').DocumentDetail>(`/documents/${id}`),
    updateDocument: (id: string, data: { title?: string; content?: string }) =>
      request<import('@/types').DocumentSummary>(`/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
    leaveDocument: (id: string) => request<{ left: boolean }>(`/documents/${id}/leave`, { method: 'POST' }),
    listShares: (documentId: string) =>
      request<import('@/types').DocumentShare[]>(`/documents/${documentId}/shares`),
    shareDocument: (documentId: string, email: string, role: 'viewer' | 'editor' = 'editor') =>
      request<import('@/types').DocumentShare>(`/documents/${documentId}/shares`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
    revokeShare: (documentId: string, shareId: string) =>
      request<void>(`/documents/${documentId}/shares/${shareId}`, { method: 'DELETE' }),
    listVersions: (documentId: string) =>
      request<import('@/types').DocumentVersion[]>(`/documents/${documentId}/versions`),
    createVersion: (documentId: string) =>
      request<import('@/types').DocumentVersion>(`/documents/${documentId}/versions`, {
        method: 'POST',
      }),
    restoreVersion: (documentId: string, versionId: string) =>
      request<import('@/types').DocumentSummary>(
        `/documents/${documentId}/versions/${versionId}/restore`,
        { method: 'POST' },
      ),
    importDocument: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<import('@/types').DocumentSummary>('/upload/import', {
        method: 'POST',
        body: formData,
      });
    },
    getToken,
  };
}

export type ApiClient = ReturnType<typeof createApi>;
