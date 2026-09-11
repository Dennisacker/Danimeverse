require("dotenv").config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 5000;
const HOST = '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// Cache durations by file type
function getCacheHeader(ext) {
  if (ext === '.html') return 'no-cache';
  if (['.css', '.js'].includes(ext)) return 'public, max-age=3600';  // 1 hour
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(ext))
    return 'public, max-age=86400'; // 24 hours
  return 'public, max-age=600';
}

// Types that benefit from gzip
const COMPRESSIBLE = new Set([
  'text/html', 'text/css', 'application/javascript',
  'application/json', 'image/svg+xml'
]);

function injectCookieConsent(html) {
  const cookieBanner = `
    <aside id="dvConsentBanner" class="dv-consent" aria-live="polite">
      <h2>Your privacy matters</h2>
      <p>Danimeverse uses essential storage to keep the site working. You can allow or reject optional preferences on this device.</p>
      <div class="dv-consent-actions">
        <button type="button" class="dv-cookie-btn dv-cookie-btn-primary" data-consent="all">Accept All</button>
        <button type="button" class="dv-cookie-btn" data-consent="reject">Reject Non-Essential</button>
        <button type="button" class="dv-cookie-btn" data-open-cookie-settings>Cookie Settings</button>
      </div>
    </aside>`;
  const shared = `
    <link rel="stylesheet" href="/cookie-consent.css?v=2">
    <script>
      (function () {
        try {
          const stored = JSON.parse(localStorage.getItem("danimeverse_cookie_consent") || "null");
          const valid = stored && stored.essential &&
            (["all", "reject", "custom"].includes(stored.choice) || stored.preferences !== undefined);
          if (!valid) document.documentElement.classList.add("dv-consent-required");
        } catch (_) {
          document.documentElement.classList.add("dv-consent-required");
        }
      })();
    </script>
    <script src="/cookie-consent.js?v=2"></script>`;

  let result = html.includes("/cookie-consent.js?v=")
    ? html
    : html.replace("</head>", `${shared}\n</head>`);
  if (!result.includes('id="dvConsentBanner"')) {
    result = result.replace("</body>", `${cookieBanner}\n</body>`);
  }
  return result;
}

  const server = http.createServer(async (req, res) => {

  // TMDB BACKDROP API
  if (req.url.startsWith("/api/backdrop")) {

    const url = new URL(req.url, `http://${req.headers.host}`);
    const anime = url.searchParams.get("anime");

    if (!anime) {
      res.writeHead(400, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        error: "Anime name missing"
      }));
    }

    try {

      const response = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(anime)}`
      );

      const data = await response.json();

      const result = data.results?.[0];

      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        backdrop: result?.backdrop_path
          ? `https://image.tmdb.org/t/p/original${result.backdrop_path}`
          : null
      }));

    } catch(error) {

      console.error(error);

      res.writeHead(500, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        error: "TMDB failed"
      }));
    }
  }


  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(__dirname, urlPath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const cacheControl = getCacheHeader(ext);
    const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip');
    const shouldCompress = acceptsGzip && COMPRESSIBLE.has(contentType);

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    };

    if (ext === '.html') {
      fs.readFile(filePath, (readErr, html) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>500 Internal Server Error</h1>');
          return;
        }
      const content = Buffer.from(injectCookieConsent(html.toString('utf8')));
        headers['Content-Length'] = content.length;
        res.writeHead(200, headers);
        res.end(content);
      });
    } else if (shouldCompress) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      const gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });
      fs.createReadStream(filePath).pipe(gzip).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Danimeverse server on http://${HOST}:${PORT}`);
});
