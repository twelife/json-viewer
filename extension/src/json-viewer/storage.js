
const defaults = require('./options/defaults');
const merge = require('./merge');

const OLD_NAMESPACE = "options";
const NAMESPACE = "v2.options";

module.exports = {
  save: function(obj) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [NAMESPACE]: obj }, resolve);
    });
  },

  load: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(NAMESPACE, (result) => {
        let options = result[NAMESPACE];
        this.restoreOldOptions(options).then((restoredOptions) => {
          options = restoredOptions ? restoredOptions : {};
          options.theme = options.theme || defaults.theme;
          options.addons = options.addons ? JSON.parse(options.addons) : {};
          options.addons = merge({}, defaults.addons, options.addons)
          options.structure = options.structure ? JSON.parse(options.structure) : defaults.structure;
          options.style = options.style && options.style.length > 0 ? options.style : defaults.style;
          resolve(options);
        });
      });
    });
  },

  restoreOldOptions: function(options) {
    return new Promise((resolve) => {
      if (options) {
        return resolve(options);
      }

      // This part is tricky because localStorage is not available in Service Workers.
      // We will assume for now that if new options are not found, we use defaults,
      // as a direct migration from localStorage is not feasible in the SW context.
      // A more robust solution would involve a content script to perform the migration.
      console.log("Old options from localStorage cannot be migrated in Service Worker.");
      resolve(null);
    });
  }
}
