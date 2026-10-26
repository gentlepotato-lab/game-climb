import { defineConfig, loadEnv } from 'vite';
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

// TO-BE: Docker를 쓰지 않는다. 개발 서버도 Nginx 게이트웨이도 모두 호스트에서 직접 돈다.
//   - 개발      : vite dev(28201) → 프록시 → Express(18201)
//   - 실서비스  : npm run build → dist/ → Nginx 게이트웨이가 그 폴더를 직접 서빙
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 포트는 .env로 덮어쓸 수 있다. 기본값은 GP Lab의 포트 규칙을 따른다.
  const backendPort = Number(env.VITE_BACKEND_PORT || '18201');
  const devPort = Number(env.VITE_DEV_PORT || '28201');

  return {
    plugins: [
      {
        // 개발 서버를 띄울 때 백엔드가 꺼져 있으면 같이 띄운다.
        name: 'start-backend',
        configureServer() {
          isPortOpen(backendPort).then((open) => {
            if (open) return;
            const backendCwd = path.resolve(__dirname, '../backend');
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
    // SPA는 루트에 선다. API가 /api 아래에 모여 있어 경로가 겹치지 않는다.
    base: '/',
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      proxy: {
        // API가 한 자리에 모였으므로 넘길 것도 한 줄이면 된다.
        '/api': { target: `http://127.0.0.1:${backendPort}`, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
