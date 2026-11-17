(function (root) {
  'use strict';

  const BASE = 'assets/characters/sakura_assets/sakura/';
  const SHEETS = {
    idle: { w: 292, h: 525, ax: 166, ay: 517 },
    walk: { w: 296, h: 508, ax: 159, ay: 500 },
    run: { w: 340, h: 506, ax: 176, ay: 498 },
    jump: { w: 342, h: 530, ax: 174, ay: 522 },
    glide_fall: { w: 352, h: 485, ax: 176, ay: 477 },
    crouch_slide_dash: { w: 339, h: 406, ax: 176, ay: 398 },
    wall: { w: 318, h: 483, ax: 152, ay: 475 },
    melee: { w: 483, h: 483, ax: 219, ay: 475 },
    special: { w: 402, h: 374, ax: 177, ay: 366 },
    hurt_death_win: { w: 382, h: 455, ax: 171, ay: 447 }
  };
  const all = (sheet, fps, loop) => [sheet, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], fps, loop];
  const part = (sheet, frames, fps, loop) => [sheet, frames, fps, loop];
  const specs = {
    idle: all('idle', 8, true),
    walk: all('walk', 10, true),
    run: all('run', 14, true),
    jump: all('jump', 12, false),
    jump_rise: part('jump', [3, 4, 5, 6], 12, false),
    jump_fall: part('jump', [7, 8, 9], 10, true),
    land: part('jump', [9, 10], 14, false),
    glide_full: all('glide_fall', 8, false),
    glide_start: part('glide_fall', [1, 2, 3], 10, false),
    glide: part('glide_fall', [4, 5, 6, 7, 8], 8, true),
    fall: part('glide_fall', [9, 10], 8, true),
    crouch_enter: part('crouch_slide_dash', [1, 2], 12, false),
    crouch: part('crouch_slide_dash', [3, 4], 6, true),
    crawl: part('crouch_slide_dash', [5, 6], 8, true),
    slide: part('crouch_slide_dash', [7, 8, 9], 14, false),
    dash: part('crouch_slide_dash', [10], 12, false),
    crouch_sheet_full: all('crouch_slide_dash', 12, false),
    wall_grab: part('wall', [1, 2, 3], 6, true),
    wall_slide: part('wall', [4, 5], 8, true),
    wall_climb: part('wall', [6, 7, 8], 10, true),
    wall_jump: part('wall', [9, 10], 12, false),
    melee: all('melee', 14, false),
    kunai: part('special', [1, 2, 3, 4], 12, false),
    special: part('special', [5, 6, 7, 8, 9, 10], 10, false),
    special_full: all('special', 11, false),
    hurt: part('hurt_death_win', [1, 2, 3, 4], 12, false),
    death: part('hurt_death_win', [5, 6, 7, 8], 8, false),
    win: part('hurt_death_win', [9, 10], 8, false)
  };
  const hitFrames = {
    melee: [3, 4, 6, 8, 9],
    kunai_spawn: [2, 3],
    special_release: [7, 8]
  };
  const frame = (sheet, number) => {
    const meta = SHEETS[sheet];
    const suffix = String(number).padStart(2, '0');
    return {
      file: 'frames/' + sheet + '/sakura_' + sheet + '_' + suffix + '.png',
      w: meta.w, h: meta.h, ax: meta.ax, ay: meta.ay, index: number
    };
  };
  const animations = {};
  Object.keys(specs).forEach(name => {
    const [sheet, numbers, fps, loop] = specs[name];
    animations[name] = {
      sheet, fps, loop,
      frames: numbers.map(number => frame(sheet, number))
    };
  });

  root.SAKURA_EVE_MANIFEST = {
    character: 'Sakura Eve',
    base: BASE,
    scale: 0.14,
    kmul: { idle: 1, walk: 1, run: 1, sprint: 1, jump: 1, crouch: 1, atk: 1, hurt: 1 },
    animations,
    hitFrames,
    idle: animations.idle.frames,
    walk: animations.walk.frames,
    run: animations.run.frames,
    sprint: animations.run.frames,
    jump: animations.jump.frames,
    jumpMap: [2, 3, 5, 6, 8],
    crouch: animations.crouch.frames,
    atk: animations.melee.frames,
    hurt: animations.hurt.frames,
    hurtMap: [0, 1, 2, 3],
    death: animations.death.frames
  };
})(window);
