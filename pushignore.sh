#!/bin/bash

# 创建或更新 .shopifyignore 文件
echo "templates/*" > shopify/.shopifyignore
echo "config/*" >> shopify/.shopifyignore
echo "locales/*" >> shopify/.shopifyignore
echo ".shopify/*" >> shopify/.shopifyignore

# 如果 shopify 目录不存在，则切换到该目录
if [ ! -d "shopify" ]; then
    cd shopify || exit 1
fi

# 推送主题
shopify theme push