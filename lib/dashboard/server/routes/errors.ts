import { AipSessionExpiredError } from '../session/operator-session';
import {
  AipDirectEndpointUnconfirmedError,
  AipDirectKeyRejectedError,
  AipUpstreamError,
  AipUpstreamParseError,
  AipUpstreamShapeError,
  AipUpstreamTimeoutError,
} from '../upstream/client';
import {
  AipForeignKeyError,
  AipInvalidKeyFormatError,
} from '../keys/registry';

export type PublicErrorCode =
  | 'FOREIGN_KEY'
  | 'INVALID_FORMAT'
  | 'SESSION_DOWN'
  | 'RATE_LIMITED'
  | 'DIRECT_KEY_REJECTED'
  | 'DIRECT_ENDPOINT_UNCONFIRMED'
  | 'UPSTREAM_SHAPE'
  | 'UPSTREAM'
  | 'TIMEOUT'
  | 'SERVER_CONFIG'
  | 'BAD_REQUEST'
  | 'INTERNAL';

const messages: Record<PublicErrorCode, string> = {
  FOREIGN_KEY: '이 키는 본 플랫폼에서 발급되지 않았습니다.',
  INVALID_FORMAT: 'API 키 형식이 올바르지 않습니다.',
  SESSION_DOWN: '잠시 후 다시 시도해주세요.',
  RATE_LIMITED: '요청이 많습니다. 잠시 후 다시 시도하세요.',
  DIRECT_KEY_REJECTED: '키를 확인할 수 없습니다. 다시 확인해주세요.',
  DIRECT_ENDPOINT_UNCONFIRMED: '데이터를 불러오지 못했습니다.',
  UPSTREAM_SHAPE: '데이터를 불러오지 못했습니다.',
  UPSTREAM: '데이터를 불러오지 못했습니다.',
  TIMEOUT: '데이터를 불러오지 못했습니다.',
  SERVER_CONFIG: '데이터를 불러오지 못했습니다.',
  BAD_REQUEST: '요청 형식이 올바르지 않습니다.',
  INTERNAL: '데이터를 불러오지 못했습니다.',
};

export interface MappedError {
  status: number;
  code: PublicErrorCode;
  message: string;
}

export class AipOperatorConfigMissingError extends Error {
  constructor() {
    super('SERVER_CONFIG');
    this.name = 'AipOperatorConfigMissingError';
  }
}

export function publicError(
  status: number,
  code: PublicErrorCode
): MappedError {
  return {
    status,
    code,
    message: messages[code],
  };
}

export function mapRouteError(error: unknown): MappedError {
  const name = error instanceof Error ? error.name : '';

  if (error instanceof AipInvalidKeyFormatError || name === 'AipInvalidKeyFormatError') {
    return publicError(400, 'INVALID_FORMAT');
  }

  if (error instanceof AipForeignKeyError || name === 'AipForeignKeyError') {
    return publicError(422, 'FOREIGN_KEY');
  }

  if (error instanceof AipSessionExpiredError || name === 'AipSessionExpiredError') {
    return publicError(503, 'SESSION_DOWN');
  }

  if (error instanceof AipDirectKeyRejectedError || name === 'AipDirectKeyRejectedError') {
    return publicError(422, 'DIRECT_KEY_REJECTED');
  }

  if (error instanceof AipDirectEndpointUnconfirmedError || name === 'AipDirectEndpointUnconfirmedError') {
    return publicError(502, 'DIRECT_ENDPOINT_UNCONFIRMED');
  }

  if (error instanceof AipUpstreamShapeError || name === 'AipUpstreamShapeError') {
    return publicError(502, 'UPSTREAM_SHAPE');
  }

  if (error instanceof AipUpstreamTimeoutError || name === 'AipUpstreamTimeoutError') {
    return publicError(504, 'TIMEOUT');
  }

  if (error instanceof AipUpstreamParseError || name === 'AipUpstreamParseError') {
    return publicError(502, 'UPSTREAM');
  }

  if (error instanceof AipUpstreamError || name === 'AipUpstreamError') {
    return publicError(503, 'UPSTREAM');
  }

  if (error instanceof AipOperatorConfigMissingError || name === 'AipOperatorConfigMissingError') {
    return publicError(503, 'SERVER_CONFIG');
  }

  return publicError(500, 'INTERNAL');
}
