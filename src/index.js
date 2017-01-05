'use strict';
const hmacSha1 = require('crypto-js/hmac-sha1');
const includes = require('lodash.includes');
const qs = require('qs');

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
      return `${prefix}${key}/${token}/${options.format || 'png'}?${query}`;
    }
  }
};

const encodedProperties = ['url', 'user_agent', 'bg_color', 
'hide_selector', 'click_selector', 
'highlight', 'highlightbg', 'highlightfg', 's3_path', 'cookies'];

const booleanProperties = ['force', 'flash', 'retina', 
'full_page', 'disable_js', 'use_s3', 'debug'];

const generateToken = (queryString, secret) => hmacSha1(queryString, secret);

const toQueryString = options => {
  const vals = Object.keys(options)
    .filter(key => !includes(['format'], key))
    .filter(key => includes(booleanProperties, key) && !value)
    .filter(key => options[key] === undefined || options[key] === null || options[key] === "" || options[key] === 0);
  return qs.stringify(vals);
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