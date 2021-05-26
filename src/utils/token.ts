import { FastifyRequest } from "fastify";

/**
 * The Parsed Auth Header, output of parseAuthHeader(req).
 */
type ParsedAuthHeader<TPrefix extends string = string> = [TPrefix, string];

/**
 * Parses the `Authorization` header. This does not verify the validity of the key.
 *
 * @param req Either the FastifyRequest instance or the header string itself
 */
const parseAuthHeader = <TPrefix extends string = string>(
  req?: FastifyRequest | string,
  allowedPrefixes?: string[]
): ParsedAuthHeader<TPrefix> => {
  const rawHeader = typeof req === "object" ? req.headers.authorization : req;

  // Header is not present, fail
  if (!rawHeader)
    throw new Error("authorization header is not present or invalid");

  const splitHeader = rawHeader.split(" ");

  // Header is not in the correct `<prefix> <key>` format, fail
  if (splitHeader.length !== 2)
    throw new Error("auth header value is in invalid format");

  // Header prefix is not a valid one, fail
  if (allowedPrefixes && !allowedPrefixes.includes(splitHeader[0]))
    throw new Error("invalid authorization prefix used");

  return [splitHeader[0] as TPrefix, splitHeader[1]];
};

/**
 * Wrapper around parseAuthHeader that doesn't throw an exception but instead returns null.
 *
 * @param req The request
 * @returns The parsed header or null.
 */
const parseAuthHeaderSilent = <TPrefix extends string = string>(
  req?: FastifyRequest | string,
  allowedPrefixes?: string[]
): ParsedAuthHeader<TPrefix> | null => {
  try {
    return parseAuthHeader(req, allowedPrefixes);
  } catch {
    return null;
  }
};

export { parseAuthHeader, parseAuthHeaderSilent, ParsedAuthHeader };
