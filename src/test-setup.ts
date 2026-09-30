import '@testing-library/jest-dom'
import { expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

expect.extend(axeMatchers)

function createMemoryStorage(): Storage {
  let store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store = new Map()
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

function patchStorage(name: 'localStorage' | 'sessionStorage'): void {
  if (typeof window === 'undefined') return

  try {
    const existing = (window as unknown as Record<string, unknown>)[name] as
      | Partial<Storage>
      | undefined

    const isWorking =
      existing &&
      typeof existing.clear === 'function' &&
      typeof existing.getItem === 'function' &&
      typeof existing.setItem === 'function'

    if (isWorking) return

    const storage = createMemoryStorage()
    const assignStorage = (target: object): void => {
      const record = target as Record<string, unknown>
      record[name] = storage
    }
    // Try each target independently — never let one failure abort the file.
    for (const target of [window, globalThis]) {
      try {
        Object.defineProperty(target, name, {
          value: storage,
          configurable: true,
          writable: true,
        })
      } catch {
        try {
          assignStorage(target)
        } catch {
          // Both attempts failed — nothing more we can do; let the test
          // surface its own error if this storage is essential.
        }
      }
    }
  } catch {
    // Absolute last resort: never let setup crash the test run.
  }
}

patchStorage('localStorage')
patchStorage('sessionStorage')
