import { headers } from "next/headers"

/**
 * Gets the current path from request headers
 * @param defaultPath Default path to return if headers are not available
 * @returns The current path
 */
export function getCurrentPath(defaultPath = "/dashboard"): string {
  try {
    const headersList = headers()
    const url = headersList.get("x-url") || headersList.get("referer") || defaultPath
    return new URL(url, "http://localhost").pathname
  } catch (error) {
    console.error("Error getting current path:", error)
    return defaultPath
  }
}

/**
 * Creates a return URL parameter for redirects
 * @param path The path to encode as return URL
 * @returns URLSearchParams object with returnUrl parameter
 */
export function createReturnUrlParams(path: string): URLSearchParams {
  return new URLSearchParams({ returnUrl: path })
}

