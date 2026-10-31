// A visible pointer for Playwright screen recordings.
//
// Playwright's recordVideo captures the page without a mouse pointer, so a
// reader cannot see where a click lands. This draws one in the page from
// real mouse events: an arrow that follows the mouse, and a ring on every
// mousedown. Nothing in the app changes; it exists only in the recording.
//
//   import { cursorInit, park, glide, glideClick } from './record-cursor.mjs';
//   await context.addInitScript(cursorInit);
//   const page = await context.newPage();
//   await page.goto(url);
//   await park(page, 820, 300);              // where the pointer starts
//   await glideClick(page, page.locator('#message'));
//   await page.locator('#message').pressSequentially('Hello', { delay: 55 });
//
// Use glide/glideClick instead of locator.click(): click() teleports the
// mouse, which makes the pointer jump instead of move.

export const cursorInit = () => {
  const add = () => {
    if (document.getElementById('__rec-cursor') || !document.body) return;
    const css = document.createElement('style');
    css.textContent = `
      #__rec-cursor{position:fixed;left:0;top:0;width:30px;height:30px;z-index:2147483647;
        pointer-events:none;transform:translate(-200px,-200px)}
      #__rec-cursor svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
      .__rec-ring{position:fixed;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;
        z-index:2147483646;pointer-events:none;border:3px solid #f97316;
        background:rgba(249,115,22,.18);animation:__rec-ring .7s ease-out forwards}
      @keyframes __rec-ring{from{transform:scale(.35);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.appendChild(css);
    const c = document.createElement('div');
    c.id = '__rec-cursor';
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 22 22"><path d="M3 2 L3 18 L7.5 14 L10.5 20.5 L13 19.3 L10.2 13 L16.5 13 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const place = (x, y) => { c.style.transform = `translate(${x - 4}px,${y - 3}px)`; };
    // Keep the pointer where it was across a page load.
    try {
      const last = JSON.parse(sessionStorage.getItem('__rec-xy') || 'null');
      if (last) place(...last);
    } catch {}
    addEventListener('mousemove', e => {
      place(e.clientX, e.clientY);
      try { sessionStorage.setItem('__rec-xy', JSON.stringify([e.clientX, e.clientY])); } catch {}
    }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.className = '__rec-ring';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 850);
    }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
};

const positions = new WeakMap();

// Put the pointer somewhere without visible movement.
export async function park(page, x, y) {
  await page.mouse.move(x, y);
  positions.set(page, { x, y });
}

// Move to the centre of a locator at a hand-like speed.
export async function glide(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const from = positions.get(page) ?? { x, y };
  const steps = Math.min(56, Math.max(8, Math.round(Math.hypot(x - from.x, y - from.y) / 18)));
  await page.mouse.move(x, y, { steps });
  positions.set(page, { x, y });
}

// Glide, pause so the reader sees the target, then click.
export async function glideClick(page, locator, pause = 250) {
  await glide(page, locator);
  await page.waitForTimeout(pause);
  await page.mouse.down();
  await page.waitForTimeout(90);
  await page.mouse.up();
}
