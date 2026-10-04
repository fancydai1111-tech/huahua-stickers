# 花花的表情包 MCP

第一批 10 张用户提供的表情包，原图保持不变。不调用付费模型 API。
2026-10-04：已部署到 Railway，通过公网 HTTPS MCP 初始化、两个工具、十种搜索，以及全部十张原图 SHA256 比对。ChatGPT 插件接入和手机端展示仍需实际验收。

## 已上线地址

- 图库：https://huahua-stickers-production.up.railway.app/
- MCP：https://huahua-stickers-production.up.railway.app/mcp
- 传输：Streamable HTTP
- 认证：无需认证

在 ChatGPT 设置的 Security and login 中启用 Developer mode，再到 Plugins 点击加号，填写上面的 MCP 地址、名称“花花表情包”和说明“从花花的十张真实表情包中按语境搜索与取图”，创建后安装。新建 Work 对话，输入 @ 选择插件，用“找一张摸头表情并展示”验收。界面与可用性以自己的账户为准。

官方接入步骤：https://developers.openai.com/plugins/quickstart

## 两个工具

- `search_stickers(query, limit=5, exclude_ids=[])`：根据描述、标签和少量中英文同义词搜索。候选只返回元数据；不匹配时返回空列表。
- `get_sticker(id, include_image=true)`：返回图片直链、Markdown 和原图 ImageContent。可以关闭原图内容，仅取直链。

## 第一批表情

| 编号 | 表情 | 主要用途 |
| --- | --- | --- |
| cat-hit | 遭受打击 | 轻松自嘲、受挫 |
| cat-careful | 等下讲你又不高兴 | 欲言又止、玩笑式反驳 |
| cat-thinking | 思索 | 思考、疑惑 |
| puppy-pat | 把你摸到起球 | 摸头、夸奖 |
| puppy-miss | 好想你 | 想念、重逢 |
| puppy-kiss | 爱心亲亲 | 亲吻、亲昵 |
| puppy-praise | 骄傲骑肩 | 庆祝、夸奖、得意 |
| puppy-baby | 宝宝爱心 | 心动、亲昵称呼 |
| puppy-flower | 我想跟你好 | 告白、示好、送花 |
| cat-surprise | 小吃一惊 | 惊讶、意外 |

## 部署到 Railway

1. 将解压后的本目录内容放在 GitHub 专用仓库根目录。若选择公开仓库，仓库中的代码和图片会公开可见。
2. Railway 从该 GitHub 仓库创建普通服务。根目录已经有 Dockerfile，无需配置模型密钥或数据库。请勿使用 Railway Function：包含原图的单文件超过其 96 KB 上限。
3. 生成服务域名，路由到 `3000` 端口。应用读取 Railway 的 `PORT` 变量；明确设置 `PORT=3000`，使监听端口与域名路由一致。
4. 验证 `https://你的域名/health` 返回 `status: ok`、`stickers: 10`，根路径能浏览十张图。
5. 如图片 URL 中域名不正确，为服务设置 `PUBLIC_URL=https://你的域名`（不要附加 /mcp）并重新部署。
6. 将远程 MCP 地址 `https://你的域名/mcp` 添加到支持 Streamable HTTP 的客户端。

这是一个只读、可公开访问的图库服务。没有上传、删除、写文件、执行命令或发送外部消息的工具；没有请求日志或长期聊天存档。
可选 `MCP_BEARER_TOKEN` 会保护 MCP 端点，但客户端必须能配置相同 Bearer token；当前没有 OAuth 授权流程。图片直链仍公开可读。
可选 `ALLOWED_ORIGINS` 可添加逗号分隔的浏览器 Origin；默认允许同源与两个 ChatGPT 官方网页来源，后端无 Origin 请求也可用。

## 本地运行与验证

生成单文件（原始 PNG 会嵌入源码）：

```sh
python3 build.py
node test.mjs
```

运行服务（需要 Bun）：

```sh
bun run index.mjs
```

运行后浏览 `http://localhost:3000`，MCP 地址为 `http://localhost:3000/mcp`。
本地测试覆盖 MCP 初始化、十种搜索、最近使用排除、空结果、无效编号、参数范围、全部十张图片的原始哈希、图片与纯文本返回、HTTP 缓存、Origin 校验、协议版本、坏 JSON 和通知。
Docker/Bun 容器已在 Railway 运行，远程工具与图片测试通过。ChatGPT 手机上的展示效果尚未验收。

## 给助手的使用说明

日常聊天在语境合适时可主动选一张表情；正事或严肃话题谨慎使用。先搜索，再按编号取图。一次最多一张，避免连续重复。选符合当前语境的图，没找到就不发。
将工具返回的图片或 Markdown 放在普通回复中，不要把显示用的 Markdown 放入代码块。不要声称已向微信等其他平台发送。
客户端是否会直接展示工具图片或 Markdown 外链，必须在实际客户端测试，不保证自动调用工具或每轮显示。

## 实现范围

实现无会话的 MCP Streamable HTTP JSON 响应与只读 tools 能力，支持协议 2025-03-26 和 2025-06-18。GET /mcp 返回 405，通知返回 202。
不实现旧 SSE 传输、OAuth、任务、资源订阅或服务端推送。
新增表情时修改 catalog.json、添加 assets 文件，再运行 build.py；直接修改 assets 不会改变已经生成的 index.mjs。

来源规格：https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
Railway 限制：https://docs.railway.com/functions
