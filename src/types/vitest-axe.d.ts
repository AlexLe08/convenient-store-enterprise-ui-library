// vitest-axe@0.1.0 ships a broken `matchers.d.ts` that wraps its re-exports
// in `export type *`, so TS can't resolve the AxeMatchers interface from the
// package. We declare the matcher shape manually instead of importing it.
//
// The runtime registration lives in src/test-setup.ts via
// `expect.extend(axeMatchers)` — this file only handles the types.
//
// `export {}` is required: without it, this file is treated as a global
// script, and `declare module 'vitest'` becomes an ambient module
// declaration that REPLACES the vitest module instead of augmenting it.
//
// See: https://github.com/chaance/vitest-axe/issues/10

interface AxeMatchers<R = unknown> {
  toHaveNoViolations(): R
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

export {}
