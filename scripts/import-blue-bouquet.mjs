// Read-only import of the procedural bouquet from the user's sonabirthday source.
// Usage: node scripts/import-blue-bouquet.mjs /absolute/path/to/sonabirthday/index.html
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import sharp from 'sharp';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the original sonabirthday/index.html path.');
const source = await readFile(sourcePath, 'utf8');
const start = source.indexOf('        // Rose Bouquet');
const end = source.indexOf('        // Confetti Cannon', start);
if (start < 0 || end < 0) throw new Error('Original bouquet section not found.');
let bouquetSource = source.slice(start, end)
  // Preserve the original petal equations and seven-flower arrangement.
  // Fewer angular samples, welded vertices and shared geometry reduce mobile memory.
  .replace('length: 1201', 'length: 721')
  .replace('i * 0.5 / 600', 'i * 0.5 / 360')
  .replace('color: 0x2d5016, shininess: 15', 'color: 0x467c83, shininess: 15')
  .replace('color: 0xFFE5F0', 'color: 0xe1f2ff')
  .replace('transparent: true, opacity: 0.9', 'transparent: false, opacity: 1')
  .replace('depthWrite: false', 'depthWrite: true')
  .replace('color: 0xFFD700', 'color: 0x347bbd')
  .replace(/const colorList = \[.*?\];/, 'const colorList = [[0.025,0.10,0.30],[0.035,0.23,0.52],[0.08,0.40,0.72],[0.25,0.60,0.88],[0.53,0.79,0.96],[0.84,0.95,1.0]];')
  .replace(/const material = new THREE\.ShaderMaterial\(\{[\s\S]*?\n            \}\);/, 'const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.64, metalness: 0.03 });')
  .replace('function createRoseSurface()', 'function buildRoseSurface()')
  .replace('geometry.computeVertexNormals();', 'geometry.deleteAttribute("shininess");')
  .replace('new THREE.Mesh(geometry, material);\n            rose.renderOrder', 'new THREE.Mesh(mergeVertices(geometry), material);\n            rose.geometry.computeVertexNormals();\n            rose.renderOrder');

// Meshes share the expensive petal geometry, just as a glTF mesh instance should.
bouquetSource += '\nlet roseTemplate; function createRoseSurface() { roseTemplate ??= buildRoseSurface(); return roseTemplate.clone(); }\ncreateBouquet();';
const bouquet = vm.runInNewContext(bouquetSource, { THREE, mergeVertices }, { timeout: 30000 });
bouquet.name = 'Sona bouquet · seven blue roses for FuongThenn';
bouquet.rotation.x = -0.92;
bouquet.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(bouquet);
const center = bounds.getCenter(new THREE.Vector3());
const root = new THREE.Group();
root.name = 'Blue rose bouquet';
bouquet.position.sub(center);
root.add(bouquet);
root.traverse(mesh => {
  if (!mesh.isMesh || !mesh.material.isMeshPhongMaterial) return;
  const original = mesh.material;
  mesh.material = new THREE.MeshStandardMaterial({
    color: original.color, side: original.side, roughness: .56,
    metalness: original.color.getHex() === 0x347bbd ? .3 : .02,
  });
  original.dispose();
});
root.updateMatrixWorld(true);

// GLTFExporter needs the browser FileReader API for its binary Blob only.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); });
  }
};
const output = new URL('../public/models/', import.meta.url);
await mkdir(output, { recursive: true });
const glb = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true });
await writeFile(new URL('fuongthenn-blue-bouquet.glb', output), Buffer.from(glb));

// Render an actual projection of this same model as the transparent poster.
// This remains visible while WebGL loads, and on devices without WebGL.
const size = bounds.getSize(new THREE.Vector3());
const width = 680, height = 800;
const halfHeight = Math.max(size.y * 0.58, size.x * height / width * 0.58);
const camera = new THREE.OrthographicCamera(-halfHeight * width / height, halfHeight * width / height, halfHeight, -halfHeight, .01, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
const light = new THREE.Vector3(-.5, .8, 1).normalize();
const faces = [];
root.traverse(mesh => {
  if (!mesh.isMesh) return;
  const positions = mesh.geometry.attributes.position;
  const colors = mesh.geometry.attributes.color;
  const indices = mesh.geometry.index;
  const count = indices ? indices.count : positions.count;
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map(j => indices ? indices.getX(i + j) : i + j);
    const vertices = ids.map(id => new THREE.Vector3().fromBufferAttribute(positions, id).applyMatrix4(mesh.matrixWorld));
    const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
    const color = mesh.material.color.clone();
    if (colors) {
      const average = new THREE.Color(0, 0, 0);
      for (const id of ids) { average.r += colors.getX(id) / 3; average.g += colors.getY(id) / 3; average.b += colors.getZ(id) / 3; }
      color.multiply(average);
    }
    color.multiplyScalar(.68 + .32 * Math.abs(normal.dot(light)));
    const projected = vertices.map(vertex => vertex.clone().project(camera));
    const points = projected.map(v => `${((v.x + 1) * width / 2).toFixed(2)},${((1 - v.y) * height / 2).toFixed(2)}`).join(' ');
    faces.push({ z: vertices.reduce((sum, v) => sum + v.z, 0) / 3, points, color: `#${color.getHexString()}` });
  }
});
faces.sort((a, b) => a.z - b.z);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${faces.map(face => `<polygon points="${face.points}" fill="${face.color}" stroke="${face.color}" stroke-width="0.35" stroke-linejoin="round"/>`).join('')}</svg>`;
await sharp(Buffer.from(svg), { limitInputPixels: false }).png().toFile(new URL('fuongthenn-blue-bouquet.png', output).pathname);
console.log(JSON.stringify({ roses: 7, glbBytes: glb.byteLength, poster: [width, height], triangles: faces.length }));
