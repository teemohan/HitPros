#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const currentDir = process.cwd();
const basePath = currentDir;
const distPath = path.join(basePath, 'dist');
const shopifyPath = path.join(basePath, 'shopify');

async function minifyFiles() {
  try {
    // 清理并准备 dist 目录
    console.log('===removing dist folder===');
    await fs.remove(distPath);
    
    console.log('===copying shopify folder to dist folder===');
    await fs.copy(shopifyPath, distPath);
    
    // 处理 JS 文件：删除注释并压缩
    console.log('===Processing JS files===');
    const jsFiles = glob.sync(path.join(distPath, 'assets', '*.js'));
    
    for (const file of jsFiles) {
      if (file.includes('.min.js')) {
        console.log(`${file} ========= is already minified`);
      } else {
        try {
          // 使用 uglifyjs 删除注释并压缩
          execSync(`npx uglify-js "${file}" --compress --mangle --comments /^!/ -o "${file}"`, {
            stdio: 'pipe'
          });
          console.log(`uglifyjs minified and removed comments: ${file}`);
        } catch (error) {
          console.log(`Skipping ${file} - uglifyjs not available or file has syntax errors`);
        }
      }
    }
    
    // 处理 CSS 文件：删除注释并压缩
    console.log('===Processing CSS files===');
    const cssFiles = glob.sync(path.join(distPath, 'assets', '*.css'));
    
    for (const file of cssFiles) {
      if (file.includes('.min.css')) {
        console.log(`${file} ========= is already minified`);
      } else {
        try {
          // 使用 uglifycss 删除注释并压缩
          execSync(`npx uglifycss --ugly-comments "${file}" --output "${file}"`, {
            stdio: 'pipe'
          });
          console.log(`uglifycss minified and removed comments: ${file}`);
        } catch (error) {
          console.log(`Skipping ${file} - uglifycss not available`);
        }
      }
    }
    
    // 处理 Liquid 文件：删除 HTML 和 Liquid 注释
    console.log('===Processing Liquid files===');
    const liquidFiles = glob.sync(path.join(distPath, '**', '*.liquid'));
    
    for (const file of liquidFiles) {
      try {
        let content = await fs.readFile(file, 'utf8');
        
        // 删除 HTML 注释 <!-- ... -->
        content = content.replace(/<!--[\s\S]*?-->/g, '');
        
        // 删除 Liquid 注释 {% comment %} ... {% endcomment %}
        content = content.replace(/\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g, '');
        
        await fs.writeFile(file, content);
        console.log(`Removed comments from liquid file: ${file}`);
      } catch (error) {
        console.log(`Error processing ${file}:`, error.message);
      }
    }
    
    console.log('===minified and cleaned files===');
    
    // 删除 dist 目录中的 .shopifyignore 文件
    const distShopifyIgnore = path.join(distPath, '.shopifyignore');
    if (await fs.pathExists(distShopifyIgnore)) {
      await fs.remove(distShopifyIgnore);
      console.log('===removed dist .shopifyignore===');
    }
    
    console.log('Minification completed successfully!');
  } catch (error) {
    console.error('Error during minification:', error.message);
    process.exit(1);
  }
}

minifyFiles();