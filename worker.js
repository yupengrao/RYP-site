// Cloudflare Worker — 代理 DeepSeek API 调用
// 部署后在 Worker 的 设置 → 变量 中添加 API_SECRET 环境变量
// 值填写你的 DeepSeek API key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// 统一 CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 只允许 POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    const apiKey = env.API_SECRET;
    if (!apiKey) {
      return jsonResponse({ error: 'Server misconfigured: missing API_SECRET' }, 500);
    }

    try {
      const body = await request.text();
      const upstream = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: body,
      });

      // 原样返回 DeepSeek 的响应
      const respBody = await upstream.text();
      return new Response(respBody, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  },
};
