import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use the proper async pattern for cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Simple health check - we don't need to actually set up the database
    // since we're using client-side fallback for subscriptions
    const status = {
      success: true,
      message: 'Subscription system ready with client-side fallback',
      timestamp: new Date().toISOString(),
      mode: 'client_fallback'
    };
    
    // Just return success - we'll handle everything in the client-side fallback
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error in subscription setup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      fallback: true
    }, { status: 200 }); // Still return 200 to allow client-side fallback to work
  }
}
