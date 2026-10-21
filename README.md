# urlbox-node

Quickly generate screenshots, PDFs and other renders using the urlbox screenshot as a service API.

Signup at [Urlbox](https://urlbox.com) to get an API key and secret.

## Installation

```
npm install urlbox --save
```

## API client

`Urlbox` calls the render API directly. It needs Node 18+ (or any runtime with a global `fetch`; pass your own as `fetch` otherwise) and both your API key and secret, so use it server-side only.

```ts
import { Urlbox } from "urlbox";

const urlbox = new Urlbox({
  apiKey: process.env.URLBOX_API_KEY!,
  secret: process.env.URLBOX_SECRET!,
});

// Render and wait for the result (POST /v1/render/sync)
const result = await urlbox.render({
  url: "https://example.com",
  format: "png",
  full_page: true,
});
console.log(result.renderUrl, result.size);

// Queue a render (POST /v1/render/async) and poll for it
const { renderId } = await urlbox.renderAsync({
  url: "https://example.com",
  webhook_url: "https://yourapp.com/webhooks/urlbox",
});
const status = await urlbox.getRender(renderId); // created | retrying | succeeded | failed | not-found
const done = await urlbox.waitForRender(renderId, { intervalMs: 2000, timeoutMs: 120_000 });

// Signed render link, the same as the default export's generateRenderLink
const link = urlbox.generateRenderLink({ url: "https://example.com" });
```

Constructor options: `apiKey`, `secret`, `baseUrl` (default `https://api.urlbox.com`), `fetch`, and `timeoutMs` (per request, default 120000).

`RenderOptions` is generated from the API's option schema, so every option is typed and documented in your editor. See [urlbox.com/docs](https://urlbox.com/docs) for the full reference.

### Errors

Failed requests throw `UrlboxError`:

```ts
import { UrlboxError, UrlboxRenderFailedError } from "urlbox";

try {
  await urlbox.render({ url: "https://example.com" });
} catch (err) {
  if (err instanceof UrlboxError) {
    err.status; // HTTP status (0 for network errors and timeouts)
    err.message; // from the x-urlbox-error-message header or the body
    err.code; // e.g. "InvalidOptions"
    err.requestId; // x-urlbox-request-id, quote it to support
    err.rateLimit; // { limit, remaining, reset, retryAfter } when present
  }
}
```

`waitForRender` throws `UrlboxRenderFailedError` (a subclass of `UrlboxError`) when the render fails, and a `UrlboxError` with code `WAIT_TIMEOUT` if it does not finish in time.

## Verifying webhooks

Urlbox signs every webhook with the `X-Urlbox-Signature` header: `t=<unix seconds>,sha256=<hex>`, with one `sha256` entry per active secret while you rotate. Verify it against the **raw request body**, exactly as received. Re-serialising parsed JSON will not match.

```ts
import express from "express";
import { parseWebhook, UrlboxWebhookSignatureError } from "urlbox";

const app = express();

app.post(
  "/webhooks/urlbox",
  express.raw({ type: "application/json" }), // keep the body as a Buffer
  (req, res) => {
    try {
      const event = parseWebhook({
        header: req.get("x-urlbox-signature"),
        rawBody: req.body, // string or Buffer
        secret: process.env.URLBOX_WEBHOOK_SECRET!, // or [newSecret, oldSecret]
      });
      if (event.event === "render.succeeded") {
        console.log(event.renderId, event.result.renderUrl);
      } else {
        console.log(event.renderId, event.error.message);
      }
      res.sendStatus(200);
    } catch (err) {
      if (err instanceof UrlboxWebhookSignatureError) return res.sendStatus(400);
      throw err;
    }
  }
);
```

`verifyWebhookSignature` takes the same arguments and returns a boolean. Signatures older than `toleranceSeconds` (default 300) are rejected; pass `0` to turn the check off.

## Render links

The default export generates render links: URLs you can put straight into an `<img>` tag or link to.

### Example

```js
import Urlbox from "urlbox";

// Get your API key and secret from urlbox.com
const urlbox = Urlbox(YOUR_API_KEY, YOUR_API_SECRET);

// See all urlbox screenshot options at urlbox.com/docs
const options = {
  url: "github.com",
  thumb_width: 600,
  format: "jpg",
  quality: 80,
};

const imgUrl = urlbox.generateRenderLink(options);
// https://api.urlbox.io/v1/YOUR_API_KEY/TOKEN/jpg?url=github.com&thumb_width=600&quality=80
```

Now stick that url in an img tag to render the screenshot!

![Urlbox Screenshot of github.com](https://api.urlbox.io/v1/ca482d7e-9417-4569-90fe-80f7c5e1c781/5a9a56f05cf1229bd8f2edf4a0e6c218ccea1bb7/jpeg?url=github.com&thumb_width=600&quality=80)

Available options:

| Option          | Default           | Description                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | -                 | The URL of the website you want to screenshot                                                                                                                                                                                                                                                                                     |
| `width`         | 1280              | Viewport width of the browser in pixels                                                                                                                                                                                                                                                                                           |
| `height`        | 1024              | Viewport height of the browser in pixels                                                                                                                                                                                                                                                                                          |
| `selector`      | -                 | Take a screenshot of the element that matches this selector                                                                                                                                                                                                                                                                       |
| `thumb_width`   | -                 | Width in pixels of the generated thumbnail, leave off for full-size screenshot                                                                                                                                                                                                                                                    |
| `format`        | png               | Format of the resulting screenshot image (`png` or `jpg`)                                                                                                                                                                                                                                                                         |
| `user_agent`    | -                 | User-Agent string used to emulate a particular client.                                                                                                                                                                                                                                                                            |
| `cookie`        | -                 | Set a cookie value before taking a screenshot. E.g. OptIn=true. Can be set multiple times to set more than one cookie.                                                                                                                                                                                                            |
| `delay`         | -                 | Amount of time to wait in milliseconds before urlbox takes the screenshot                                                                                                                                                                                                                                                         |
| `wait_for`      | -                 | Waits for the element specified by this selector to be visible on the page before taking a screenshot                                                                                                                                                                                                                             |
| `timeout`       | 30000             | Amount of time to wait in milliseconds for the website at url to respond                                                                                                                                                                                                                                                          |
| `full_page`     | false             | Specify whether to capture the full-length of the website                                                                                                                                                                                                                                                                         |
| `flash`         | false             | Enable the flash plugin for flash using websites                                                                                                                                                                                                                                                                                  |
| `force`         | false             | Take a fresh screenshot instead of getting a cached version                                                                                                                                                                                                                                                                       |
| `ttl`           | 2592000 (30 days) | Short for 'time to live'. Number of seconds to keep a screenshot in the cache. Note the default is also the maximum value for this option.                                                                                                                                                                                        |
| `quality`       | 80                | JPEG only - image quality of resulting screenshot (0-100)                                                                                                                                                                                                                                                                         |
| `disable_js`    | false             | Turn off javascript on target url to prevent popups                                                                                                                                                                                                                                                                               |
| `retina`        | false             | Take a 'retina' or high definition screenshot equivalent to setting a device pixel ratio of 2.0 or @2x. Please note that retina screenshots will be double the normal dimensions and will normally take slightly longer to process due to the much bigger image size.                                                             |
| `click`         | -                 | Element selector that is clicked before taking a screenshot e.g. #clickme would click the element with id="clickme"                                                                                                                                                                                                               |
| `hover`         | -                 | Element selector that is hovered before taking a screenshot e.g. #hoverme would hover over the element with id="clickme"                                                                                                                                                                                                          |
| `bg_color`      | -                 | Hex code or css color string. Some websites don't set a body background colour, and will show up as transparent backgrounds with PNG or black when using JPG. Use this setting to set a background colour. If the website explicitly sets a transparent background on the html or body elements, this setting will be overridden. |
| `crop_width`    | -                 | Crop the width of the screenshot to this size in pixels                                                                                                                                                                                                                                                                           |
| `hide_selector` | -                 | Hides all elements that match the element selector by setting their style to `display:none !important;`. Useful for hiding popups.                                                                                                                                                                                                |
| `highlight`     | -                 | Word to highlight on the page before capturing a screenshot                                                                                                                                                                                                                                                                       |
| `highlightfg`   | white             | Text color of the highlighted word                                                                                                                                                                                                                                                                                                |
| `highlightbg`   | red               | Background color of the highlighted word                                                                                                                                                                                                                                                                                          |
| `use_s3`        | false             | Save the screenshot directly to the S3 bucket configured on your account                                                                                                                                                                                                                                                          |
