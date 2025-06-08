const OpenAI = require('openai');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

async function testGPT4OImageVIP() {
  console.log('Testing aihubmix gpt-4o-image-vip model...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Missing OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://aihubmix.com/v1',
  });

  try {
    console.log('📞 Calling gpt-4o-image-vip model...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-image-vip",
      messages: [
        {
          role: "user",
          content: "Please create a Studio Ghibli style image of a cute cartoon cat with large expressive eyes, soft colors, and hand-drawn animation aesthetic."
        }
      ],
      max_tokens: 2000,
    });

    console.log('✅ Response received:');
    console.log('Model:', response.model);
    console.log('Content:', response.choices[0]?.message?.content);
    
    // 检查是否包含图像URL
    const content = response.choices[0]?.message?.content || '';
    const urlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
    
    if (urlMatch) {
      console.log('🖼️ Image URL found:', urlMatch[0]);
    } else {
      console.log('ℹ️ No direct image URL found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing gpt-4o-image-vip:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// 运行测试
testGPT4OImageVIP(); 