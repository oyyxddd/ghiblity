import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase, isSupabaseAvailable } from '../../../lib/supabase';
import type { AvatarGeneration } from '../../../lib/supabase';


if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://aihubmix.com/v1', // 使用 aihubmix 中转服务
});

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

    // 使用 gpt-4o-image-vip 直接进行图像风格转换
    const response = await openai.chat.completions.create({
      model: "gpt-4o-image-vip", // 使用 VIP 图像转换模型
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Convert this image to Studio Ghibli Spirited Away animation style. 

Requirements:
- Authentic Studio Ghibli animation style from Spirited Away (2001)
- Traditional hand-drawn cel animation aesthetic  
- Soft warm colors with golden hour lighting
- Large expressive eyes with bright highlights like Chihiro
- Clean flowing lines characteristic of Miyazaki's work
- Maintain original composition and proportions
- High quality result, bright tone, 1:1 aspect ratio`
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response received from image conversion model');
    }

    const result = response.choices[0].message.content;

    // 检查返回的内容是否包含图像URL或base64数据
    let imageUrl = '';
    
    if (!result) {
      throw new Error('No content received from the model');
    }
    
    // 如果返回的是图像URL
    if (result.includes('http')) {
      const urlMatch = result.match(/https?:\/\/[^\s\)]+/);
      if (urlMatch) {
        imageUrl = urlMatch[0];
      }
    }
    
    // 如果返回的是完整的base64数据
    if (result.includes('data:image')) {
      const base64Match = result.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) {
        imageUrl = base64Match[0];
      }
    }
    
    // 如果返回的是纯base64数据（没有前缀）
    if (!imageUrl && result.match(/^[A-Za-z0-9+/=]{100,}$/)) {
      imageUrl = `data:image/png;base64,${result}`;
    }

    // 如果以上都没有匹配，可能整个content就是某种格式的数据
    if (!imageUrl) {
      imageUrl = result;
    }

    const processingTime = Date.now() - startTime;

    // 更新数据库记录为成功状态（如果可用）
    if (generationId && isSupabaseAvailable && supabase) {
      const { error: updateError } = await supabase
        .from('avatar_generations')
        .update({
          generated_image_url: imageUrl,
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
      imageUrl: imageUrl,
      message: 'Spirited Away style avatar generated successfully!',
      method: 'gpt-4o-image-vip',
      generationId: generationId,
      processingTime: processingTime,
      rawResponse: result
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

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