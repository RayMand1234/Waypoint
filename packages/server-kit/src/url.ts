/** Strips trailing slashes from a configured base URL, so concatenating a path never doubles one. */
export const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '')
