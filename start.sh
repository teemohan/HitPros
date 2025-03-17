#!/bin/bash

echo "Executing start.sh script..."

# 获取当前目录并设置 shopify 目录
CURRENT_DIR=$(pwd)
SHOPIFY_DIR="$CURRENT_DIR/shopify"

echo "Navigating to shopify directory: $SHOPIFY_DIR"
cd "$SHOPIFY_DIR" || exit 1

# 运行 shopify theme dev 命令
shopify theme dev
