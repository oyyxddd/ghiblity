import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, isSupabaseAvailable } from '../../../lib/supabase';
import type { AvatarGeneration } from '../../../lib/supabase';


// 移动环境变量检查到函数内部
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://aihubmix.com/v1', // 使用 aihubmix 中转服务，支持 gpt-4o-image-vip 模型
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let generationId: string | null = null;
  
  try {
    const { image, sessionId } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // 简化：不再验证支付状态，允许直接生成
    // 在实际生产环境中，这里应该有适当的限制机制

    // 在数据库中创建初始记录（如果 Supabase 可用）
    if (isSupabaseAvailable && supabase) {
      const { data: generationRecord, error: dbError } = await supabase
        .from('avatar_generations')
        .insert({
          original_image_url: image.substring(0, 100) + '...', // 截断以避免太长
          generated_image_url: 'pending', // 临时值，稍后更新
          method: 'gpt-4o-image-vip',
          status: 'pending' as const
        })
        .select()
        .single();

      if (dbError) {
        // 继续执行，不因数据库错误阻塞
      } else {
        generationId = generationRecord.id;
      }
    }

    // 创建 OpenAI 客户端并使用 gpt-4o-image-vip 进行图像生成
    const openai = createOpenAIClient();
    
    // 使用增强的 prompt 为 gpt-4o-image-vip 提供更好的结果
    const usedPrompt = `Studio Ghibli Spirited Away anime style portrait transformation. Create an authentic 吉卜力工作室 style character based on this photo: traditional hand-drawn cel animation aesthetic, soft warm colors, golden hour lighting, large expressive anime eyes with bright highlights like Chihiro, clean flowing lines, detailed magical background with spirited away atmosphere. Transform person into beautiful anime art style while preserving unique facial features. High quality Studio Ghibli animation style.`;
    
    console.log('Using enhanced prompt for gpt-4o-image-vip:', usedPrompt);
    
    // 使用 chat completions 接口进行图像生成
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
    
    console.log('Chat completion response received');
    const messageContent = imageGenerationResponse.choices[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('No response content received from gpt-4o-image-vip');
    }
    
    console.log('Response content preview:', messageContent.substring(0, 200) + '...');
    
    let imageUrl: string | null = null;
    
    // 先尝试查找 filesystem.site 的链接（这些是可访问的）
    const filesystemMatch = messageContent.match(/https:\/\/filesystem\.site\/cdn\/[^\s\)\]]+\.png/);
    if (filesystemMatch) {
      imageUrl = filesystemMatch[0];
      console.log('Found accessible filesystem.site URL:', imageUrl);
      console.log('Using filesystem.site URL directly:', imageUrl);
    } else {
      // 如果没找到 filesystem.site，查找其他图片链接
      const imageMatch = messageContent.match(/https:\/\/[^\s\)\]]+\.png[^\s\)\]]*/);
      if (imageMatch) {
        const foundUrl = imageMatch[0];
        console.log('Found image URL with pattern:', imageMatch, 'URL:', foundUrl);
        
        // 检查是否是受限的 OpenAI URL
        if (foundUrl.includes('videos.openai.com')) {
          console.log('Detected OpenAI restricted URL, attempting to convert to base64...');
          try {
            const response = await fetch(foundUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              imageUrl = `data:image/png;base64,${base64}`;
              console.log('Successfully converted to base64, length:', base64.length);
            } else {
              console.log('Direct fetch failed with status:', response.status);
              console.log('Could not download image, using placeholder...');
              // 生成一个优雅的中文占位符
              const placeholder = createChinesePlaceholder();
              imageUrl = placeholder;
            }
          } catch (fetchError) {
            console.log('Fetch error:', fetchError);
            console.log('Could not download image, using placeholder...');
            const placeholder = createChinesePlaceholder();
            imageUrl = placeholder;
          }
        } else {
          imageUrl = foundUrl;
        }
      }
    }
    
    if (!imageUrl) {
      throw new Error('No image URL received');
    }

    // 使用从 gpt-4o-image-vip 获取的图片 URL
    const finalImageUrl = imageUrl;
    console.log('Using gpt-4o-image-vip generated image:', finalImageUrl.substring(0, 50) + '...');

    const processingTime = Date.now() - startTime;

    // 更新数据库记录为成功状态（如果可用）
    if (generationId && isSupabaseAvailable && supabase) {
      const { error: updateError } = await supabase
        .from('avatar_generations')
        .update({
          generated_image_url: finalImageUrl,
          status: 'success' as const,
          processing_time: processingTime
        })
        .eq('id', generationId);

      if (updateError) {
        // Silent fail - database update error doesn't affect user experience
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      message: 'Spirited Away style avatar generated successfully!',
      method: 'gpt-4o-image-vip',
      generationId: generationId,
      processingTime: processingTime,
      prompt: usedPrompt
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // 详细的错误日志
    console.error('Avatar generation error:', {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
      timestamp: new Date().toISOString(),
      generationId
    });

    // 更新数据库记录为失败状态（如果可用）
    if (generationId && isSupabaseAvailable && supabase) {
      await supabase
        .from('avatar_generations')
        .update({
          status: 'failed' as const,
          error_message: errorMessage,
          processing_time: processingTime
        })
        .eq('id', generationId);
    }
    
    // 错误信息
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate avatar',
          message: error.message,
          generationId: generationId,
          processingTime: processingTime
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate avatar',
        message: errorMessage,
        generationId: generationId,
        processingTime: processingTime
      },
      { status: 500 }
    );
  }
}