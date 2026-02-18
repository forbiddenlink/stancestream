export default async function handler(req, res) {
  // Proxy all HTTP API requests to the Render backend to avoid CORS in previews
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace(/^\/api\/?/, '');
    const targetBase = process.env.RENDER_API_BASE || 'https://stancestream.onrender.com';
    const targetUrl = `${targetBase.replace(/\/$/, '')}/api/${path}${url.search}`;

    // Reconstruct request init
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (k.toLowerCase() === 'host') continue;
      if (k.toLowerCase() === 'content-length') continue;
      headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    }

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    // Copy status and headers back
    res.statusCode = resp.status;
    resp.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding') return;
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await resp.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err?.message || 'proxy error' }));
  }
}