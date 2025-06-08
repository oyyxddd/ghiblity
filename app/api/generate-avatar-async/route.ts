import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, isSupabaseAvailable } from '../../../lib/supabase';

// 移动环境变量检查到函数内部
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://aihubmix.com/v1',
  });
};

// 创建优雅的中文占位符
const createChinesePlaceholder = () => {
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7dd3fc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
      <text x="256" y="240" font-family="system-ui" font-size="24" fill="white" text-anchor="middle">吉卜力工作室</text>
      <text x="256" y="280" font-family="system-ui" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">头像生成中...</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// 启动异步生成任务
export async function POST(request: NextRequest) {
  try {
    const { image, sessionId } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // 在数据库中创建任务记录
    if (isSupabaseAvailable && supabase) {
      const { data: generationRecord, error: dbError } = await supabase
        .from('avatar_generations')
        .insert({
          original_image_url: image.substring(0, 100) + '...',
          generated_image_url: 'pending',
          method: 'gpt-4o-image-vip-async',
          status: 'pending' as const
        })
        .select()
        .single();

      if (dbError) {
        throw new Error('Failed to create generation task');
      }

      const taskId = generationRecord.id;

      // 异步启动生成任务（不等待）
      processImageGeneration(taskId, image).catch(console.error);

      // 立即返回任务ID
      return NextResponse.json({
        success: true,
        taskId: taskId,
        status: 'pending',
        message: 'Generation task started. Use /api/check-status to check progress.',
        estimatedTime: '80-120 seconds'
      });
    } else {
      // 如果没有数据库，使用内存存储
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 这里可以使用Redis或其他缓存系统
      // 暂时返回错误，提示需要数据库支持
      return NextResponse.json({
        success: false,
        error: 'Database required for async processing'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to start generation task:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start generation task',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 异步处理图像生成
async function processImageGeneration(taskId: string, image: string) {
  const startTime = Date.now();
  
  try {
    console.log(`Starting async generation for task ${taskId}`);
    
    const openai = createOpenAIClient();
    
    const usedPrompt = `Studio Ghibli Spirited Away anime style portrait transformation. Create an authentic 吉卜力工作室 style character based on this photo: traditional hand-drawn cel animation aesthetic, soft warm colors, golden hour lighting, large expressive anime eyes with bright highlights like Chihiro, clean flowing lines, detailed magical background with spirited away atmosphere. Transform person into beautiful anime art style while preserving unique facial features. High quality Studio Ghibli animation style.`;
    
    // 更新状态为processing
    if (isSupabaseAvailable && supabase) {
      await supabase
        .from('avatar_generations')
        .update({ status: 'processing' as const })
        .eq('id', taskId);
    }
    
    const imageGenerationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-image-vip',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: usedPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });
    
    const messageContent = imageGenerationResponse.choices[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('No response content received from gpt-4o-image-vip');
    }
    
    let imageUrl: string | null = null;
    
    // 优先查找 filesystem.site 链接
    const filesystemMatch = messageContent.match(/https:\/\/filesystem\.site\/cdn\/[^\s\)\]]+\.png/);
    if (filesystemMatch) {
      imageUrl = filesystemMatch[0];
    } else {
      // 查找其他图片链接
      const imageMatch = messageContent.match(/https:\/\/[^\s\)\]]+\.png[^\s\)\]]*/);
      if (imageMatch) {
        const foundUrl = imageMatch[0];
        
        if (foundUrl.includes('videos.openai.com')) {
          try {
            const response = await fetch(foundUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              imageUrl = `data:image/png;base64,${base64}`;
            } else {
              imageUrl = createChinesePlaceholder();
            }
          } catch (fetchError) {
            imageUrl = createChinesePlaceholder();
          }
        } else {
          imageUrl = foundUrl;
        }
      }
    }
    
    if (!imageUrl) {
      throw new Error('No image URL received');
    }
    
    const processingTime = Date.now() - startTime;
    
    // 更新为成功状态
    if (isSupabaseAvailable && supabase) {
      await supabase
        .from('avatar_generations')
        .update({
          generated_image_url: imageUrl,
          status: 'success' as const,
          processing_time: processingTime
        })
        .eq('id', taskId);
    }
    
    console.log(`Async generation completed for task ${taskId} in ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`Async generation failed for task ${taskId}:`, errorMessage);
    
    // 更新为失败状态
    if (isSupabaseAvailable && supabase) {
      await supabase
        .from('avatar_generations')
        .update({
          status: 'failed' as const,
          error_message: errorMessage,
          processing_time: processingTime
        })
        .eq('id', taskId);
    }
  }
} 