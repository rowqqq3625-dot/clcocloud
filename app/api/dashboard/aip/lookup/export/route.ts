import { NextRequest } from 'next/server';
import { handleNextRequest } from '@/lib/dashboard/server/nextHelper';

export async function POST(request: NextRequest) {
  return handleNextRequest(request, 'POST', '/lookup/export');
}
