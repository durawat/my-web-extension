const VIDEO_LINK_SELECTOR = ['a[href*="/watch"]', 'a[href*="/shorts/"]'].join(
  ", ",
);

const TOAST_ID = "youtube-video-item-remover-toast";
const TRACE_DEBUG_FLAG = "__REMOVE_YOUTUBE_VIDEO_ITEM_TRACE__";
const TRACE_DEBUG_PREFIX = "[RemoveYouTubeVideoItemTrace]";

let lastContextMenuState = null;
let toastTimeoutId = null;

const traceDebug = (() => {
  if (typeof window[TRACE_DEBUG_FLAG] !== "boolean") {
    window[TRACE_DEBUG_FLAG] = false;
  }

  if (window[TRACE_DEBUG_FLAG] !== true) {
    return () => {};
  }

  return (step, details = {}) => {
    console.log(`${TRACE_DEBUG_PREFIX} ${step}`, details);
  };
})();

function isElement(value) {
  return value instanceof Element;
}

function findClosestVideoLink(node) {
  traceDebug("findClosestVideoLink:start", { node });
  let current = isElement(node) ? node : (node?.parentElement ?? null);

  while (current) {
    if (current.matches(VIDEO_LINK_SELECTOR)) {
      traceDebug("findClosestVideoLink:found-direct", { current });
      return current;
    }

    current = current.parentElement;
  }

  const fallbackRoot = isElement(node) ? node : (node?.parentElement ?? null);
  const videoLink = getVideoLink(fallbackRoot);
  traceDebug("findClosestVideoLink:fallback", { fallbackRoot, videoLink });
  return videoLink;
}

function getVideoLink(element) {
  traceDebug("getVideoLink:start", { element });

  if (!isElement(element)) {
    traceDebug("getVideoLink:non-element", { element });
    return null;
  }

  const videoLink = element.matches(VIDEO_LINK_SELECTOR)
    ? element
    : element.querySelector(VIDEO_LINK_SELECTOR);

  traceDebug("getVideoLink:done", { element, videoLink });
  return videoLink;
}

function getVideoLinkCount(element) {
  if (!isElement(element)) {
    traceDebug("getVideoLinkCount:non-element", { element });
    return 0;
  }
  traceDebug("getVideoLinkCount:start", {
    element,
    videoLinksWithHref: Array.from(
      element.querySelectorAll(VIDEO_LINK_SELECTOR),
    ).filter((link) => link.href),
  });
  const count = element.querySelectorAll(VIDEO_LINK_SELECTOR).length;
  traceDebug("getVideoLinkCount:done", { element, count });
  return count;
}

function findVideoItemFromNode(node) {
  traceDebug("findVideoItemFromNode:start", { node });
  const videoLink = findClosestVideoLink(node);

  if (!videoLink) {
    traceDebug("findVideoItemFromNode:no-video-link", { node });
    return null;
  }

  let current = videoLink.parentElement;
  let removableItem = videoLink;

  while (current) {
    const videoLinkCount = getVideoLinkCount(current);
    traceDebug("findVideoItemFromNode:check-current", {
      current,
      videoLinkCount,
    });

    if (!current.contains(videoLink) || videoLinkCount > 2) {
      traceDebug("findVideoItemFromNode:hit-link-boundary", {
        current,
        videoLinkCount,
        removableItem,
        videoLink,
      });
      break;
    }

    removableItem = current;
    current = current.parentElement;
  }

  traceDebug("findVideoItemFromNode:return-item", { removableItem, videoLink });
  return removableItem;
}

function clearTrackedContext() {
  traceDebug("clearTrackedContext", { lastContextMenuState });
  lastContextMenuState = null;
}

function trackContextMenuTarget(event) {
  traceDebug("trackContextMenuTarget:start", { eventTarget: event.target });
  const removableItem = findVideoItemFromNode(event.target);

  lastContextMenuState = {
    pageUrl: window.location.href,
    targetNode: isElement(event.target)
      ? event.target
      : (event.target?.parentElement ?? null),
    removableItem,
  };

  traceDebug("trackContextMenuTarget:done", { lastContextMenuState });
}

function ensureToast() {
  traceDebug("ensureToast:start");
  let toast = document.getElementById(TOAST_ID);

  if (toast) {
    traceDebug("ensureToast:reuse", { toast });
    return toast;
  }

  toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.style.position = "fixed";
  toast.style.right = "16px";
  toast.style.bottom = "16px";
  toast.style.zIndex = "2147483647";
  toast.style.maxWidth = "320px";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.fontSize = "13px";
  toast.style.lineHeight = "1.4";
  toast.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.3)";
  toast.style.opacity = "0";
  toast.style.pointerEvents = "none";
  toast.style.transition = "opacity 120ms ease";
  document.documentElement.appendChild(toast);

  traceDebug("ensureToast:created", { toast });
  return toast;
}

function showToast(message, tone) {
  traceDebug("showToast:start", { message, tone });
  const toast = ensureToast();
  const palette =
    tone === "error"
      ? { background: "#7f1d1d", color: "#ffffff" }
      : { background: "#065f46", color: "#ffffff" };

  toast.textContent = message;
  toast.style.background = palette.background;
  toast.style.color = palette.color;
  toast.style.opacity = "1";

  if (toastTimeoutId !== null) {
    window.clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = window.setTimeout(() => {
    traceDebug("showToast:hide", { message, tone });
    toast.style.opacity = "0";
  }, 2200);

  traceDebug("showToast:done", { toast, message, tone });
}

function resolveTrackedVideoItem() {
  traceDebug("resolveTrackedVideoItem:start", { lastContextMenuState });
  let refreshedItem = null;

  if (!lastContextMenuState) {
    traceDebug("resolveTrackedVideoItem:no-state");
    return null;
  }

  if (lastContextMenuState.pageUrl !== window.location.href) {
    traceDebug("resolveTrackedVideoItem:page-changed", {
      trackedPageUrl: lastContextMenuState.pageUrl,
      currentPageUrl: window.location.href,
    });
    clearTrackedContext();
    return null;
  }

  if (lastContextMenuState.removableItem?.isConnected) {
    traceDebug("resolveTrackedVideoItem:return-connected", {
      removableItem: lastContextMenuState.removableItem,
    });
    return lastContextMenuState.removableItem;
  }

  if (lastContextMenuState.targetNode?.isConnected) {
    traceDebug("resolveTrackedVideoItem:refresh-from-target", {
      targetNode: lastContextMenuState.targetNode,
    });
    refreshedItem = findVideoItemFromNode(lastContextMenuState.targetNode);

    if (refreshedItem) {
      lastContextMenuState.removableItem = refreshedItem;
      traceDebug("resolveTrackedVideoItem:return-refreshed", { refreshedItem });
      return refreshedItem;
    }
  }

  traceDebug("resolveTrackedVideoItem:not-found");
  clearTrackedContext();
  return null;
}

function removeTrackedVideoItem() {
  traceDebug("removeTrackedVideoItem:start");
  const videoItem = resolveTrackedVideoItem();

  if (!videoItem) {
    traceDebug("removeTrackedVideoItem:missing-video-item");
    showToast("Right-click a supported YouTube video item first.", "error");
    return { ok: false, reason: "no-video-item" };
  }

  traceDebug("removeTrackedVideoItem:remove", { videoItem });
  videoItem.remove();
  clearTrackedContext();
  showToast("Removed the YouTube video item from the page.", "success");

  traceDebug("removeTrackedVideoItem:done");
  return { ok: true };
}

document.addEventListener("contextmenu", trackContextMenuTarget, true);
window.addEventListener("yt-navigate-start", clearTrackedContext, true);
window.addEventListener("popstate", clearTrackedContext, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  traceDebug("runtimeMessage:received", { message, sender });

  if (message?.type !== "REMOVE_CONTEXT_VIDEO_ITEM") {
    traceDebug("runtimeMessage:ignored", { messageType: message?.type });
    return;
  }

  traceDebug("runtimeMessage:remove-request");
  sendResponse(removeTrackedVideoItem());
});
