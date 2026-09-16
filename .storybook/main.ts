import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  async viteFinal(config) {
    // The dts() plugin in vite.config.ts runs api-extractor against
    // dist/index.d.ts. Storybook builds to a temp dir without that file,
    // so the plugin crashes the build. Strip it here — it's only needed
    // for library builds, which run through `npm run build`.
    config.plugins = config.plugins?.filter((plugin) => {
      if (!plugin) return false
      const name = Array.isArray(plugin) ? plugin[0]?.name : plugin.name
      return name !== 'vite:dts'
    })
    return config
  }
}

export default config