/**
 * 简单的 Vision API 测试脚本
 * 使用方法: node test-vision-api.js <图片路径>
 * 
 * 示例: node test-vision-api.js test-image.jpg
 */

require('dotenv').config();
const { analyzeImage } = require('./services/visionService');
const path = require('path');

async function testVisionAPI() {
  // 获取命令行参数（图片路径）
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error('❌ 错误: 请提供图片路径');
    console.log('使用方法: node test-vision-api.js <图片路径>');
    console.log('示例: node test-vision-api.js test-image.jpg');
    process.exit(1);
  }

  // 检查 Service Account 配置
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ 错误: GOOGLE_APPLICATION_CREDENTIALS 未设置');
    console.log('\n📝 请按照以下步骤配置：');
    console.log('1. 在 Google Cloud Console 创建 Service Account');
    console.log('2. 下载 JSON 密钥文件');
    console.log('3. 在 .env 文件中设置: GOOGLE_APPLICATION_CREDENTIALS=./your-credentials.json');
    console.log('\n详细说明请查看: SERVICE_ACCOUNT_SETUP.md');
    process.exit(1);
  }

  console.log('🔍 开始测试 Vision API...\n');
  console.log(`📷 图片路径: ${imagePath}`);
  console.log(`🔑 凭证文件: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}\n`);

  try {
    // 解析完整路径
    const fullPath = path.isAbsolute(imagePath) 
      ? imagePath 
      : path.join(__dirname, imagePath);

    console.log('⏳ 正在分析图片...\n');

    // 调用 Vision API
    const result = await analyzeImage(fullPath);

    // 显示结果
    console.log('✅ 分析成功！\n');
    console.log('📊 分析结果:');
    console.log('─'.repeat(50));
    console.log(`类别 (Category): ${result.aiDetectedCategory || '未识别'}`);
    console.log(`建议名称 (Suggested Name): ${result.aiSuggestedName || '未识别'}`);
    console.log(`置信度 (Confidence): ${(result.aiConfidence * 100).toFixed(2)}%`);
    console.log(`标签数量: ${result.aiTags?.length || 0}`);
    console.log('\n🏷️  标签列表:');
    
    if (result.aiTags && result.aiTags.length > 0) {
      result.aiTags.forEach((tag, index) => {
        console.log(`  ${index + 1}. ${tag}`);
      });
    } else {
      console.log('  (无标签)');
    }

    console.log(`\n⏰ 处理时间: ${result.aiProcessedAt || new Date()}`);
    console.log('─'.repeat(50));

    if (result.error) {
      console.log(`\n⚠️  警告: ${result.error}`);
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败！');
    console.error('错误信息:', error.message);
    
    if (error.message.includes('API key') || error.message.includes('Service Account')) {
      console.error('\n💡 提示: Vision API 需要使用 Service Account，不是 API Key');
      console.error('   请查看 SERVICE_ACCOUNT_SETUP.md 获取详细设置说明');
    } else if (error.message.includes('not found')) {
      console.error('\n💡 提示: 请检查图片路径是否正确');
    } else if (error.message.includes('quota')) {
      console.error('\n💡 提示: API 配额可能已用完，请检查 Google Cloud Console');
    }
    
    process.exit(1);
  }
}

// 运行测试
testVisionAPI();

