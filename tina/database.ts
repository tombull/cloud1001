import { createDatabase, createLocalDatabase } from '@tinacms/datalayer'
import { GitHubProvider } from 'tinacms-gitprovider-github'
import { RedisLevel } from '../src/database/redis-level'

// Initialize the Database Adapter
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
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
