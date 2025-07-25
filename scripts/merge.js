#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const currentDir = process.cwd();
const shopifyDir = path.join(currentDir, 'shopify');
const shopifyIgnoreFile = path.join(shopifyDir, '.shopifyignore');

console.log(`Navigating to shopify directory: ${shopifyDir}`);

try {
  // 创建或更新 .shopifyignore 文件
  const ignoreContent = [
    'templates/*',
    'config/*',
    'locales/*',
    '.shopify/*'
  ].join('\n');
  
  fs.writeFileSync(shopifyIgnoreFile, ignoreContent);
  console.log('Created/updated .shopifyignore file');
  
  // 拉取主题
  console.log('Pulling Shopify theme...');
  execSync(`shopify theme pull --path="${shopifyDir}"`, {
    stdio: 'inherit',
    cwd: currentDir
  });
  
  console.log('Theme pull completed!');
} catch (error) {
  console.error('Error pulling Shopify theme:', error.message);
  process.exit(1);
}