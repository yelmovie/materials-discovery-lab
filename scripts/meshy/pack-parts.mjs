// Part GLBs from segment-parts.py → public/assets/models: shrink the embedded textures, then gltfpack simplifies with UV seams locked
// and meshopt-compresses. Same method as 8 creatures/scripts/pack-models.mjs (Blender Decimate smeared textures across UV seams there).
// node scripts/meshy/pack-parts.mjs <in-parts.glb> <out.glb> <ratio> <error>
// gltfpack runs through npx (pinned 1.3.0) so package.json and the lock file stay as they are.
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

async function shrinkTextures(src, out, [colorPx, normalPx, attribPx]) {
  const glb = await readFile(src);
  const jsonLength = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  const binStart = 20 + jsonLength + 8, bin = glb.subarray(binStart, binStart + glb.readUInt32LE(20 + jsonLength));
  if (json.buffers.length !== 1 || json.extensionsRequired?.length) throw Error(`${src}: expects a single-buffer GLB without required extensions`);
  // Texture class from how materials use it.
  const limit = new Map();
  const use = (info, side) => { if (!info) return; const image = json.textures[info.index].source; limit.set(image, Math.max(limit.get(image) ?? 0, side)); };
  for (const m of json.materials ?? []) {
    use(m.pbrMetallicRoughness?.baseColorTexture, colorPx); use(m.emissiveTexture, colorPx);
    use(m.normalTexture, normalPx); use(m.pbrMetallicRoughness?.metallicRoughnessTexture, attribPx); use(m.occlusionTexture, attribPx);
  }
  const views = json.bufferViews.map(v => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
  for (const [i, image] of json.images.entries()) {
    const side = limit.get(i) ?? colorPx, input = views[image.bufferView], {width, height} = await sharp(input).metadata();
    views[image.bufferView] = await sharp(input).resize({width: Math.min(side, width), height: Math.min(side, height), fit: 'fill'}).jpeg({quality: 90, mozjpeg: true}).toBuffer();
    image.mimeType = 'image/jpeg';
  }
  // Repack every view 4-byte aligned in its original order.
  let offset = 0; const parts = [];
  for (const [i, v] of views.entries()) { const pad = (4 - offset % 4) % 4; if (pad) parts.push(Buffer.alloc(pad)); offset += pad; Object.assign(json.bufferViews[i], {byteOffset: offset, byteLength: v.length}); parts.push(v); offset += v.length; }
  json.buffers[0].byteLength = offset;
  const binOut = Buffer.concat([...parts, Buffer.alloc((4 - offset % 4) % 4)]);
  let jsonOut = Buffer.from(JSON.stringify(json)); jsonOut = Buffer.concat([jsonOut, Buffer.alloc((4 - jsonOut.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonOut.length + 8 + binOut.length, 8);
  const chunk = (data, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(data.length, 0); h.writeUInt32LE(type, 4); return [h, data]; };
  await writeFile(out, Buffer.concat([header, ...chunk(jsonOut, 0x4e4f534a), ...chunk(binOut, 0x004e4942)]));
}

const [src, out, ratio = '0.1', error = '0.004'] = process.argv.slice(2);
const textured = out.replace(/\.glb$/, '-tex.tmp.glb');
await shrinkTextures(src, textured, [1024, 1024, 512]);
// -kn/-km keep each part as its own named node and material so the app can find, highlight and recolour it.
const log = execFileSync('npx', ['-y', 'gltfpack@1.3.0', '-i', textured, '-o', out, '-si', ratio, '-se', error, '-cc', '-vt', '14', '-kn', '-km', '-v'], {encoding: 'utf8'});
console.log(log.split('\n').filter(l => /^(input|output)/.test(l)).join('\n'));
console.log(out, (await readFile(out)).length, 'bytes');
