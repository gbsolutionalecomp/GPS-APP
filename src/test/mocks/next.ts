import { vi } from 'vitest'

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
}

export const mockSearchParams = new URLSearchParams()
