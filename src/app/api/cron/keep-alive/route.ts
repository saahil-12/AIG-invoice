import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. Verify authorization header using the CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Perform a lightweight query to keep Supabase active
    // We fetch a single row from business_profile as it is a tiny query
    const { data, error } = await supabase
      .from('business_profile')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Supabase keep-alive successful' });
  } catch (err) {
    console.error('Keep-alive unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
