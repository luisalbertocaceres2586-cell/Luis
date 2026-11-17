// Pruebas de logros locales. Ejecutar: node tests/achievements.test.js
const assert = require('assert');
const Achievements = require('../engine/ui/achievements.js');

function fakeStore() {
  const data = {};
  return {
    getItem: key => data[key] || null,
    setItem: (key, value) => { data[key] = String(value); }
  };
}

const storage = fakeStore();
const unlocked = [];
const achievements = Achievements.create(storage, item => unlocked.push(item.id));

assert.strictEqual(Achievements.DEFINITIONS.length, 8);
achievements.record('correct', { streak: 10 });
for (let i = 0; i < 9; i++) achievements.record('correct', { streak: 10 });
achievements.record('level-complete', { stars: 3, damageFree: true, phase: 'easy', campaignComplete: true });

assert.strictEqual(achievements.summary().unlocked, 8);
assert.strictEqual(new Set(unlocked).size, 8, 'cada logro se notifica una sola vez');
assert.strictEqual(achievements.state.correct, 10);
assert.strictEqual(achievements.record('unknown'), false);

const restored = Achievements.create(storage);
assert.strictEqual(restored.summary().unlocked, 8);
assert.strictEqual(restored.state.maxStreak, 10);
assert.strictEqual(restored.state.levels, 1);
console.log('8 pruebas de logros OK');
