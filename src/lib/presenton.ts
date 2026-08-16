// NIGHTMARE AI — Presenton API client (server-only)
// Docs: https://docs.presenton.ai

// LAZY INIT: On Cloudflare Workers, process.env is populated at runtime
// from Worker bindings, NOT at module load time. Reading it into a
// module-level constant captures an empty value. We must read it inside
// each function call so it picks up the secret at request time.
function getBaseUrl(): string {
  return process.env.PRESENTON_API_URL || "https://api.presenton.ai";
}

function getApiKey(): string {
  return process.env.PRESENTON_API_KEY || "";
}

export function isConfigured(): boolean {
  return !!getApiKey();
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export interface GenerateBody {
  content: string;
  instructions?: string;
  n_slides?: number;
  language?: string;
  template?: string;
  tone?: string;
  verbosity?: string;
  mode?: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  message?: string;
  stage?: string;
  percent?: number;
  data?: unknown;
  error?: string;
  updated_at?: string;
}

export async function generatePresentationAsync(
  body: GenerateBody
): Promise<{ task_id: string; status: string; stage?: string; percent?: number }> {
  if (!isConfigured()) {
    throw new Error("Presenton API key not configured");
  }
  const res = await fetchWithTimeout(
    `${getBaseUrl()}/api/v3/presentation/generate/async`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    },
    30_000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Presenton generate failed (${res.status}): ${text || res.statusText}`
    );
  }
  const json = (await res.json()) as {
    task_id?: string;
    id?: string;
    status?: string;
    stage?: string;
    percent?: number;
  };
  const taskId = json.task_id || json.id;
  if (!taskId) {
    throw new Error("Presenton did not return a task_id");
  }
  return {
    task_id: taskId,
    status: json.status || "pending",
    stage: json.stage,
    percent: json.percent,
  };
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  if (!isConfigured()) {
    throw new Error("Presenton API key not configured");
  }
  const res = await fetchWithTimeout(
    `${getBaseUrl()}/api/v3/async-task/status/${taskId}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
    20_000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Presenton status failed (${res.status}): ${text || res.statusText}`
    );
  }
  return (await res.json()) as TaskStatus;
}

export async function listTemplates(
  page = 1,
  pageSize = 50
): Promise<{ templates: unknown[]; total?: number }> {
  if (!isConfigured()) {
    return { templates: [] };
  }
  const res = await fetchWithTimeout(
    `${getBaseUrl()}/api/v3/standard-template/all?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
    20_000
  );
  if (!res.ok) {
    return { templates: [] };
  }
  const json = (await res.json()) as { templates?: unknown[]; items?: unknown[]; total?: number };
  return {
    templates: json.templates || json.items || [],
    total: json.total,
  };
}

export async function exportPresentation(
  id: string,
  format: "pptx" | "pdf"
): Promise<{ url?: string; download_url?: string; path?: string }> {
  if (!isConfigured()) {
    throw new Error("Presenton API key not configured");
  }
  const res = await fetchWithTimeout(
    `${getBaseUrl()}/api/v3/presentation/export`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ presentation_id: id, export_as: format }),
    },
    60_000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Presenton export failed (${res.status}): ${text || res.statusText}`
    );
  }
  return (await res.json()) as {
    url?: string;
    download_url?: string;
    path?: string;
  };
}
