# 运行 pull.sh 脚本
echo "Executing minify.sh script..."
bash ./minify.sh
CURRENT_DIR=$(pwd)
# 组合成完整的本地绝对路径
BASE_PATH="${CURRENT_DIR}/"
shopify_dir="${BASE_PATH}dist/"
echo "Navigating to shopify directory: $shopify_dir"
# cd "$shopify_dir" || (echo "Error navigating to shopify directory"; exit 1) 
# shopify theme deploy --allow-live --path="$shopify_dir"
shopify theme push --path="$shopify_dir"