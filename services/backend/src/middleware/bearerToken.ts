const BEARER = /^Bearer[ \t]+([\w-]+\.[\w-]+\.[\w-]+)[ \t]*$/;

/**
 * Pulls the compact JWT out of an `Authorization` header, or `undefined` if
 * the header is missing or not a bearer token.
 */
export const bearerToken = (header: string | undefined): string | undefined =>
  header === undefined ? undefined : BEARER.exec(header)?.[1];
