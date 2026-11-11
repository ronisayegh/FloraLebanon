// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');
const https = require('https');
const appConfig = require('./default.config.json');

const config = getDefaultConfig(__dirname);

// Web preview only: the API rejects cross-origin browser requests (CORS), so
// `npm run web` sends API calls to /api-proxy on the dev server and this
// middleware forwards them server-side. Native builds never hit this path.
const PROXY_PREFIX = '/api-proxy';
const target = new URL(appConfig.app.apis[appConfig.app.dev ? 'dev' : 'master']);
const client = target.protocol === 'https:' ? https : http;

config.server = {
  ...config.server,
  enhanceMiddleware: middleware => (req, res, next) => {
    if (!req.url || !req.url.startsWith(PROXY_PREFIX + '/')) return middleware(req, res, next);

    const headers = { ...req.headers, host: target.host };
    delete headers.origin;
    delete headers.referer;

    const upstream = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        method: req.method,
        path: req.url.slice(PROXY_PREFIX.length),
        headers,
      },
      upstreamRes => {
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );
    upstream.on('error', err => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { code: 'PROXY_ERROR', message: err.message } }));
    });
    req.pipe(upstream);
  },
};

module.exports = config;
