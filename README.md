# shopify-2.0

## 安装 tailwind
https://www.tailwindcss.cn/docs/installation

运行命令    ``` npx tailwindcss -i ./config.css -o ./shopify/assets/shopify-style.css --watch ```
上线时运行  ``` npx tailwindcss -i ./config.css -o ./shopify/assets/shopify-style.css --watch --minify ``` 会压缩css文件

recursive-uglifyjs-map

git分支说明

matser -> 线上商店live  hitpros.myshopify.com
testHitPros -> 测试商店live testhitpros.myshopify.com

开发流程：
（由于两个项目的templates,config, locales, .shopify 文件不一样 其余文件是一样）



"start": "start.bat",
"pull": "pull.bat",
"push": "push.bat",
"merge": "merge.bat",
"change-test": "change-test.bat",  
"change-live": "change-live.bat",
"tw": "npx tailwindcss -i ./config.css -o ./shopify/assets/shopify-style.css --watch"

版权声明：本文为原创文章，版权由本站（JavaScript中文网）拥有，严禁未经允许复制、转载、传播、篡改等任何行为，如需转载，请联系本站管理员获取书面授权


上线流程

合并测试商店改动
1.shopify环境切换: --store testhitpros.myshopify.com
2. git版本： 从 main分支copy一个 testdev 分支
3.命令： 在testdev分支下 执行 npm run merge (更新测试商店的改动到testdev 分支,检查一下改动)

到正式商店预发布
4.shopify环境切换： --store hitpros.myshopify.com
5.shopify theme push (将testdev分支的代码推送到hitpros.myshopify.com 的 名为 dev 副本)
6.配置dev副本：tempalte json 部分配置 （hitpros.myshopify.com， dev）
7.拉取dev副本改动 （主要是 tempalte json） （hitpros.myshopify.com， dev）
8.在hitpros.myshopify.com 上 打开 dev 副本 （检查一下改动）
9.合并代码到main分支
10.发版本： npm run deploycli