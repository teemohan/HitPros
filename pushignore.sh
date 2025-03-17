#!/bin/bash
CURRENT_DIR=$(pwd)
# 组合成完整的本地绝对路径
BASE_PATH="${CURRENT_DIR}/"

# 创建或更新 .shopifyignore 文件
shopify_dir="${BASE_PATH}shopify/"
echo "Navigating to shopify directory: $shopify_dir"

# 创建或更新 .shopifyignore 文件
echo "templates/*" > "${shopify_dir}.shopifyignore"
echo "config/*" >> "${shopify_dir}.shopifyignore"
echo "locales/*" >> "${shopify_dir}.shopifyignore"
echo ".shopify/*" >> "${shopify_dir}.shopifyignore"

# 推送主题
echo "Pushing Shopify theme..."
shopify theme push --path="$shopify_dir"
if [ $? -ne 0 ]; then
  echo "Error pushing Shopify theme"
  exit 1
fi