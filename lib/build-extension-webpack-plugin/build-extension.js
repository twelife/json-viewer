const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const BuildPaths = require('../build-paths');

function copyTheme(darkness, list, compilation) {
  const paths = [];
  if (!list) {
    compilation.warnings.push(new Error(`No themes found for darkness: ${darkness}`));
    return paths;
  }
  list.forEach(function(theme) {
    const themeCSS = theme.replace(/\.js$/, '.css');
    const themeCSSPath = 'themes/' + darkness + '/' + theme + '.css';
    const themePath = path.join(BuildPaths.EXTENSION, 'assets/' + theme);

    if (fs.existsSync(themePath + '.js') && fs.existsSync(themePath + '.css')) {
      fs.removeSync(themePath + '.js');
      fs.copySync(themePath + '.css', path.join(BuildPaths.EXTENSION, themeCSSPath));
      console.log('  copied: ' + themeCSSPath);
      paths.push(themeCSSPath);
    } else {
      compilation.errors.push(new Error('  fail to copy theme asset: ' + (themePath + '.css')));
    }
  });

  return paths;
}

class BuildExtension {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.done.tap('BuildExtension', (stats) => {
      console.log('BuildExtension plugin: execution started.');

      console.log('-> copying static files (icons, pages)');
      fs.copySync(path.join(BuildPaths.SRC_ROOT, 'icons'), path.join(BuildPaths.EXTENSION, 'icons'));
      fs.copySync(path.join(BuildPaths.SRC_ROOT, 'pages'), path.join(BuildPaths.EXTENSION, 'pages'));
      console.log('-> static files copied.');

      console.log('-> copying themes');
      const availableThemes = this.options.themes;
      if (!availableThemes) {
        stats.compilation.errors.push(new Error('Themes not defined in BuildExtension options.'));
        return;
      }

      const themesCSSPaths = copyTheme('light', availableThemes.light, stats.compilation).
                           concat(copyTheme('dark', availableThemes.dark, stats.compilation));
      console.log('-> themes copied.');

      let manifest;
      const manifestDestPath = path.join(BuildPaths.EXTENSION, 'manifest.json');
      try {
        manifest = fs.readJSONSync(manifestDestPath);
      } catch (e) {
        console.log('Manifest not found in build destination, reading from source.');
        manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
      }

      if (!Array.isArray(manifest.web_accessible_resources) || manifest.web_accessible_resources.length === 0) {
          manifest.web_accessible_resources = [{ resources: [], matches: ["<all_urls>"] }];
      }

      let resourceObj = manifest.web_accessible_resources.find(r => r.matches && r.matches.includes('<all_urls>'));
      if (!resourceObj) {
          resourceObj = { resources: [], matches: ['<all_urls>'] };
          manifest.web_accessible_resources.push(resourceObj);
      }

      if (!Array.isArray(resourceObj.resources)) {
        resourceObj.resources = [];
      }
      const existingResources = new Set(resourceObj.resources);
      themesCSSPaths.forEach(p => existingResources.add(p));
      resourceObj.resources = Array.from(existingResources);

      if (process.env.NODE_ENV !== 'production') {
        console.log('-> dev version, appending suffix to name.');
        if (!manifest.name.endsWith(' - dev')) {
            manifest.name += ' - dev';
        }
      }

      console.log('-> writing final manifest.json');
      fs.outputJSONSync(manifestDestPath, manifest, { spaces: 2 });
      console.log('BuildExtension plugin: execution finished.');
    });
  }
}

module.exports = BuildExtension;