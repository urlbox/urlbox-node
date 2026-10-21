import qs from "qs";
import { createHmac } from "node:crypto";
import type { RenderOptions } from "./types.js";

const DEFAULT_OPTIONS = {
  format: "png",
};

export const validateOptions = (options: RenderOptions) => {
  if (!options) {
    throw new Error("no options object passed");
  }
  if (options.url && typeof options.url !== "string") {
    throw new Error(
      "url should be of type string (something like www.google.com)",
    );
  }
  if (!options.url && !options.html) {
    throw new Error("url or html option is required");
  }
  return Object.assign({}, DEFAULT_OPTIONS, options);
};

const toQueryString = (options: RenderOptions) => {
  const filter = (key: string, value: any) => {
    if (key === "format" || key === "token" || !value) {
      return;
    }
    return value;
  };

  return qs.stringify(options, {
    filter,
    arrayFormat: "repeat",
  });
};

const generateToken = (queryString: string, secret: string): string =>
  createHmac("sha256", secret).update(queryString).digest("hex");

/**
 * Builds a render link: `${prefix}${key}/${token}/${format}?${query}`, or
 * without the token when no secret is given.
 */
export const buildRenderLink = (
  prefix: string,
  key: string,
  options: RenderOptions,
  secret?: string,
): string => {
  const validated = validateOptions(options);
  const query = toQueryString(validated);
  const format = validated.format || "png";
  if (secret === undefined) {
    return `${prefix}${key}/${format}?${query}`;
  }
  return `${prefix}${key}/${generateToken(query, secret)}/${format}?${query}`;
};
