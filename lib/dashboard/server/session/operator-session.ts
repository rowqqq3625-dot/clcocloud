/**
 * 운영자 세션 서비스 (OperatorSessionService)
 * - JWT 토큰 발급 및 자동 갱신
 * - 동시 갱신 방지를 위한 in-flight 뮤텍스
 * - 세션 만료 시 Webhook 알림
 * - 세션 상태 헬스 체크
 *
 * 보안 규칙:
 *   - 크레덴셜(이메일, 비밀번호, 토큰)은 절대 로그에 출력하지 않음
 *   - 세션은 서버 메모리에만 존재, DB나 파일에 저장하지 않음 (R5 준수)
 */

import type {
  OperatorSession,
  SessionStatus,
  SessionHealth,
  LoginResponse,
} from '../../types/session';
import { getOperatorConfig } from './config';

/** 세션 상태 변경 콜백 */
type StatusChangeCallback = (prev: SessionStatus, next: SessionStatus) => void;

class OperatorSessionService {
  private session: OperatorSession | null = null;
  private status: SessionStatus = 'initializing';
  private lastRefreshedAt: number | null = null;
  private refreshPromise: Promise<OperatorSession> | null = null;
  private startedAt: number = Date.now();
  private lastAlertedStatus: SessionStatus | null = null;
  private statusChangeCallbacks: StatusChangeCallback[] = [];

  /**
   * 유효한 운영자 세션을 가져옴
   * - 세션이 없거나 만료 임박 시 자동 갱신
   * - 동시 요청 시 같은 갱신 Promise를 공유 (뮤텍스)
   */
  async getSession(): Promise<OperatorSession> {
    // 유효한 세션이 있으면 바로 반환
    if (this.session !== null && !this.isExpiringSoon()) {
      return this.session;
    }

    // 이미 갱신 중이면 같은 Promise 공유
    if (this.refreshPromise !== null) {
      return this.refreshPromise;
    }

    // 새로운 갱신 시작
    this.refreshPromise = this.doRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 세션 갱신 수행
   * - POST /api/v1/auth/login 으로 JWT 토큰 발급
   */
  private async doRefresh(): Promise<OperatorSession> {
    const config = getOperatorConfig();
    const prevStatus = this.status;

    try {
      if (config.authMode === 'token') {
        const now = Date.now();
        this.session = {
          accessToken: config.token ?? '',
          expiresAt: now + 60 * 60 * 1000,
          userId: 0,
          email: 'operator-token',
          role: 'operator',
        };
        this.lastRefreshedAt = now;
        this.setStatus('active');
        return this.session;
      }

      if (config.authMode === 'cookie') {
        const now = Date.now();
        this.session = {
          accessToken: '',
          expiresAt: now + 60 * 60 * 1000,
          userId: 0,
          email: 'operator-cookie',
          role: 'operator',
          cookieHeader: config.cookie,
        };
        this.lastRefreshedAt = now;
        this.setStatus('active');
        return this.session;
      }

      const response = await fetch(`${config.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.email,
          password: config.password,
        }),
        signal: AbortSignal.timeout(10_000), // 10초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`로그인 실패: HTTP ${response.status}`);
      }

      const json = (await response.json()) as LoginResponse;

      if (json.code !== 0) {
        throw new Error(`로그인 실패: ${json.message}`);
      }

      const { data } = json;
      const now = Date.now();

      this.session = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: now + data.expires_in * 1000,
        userId: data.user.id,
        email: data.user.email,
        role: data.user.role,
      };

      this.lastRefreshedAt = now;
      this.setStatus('active');

      // 상태 변경 시 알림 (한 번만)
      if (prevStatus !== 'active') {
        console.log('[AIP Session] 운영자 세션 활성화됨');
      }

      return this.session;
    } catch (error) {
      this.setStatus('expired');

      // Webhook 알림 발송
      await this.fireAlert(
        `운영자 세션 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );

      throw new AipSessionExpiredError(
        '운영자 세션이 만료되었습니다. 잠시 후 다시 시도해주세요.'
      );
    }
  }

  /**
   * 세션 만료 임박 여부 확인
   * - 만료 5분 전부터 갱신 시도
   */
  private isExpiringSoon(): boolean {
    if (this.session === null) return true;
    const BUFFER_MS = 5 * 60 * 1000; // 5분 여유
    return Date.now() >= this.session.expiresAt - BUFFER_MS;
  }

  /**
   * 상태 변경 및 콜백 호출
   */
  private setStatus(newStatus: SessionStatus): void {
    const prevStatus = this.status;
    if (prevStatus === newStatus) return;

    this.status = newStatus;
    for (const cb of this.statusChangeCallbacks) {
      try {
        cb(prevStatus, newStatus);
      } catch {
        // 콜백 오류 무시
      }
    }
  }

  /**
   * Webhook 알림 발송
   * - 같은 상태에 대해 한 번만 발송
   * - ALERT_WEBHOOK_URL이 설정된 경우에만 발송
   */
  private async fireAlert(message: string): Promise<void> {
    // 같은 상태에 대한 중복 알림 방지
    if (this.lastAlertedStatus === this.status) return;
    this.lastAlertedStatus = this.status;

    const config = getOperatorConfig();
    if (!config.alertWebhookUrl) return;

    try {
      await fetch(config.alertWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'routeai-dashboard',
          status: this.status,
          message,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      console.error('[RouteAI Session] Webhook 알림 발송 실패');
    }
  }

  /**
   * 세션 헬스 체크 결과 반환
   */
  getHealth(): SessionHealth {
    const config = getOperatorConfig();
    return {
      status: this.status,
      lastRefreshedAt: this.lastRefreshedAt !== null
        ? new Date(this.lastRefreshedAt).toISOString()
        : null,
      expiresAt: this.session !== null
        ? new Date(this.session.expiresAt).toISOString()
        : null,
      authMode: config.authMode,
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  /**
   * 현재 세션 상태 반환
   */
  getStatus(): SessionStatus {
    return this.status;
  }

  /**
   * 세션을 강제로 만료 처리 (테스트/관리용)
   */
  invalidate(): void {
    this.session = null;
    this.setStatus('expired');
    console.log('[RouteAI Session] 운영자 세션이 무효화되었습니다.');
  }

  /**
   * 401 응답 수신 시 세션 만료 처리
   * - 세션을 무효화하고 다음 요청 시 자동 갱신 시도
   */
  async handleUnauthorized(): Promise<void> {
    this.session = null;
    this.setStatus('expired');
    await this.fireAlert('운영자 세션이 만료되었습니다 (401 수신)');
  }

  /**
   * 상태 변경 리스너 등록
   */
  onStatusChange(callback: StatusChangeCallback): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * 서비스 리셋 (테스트용)
   */
  reset(): void {
    this.session = null;
    this.status = 'initializing';
    this.lastRefreshedAt = null;
    this.refreshPromise = null;
    this.startedAt = Date.now();
    this.lastAlertedStatus = null;
    this.statusChangeCallbacks = [];
  }
}

/** 세션 만료 에러 */
export class AipSessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AipSessionExpiredError';
  }
}

/**
 * 싱글톤 인스턴스
 * - 프로세스 레벨에서 하나만 존재
 * - 사용자 데이터를 보관하지 않음 (R5: 모듈 레벨 뮤터블 스테이트에 사용자 데이터 없음)
 * - 운영자 인증 정보만 관리
 */
export const operatorSessionService = new OperatorSessionService();
