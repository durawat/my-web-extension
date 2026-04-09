const REMOVE_VIDEO_ITEM_MENU_ID = "remove-youtube-video-item";
const BLOCK_CHANNEL_MENU_ID = "block-youtube-channel";
const YOUTUBE_URL_PATTERNS = ["*://www.youtube.com/*", "*://youtube.com/*"];

// In-memory store: channelHref → channelName (cleared if service worker is suspended)
const blockedChannels = new Map();

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    const removeAllError = chrome.runtime.lastError;

    if (removeAllError) {
      console.warn("Failed to reset context menus:", removeAllError.message);
    }

    chrome.contextMenus.create({
      id: REMOVE_VIDEO_ITEM_MENU_ID,
      title: "Remove video from page",
      contexts: ["all"],
      documentUrlPatterns: YOUTUBE_URL_PATTERNS,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to create remove menu:", chrome.runtime.lastError.message);
      }
    });

    chrome.contextMenus.create({
      id: BLOCK_CHANNEL_MENU_ID,
      title: "Block channel (hide all videos)",
      contexts: ["all"],
      documentUrlPatterns: YOUTUBE_URL_PATTERNS,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to create block menu:", chrome.runtime.lastError.message);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

function getChannelsArray() {
  return Array.from(blockedChannels.entries()).map(([href, name]) => ({ href, name }));
}

async function broadcastBlockedChannels() {
  const channels = getChannelsArray();
  const tabs = await chrome.tabs.query({ url: YOUTUBE_URL_PATTERNS });

  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, {
      type: "BLOCKED_CHANNELS_UPDATED",
      channels,
    }).catch(() => {});
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === REMOVE_VIDEO_ITEM_MENU_ID) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "REMOVE_CONTEXT_VIDEO_ITEM",
    }).catch((error) => {
      console.error("Failed to reach the YouTube content script:", error);
      return null;
    });

    if (!response?.ok) {
      console.info("Remove request was not applied.", response?.reason ?? "unknown");
    }
    return;
  }

  if (info.menuItemId === BLOCK_CHANNEL_MENU_ID) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "BLOCK_CONTEXT_CHANNEL",
    }).catch((error) => {
      console.error("Failed to reach the YouTube content script:", error);
      return null;
    });

    if (response?.ok) {
      blockedChannels.set(response.channelHref, response.channelName);
      broadcastBlockedChannels();
    } else {
      console.info("Block channel request was not applied.", response?.reason ?? "unknown");
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_BLOCKED_CHANNELS") {
    sendResponse({ channels: getChannelsArray() });
    return true;
  }

  if (message?.type === "UNBLOCK_CHANNEL") {
    blockedChannels.delete(message.channelHref);
    broadcastBlockedChannels();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "CLEAR_BLOCKED_CHANNELS") {
    blockedChannels.clear();
    broadcastBlockedChannels();
    sendResponse({ ok: true });
    return true;
  }
});
