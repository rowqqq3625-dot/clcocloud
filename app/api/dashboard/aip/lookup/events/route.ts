import { NextRequest } from 'next/server';
import { handleNextRequest } from '@/lib/dashboard/server/nextHelper';

export async function POST(request: NextRequest) {
  return handleNextRequest(request, 'POST', '/lookup/events');
}

export async function GET(request: NextRequest) {
  return handleNextRequest(request, 'GET', '/lookup/events');
}
