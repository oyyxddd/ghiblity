import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseAvailable } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseAvailable || !supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // 查询任务状态
    const { data: task, error } = await supabase
      .from('avatar_generations')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 返回任务状态
    const response: any = {
      success: true,
      taskId: task.id,
      status: task.status,
      createdAt: task.created_at
    };

    if (task.processing_time) {
      response.processingTime = task.processing_time;
    }

    if (task.status === 'success' && task.generated_image_url) {
      response.imageUrl = task.generated_image_url;
      response.message = 'Avatar generated successfully!';
    } else if (task.status === 'failed') {
      response.error = task.error_message || 'Generation failed';
    } else if (task.status === 'processing') {
      response.message = 'Generation in progress...';
    } else if (task.status === 'pending') {
      response.message = 'Task is queued for processing...';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to check task status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check task status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 