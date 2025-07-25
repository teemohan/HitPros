#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('Logging out from Shopify...');
  execSync('shopify auth logout', { stdio: 'inherit' });
  
  console.log('Starting development server for live store...');
  execSync('shopify theme dev --store hitpros.myshopify.com', { stdio: 'inherit' });
} catch (error) {
  console.error('Error switching to live store:', error.message);
  process.exit(1);
}