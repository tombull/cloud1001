import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
// ... rest of imports
import rehypeExpressiveCode from 'rehype-expressive-code'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

import tailwindcss from '@tailwindcss/vite'

const cmsEnabled = process.env.ENABLE_CMS === 'true'

export default defineConfig({
  output: cmsEnabled ? 'server' : 'static',
  adapter: cmsEnabled ? node({ mode: 'standalone' }) : undefined,
  site: 'https://cloud1001.com',
  ...(cmsEnabled && {
    redirects: {
      '/admin': '/admin/index.html',
    },
  }),
  integrations: [mdx(), react(), sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['bun', '@tinacms/datalayer', 'tinacms-gitprovider-github', 'abstract-level']
    },
    build: {
      rollupOptions: {
        external: ['bun']
      }
    }
  },
  server: {
    port: 1234,
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['nofollow', 'noreferrer', 'noopener'],
        },
      ],
      rehypeHeadingIds,
      rehypeKatex,
      [
        rehypeExpressiveCode,
        {
          themes: ['github-dark'],
          plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
          useDarkModeMediaQuery: false,
          defaultProps: {
            wrap: true,
            collapseStyle: 'collapsible-auto',
            overridesByLang: {
              'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
                {
                  showLineNumbers: false,
                },
            },
          },
          styleOverrides: {
            codeFontSize: '0.75rem',
            borderColor: 'color-mix(in srgb, var(--outline-variant) 20%, transparent)',
            codeFontFamily: 'var(--font-mono)',
            codeBackground:
              'color-mix(in srgb, var(--surface-container-low) 80%, transparent)',
            frames: {
              editorActiveTabForeground: 'var(--on-surface-variant)',
              editorActiveTabBackground:
                'color-mix(in srgb, var(--surface-container-low) 80%, transparent)',
              editorActiveTabIndicatorBottomColor: 'transparent',
              editorActiveTabIndicatorTopColor: 'transparent',
              editorTabBorderRadius: '0',
              editorTabBarBackground: 'transparent',
              editorTabBarBorderBottomColor: 'transparent',
              frameBoxShadowCssValue: 'none',
              terminalBackground:
                'color-mix(in srgb, var(--surface-container-low) 80%, transparent)',
              terminalTitlebarBackground: 'transparent',
              terminalTitlebarBorderBottomColor: 'transparent',
              terminalTitlebarForeground: 'var(--on-surface-variant)',
            },
            lineNumbers: {
              foreground: 'var(--on-surface-variant)',
            },
            uiFontFamily: 'var(--font-sans)',
          },
        },
      ],
      [
        rehypeShiki,
        {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          inline: 'tailing-curly-colon',
        },
      ],
    ],
    remarkPlugins: [remarkMath, remarkEmoji],
  },
})
