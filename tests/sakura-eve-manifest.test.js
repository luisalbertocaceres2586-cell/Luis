const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'assets', 'characters', 'sakura_assets', 'sakura');
const runtime = fs.readFileSync(path.join(folder, 'manifest.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(runtime, context);

const M = context.window.SAKURA_EVE_MANIFEST;
const config = JSON.parse(fs.readFileSync(path.join(folder, 'animations', 'animation_config.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));

assert.strictEqual(M.character, 'Sakura Eve');
assert.strictEqual(M.scale, 0.16275);
assert.deepStrictEqual(Object.keys(M.animations).sort(), Object.keys(config.animations).sort());

const files = new Set();
Object.keys(config.animations).forEach(name => {
  const actual = M.animations[name];
  const expected = config.animations[name];
  assert.strictEqual(actual.fps, expected.fps, name + ' FPS');
  assert.strictEqual(actual.loop, expected.loop, name + ' loop');
  assert.deepStrictEqual(Array.from(actual.frames, frame => frame.file), expected.files, name + ' frames');
  actual.frames.forEach(frame => {
    files.add(frame.file);
    const sheet = sourceManifest.sheets[actual.sheet];
    assert.strictEqual(frame.w, sheet.frame_size[0], name + ' frame width');
    assert.strictEqual(frame.h, sheet.frame_size[1], name + ' frame height');
    assert.strictEqual(frame.ax, sheet.pivot_px[0], name + ' pivot x');
    assert.strictEqual(frame.ay, sheet.pivot_px[1], name + ' pivot y');
  });
});

files.forEach(file => assert(fs.existsSync(path.join(folder, file)), 'missing frame: ' + file));
assert.strictEqual(files.size, sourceManifest.total_frames);
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.hitFrames)), config.hit_frames);
console.log('Sakura Eve: ' + Object.keys(M.animations).length + ' animaciones y ' + files.size + ' frames verificados.');
