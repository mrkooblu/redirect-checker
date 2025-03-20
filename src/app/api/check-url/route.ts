import { NextRequest, NextResponse } from 'next/server';
import { checkUrl } from '@/utils/redirectUtils';
import { UrlCheckOptions } from '@/types/redirect';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, options } = body as { url: string; options?: UrlCheckOptions };

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const result = await checkUrl(url, options);
    
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 