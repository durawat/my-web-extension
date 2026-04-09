const list = document.getElementById("channel-list");
const clearAllBtn = document.getElementById("clear-all");

async function loadChannels() {
  const response = await chrome.runtime.sendMessage({ type: "GET_BLOCKED_CHANNELS" });
  renderChannels(response?.channels ?? []);
}

function renderChannels(channels) {
  list.innerHTML = "";

  if (!channels.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      "No channels blocked yet.\nRight-click a YouTube video and choose \u201CBlock channel\u201D.";
    list.appendChild(empty);
    clearAllBtn.disabled = true;
    return;
  }

  clearAllBtn.disabled = false;

  for (const { href, name } of channels) {
    const item = document.createElement("div");
    item.className = "channel-item";

    const nameEl = document.createElement("span");
    nameEl.className = "channel-name";
    nameEl.textContent = name;
    nameEl.title = name;

    const btn = document.createElement("button");
    btn.className = "unblock-btn";
    btn.textContent = "Unblock";
    btn.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ type: "UNBLOCK_CHANNEL", channelHref: href });
      loadChannels();
    });

    item.appendChild(nameEl);
    item.appendChild(btn);
    list.appendChild(item);
  }
}

clearAllBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_BLOCKED_CHANNELS" });
  loadChannels();
});

loadChannels();
