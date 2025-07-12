var chrome = require("chrome-framework");

function exposeJson(text) {
  console.info("[JSONViewer] Exposing JSON to the page.");
  chrome.runtime.sendMessage(
    { action: "EXPOSE_JSON", text: text },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[JSONViewer] Error exposing JSON:",
          chrome.runtime.lastError.message
        );
      } else if (response && response.error) {
        console.error("[JSONViewer] Error from background script:", response.error);
      } else {
        console.info("[JSONViewer] JSON exposed successfully.");
      }
    }
  );
}

module.exports = exposeJson;
