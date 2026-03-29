const REMOVE_VIDEO_ITEM_MENU_ID = "remove-youtube-video-item";

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    const removeAllError = chrome.runtime.lastError;

    if (removeAllError) {
      console.warn("Failed to reset context menus:", removeAllError.message);
    }

    chrome.contextMenus.create({
      id: REMOVE_VIDEO_ITEM_MENU_ID,
      title: "Remove YouTube video item",
      contexts: ["all"],
      documentUrlPatterns: [
        "*://www.youtube.com/*",
        "*://youtube.com/*"
      ]
    }, () => {
      const createError = chrome.runtime.lastError;

      if (createError) {
        console.error("Failed to create context menu:", createError.message);
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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== REMOVE_VIDEO_ITEM_MENU_ID || !tab?.id) {
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "REMOVE_CONTEXT_VIDEO_ITEM"
  }).catch((error) => {
    console.error("Failed to reach the YouTube content script:", error);
    return null;
  });

  if (!response?.ok) {
    console.info("Remove request was not applied.", response?.reason ?? "unknown");
  }
});
