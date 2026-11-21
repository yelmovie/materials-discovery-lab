import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// 앱용 Phaser(2026-11-21, D10): 지도·실험 화면은 CANVAS 렌더만 쓰고 물리·WebGL을 쓰지 않는다.
// 'phaser'를 src/game/phaser-lite.js로 바꾸고, Phaser 소스의 빌드 표식(typeof WEBGL_RENDERER 등)을 Phaser 공식 빌드처럼 상수로 바꾼다.
const PHASER_FLAGS: Record<string, string> = {
  CANVAS_RENDERER: 'true', WEBGL_RENDERER: 'false', WEBGL_DEBUG: 'false', EXPERIMENTAL: 'false',
  PLUGIN_3D: 'false', PLUGIN_CAMERA3D: 'false', PLUGIN_FBINSTANT: 'false', FEATURE_SOUND: 'true',
};
const PHASER_SRC = /[\\/]node_modules[\\/]phaser[\\/]src[\\/].*\.js$/;
const flags = (code: string) => code.replace(/typeof (CANVAS_RENDERER|WEBGL_RENDERER|WEBGL_DEBUG|EXPERIMENTAL|PLUGIN_3D|PLUGIN_CAMERA3D|PLUGIN_FBINSTANT|FEATURE_SOUND)\b/g, (_, k: string) => PHASER_FLAGS[k]);

export default defineConfig({
  resolve: { alias: [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./src/game/phaser-lite.js', import.meta.url)) }] },
  plugins: [{ name: 'phaser-flags', enforce: 'pre', transform: (code, id) => (PHASER_SRC.test(id) ? flags(code) : undefined) }],
  optimizeDeps: { esbuildOptions: { plugins: [{ name: 'phaser-flags', setup(build) { build.onLoad({ filter: PHASER_SRC }, async (a) => ({ contents: flags(await readFile(a.path, 'utf8')), loader: 'js' })); } }] } },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
