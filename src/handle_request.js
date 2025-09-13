// src/handle_request.js (Final Purified Version)

// 我们已经物理删除了 openai.mjs，所以这里不再需要任何 import

export async function handleRequest(request) {

  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;

  if (pathname === '/' || pathname === '/index.html') {
    return new Response('Proxy is Running! More Details: https://github.com/tech-shrimp/gemini-balance-lite', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const targetUrl = `https://generativelanguage.googleapis.com${pathname}${search}`;

  try {
    // --- 安全检查站 ---
    const clientProvidedKey = request.headers.get('x-goog-api-key');
    const serverAccessKey = request.headers.get('x-access-key-server');

    if (!serverAccessKey) {
        console.error('Server configuration error: ACCESS_KEY is not set.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Access Key is not set.' } }), { status: 500 });
    }
    
    if (!clientProvidedKey || clientProvidedKey !== serverAccessKey) {
        console.log('Authorization failed: Invalid access key provided.');
        return new Response(JSON.stringify({ error: { message: 'Unauthorized: Invalid API Key provided.' } }), { status: 401 });
    }
    
    console.log('Authorization successful.');

    // --- 负载均衡逻辑 ---
    const serverKeyPoolHeader = request.headers.get('x-gemini-keys-pool-server');
    if (!serverKeyPoolHeader) {
        console.error('Server configuration error: GEMINI_API_KEYS is not set.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Key pool is not set.' } }), { status: 500 });
    }

    const apiKeys = serverKeyPoolHeader.split(',').map(k => k.trim()).filter(k => k);

    if (apiKeys.length === 0) {
        console.error('Server configuration error: GEMINI_API_KEYS is empty.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Key pool is empty.' } }), { status: 500 });
    }

    const selectedKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    console.log(`A key has been selected from the server pool.`);

    const headers = new Headers();
    headers.set('x-goog-api-key', selectedKey);

    if (request.headers.has('content-type')) {
        headers.set('content-type', request.headers.get('content-type'));
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('connection');
    responseHeaders.delete('keep-alive');
    responseHeaders.delete('content-encoding');
    responseHeaders.set('Referrer-Policy', 'no-referrer');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
   console.error('Failed to fetch:', error);
   return new Response('Internal Server Error\n' + error?.stack, { status: 500 });
  }
};
