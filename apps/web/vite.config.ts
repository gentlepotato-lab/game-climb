import { defineConfig } from 'vite';
import { spawn } from 'node:child_process';
import * as net from 'node:net';
import * as path from 'node:path';

const isPortOpen = (port: number) => {
  return new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    const finalize = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(600);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, '127.0.0.1');
  });
};

// TO-BE: 네이티브 실행 (Docker 미사용). AS-IS(4080/5174) 와 겹치지 않는 포트를 쓴다 (규칙: Gateway/nginx/conf/conf.d/00-default.conf).
const API_PORT = Number(process.env.CLIMB_API_PORT || 18201);
const DEV_PORT = Number(process.env.CLIMB_WEB_PORT || 28201);

export default defineConfig({
  plugins: [
    {
      name: 'start-backend',
      configureServer() {
        const port = API_PORT;
        isPortOpen(port).then((open) => {
          if (open) return;
          const backendCwd = path.resolve(__dirname, '../server');
          const child = spawn('npm', ['run', 'dev'], {
            cwd: backendCwd,
            stdio: 'inherit',
            shell: true
          });
          process.on('exit', () => child.kill());
        });
      }
    }
  ],
  server: {
    host: "0.0.0.0",
    port: DEV_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
