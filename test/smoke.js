/**
 * End-to-end smoke test: loads the unpacked extension in Chromium against a live
 * SAS Studio instance and exercises the page-side features.
 *
 * Run:  node test/smoke.js
 * Env:  SS_URL      SAS Studio URL      (default http://192.168.1.72/SASStudio/38/)
 *       CHROME_BIN  Chromium executable (default: playwright's bundled chromium)
 * Needs the `playwright` module resolvable (npx playwright / NODE_PATH / local install)
 * and at least one closable FILE tab open in the SAS Studio session.
 *
 * Middle-clicks are sent as raw CDP input (trusted, full event pipeline) - this is
 * what caught the dojo/touch.js dojoClick suppression bug that synthetic
 * dispatchEvent-based tests can't see.
 */
const { chromium } = require("playwright");

const EXT = require("path").resolve(__dirname, "..");
const URL = process.env.SS_URL || "http://192.168.1.72/SASStudio/38/";

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(detail)}`);
  if (!ok) failures++;
}

(async () => {
  const ctx = await chromium.launchPersistentContext("", {
    ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: "chromium" }),
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("console", (m) => {
    const t = m.text();
    if (t.includes("[SS Ext]") && m.type() === "error") console.log("PAGE ERROR:", t);
  });
  await page.goto(URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector(".dijitTreeNode", { timeout: 45000 });
  await page.waitForTimeout(3000);

  // -- injection + init ---------------------------------------------------------
  const state = await page.evaluate(() => ({
    initialized: !!(window.__ssf && window.__ssf._initialized),
    toolsMeta: Array.isArray(window.SSF_TOOLS),
    closedTabsTracking: Array.isArray(window.__ssfClosedTabs),
    closeTabWrapped: !!window.appDMS.tabs._closeTabOrig,
    tabCount: window.appDMS.tabs.getAllTabObjects().length,
  }));
  check("ss-fixes injected and initialized", state.initialized && state.toolsMeta, state);
  check("reopenClosedTab tracking installed", state.closedTabsTracking && state.closeTabWrapped, state);
  if (state.tabCount < 1) {
    check("at least one tab open in session (needed for middle-click test)", false, state);
  } else {
    // -- middle-click close (raw CDP input) --------------------------------------
    const pt = await page.evaluate(() => {
      const t = window.appDMS.tabs.getAllTabObjects()[0];
      const r = (t.tab ?? t).controlButton.domNode.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, name: t.name || t.title };
    });
    const cdp = await ctx.newCDPSession(page);
    const base = { x: pt.x, y: pt.y, button: "middle", buttons: 4, clickCount: 1 };
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...base });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...base });
    await page.waitForTimeout(1500);

    const afterClose = await page.evaluate(() => ({
      count: window.appDMS.tabs.getAllTabObjects().length,
      stack: window.__ssfClosedTabs.map((c) => c.name),
    }));
    check("middle-click closes tab", afterClose.count === state.tabCount - 1, afterClose);
    check("closed tab tracked for reopen", afterClose.stack.includes(pt.name), afterClose);

    // -- reopen -------------------------------------------------------------------
    await page.evaluate(() => window.__ssf.run("reopenClosedTab"));
    await page.waitForTimeout(2500);
    const afterReopen = await page.evaluate(() => window.appDMS.tabs.getAllTabObjects().length);
    check("reopenClosedTab restores tab", afterReopen === state.tabCount, { afterReopen });
  }

  // -- native context menu toggle (live) -----------------------------------------
  const ctxMenu = await page.evaluate(() => {
    window.__ssf.run("toggleNativeContextMenu");
    const on = typeof window.__ssfNativeCtxMenu === "function";
    window.__ssf.run("toggleNativeContextMenu");
    const off = window.__ssfNativeCtxMenu === null;
    return { on, off };
  });
  check("native context menu toggles on and back off", ctxMenu.on && ctxMenu.off, ctxMenu);

  await ctx.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error("HARNESS ERROR:", e.message);
  process.exit(1);
});
