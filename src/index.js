// src/index.js

import { handleRequest } from "./handle_request.js";

// 在这里声明 Vercel 的运行时配置
export const config = {
  runtime: 'edge',
};

// 导出 handleRequest 作为默认处理函数
export default async function (req, context) {
  return handleRequest(req, context);
}
