# My Web Extension

A lightweight browser extension project focused on removing YouTube video items from the current page with a right-click action.

## Overview

This repository now contains a minimal Chrome-compatible Manifest V3 extension. On supported YouTube pages, the extension tracks the last video item you right-clicked and adds a context-menu action that removes that item from the DOM.

The first version is intentionally simple:

- No build step
- No framework
- No persistence across reloads or navigation
- No server-side components

## Project Structure

- `manifest.json` defines the extension, permissions, and content script registration.
- `src\background.js` creates the extension context-menu entry and sends remove requests to the active YouTube tab.
- `src\content.js` detects the right-clicked YouTube video item, removes it from the page, and shows a small success or error toast.

## Supported YouTube Surfaces

The selector logic is aimed at common video-item renderers used in:

- Home feed
- Search results
- Subscriptions feed
- Related videos
- Playlist video lists

Because YouTube frequently changes its DOM, unsupported layouts may require selector updates in the future.

## Load the Extension Locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder: `C:\Users\User\my-websites\my-web-extension`.

## How to Use It

1. Open YouTube in Chrome.
2. Right-click a supported video item.
3. Click **Remove YouTube video item** from the context menu.
4. The selected item is removed from the current page DOM.

If you use the menu outside a supported video item, the extension shows a small on-page error toast instead of removing unrelated page content.

## Optional Trace Debug Logging

`src\content.js` does not use `localStorage`.

Trace logging is controlled by the in-memory flag `window.__REMOVE_YOUTUBE_VIDEO_ITEM_TRACE__` inside the content-script context. The current script initializes that flag with a hardcoded boolean default, and tracing only logs when the flag is `true`.

If you need to inspect the removal flow in DevTools, set:

- `window.__REMOVE_YOUTUBE_VIDEO_ITEM_TRACE__ = true`

Turn it back off with:

- `window.__REMOVE_YOUTUBE_VIDEO_ITEM_TRACE__ = false`

Trace logs are prefixed with `[RemoveYouTubeVideoItemTrace]` so they can be filtered easily in the console.

## Video Item Boundary Detection

The content script first finds the closest YouTube video link, then walks up the DOM and stops when it crosses a link boundary.

The current boundary rule allows up to `2` matching video links inside a removable item. This is intentional because many YouTube video cards include:

- one link on the thumbnail/image
- one link on the title, metadata, or description

If a parent contains more than `2` matching video links, the script treats that as a larger container and does not remove it.

## Validation

There is currently no checked-in build, lint, or test tooling in this repository.

Manual verification steps:

1. Load the unpacked extension in Chrome.
2. Visit YouTube home, search results, and a watch page with related videos.
3. Right-click several video items and confirm only the clicked item disappears.
4. Right-click outside a video item and confirm the page stays intact and an error toast appears.
5. Navigate within YouTube and confirm the action still works after client-side page transitions.
