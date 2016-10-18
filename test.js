'use strict';
import test from 'ava';
import crypto from 'crypto';
import qs from 'querystring';
import urlboxFactory from './lib/index';

// test('foo', t => {
//     t.pass();
// });

// test('bar', async t => {
//     const bar = Promise.resolve('bar');
//     t.is(await bar, 'bar');
// });

const myapikey = '12345';
const mysecret = '54321';
const prefix = 'https://api.urlbox.io/v1/';
const urlbox = urlboxFactory(myapikey, mysecret);
var delay, full_page, height, url, width;

test('should return a url with a valid token and query string', t => {
  const options = {
    url: 'bbc.co.uk',
    width: 1024,
    height: 768,
    delay: 1000
  };
  const query = qs.stringify(options);
  const result = urlbox.buildUrl(options);
  const token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  t.truthy(result);
  t.is(result, "https://api.urlbox.io/v1/" + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with width param', t => {
  var query, result, token;
  const options = {
    url: 'bbc.co.uk',
    width: 100
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result, prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with height param', t => {
  var query, result, token;
  const options = {
    url: 'google.com',
    height: 100
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result, prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with full_page param', t => {
  var query, result, token;
  const options = {
    url: 'google.com',
    full_page: true
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with delay param', t => {
  var query, result, token;
  const options = {
    url: 'google.com',
    delay: 4000
  }
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with width and height params', t => {
  var query, result, token;
  const options = {
    url: 'bbc.co.uk',
    width: 100,
    height: 200
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with width and height and full_page params', t => {
  var query, result, token;
  const options = {
    url: 'bbc.co.uk',
    width: 100,
    height: 200,
    full_page: true
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('should return a url with a valid token and query string with width and height and full_page and delay params', t => {
  var query, result, token;
  const options = {
    url: 'bbc.co.uk',
    width: 100,
    height: 200,
    full_page: true
  };
  query = qs.stringify(options);
  token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('user_agent and url are url-encoded', t => {
  const options = {
    url: 'https://bbc.co.uk',
    user_agent: 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)'
  };
  const query = qs.stringify(options);
  const token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  const result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/png?" + query);
});
test('removes false values from query', t => {
  let options = {
    url: 'bbc.co.uk',
    width: 1024,
    height: 768,
    delay: 1000
  };
  const query = qs.stringify(options);
  options.force = false;
  options.full_page = false;
  options.disable_js = false;
  options.retina = false;
  const result = urlbox.buildUrl(options);
  const token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  t.truthy(result);
  t.is(result, "https://api.urlbox.io/v1/" + myapikey + "/" + token + "/png?" + query);
});
test('removes 0 values from query', t => {
  let options = {
    url: 'bbc.co.uk'
  };
  const query = qs.stringify(options);
  options.width = 0;
  options.height = 0;
  options.delay = undefined;
  options.thumb_width = null;
  const result = urlbox.buildUrl(options);
  const token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  t.truthy(result);
  t.is(result, "https://api.urlbox.io/v1/" + myapikey + "/" + token + "/png?" + query);
});
test('kitchen sink', t => {
  const options = {
    url: 'https://www.mysite.com/?video=funny cat plays piano',
    width: 100,
    height: 200,
    thumb_width: 300,
    // format: 'jpg',
    full_page: true, 
    retina: true,
    disable_js: true,
    delay: 4000,
    user_agent: 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)',
    force: true,
    quality: 80
  };
  const query = qs.stringify(options);
  // don't want format in the query string...
  options.format = 'jpg';
  const token = crypto.createHmac("sha1", mysecret).update(query).digest("hex");
  const result = urlbox.buildUrl(options);
  t.truthy(result);
  t.is(result,prefix + myapikey + "/" + token + "/jpg?" + query);
});
test('should error if no url', t => {
  t.throws(() => urlbox.buildUrl(), "no options object passed");
});
test('should error if url is wrong type', t => {
    let options = {url: 2};
    t.throws(() => urlbox.buildUrl(options),"url should be of type string (something like www.google.com)");
});