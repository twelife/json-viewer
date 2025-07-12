var chrome = require('chrome-framework');
var Storage = require('./json-viewer/storage');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_OPTIONS") {
    Storage.load()
      .then(options => {
        sendResponse({ err: null, value: options });
      })
      .catch(error => {
        console.error('[JSONViewer] error getting options: ' + error.message, error);
        sendResponse({ err: error.message });
      });
    return true; // Indicates that the response is sent asynchronously.
  } else if (request.action === "EXPOSE_JSON") {
    const tabId = sender.tab.id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (jsonText) => {
        const script = document.createElement("script");
        script.innerHTML = `window.json = ${jsonText};`;
        document.head.appendChild(script);
      },
      args: [request.text],
      world: "MAIN"
    })
    .then(() => sendResponse({ success: true }))
    .catch(err => {
      console.error("Failed to inject script: ", err);
      sendResponse({ error: err.message });
    });
    return true;
  }
});

// Manually include omnibox.js content here
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  console.log('[JSONViewer] inputChanged: ' + text);
  suggest([
    {
      content: "Format JSON",
      description: "(Format JSON) Open a page with json highlighted"
    },
    {
      content: "Scratch pad",
      description: "(Scratch pad) Area to write and format/highlight JSON"
    }
  ]);
});

chrome.omnibox.onInputEntered.addListener(function(text) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var omniboxUrl = chrome.runtime.getURL("/pages/omnibox.html");
    var path = /scratch pad/i.test(text) ? "?scratch-page=true" : "?json=" + encodeURIComponent(text);
    var url = omniboxUrl + path;
    console.log("[JSONViewer] Opening: " + url);

    chrome.tabs.update(tabs[0].id, {url: url});
  });
});

