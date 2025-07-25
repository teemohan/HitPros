#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('npm run pull');

const currentDir = process.cwd();
const shopifyDir = path.join(currentDir, 'shopify');
const shopifyIgnoreFile = path.join(shopifyDir, '.shopifyignore');
const searchString = 'assets/*';

try {
  // 检查 .shopifyignore 文件是否包含 assets/*
  if (fs.existsSync(shopifyIgnoreFile)) {
    const content = fs.readFileSync(shopifyIgnoreFile, 'utf8');
    if (content.includes(searchString)) {
      console.log('==================');
    } else {
      console.log('删除 .shopifyignore 文件');
      fs.unlinkSync(shopifyIgnoreFile);
    }
  }

  console.log(`Navigating to shopify directory: ${shopifyDir}`);
  console.log('Pulling Shopify theme...');
  
  // 拉取 Shopify 主题
  execSync(`shopify theme pull --path="${shopifyDir}"`, {
    stdio: 'inherit',
    cwd: currentDir
  });
  
  console.log('Theme pull completed!');
} catch (error) {
  console.error('Error pulling Shopify theme:', error.message);
  process.exit(1);
}