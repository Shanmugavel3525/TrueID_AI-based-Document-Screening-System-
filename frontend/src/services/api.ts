import type {
  AuthResponse, ScreeningDetail, ScreeningSummary, DashboardStats,
  RegistryRecord, AuditLog, RiskWeights, DocumentData
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'https://trueid-backend-vj3z.onrender.com/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sih_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(errorData.detail || 'Login failed');
  }
  return res.json();
}

export async function getMeApi(): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json();
}

export async function uploadDocumentApi(file: File, documentType: string): Promise<DocumentData> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Upload failed');
  }
  return res.json();
}

export async function createScreeningApi(
  documentId: string,
  livePhoto?: File | null,
  presetDataJson?: string
): Promise<ScreeningDetail> {
  const formData = new FormData();
  formData.append('document_id', documentId);
  if (livePhoto) {
    formData.append('live_photo', livePhoto);
  }
  if (presetDataJson) {
    formData.append('preset_data_json', presetDataJson);
  }

  const res = await fetch(`${API_BASE}/screenings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Screening pipeline failed' }));
    throw new Error(errorData.detail || 'Screening pipeline execution error');
  }
  return res.json();
}

export async function getScreeningApi(id: string): Promise<ScreeningDetail> {
  const res = await fetch(`${API_BASE}/screenings/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Screening dossier not found');
  return res.json();
}

export async function listScreeningsApi(params?: {
  status?: string;
  risk?: string;
  doc_type?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<ScreeningSummary[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status_filter', params.status);
  if (params?.risk) query.append('risk_filter', params.risk);
  if (params?.doc_type) query.append('doc_type_filter', params.doc_type);
  if (params?.search) query.append('search', params.search);
  if (params?.skip) query.append('skip', String(params.skip));
  if (params?.limit) query.append('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/screenings?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch screenings');
  return res.json();
}

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/screenings/stats/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function submitDecisionApi(
  id: string,
  status: string,
  notes: string
): Promise<ScreeningDetail> {
  const res = await fetch(`${API_BASE}/screenings/${id}/decision`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, officer_notes: notes }),
  });
  if (!res.ok) throw new Error('Failed to submit determination');
  return res.json();
}

export async function listRegistriesApi(type?: string, search?: string): Promise<RegistryRecord[]> {
  const query = new URLSearchParams();
  if (type) query.append('registry_type', type);
  if (search) query.append('search', search);

  const res = await fetch(`${API_BASE}/registries?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch registry records');
  return res.json();
}

export async function createRegistryRecordApi(data: Partial<RegistryRecord>): Promise<RegistryRecord> {
  const res = await fetch(`${API_BASE}/registries`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create registry record');
  return res.json();
}

export async function deleteRegistryRecordApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/registries/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete record');
}

export async function listAuditLogsApi(action?: string, resource?: string): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (action) query.append('action_type', action);
  if (resource) query.append('resource_type', resource);

  const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function getRiskWeightsApi(): Promise<RiskWeights> {
  const res = await fetch(`${API_BASE}/settings/risk-weights`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch risk weights');
  return res.json();
}

export async function updateRiskWeightsApi(weights: RiskWeights): Promise<RiskWeights> {
  const res = await fetch(`${API_BASE}/settings/risk-weights`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(weights),
  });
  if (!res.ok) throw new Error('Failed to update risk weights');
  return res.json();
}