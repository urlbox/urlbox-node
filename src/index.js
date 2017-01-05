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

const generateToken = (queryString, secret) => hmacSha1(queryString, secret);

const toQueryString = options => {
  const filterFunc = function (key, value) {
    console.log('in filter', key, value);
    if(key === 'format'){return;}
    if(!value){return;}
    return value;
  };
  return qs.stringify(options, {encoder: encodeURIComponent, filter: filterFunc, arrayFormat: 'repeat'});
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