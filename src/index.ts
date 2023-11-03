"use strict";
import qs from "qs";
import hmacSha256 from "crypto-js/hmac-sha256.js";
import { RenderOptions } from "./types";

const DEFAULT_PREFIX = "https://api.urlbox.io/v1/";
const DEFAULT_OPTIONS = {
  format: "png",
};

export default (
  key: string,
  secret?: string,
  prefix: string = DEFAULT_PREFIX
) => {
  return {
    generateRenderLink: (options: RenderOptions) => {
      if (!secret) {
        throw new Error("your secret is required");
      }
      options = validateOptions(options);
      const query = toQueryString(options);
      const token = generateToken(query, secret);
      return `${prefix}${key}/${token}/${options.format || "png"}?${query}`;
    },
    generateInsecureRenderLink: (options: RenderOptions) => {
      options = validateOptions(options);
      const query = toQueryString(options);
      return `${prefix}${key}/${options.format || "png"}?${query}`;
    },
  };
};

const generateToken = (queryString: string, secret: string) => {
  return hmacSha256(queryString, secret);
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

const validateOptions = (options: RenderOptions) => {
  if (!options) {
    throw new Error("no options object passed");
  }
  if (options.url && typeof options.url !== "string") {
    throw new Error(
      "url should be of type string (something like www.google.com)"
    );
  }
  if (!options.url && !options.html) {
    throw new Error("url or html option is required");
  }
  return Object.assign({}, DEFAULT_OPTIONS, options);
};
