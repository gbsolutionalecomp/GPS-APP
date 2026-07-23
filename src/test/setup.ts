import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Global fetch mock
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn()
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock Geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn((success) => {
    success({
      coords: { latitude: 19.4326, longitude: -99.1332, accuracy: 10, speed: 45 },
      timestamp: Date.now(),
    })
    return 1
  }),
  clearWatch: vi.fn(),
}
Object.defineProperty(globalThis.navigator, 'geolocation', { value: mockGeolocation, writable: true })
