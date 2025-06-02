import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabase
      .from('avatar_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果指定了状态过滤器
    if (status && ['pending', 'success', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch avatar history',
          message: error.message
        },
        { status: 500 }
      );
    }

    // 获取总数
    const { count, error: countError } = await supabase
      .from('avatar_generations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Avatar history error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch avatar history',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 