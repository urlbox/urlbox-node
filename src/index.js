'use strict';
const hmacSha1 = require('crypto-js/hmac-sha1');
const includes = require('lodash.includes');

const DEFAULT_PREFIX = 'https://api.urlbox.io/v1/';
const DEFAULT_OPTIONS = {
  format: 'png',
};

module.exports = (key, secret, prefix = DEFAULT_PREFIX) => {
  return {
    buildUrl: (options) => {
      console.log(options);
      options = validateOptions(options);
      const query = toQueryString(options);
      const token = generateToken(query, secret);
      return `${prefix}${key}/${token}/${options.format}?${query}`;
    }
  }
};

const generateToken = (queryString, secret) => hmacSha1(queryString, secret);

const toQueryString = (options) => {
  const vals = Object.keys(options)
    .filter(key => !includes(['format'], key))
    .map(key => {
      let value = options[key];
      if (value === undefined || value === null || value === "" || value === 0) {
        return false;
      }
      if (includes(['url', 'user_agent', 'bg_color'], key)) {
        value = encodeURIComponent(value);
      }
      if (includes(['force', 'retina', 'full_page', 'disable_js'], key) && !value) {
        return false;
      }
      return `${key}=${value}`;
    });
  return vals.filter(v => v).join('&');
};

const validateOptions = (options) => {
  let query, ret, token;
  if (!options) {
    throw new Error('no options object passed');
  }
  if (typeof options.url !== 'string') {
    throw new Error('url should be of type string (something like www.google.com)');
  }
  if (options.url === null) {
    throw new Error('url is required');
  }
  return Object.assign({}, DEFAULT_OPTIONS, options);
}