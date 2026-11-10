import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
export async function open(url, {w=1280,h=720, wait=3000}={}) {
  const browser = await puppeteer.launch({ args: [...chromium.args.filter(a=>!a.includes('single-process')),'--no-sandbox','--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless:'shell' });
  const page = await browser.newPage();
  await page.setViewport({width:w,height:h});
  const logs=[]; page.on('console',m=>logs.push(m.type()+': '+m.text().slice(0,200))); page.on('pageerror',e=>logs.push('PAGEERROR: '+e.message.slice(0,300)));
  const t0=Date.now(); await page.goto(url,{waitUntil:'load',timeout:90000}); const loadMs=Date.now()-t0;
  await new Promise(r=>setTimeout(r,wait));
  return {browser,page,logs,loadMs};
}
