/**
 * Logger estruturado (uma linha JSON por chamada, no stdout — capturado pelo
 * CloudWatch Logs). Todo log inclui requestId para correlacionar com a API
 * Gateway e, através do header X-Request-Id, com os logs da API Rails.
 */
type LogFields = Record<string, unknown>;

function log(level: "info" | "warn" | "error", message: string, fields: LogFields = {}): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields }));
}

export const logger = {
  info: (message: string, fields?: LogFields) => log("info", message, fields),
  warn: (message: string, fields?: LogFields) => log("warn", message, fields),
  error: (message: string, fields?: LogFields) => log("error", message, fields),
};
