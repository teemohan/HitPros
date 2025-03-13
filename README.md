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