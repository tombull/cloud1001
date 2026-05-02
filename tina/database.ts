import { createDatabase, createLocalDatabase } from '@tinacms/datalayer'

// Initialize the Database Adapter
// In local/static mode, use the simple local database (flat files, no Redis).
// In production CMS mode, dynamically import the Redis + GitHub providers
// to avoid bundling the 'bun' native module into static builds.
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

let db: ReturnType<typeof createLocalDatabase> | ReturnType<typeof createDatabase>

if (isLocal) {
  db = createLocalDatabase()
} else {
  const { GitHubProvider } = await import('tinacms-gitprovider-github')
  const { RedisLevel } = await import('../src/database/redis-level')

  db = createDatabase({
    gitProvider: new GitHubProvider({
      repo: process.env.GITHUB_REPO || 'tombull/cloud1001',
      owner: process.env.GITHUB_OWNER || 'tombull',
      token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN as string,
      branch: process.env.GITHUB_BRANCH || 'main',
    }),
    databaseAdapter: new RedisLevel({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      namespace: 'tina',
    }) as any,
  })
}

export default db
