// 测试Gemini API的简单脚本
// 请先配置您的API密钥，然后运行: node test-gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  // 请替换为您的实际API密钥
  const API_KEY = 'your-gemini-api-key-here';

  if (API_KEY === 'your-gemini-api-key-here') {
    console.log('❌ 请先在脚本中配置您的Gemini API密钥');
    console.log('📝 获取API密钥: https://makersuite.google.com/app/apikey');
    return;
  }

  try {
    console.log('🔧 正在测试Gemini API...');

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent('请简单介绍一下人工智能的发展历程。');
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API测试成功！');
    console.log('📝 响应内容:');
    console.log(text.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Gemini API测试失败:');
    console.error('错误详情:', error.message);

    if (error.message.includes('API key not valid')) {
      console.log('💡 提示: API密钥无效，请检查密钥是否正确');
    } else if (error.message.includes('quota')) {
      console.log('💡 提示: API配额已用完，请检查Google Cloud控制台');
    }
  }
}

testGemini();