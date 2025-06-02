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
    baseURL: 'https://aihubmix.com/v1', // 使用 aihubmix 中转服务
  });
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
          method: 'dall-e-3',
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

    // 创建 OpenAI 客户端并使用 DALL-E 进行图像生成
    const openai = createOpenAIClient();
    
    // 更详细的图片分析，捕捉更多个人特征
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 使用更快的mini模型
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this person for Ghibli portrait: gender, age, hair color/style/length, eye color, face shape, facial features, skin tone, clothing style. Keep under 80 words, be specific and detailed."
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
      max_tokens: 120, // 增加token以获得更详细描述
    });

    const features = analysisResponse.choices[0]?.message?.content || "young person";

    // 更精确的prompt，保持用户的具体特征
    const prompt = `Studio Ghibli Spirited Away anime style portrait of ${features}. Maintain the person's specific facial features, hair details, and characteristics while transforming into hand-drawn cel animation aesthetic. Soft warm colors, large expressive anime eyes, clean flowing lines characteristic of classic animation style. High quality, bright tone, magical atmosphere.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd", // hd质量更好地保持细节特征
      style: "natural" // natural风格更接近原始特征
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error('No image URL received');
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
      method: 'dall-e-3',
      generationId: generationId,
      processingTime: processingTime,
      prompt: prompt
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