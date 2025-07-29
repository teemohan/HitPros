#获取当前工作目录的绝对路径
CURRENT_DIR=$(pwd)

# 设置相对路径
RELATIVE_PATH="/HitPros/"

# 组合成完整的本地绝对路径
BASE_PATH="${CURRENT_DIR}/"

# 修改路径
rm -r "${BASE_PATH}dist/"
echo "===removed dist folder==="
cp -r "${BASE_PATH}shopify/" "${BASE_PATH}dist/"
echo "===copied shopify folder to dist folder==="

for file in "${BASE_PATH}dist/assets/"*.js; do
    uglifyjs "$file" -o "$file"
    echo uglifyjs minified: "$file"
done

for file in "${BASE_PATH}dist/assets/"*.css; do
    uglifycss "$file" --output "$file"
    echo uglifycss minified: "$file"
done

echo "===minified js files==="
rm -r "${BASE_PATH}dist/.shopifyignore"
echo "===removed dist .shopifyignore==="