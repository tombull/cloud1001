/**
 * Static build smoke tests
 *
 * These tests run against the `dist/` output of a static Astro build
 * (ENABLE_CMS unset). They verify that the build produces a structurally
 * correct static site -- catching breakage from package upgrades, broken
 * content collections, or missing pages.
 *
 * Prerequisites:
 *   bun run test:build   (runs the static build)
 *   bun test             (runs these tests)
 */

import { describe, test, expect, beforeAll } from 'bun:test'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Glob } from 'bun'

const DIST = join(import.meta.dir, '..', 'dist')

/** Read a file from dist/ as a string */
async function readDist(path: string): Promise<string> {
  return Bun.file(join(DIST, path)).text()
}

/** Check if a path exists in dist/ */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(join(DIST, path))
    return true
  } catch {
    return false
  }
}

/** Collect glob matches under dist/ */
async function globDist(pattern: string): Promise<string[]> {
  const glob = new Glob(pattern)
  const results: string[] = []
  for await (const match of glob.scan({ cwd: DIST })) {
    results.push(match)
  }
  return results
}

// ---------------------------------------------------------------------------
// Sanity check: dist/ exists
// ---------------------------------------------------------------------------

beforeAll(async () => {
  const distExists = await exists('')
  if (!distExists) {
    throw new Error(
      'dist/ directory not found. Run `bun run test:build` before running tests.',
    )
  }
})

// ---------------------------------------------------------------------------
// Core pages exist
// ---------------------------------------------------------------------------

describe('core pages', () => {
  test('homepage exists', async () => {
    expect(await exists('index.html')).toBe(true)
  })

  test('about page exists', async () => {
    expect(await exists('about/index.html')).toBe(true)
  })

  test('archive index exists', async () => {
    expect(await exists('archive/index.html')).toBe(true)
  })

  test('tags index exists', async () => {
    expect(await exists('tags/index.html')).toBe(true)
  })

  test('404 page exists', async () => {
    expect(await exists('404.html')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Blog content
// ---------------------------------------------------------------------------

describe('blog content', () => {
  test('at least one blog post page exists', async () => {
    const posts = await globDist('archive/*/index.html')
    expect(posts.length).toBeGreaterThanOrEqual(1)
  })

  test('at least one tag page exists', async () => {
    const tags = await globDist('tags/*/index.html')
    expect(tags.length).toBeGreaterThanOrEqual(1)
  })

  test('blog post pages contain article content', async () => {
    const posts = await globDist('archive/*/index.html')
    // Check the first post has meaningful content
    const html = await readDist(posts[0])
    expect(html).toContain('<article')
  })

  test('archive index links to blog posts', async () => {
    const html = await readDist('archive/index.html')
    expect(html).toContain('/archive/')
    // Should contain at least one link to a post
    expect(html).toMatch(/href=["'][^"']*\/archive\/[^"']+["']/)
  })
})

// ---------------------------------------------------------------------------
// HTML structure
// ---------------------------------------------------------------------------

describe('HTML structure', () => {
  test('homepage has valid HTML skeleton', async () => {
    const html = await readDist('index.html')
    expect(html).toContain('<html')
    expect(html).toContain('<head')
    expect(html).toContain('<body')
    expect(html).toContain('</html>')
  })

  test('homepage has a title', async () => {
    const html = await readDist('index.html')
    expect(html).toMatch(/<title>[^<]+<\/title>/)
  })

  test('homepage links to archive', async () => {
    const html = await readDist('index.html')
    expect(html).toMatch(/href=["'][^"']*\/archive\/?["']/)
  })

  test('no pages are empty renders', async () => {
    const htmlFiles = await globDist('**/*.html')
    const tooSmall: string[] = []

    for (const file of htmlFiles) {
      const { size } = await stat(join(DIST, file))
      if (size < 500) {
        tooSmall.push(`${file} (${size} bytes)`)
      }
    }

    expect(tooSmall).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Feeds and metadata
// ---------------------------------------------------------------------------

describe('feeds and metadata', () => {
  test('RSS feed exists and is valid', async () => {
    expect(await exists('rss.xml')).toBe(true)
    const rss = await readDist('rss.xml')
    expect(rss).toContain('<rss')
    expect(rss).toContain('<item>')
  })

  test('robots.txt exists and references sitemap', async () => {
    expect(await exists('robots.txt')).toBe(true)
    const robots = await readDist('robots.txt')
    expect(robots.toLowerCase()).toContain('sitemap:')
  })

  test('sitemap exists', async () => {
    const hasSitemap =
      (await exists('sitemap-index.xml')) || (await exists('sitemap.xml'))
    expect(hasSitemap).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Static assets
// ---------------------------------------------------------------------------

describe('static assets', () => {
  test('CSS files are generated', async () => {
    const cssFiles = await globDist('_astro/*.css')
    expect(cssFiles.length).toBeGreaterThanOrEqual(1)
  })

  test('favicon exists', async () => {
    const hasFavicon =
      (await exists('favicon.ico')) || (await exists('favicon.svg'))
    expect(hasFavicon).toBe(true)
  })

  test('fonts directory exists', async () => {
    expect(await exists('fonts')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CMS routes are stripped in static build
// ---------------------------------------------------------------------------

describe('CMS routes stripped', () => {
  test('no TinaCMS API routes in output', async () => {
    const tinaRoutes = await globDist('api/tina/**/*')
    expect(tinaRoutes).toEqual([])
  })

  test('no server-side SSR bundles in output', async () => {
    // In static mode, there should be no server/ directory with SSR entry points
    expect(await exists('server/entry.mjs')).toBe(false)
  })
})
