// @ts-nocheck
import {
  AbstractIterator,
  AbstractLevel,
} from 'abstract-level'
import type {
  AbstractDatabaseOptions,
  AbstractOpenOptions,
} from 'abstract-level'
import type { NextCallback } from 'abstract-level/types/abstract-iterator'
import ModuleError from 'module-error'
import { RedisClient } from 'bun'

const DEFAULT_LIMIT = 50

const encode = (value: any) => encodeURIComponent(value)
const decode = (value: string) => decodeURIComponent(value)

const encodeFilter = (filter: string) => {
  if (filter.endsWith('\uFFFF')) {
    return encodeURIComponent(filter.slice(0, -1)) + '\uFFFF'
  }
  return encodeURIComponent(filter)
}

export type RedisLevelOptions<K, V> = {
  redis: string | RedisClient
  debug?: boolean
  namespace?: string
} & AbstractDatabaseOptions<K, V>

declare interface BatchPutOperation {
  type: 'put'
  key: string
  value: string
}

declare interface BatchDelOperation {
  type: 'del'
  key: string
}

declare type BatchOperation = BatchPutOperation | BatchDelOperation

declare interface ClearOptions<KDefault> {
  gt?: KDefault
  gte?: KDefault
  lt?: KDefault
  lte?: KDefault
  limit: number
  reverse: boolean
  keyEncoding: string
  valueEncoding: string
}

declare interface IteratorOptions<KDefault> {
  offset: number
  limit: number
  keyEncoding: string
  valueEncoding: string
  reverse: boolean
  keys: boolean
  values: boolean
  gt?: KDefault
  gte?: KDefault
  lt?: KDefault
  lte?: KDefault
  debug: boolean
}

const buildZRangeArgs = (options: IteratorOptions<any>) => {
  const lowerBound = options.gte !== undefined ? options.gte : options.gt !== undefined ? options.gt : '-'
  const exclusiveLowerBound = options.gte === undefined && options.gt !== undefined
  const upperBound = options.lte !== undefined ? options.lte : options.lt !== undefined ? options.lt : '+'
  const exclusiveUpperBound = options.lte === undefined && options.lt !== undefined
  const noLowerBound = lowerBound === '-' || lowerBound === '+'
  const noUpperBound = upperBound === '-' || upperBound === '+'
  
  const encodedUpperBound = encodeFilter(upperBound)
  const encodedLowerBound = encodeFilter(lowerBound)

  let min = '', max = ''
  
  if (options.reverse) {
      max = noUpperBound ? '+' : exclusiveUpperBound ? `(${encodedUpperBound}` : `[${encodedUpperBound}`
      min = noLowerBound ? '-' : exclusiveLowerBound ? `(${encodedLowerBound}` : `[${encodedLowerBound}`
  } else {
      min = noLowerBound ? '-' : exclusiveLowerBound ? `(${encodedLowerBound}` : `[${encodedLowerBound}`
      max = noUpperBound ? '+' : exclusiveUpperBound ? `(${encodedUpperBound}` : `[${encodedUpperBound}`
  }

  const args: any[] = [min, max, 'BYLEX']
  if (options.reverse) args.push('REV')
  if (options.limit !== Infinity) {
      args.push('LIMIT', options.offset, options.limit)
  }
  return args
}

class RedisIterator<KDefault, VDefault> extends AbstractIterator<
  RedisLevel<KDefault, VDefault>,
  KDefault,
  VDefault
> {
  private redis: RedisClient
  private options: IteratorOptions<KDefault>
  private offset: number
  private readonly resultLimit: number
  private results: any[]
  private finished: boolean
  private debug: boolean

  constructor(db: RedisLevel<KDefault, VDefault>, options: IteratorOptions<KDefault>) {
    super(db, options)
    this.redis = db.redis
    this.options = options
    this.resultLimit = options.limit !== Infinity && options.limit >= 0 ? options.limit : DEFAULT_LIMIT
    this.offset = options.offset || 0
    this.results = []
    this.finished = false
    this.debug = options.debug || false
  }

  async _next(callback: NextCallback<KDefault, VDefault>) {
    if (this.finished) return this.db.nextTick(callback, null)

    if (this.results.length === 0) {
      const getKeys = this.options.keys
      const getValues = this.options.values
      const args = buildZRangeArgs({ ...this.options, offset: this.offset, limit: this.resultLimit })
      
      let keys: string[] = []
      try {
        keys = (await this.redis.zrange(this.db.zKey, ...args)) as string[]
      } catch (e) {
        console.error(e)
      }

      if (!keys || keys.length === 0) {
        this.finished = true
        return this.db.nextTick(callback, null)
      }

      let values: (string | null)[] = []
      if (getValues) {
         values = await this.redis.hmget(this.db.hKey, ...keys) as (string | null)[]
      }

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const decodedKey = decode(key)
        const result: any[] = []
        result.push(getKeys ? decodedKey : undefined)
        if (getValues) {
          result.push(values[i] !== null && values[i] !== undefined ? decode(String(values[i])) : undefined)
        }
        this.results.push(result)
      }
      this.offset += this.resultLimit
    }

    const result = this.results.shift()
    return this.db.nextTick(callback, null, ...result)
  }
}

export class RedisLevel<KDefault = string, VDefault = string> extends AbstractLevel<string, KDefault, VDefault> {
  public readonly redis: RedisClient
  public readonly hKey: string
  public readonly zKey: string
  private readonly debug: boolean

  constructor(options: RedisLevelOptions<KDefault, VDefault>) {
    super({ encodings: { utf8: true }, snapshots: false }, options)
    this.redis = typeof options.redis === 'string' ? new RedisClient(options.redis) : options.redis
    const namespace = options.namespace || 'level'
    this.hKey = `${namespace}:h`
    this.zKey = `${namespace}:z`
    this.debug = options.debug || false
  }

  get type() {
    return 'bun-redis'
  }

  async _open(options: AbstractOpenOptions, callback: (error?: Error) => void) {
    this.nextTick(callback)
  }

  async _close(callback: (error?: Error) => void) {
    if ((this.redis as any).quit) {
      await (this.redis as any).quit()
    }
    this.nextTick(callback)
  }

  async _get(key: string, options: { keyEncoding: 'utf8', valueEncoding: 'utf8' }, callback: (error?: Error, value?: string) => void) {
    const data = await this.redis.hget(this.hKey, encode(key))
    if (data !== null) {
      return this.nextTick(callback, null, decode(data))
    } else {
      return this.nextTick(
        callback,
        new ModuleError(`Key '${key}' was not found`, {
          code: 'LEVEL_NOT_FOUND',
        })
      )
    }
  }

  async _getMany(keys: string[], options: { keyEncoding: 'utf8', valueEncoding: 'utf8 '}, callback: (error?: Error, value?: string) => void) {
    try {
      const data = await this.redis.hmget(this.hKey, ...keys.map((key) => encode(key))) as (string | null)[]
      if (data) {
        return this.nextTick(callback, null, keys.map((_, i) => data[i] ? decode(String(data[i])) : undefined))
      } else {
        return this.nextTick(callback, null, keys.map((key) => undefined))
      }
    } catch (e) {
      return this.nextTick(
        callback,
        new ModuleError(`Unexpected error in getMany`, {
          code: 'LEVEL_NOT_FOUND',
        })
      )
    }
  }

  async _put(key: string, value: string, options: { keyEncoding: 'utf8', valueEncoding: 'utf8'}, callback: (error?: Error) => void) {
    await Promise.all([
      this.redis.hset(this.hKey, encode(key), encode(value)),
      this.redis.zadd(this.zKey, 0, encode(key))
    ])
    this.nextTick(callback)
  }

  async _del(key: Buffer, options: any, callback: (error?: Error) => void) {
    await Promise.all([
      this.redis.hdel(this.hKey, encode(key)),
      this.redis.zrem(this.zKey, encode(key))
    ])
    this.nextTick(callback)
  }

  async _batch(batch: BatchOperation[], options: any, callback: (error?: Error) => void): Promise<void> {
    if (batch.length === 0) return this.nextTick(callback)
    
    const promises = []
    
    for (const op of batch) {
      if (op.type === 'put') {
        promises.push(this.redis.hset(this.hKey, encode(op.key), encode(op.value)))
        promises.push(this.redis.zadd(this.zKey, 0, encode(op.key)))
      } else if (op.type === 'del') {
        promises.push(this.redis.hdel(this.hKey, encode(op.key)))
        promises.push(this.redis.zrem(this.zKey, encode(op.key)))
      }
    }
    
    await Promise.all(promises)
    this.nextTick(callback)
  }

  async _clear(options: ClearOptions<KDefault>, callback: (error?: Error) => void): Promise<void> {
    let limit = options.limit !== Infinity && options.limit >= 0 ? options.limit : Infinity
    let offset = 0
    const fetchLimit = 100
    let total = 0
    while (true) {
      const args = buildZRangeArgs({ ...options, offset, limit: fetchLimit, debug: false, keys: true, values: false })
      let keys: string[] = []
      try {
        keys = (await this.redis.zrange(this.zKey, ...args)) as string[]
      } catch (e) {
        console.error(e)
      }
      if (!keys || keys.length === 0) break
      if (keys.length + total > limit) {
        keys = keys.slice(0, limit - total)
      }
      if (keys.length > 0) {
         await Promise.all([
           this.redis.hdel(this.hKey, ...keys),
           this.redis.zrem(this.zKey, ...keys)
         ])
      }
      // offset stays at same rank because ZREM shifts the remaining items down
      total += keys.length
      if (total >= limit) break
    }
    this.nextTick(callback)
  }

  _iterator(
    options: IteratorOptions<KDefault>
  ): RedisIterator<KDefault, VDefault> {
    return new RedisIterator<KDefault, VDefault>(this, { ...options, debug: this.debug })
  }
}
