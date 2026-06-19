import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

interface SlideMetadata {
  title?: string;
  preset?: string;
  accent?: string;
  transition?: string;
}

interface FrontmatterResult {
  metadata: SlideMetadata;
  content: string;
}

function parseFrontmatter(markdown: string): FrontmatterResult {
  const match = markdown.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n/);
  if (!match) return { metadata: {}, content: markdown };
  
  const yaml = match[1];
  const metadata: SlideMetadata = {};
  yaml.split(/\r?\n/).forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key === 'title') metadata.title = val;
      if (key === 'preset') metadata.preset = val;
      if (key === 'accent') metadata.accent = val;
      if (key === 'transition') metadata.transition = val;
    }
  });
  const content = markdown.slice(match[0].length);
  return { metadata, content };
}

// Vite plugin to serve the slide library files as JSON API
function slidesApiPlugin() {
  return {
    name: 'vite-plugin-slides-api',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlStr = req.url || '/';
        const urlObj = new URL(urlStr, 'http://localhost');
        const pathname = urlObj.pathname;
        const libraryPath = path.resolve(__dirname, 'library');

        // Ensure library directory exists
        if (!fs.existsSync(libraryPath)) {
          fs.mkdirSync(libraryPath, { recursive: true });
        }

        if (pathname === '/api/presentations') {
          try {
            const scanDirectoryRecursively = (dir: string, baseDir: string) => {
              let results: any[] = [];
              const list = fs.readdirSync(dir);
              list.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                  results = results.concat(scanDirectoryRecursively(fullPath, baseDir));
                } else if (file.endsWith('.md')) {
                  const content = fs.readFileSync(fullPath, 'utf8');
                  const { metadata } = parseFrontmatter(content);
                  const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                  const id = relativePath.replace(/\.md$/, '');
                  results.push({
                    id,
                    title: metadata.title || path.basename(file, '.md'),
                    preset: metadata.preset || 'google-io-light',
                    accent: metadata.accent || 'blue',
                    mtime: stat.mtimeMs,
                  });
                }
              });
              return results;
            };

            const list = scanDirectoryRecursively(libraryPath, libraryPath);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(list));
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            res.statusCode = 500;
            res.end(JSON.stringify({ error: message }));
          }
          return;
        }

        if (pathname.startsWith('/api/presentations/')) {
          const id = pathname.substring('/api/presentations/'.length);
          if (id.includes('..')) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Access denied' }));
            return;
          }
          const filePath = path.join(libraryPath, `${id}.md`);
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Presentation not found' }));
            return;
          }
          try {
            const markdown = fs.readFileSync(filePath, 'utf8');
            const { metadata, content } = parseFrontmatter(markdown);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ id, metadata, content }));
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            res.statusCode = 500;
            res.end(JSON.stringify({ error: message }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), slidesApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
  };
});
