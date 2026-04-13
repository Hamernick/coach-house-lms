import { chromium } from "@playwright/test";

const URL = "http://127.0.0.1:3000/find";

function log(label, data) {
  console.log(label, JSON.stringify(data, null, 2));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 700, height: 900 }, colorScheme: "dark" });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-slot="drawer-content"]');

const data = await page.evaluate(() => {
  const surface = document.querySelector('[aria-label="Public organization map"]')?.parentElement?.parentElement;
  const drawer = document.querySelector('[data-slot="drawer-content"]');
  const panel = document.querySelector('[data-sidebar="content"]');

  function rect(node) {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
    };
  }

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    surface: rect(surface),
    drawer: rect(drawer),
    panel: rect(panel),
    drawerStyle: drawer
      ? {
          height: getComputedStyle(drawer).height,
          maxHeight: getComputedStyle(drawer).maxHeight,
          transform: getComputedStyle(drawer).transform,
          top: getComputedStyle(drawer).top,
          bottom: getComputedStyle(drawer).bottom,
        }
      : null,
  };
});

log("initial", data);
await page.screenshot({ path: "/tmp/public-map-drawer-initial.png", fullPage: true });
await browser.close();
