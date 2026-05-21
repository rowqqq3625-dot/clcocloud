import { NextRequest } from 'next/server';
import { handleNextRequest } from '@/lib/dashboard/server/nextHelper';

export async function GET(request: NextRequest) {
  return handleNextRequest(request, 'GET', '/admin/session/health');
}
