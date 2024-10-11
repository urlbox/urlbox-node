"use strict";
import { expect, test } from "vitest";
import crypto from "node:crypto";
import qs from "qs";
import urlboxFactory from "./";
import { RenderOptions } from "types";

const myapikey = "MY_API_KEY";
const mysecret = "secret";
const prefix = "https://api.urlbox.com/v1/";
const urlbox = urlboxFactory(myapikey, mysecret);

const toQuery = (options: RenderOptions) =>
  qs.stringify(options, {
    filter: (key, value) => (key == "format" ? undefined : value),
  });

test("should return a url with a valid token and query string", () => {
  const options: RenderOptions = {
    url: "bbc.co.uk",
    width: 1024,
    height: 768,
    delay: 1000,
  };
  const query = toQuery(options);
  const renderLink = urlbox.generateRenderLink(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  expect(renderLink).toEqual(
    "https://api.urlbox.com/v1/" + myapikey + "/" + token + "/png?" + query
  );
});
test("should return a url with a valid token and query string with width param", () => {
  const options = {
    url: "bbc.co.uk",
    width: 100,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with height param", () => {
  const options = {
    url: "google.com",
    height: 100,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with full_page param", () => {
  const options = {
    url: "google.com",
    full_page: true,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with delay param", () => {
  const options = {
    url: "google.com",
    delay: 4000,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with width and height params", () => {
  const options = {
    url: "bbc.co.uk",
    width: 100,
    height: 200,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with width and height and full_page params", () => {
  const options = {
    url: "bbc.co.uk",
    width: 100,
    height: 200,
    full_page: true,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("should return a url with a valid token and query string with width and height and full_page and delay params", () => {
  const options = {
    url: "bbc.co.uk",
    width: 100,
    height: 200,
    full_page: true,
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("user_agent and url are url-encoded", () => {
  const options = {
    url: "https://bbc.co.uk",
    user_agent:
      "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)",
  };
  const query = toQuery(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});
test("removes false values from query", () => {
  let options: RenderOptions = {
    url: "bbc.co.uk",
    width: 1024,
    height: 768,
    delay: 1000,
  };
  const query = toQuery(options);
  options.force = false;
  options.full_page = false;
  options.disable_js = false;
  options.retina = false;
  const renderLink = urlbox.generateRenderLink(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");

  expect(renderLink).toEqual(
    "https://api.urlbox.com/v1/" + myapikey + "/" + token + "/png?" + query
  );
});
test("removes 0 values from query", () => {
  let options: RenderOptions = {
    url: "bbc.co.uk",
  };
  const query = toQuery(options);
  options.width = 0;
  options.height = 0;
  options.delay = undefined;
  options.thumb_width = undefined;
  const renderLink = urlbox.generateRenderLink(options);
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");

  expect(renderLink).toEqual(
    "https://api.urlbox.com/v1/" + myapikey + "/" + token + "/png?" + query
  );
});
test("kitchen sink", () => {
  const options: RenderOptions = {
    url: "https://www.mysite.com/?video=funny cat plays piano",
    width: 100,
    height: 200,
    thumb_width: 300,
    full_page: true,
    retina: true,
    disable_js: true,
    delay: 4000,
    user_agent:
      "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)",
    force: true,
    quality: 80,
  };
  const query = toQuery(options);
  // don't want format in the query string...
  options.format = "jpg";
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/jpg?" + query);
});

test("cookies", () => {
  const options: RenderOptions = {
    url: "bbc.co.uk",
    cookie: [
      "CookieOptIn=true;Path=/;Domain=.marktplaats.nl;Expires=Fri, 01-Jan-2027 15:19:58 GMT",
      "LoggedIn=true;Path=/;Domain=.urlbox.com;Max-Age=10000",
    ],
  };
  const query =
    "url=bbc.co.uk&" +
    (Array.isArray(options.cookie)
      ? options.cookie.map((c) => "cookie=" + encodeURIComponent(c)).join("&")
      : "cookie=" + encodeURIComponent(options.cookie!));
  options.format = "png";
  const token = crypto
    .createHmac("sha256", mysecret)
    .update(query)
    .digest("hex");
  const renderLink = urlbox.generateRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/" + token + "/png?" + query);
});

test("should error if no url", () => {
  //@ts-expect-error
  expect(() => urlbox.generateRenderLink()).toThrow("no options object passed");
});

test("should error if url is wrong type", () => {
  let options = { url: 2 };
  //@ts-expect-error
  expect(() => urlbox.generateRenderLink(options)).toThrow(
    "url should be of type string (something like www.google.com)"
  );
});

test("without secret, should throw exception", () => {
  const urlbox = urlboxFactory(myapikey);
  const options: RenderOptions = {
    url: "https://www.mysite.com/?video=funny cat plays piano",
    width: 100,
    height: 200,
    thumb_width: 300,
    full_page: true,
    retina: true,
    disable_js: true,
    delay: 4000,
    user_agent:
      "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)",
    force: true,
    quality: 80,
  };
  options.format = "jpg";
  expect(() => urlbox.generateRenderLink(options)).toThrow(
    "your secret is required"
  );
});
test("without secret", () => {
  const urlbox = urlboxFactory(myapikey);
  const options: RenderOptions = {
    url: "https://www.mysite.com/?video=funny cat plays piano",
    width: 100,
    height: 200,
    thumb_width: 300,
    full_page: true,
    retina: true,
    disable_js: true,
    delay: 4000,
    user_agent:
      "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/30.0.1599.12 Mobile/11A465 Safari/8536.25 (3B92C18B-D9DE-4CB7-A02A-22FD2AF17C8F)",
    force: true,
    format: "mp4",
    quality: 80,
  };
  const query = toQuery(options);
  const renderLink = urlbox.generateInsecureRenderLink(options);
  expect(renderLink).toEqual(prefix + myapikey + "/mp4?" + query);
});

test("asterisk", () => {
  const urlbox = urlboxFactory(myapikey);
  const options: RenderOptions = {
    html: "<h1>Hello World</h1>",
    highlight: "*^",
    format: "pdf",
  };
  const query = toQuery(options);
  options.format = "png";
  const renderLink = urlbox.generateInsecureRenderLink(options);

  expect(renderLink).toEqual(prefix + myapikey + "/png?" + query);
});
