import { NextResponse } from 'next/server'

export interface APIResponseData<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export function apiSuccess<T>(data: T, status = 200, headers?: Record<string, string>): NextResponse<APIResponseData<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status, headers }
  )
}

export function apiError(message: string, status = 400, headers?: Record<string, string>): NextResponse<APIResponseData<never>> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status, headers }
  )
}
