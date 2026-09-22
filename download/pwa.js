(() => {
  "use strict";
  const APP_VERSION = "2.77.0";
  const UPDATE_ATTEMPT_KEY = "meteor-striker-update-attempt";
  const CACHE_PREFIXES = ["monpatch-download-", "meteor-striker-download-"];
  const statusEl = document.getElementById("pwaStatus");
  const multiBtn = document.getElementById("multiModeBtn");
  const installBtn = document.getElementById("installPwaBtn");
  let deferredInstall = null;
  let updatePromise = null;

  window.__monpatchOnlineAllowed = false;

  function notifyOnlineState() {
    window.dispatchEvent(new CustomEvent("monpatch-online-state", {
      detail: { allowed: window.__monpatchOnlineAllowed }
    }));
    if (typeof refreshEntryButtons === "function") refreshEntryButtons();
  }

  function showStatus(html, kind = "") {
    if (!statusEl) return;
    statusEl.className = `pwaStatus show ${kind}`.trim();
    statusEl.innerHTML = html;
  }

  function allowOnline() {
    sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
    window.__monpatchOnlineAllowed = true;
    if (multiBtn) multiBtn.disabled = false;
    if (statusEl) statusEl.className = "pwaStatus";
    notifyOnlineState();
  }

  function useOfflineMode() {
    window.__monpatchOnlineAllowed = false;
    if (multiBtn) multiBtn.disabled = true;
    showStatus("<strong>通信ができません。</strong><br>現在はシングルプレイのみプレイできます（ランキング対象外）。", "error");
    notifyOnlineState();
  }

  function requireUpdate(targetVersion) {
    window.__monpatchOnlineAllowed = false;
    if (multiBtn) multiBtn.disabled = true;
    showStatus('<strong>自動更新を完了できませんでした。</strong><br>通信状態を確認して、もう一度更新してください。<button id="pwaUpdateBtn" type="button">更新して再読み込み</button>', "error");
    document.getElementById("pwaUpdateBtn")?.addEventListener("click", () => {
      sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
      updateAndReload(targetVersion);
    });
    notifyOnlineState();
  }

  function waitForActivation(worker, timeoutMs = 15000) {
    if (!worker || worker.state === "activated") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onStateChange = () => {
        if (worker.state === "activated") {
          clearTimeout(timer);
          worker.removeEventListener("statechange", onStateChange);
          resolve();
        } else if (worker.state === "redundant") {
          clearTimeout(timer);
          worker.removeEventListener("statechange", onStateChange);
          reject(new Error("Service Workerの更新が破棄されました"));
        }
      };
      const timer = setTimeout(() => {
        worker.removeEventListener("statechange", onStateChange);
        reject(new Error("Service Workerの有効化がタイムアウトしました"));
      }, timeoutMs);
      worker.addEventListener("statechange", onStateChange);
    });
  }

  function waitForControllerChange(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const onControllerChange = () => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        resolve();
      };
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        reject(new Error("Service Workerの制御切替がタイムアウトしました"));
      }, timeoutMs);
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    });
  }

  function deleteOldAppCaches(targetVersion) {
    const keepName = `meteor-striker-download-${targetVersion}`;
    return caches.keys().then(names => Promise.all(
      names
        .filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix)) && name !== keepName)
        .map(name => caches.delete(name))
    ));
  }

  function updateAndReload(targetVersion) {
    if (updatePromise) return updatePromise;
    updatePromise = (async () => {
      const button = document.getElementById("pwaUpdateBtn");
      if (button) { button.disabled = true; button.textContent = "更新中…"; }
      showStatus("<strong>最新版へ自動更新しています。</strong><br>この画面のままお待ちください。", "");
      try {
        const controllerChange = waitForControllerChange();
        controllerChange.catch(() => {});
        const registration = await navigator.serviceWorker.register(`sw.js?v=${targetVersion}`, {
          scope: "./",
          updateViaCache: "none"
        });
        await registration.update();
        const worker = registration.installing || registration.waiting;
        if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
        await waitForActivation(worker);
        await controllerChange;
        await deleteOldAppCaches(targetVersion);
        sessionStorage.setItem(UPDATE_ATTEMPT_KEY, targetVersion);
        location.reload();
      } catch (error) {
        console.error(error);
        updatePromise = null;
        requireUpdate(targetVersion);
      }
    })();
    return updatePromise;
  }

  async function verifyVersion() {
    if (!navigator.onLine) { useOfflineMode(); return; }
    try {
      const response = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`version ${response.status}`);
      const remote = await response.json();
      if (remote.version !== APP_VERSION) {
        if (sessionStorage.getItem(UPDATE_ATTEMPT_KEY) === remote.version) {
          requireUpdate(remote.version);
        } else {
          updateAndReload(remote.version);
        }
        return;
      }
      allowOnline();
    } catch (error) {
      console.warn("online verification failed", error);
      useOfflineMode();
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`, {
      scope: "./",
      updateViaCache: "none"
    }).then(registration => registration.update()).catch(console.error);
  }
  window.addEventListener("online", verifyVersion);
  window.addEventListener("offline", useOfflineMode);
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstall = event;
    installBtn?.classList.add("show");
  });
  installBtn?.addEventListener("click", async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    installBtn.classList.remove("show");
  });
  verifyVersion();
})();
