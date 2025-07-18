// forge.config.js

// Explicitly require the plugin at the top. This can help resolve lookup issues.
require('@electron-forge/plugin-vite');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` specifies all the entry points Vite should build
        build: [
          {
            // First entry: The Main process
            entry: 'src/main.ts',
            config: 'vite.main.config.mjs', // A specific config for the main process
          },
          {
            // Second entry: The Renderer process (your React app)
            entry: 'frontend/index.html',
            name: 'main_window',
          },
        ],
        // `renderer` specifies what to do for the dev server
        renderer: [
          {
            name: 'main_window',
            config: 'frontend/vite.config.js',
          },
        ],
      },
    },
  ],
};
