#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const currentDir = process.cwd();
const distDir = path.join(currentDir, 'dist');

try {
  // 运行 minify 脚本
  console.log('Executing minify script...');
  execSync('node ./scripts/minify.js', {
    stdio: 'inherit',
    cwd: currentDir
  });
  
  console.log(`Navigating to dist directory: ${distDir}`);
  console.log('Pushing Shopify theme from dist...');
  
  // 推送主题
  execSync(`shopify theme push --path="${distDir}"`, {
    stdio: 'inherit',
    cwd: currentDir
  });
  
  console.log('Deploy completed!');
} catch (error) {
  console.error('Error during deployment:', error.message);
  process.exit(1);
}