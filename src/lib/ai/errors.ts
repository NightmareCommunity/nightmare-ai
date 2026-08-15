// NIGHTMARE AI — error classification

export type AIErrorKind =
  | "rate_limit"
  | "timeout"
  | "network"
  | "auth"
  | "config"
  | "model_unavailable"
  | "invalid_request"
  | "cancelled"
  | "server"
  | "unknown";

export class AIError extends Error {
  kind: AIErrorKind;
  status?: number;
  constructor(kind: AIErrorKind, message: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.kind = kind;
    this.status = status;
  }
}

export function classifyHttpError(status: number): AIErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model_unavailable";
  if (status === 408) return "timeout";
  if (status === 429) return "rate_limit";
  if (status >= 400 && status < 500) return "invalid_request";
  if (status >= 500) return "server";
  return "unknown";
}
