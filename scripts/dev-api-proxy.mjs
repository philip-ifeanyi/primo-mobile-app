/**
 * Development-only TLS-terminating proxy for the Primo ABP backend.
 *
 * WHY THIS EXISTS
 * ---------------
 * The backend is served at https://104.131.48.195:44301 behind a certificate
 * that no mobile OS will accept, for three independent reasons:
 *
 *   1. it is self-signed, so there is no trusted root to chain to;
 *   2. its subject is CN=localhost, but it is reached over an IP address, so
 *      hostname validation fails;
 *   3. it expired on 16 June 2026.
 *
 * None of this is fixable from the client. iOS App Transport Security
 * exception domains only relax ATS policy (cleartext, TLS version, forward
 * secrecy) — certificate *trust* evaluation happens underneath ATS and
 * ignores those keys, so an expired self-signed cert is refused regardless.
 * React Native's fetch exposes no way to skip verification either.
 *
 * So the verification has to happen somewhere that can be told not to care:
 * this process, on your own machine. It speaks plain HTTP to the simulator
 * over loopback (which ATS permits via NSAllowsLocalNetworking) and speaks
 * HTTPS-without-verification to the backend.
 *
 * This is a local development crutch, not a fix. The real fix is a valid
 * certificate on the backend — there is already an nginx on port 80 of that
 * host, so terminating TLS there against a real hostname and reverse-proxying
 * to Kestrel on 44301 would solve it for the mobile app, the web portal and
 * any future client at once.
 *
 *   node scripts/dev-api-proxy.mjs
 *   EXPO_PUBLIC_API_URL=http://localhost:8788/api
 */
import http from 'node:http';
import https from 'node:https';

const PORT = Number(process.env.PROXY_PORT ?? 8788);
const TARGET_HOST = process.env.PROXY_TARGET_HOST ?? '104.131.48.195';
const TARGET_PORT = Number(process.env.PROXY_TARGET_PORT ?? 44301);

// The entire point of the process. Scoped to this one agent rather than set
// globally via NODE_TLS_REJECT_UNAUTHORIZED, so nothing else this process
// might talk to is affected.
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    // Host must be rewritten or ABP may reject on host validation, and
    // content-length must be recomputed in case the body was re-encoded.
    const headers = { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
    delete headers['accept-encoding']; // keep the log readable
    if (body.length) headers['content-length'] = String(body.length);

    const upstream = https.request(
      { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers, agent },
      (up) => {
        console.log(`${req.method} ${req.url} -> ${up.statusCode}`);
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      }
    );

    upstream.on('error', (err) => {
      console.error(`${req.method} ${req.url} -> upstream error: ${err.message}`);
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'proxy_upstream_failed', message: err.message }));
    });

    upstream.end(body);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`dev api proxy: http://localhost:${PORT} -> https://${TARGET_HOST}:${TARGET_PORT}`);
  console.log('certificate verification is DISABLED for that upstream. development only.');
});
