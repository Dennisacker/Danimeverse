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

const server = http.createServer((req, res) => {
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

    if (shouldCompress) {
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
