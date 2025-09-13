// /api/vercel_index.js (All-in-One Final Version)

export const config = {
  runtime: 'edge',
};

export default async function handleRequest(request) {
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
    // --- Security Checkpoint ---
    const clientProvidedKey = request.headers.get('x-goog-api-key');
    const serverAccessKey = request.headers.get('x-access-key-server');

    if (!serverAccessKey) {
        console.error('Server configuration error: ACCESS_KEY is not set.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Access Key is not set.' } }), { status: 500, headers: {'Content-Type': 'application/json'} });
    }
    
    if (!clientProvidedKey || clientProvidedKey !== serverAccessKey) {
        console.log('Authorization failed: Invalid access key provided.');
        return new Response(JSON.stringify({ error: { message: 'Unauthorized: Invalid API Key provided.' } }), { status: 401, headers: {'Content-Type': 'application/json'} });
    }
    
    console.log('Authorization successful.');

    // --- Load Balancing Logic ---
    const serverKeyPoolHeader = request.headers.get('x-gemini-keys-pool-server');
    if (!serverKeyPoolHeader) {
        console.error('Server configuration error: GEMINI_API_KEYS is not set.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Key pool is not set.' } }), { status: 500, headers: {'Content-Type': 'application/json'} });
    }

    const apiKeys = serverKeyPoolHeader.split(',').map(k => k.trim()).filter(k => k);

    if (apiKeys.length === 0) {
        console.error('Server configuration error: GEMINI_API_KEYS is empty.');
        return new Response(JSON.stringify({ error: { message: 'Server configuration error: Key pool is empty.' } }), { status: 500, headers: {'Content-Type': 'application/json'} });
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
   return new Response('Internal Server Error\n' + error?.stack, { status: 500, headers: {'Content-Type': 'text/plain'} });
  }
}
