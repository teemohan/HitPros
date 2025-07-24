const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');

// 定义要处理的 CSS 文件映射
const cssFiles = {
  'theme.css': 'theme.css',
  'theme-v3.css': 'theme-v3.css',
  'global.min.css': 'global.min.css'
};

// 基础配置
const baseConfig = {
  content: ['./shopify/**/*.{liquid,js}'],
  safelist: [
    // 保护 Swiper 相关类名
    /^swiper-/,
    // 保护 Element UI 相关类名
    /^el-/,
    // 保护 Vue 相关类名
    /^vue-/,
    // 保护 JavaScript 动态添加的类名
    /^js-/,
    // 保护第三方插件类名
    'flickity',
    'photoswipe',
    // 保护伪元素
    /::?before/,
    /::?after/,
    // 保护常用工具类
    'hidden',
    'block',
    'flex',
    'grid',
    'active',
    'open',
    'closed',
    // 保护响应式类名
    /^sm:/,
    /^md:/,
    /^lg:/,
    /^xl:/,
    // 保护状态类名
    /^hover:/,
    /^focus:/,
    /^active:/
  ]
};

// 异步处理函数
async function purgeCSSFiles() {
  console.log('===开始批量处理 CSS 文件（高级模式）===');
  
  // 确保输出目录存在
  const outputDir = './copy/purged';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const [inputFile, outputFile] of Object.entries(cssFiles)) {
    const inputPath = `./shopify/assets/${inputFile}`;
    const outputPath = `${outputDir}/${outputFile}`;
    
    if (fs.existsSync(inputPath)) {
      console.log(`正在处理: ${inputFile}`);
      
      try {
        const purgeCSSResult = await new PurgeCSS().purge({
          ...baseConfig,
          css: [inputPath]
        });
        
        if (purgeCSSResult.length > 0) {
          fs.writeFileSync(outputPath, purgeCSSResult[0].css);
          
          // 计算文件大小变化
          const originalSize = fs.statSync(inputPath).size;
          const purgedSize = fs.statSync(outputPath).size;
          const savedBytes = originalSize - purgedSize;
          const savedPercent = Math.round((savedBytes * 100) / originalSize);
          
          console.log(`  原始大小: ${originalSize} bytes`);
          console.log(`  优化后: ${purgedSize} bytes`);
          console.log(`  节省: ${savedBytes} bytes (${savedPercent}%)`);
        }
      } catch (error) {
        console.error(`处理 ${inputFile} 时出错:`, error.message);
      }
    } else {
      console.log(`警告: 文件不存在 - ${inputPath}`);
    }
    console.log('');
  }
  
  console.log('===批量处理完成（高级模式）===');
  console.log(`优化后的文件保存在: ${outputDir}/`);
}

// 如果直接运行此文件，则执行处理
if (require.main === module) {
  purgeCSSFiles().catch(console.error);
}

module.exports = { purgeCSSFiles, baseConfig, cssFiles };