var background = (function() {
  "use strict";
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  function onMessage(handler) {
    if (typeof browser !== "undefined" && browser.runtime?.onMessage) {
      const listener = (msg, sender, sendResponse) => {
        (async () => {
          try {
            const result2 = await Promise.resolve(handler(msg, sender));
            sendResponse(result2 || {});
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, message: errorMsg });
          }
        })();
        return true;
      };
      browser.runtime.onMessage.addListener(listener);
      return () => {
        browser.runtime.onMessage.removeListener(listener);
      };
    }
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      const listener = (msg, sender, sendResponse) => {
        (async () => {
          try {
            const result2 = await Promise.resolve(handler(msg, sender));
            sendResponse(result2 || {});
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, message: errorMsg });
          }
        })();
        return true;
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
    }
    return () => {
    };
  }
  async function getStorage(key) {
    try {
      if (typeof browser !== "undefined" && browser.storage?.local) {
        const result2 = await browser.storage.local.get(key);
        return result2?.[key];
      }
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        return await new Promise((resolve) => {
          chrome.storage.local.get(key, (result2) => {
            resolve(result2?.[key]);
          });
        });
      }
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return void 0;
        }
      }
      return void 0;
    } catch (error) {
      console.error(`Failed to get storage key "${key}":`, error);
      return void 0;
    }
  }
  async function setStorage(key, value) {
    try {
      const data = { [key]: value };
      if (typeof browser !== "undefined" && browser.storage?.local) {
        await browser.storage.local.set(data);
        return;
      }
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await new Promise((resolve) => {
          chrome.storage.local.set(data, () => {
            resolve();
          });
        });
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set storage key "${key}":`, error);
      throw error;
    }
  }
  const API_CONFIG = {
    BASE_URL: "https://member.starcg.net",
    MARKET_ENDPOINT: "/market.php",
    // 查詢參數
    QUERY_PARAMS: {
      ajax: "1",
      type: "all",
      server: "all",
      exact: "0"
    }
  };
  const MARKET_CONFIG = {
    DEFAULT_MAGIC_CRYSTAL_RATIO: 175,
    DEFAULT_PAGE_SIZE: 100,
    TIMEOUT_MS: 3e4,
    MAX_RETRIES: 3
  };
  async function fetchMarketData(searchText, page = 1) {
    const params = new URLSearchParams({
      ...API_CONFIG.QUERY_PARAMS,
      page: String(page),
      search: searchText
    });
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.MARKET_ENDPOINT}?${params}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MARKET_CONFIG.TIMEOUT_MS);
      const response = await fetch(url, {
        credentials: "omit",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return normalizeApiResponse(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch market data: ${errorMsg}`);
    }
  }
  async function fetchAllMarketPages(searchText) {
    const stalls = [];
    const itemsByCd = {};
    const petsByCd = {};
    let page = 1;
    let totalFiltered = 0;
    while (true) {
      try {
        const data = await fetchMarketData(searchText, page);
        stalls.push(...data.stalls || []);
        Object.assign(itemsByCd, data.itemsByCd || {});
        Object.assign(petsByCd, data.petsByCd || {});
        totalFiltered = data.totalFiltered || stalls.length + totalFiltered;
        if (stalls.length >= totalFiltered) break;
        if (!data.stalls || data.stalls.length === 0) break;
        page += 1;
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        if (stalls.length === 0) throw error;
        break;
      }
    }
    return { stalls, itemsByCd, petsByCd, totalFiltered };
  }
  function normalizeApiResponse(data) {
    return {
      stalls: data.stalls || data.data?.stalls || [],
      itemsByCd: data.itemsByCd || data.data?.itemsByCd || {},
      petsByCd: data.petsByCd || data.data?.petsByCd || {},
      totalFiltered: data.totalFiltered ?? data.data?.totalFiltered
    };
  }
  function filterMarketDataBySearch(data, searchText) {
    if (!searchText.trim()) {
      return data;
    }
    const lowerCaseSearch = searchText.toLowerCase();
    const validCdKeys = /* @__PURE__ */ new Set();
    for (const cdkey in data.itemsByCd) {
      const items = data.itemsByCd[cdkey];
      const filteredItems = items.filter(
        (item) => (item.ITEM_TRUENAME || "").toLowerCase().includes(lowerCaseSearch)
      );
      if (filteredItems.length > 0) {
        data.itemsByCd[cdkey] = filteredItems;
        validCdKeys.add(cdkey);
      } else {
        delete data.itemsByCd[cdkey];
      }
    }
    for (const cdkey in data.petsByCd) {
      const pets = data.petsByCd[cdkey];
      const filteredPets = pets.filter(
        (pet) => (pet.Name || "").toLowerCase().includes(lowerCaseSearch)
      );
      if (filteredPets.length > 0) {
        data.petsByCd[cdkey] = filteredPets;
        validCdKeys.add(cdkey);
      } else {
        delete data.petsByCd[cdkey];
      }
    }
    data.stalls = data.stalls.filter(
      (stall) => validCdKeys.has(stall.cdkey ?? stall.cdKey ?? stall.cd ?? stall.CDKEY ?? "")
    );
    return data;
  }
  const definition = defineBackground(() => {
    console.log("Background service worker loaded");
    onMessage(async (message) => {
      if (!message || !message.type) {
        return { success: true };
      }
      try {
        if (message.type === "fetchMarket") {
          return await handleFetchMarket(message);
        } else if (message.type === "addTracked") {
          return await handleAddTracked(message);
        } else {
          throw new Error(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error handling message:`, errorMsg);
        return { success: false, message: errorMsg };
      }
    });
  });
  async function handleFetchMarket(message) {
    const search = message.search || "";
    try {
      let data = await fetchAllMarketPages(search);
      if (search.trim()) {
        data = filterMarketDataBySearch(data, search);
      }
      return {
        success: true,
        stalls: data.stalls,
        itemsByCd: data.itemsByCd,
        petsByCd: data.petsByCd
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to fetch market data: ${errorMsg}`
      };
    }
  }
  async function handleAddTracked(message) {
    const item = message.item;
    if (!item) {
      return { success: false, message: "Item data is required" };
    }
    try {
      const trackedItems = await getStorage("trackedItems") || [];
      trackedItems.unshift(item);
      await setStorage("trackedItems", trackedItems);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to add tracked item: ${errorMsg}`
      };
    }
  }
  function initPlugins() {
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
    else method("[wxt]", ...args);
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "ws://localhost:3000";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
        type: "custom",
        event,
        payload
      }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2();
    else reloadContentScriptMv3(payload);
  }
  async function reloadContentScriptMv3({ registration, contentScript }) {
    if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
    else await reloadManifestContentScriptMv3(contentScript);
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{
        ...contentScript,
        id,
        css: contentScript.css ?? []
      }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{
        ...contentScript,
        id,
        css: contentScript.css ?? []
      }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
      const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log("Content script is not registered yet, nothing to reload", contentScript);
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(matchingTabs.map(async (tab) => {
      try {
        await browser.tabs.reload(tab.id);
      } catch (err) {
        logger.warn("Failed to reload tab:", err);
      }
    }));
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener("open", () => ws2.sendCustom("wxt:background-initialized"));
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") browser.runtime.reload();
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  var background_entrypoint_default = result;
  return background_entrypoint_default;
})();
