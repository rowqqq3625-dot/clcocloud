/**
 * 감사 로거 (Audit Logger)
 * - R7: 모든 성공적인 조회에 대해 감사 기록
 * - 평문 API 키는 절대 로그에 포함하지 않음
 * - fingerprint(userKey)만 기록
 */

export interface AuditEntry {
  timestamp: string;
  requestId: string;
  fingerprint: string; // SHA-256 hex of user key (처음 16자만 표시)
  rowCount: number;
  range: string;
  latencyMs: number;
}

/**
 * 감사 로그 기록
 * - 현재는 stdout으로 출력 (추후 외부 로그 시스템 연동 가능)
 * - 절대로 평문 키를 포함하지 않음
 */
export function logAudit(entry: AuditEntry): void {
  const logLine = JSON.stringify({
    type: 'AUDIT',
    ...entry,
    // fingerprint는 처음 16자만 표시 (보안 강화)
    fingerprint: entry.fingerprint.substring(0, 16),
  });
  console.log(logLine);
}
