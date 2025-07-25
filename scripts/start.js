#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Executing start script...');

const currentDir = process.cwd();
const shopifyDir = path.join(currentDir, 'shopify');

console.log(`Navigating to shopify directory: ${shopifyDir}`);

try {
  // 启动 Shopify 开发服务器
  execSync(`shopify theme dev --path="${shopifyDir}"`, {
    stdio: 'inherit',
    cwd: currentDir
  });
} catch (error) {
  console.error('Error starting Shopify theme dev:', error.message);
  process.exit(1);
}