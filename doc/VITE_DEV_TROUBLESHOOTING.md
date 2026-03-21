# Vite 开发环境：`ERR_CONNECTION_REFUSED` / `client ping`

## 现象

浏览器控制台反复出现类似日志：

```text
GET http://127.0.0.1:5173/ net::ERR_CONNECTION_REFUSED
ping @ client:xxx
waitForSuccessfulPing @ client:xxx
```

## 原因说明（不是你的业务代码报错）

- 这些日志来自 **Vite 注入的前端 `client` 脚本**（热更新 HMR 用）。
- `ping` 会周期性请求开发服务器根地址，用于判断服务是否可用、是否重连 WebSocket。
- **`net::ERR_CONNECTION_REFUSED`** 表示：浏览器尝试连接 `127.0.0.1:5173`，但该端口上 **没有进程在监听**（连接被拒绝）。

因此这通常表示：**开发服务器未在运行**，或 **页面仍开着但服务已停止**。

## 处理办法

1. **在项目根目录重新启动开发服务**  
   ```bash
   npm run dev
   ```  
   使用终端里打印的地址打开页面（一般为 `http://127.0.0.1:5173/` 或 `http://localhost:5173/`）。

2. **关掉已失效的标签页**  
   若已停止 `npm run dev`，请关闭仍指向 `localhost:5173` 的旧标签，避免 HMR 一直重试、刷屏。

3. **端口被占用时**  
   若 5173 已被占用，Vite 可能自动改用 `5174` 等端口；请 **以终端输出为准** 访问新地址，不要仍用旧端口。

4. **预览生产构建**  
   若使用 `npm run build` 后用 `npm run preview`，默认一般为 **4173** 端口，与 **5173 开发端口** 不同；此时不应再出现对 5173 的 HMR 请求，除非仍打开了旧的 dev 页面。

5. **仍无法连接时**  
   - 检查本机防火墙/安全软件是否拦截本地端口。  
   - 尝试换浏览器或无痕窗口排除扩展干扰。

## 是否需要改项目配置？

一般 **不需要**。若仅在「开发服务已关、页面未关」时出现，属于预期行为。

仅在特殊网络环境（反向代理、Docker、WSL 等）下 HMR 连错地址时，才需要在 `vite.config.ts` 里配置 `server.hmr`（如 `host` / `clientPort`）。详见 [Vite 文档 - server.hmr](https://vitejs.dev/config/server-options.html#server-hmr)。
