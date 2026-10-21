# v2.3.0

## Features

- Add the `Urlbox` API client: `render`, `renderAsync`, `getRender`, `waitForRender` and `generateRenderLink`
- Add `verifyWebhookSignature` and `parseWebhook` for `X-Urlbox-Signature` webhooks, including secret rotation
- Add `UrlboxError`, `UrlboxRenderFailedError` and `UrlboxWebhookSignatureError`
- Add response and webhook types (`RenderResult`, `RenderStatus`, `WebhookEvent`, ...)

## Improvements

- `RenderOptions` is now generated from the API's option schema (387 options, with descriptions). Options from earlier releases that the API no longer lists are kept as deprecated fields
- CommonJS consumers now get type declarations, and `exports` lists `types` for both `import` and `require`
- Test files are no longer included in the published package

# v2.2.0

## Improvements

- Change `crypto` import to `node:crypto` to be compatible with cloudflare workers, thanks to [drush](https://github.com/drush) in [#21](https://github.com/urlbox/urlbox-node/pull/21)
- Updated dependencies

# v2.1.0

## Improvements

- Move to nodejs crypto, remove cryptojs
- Remove lodash

# v2.0.3

## Improvements

- Export `RenderOptions` type, thanks to [DigiPie](https://github.com/DigiPie) in [#17](https://github.com/urlbox/urlbox-node/pull/17)
- Updated dependencies

# v2.0.2

## Improvements

- Added more options to `RenderOptions` type
- Made hmacSha256 import more explicit

# v2.0.1

## Improvements

- Add `types` to package.json

# v2.0.0

## Breaking Changes

- Rename `buildUrl` to `generateRenderLink`
- Remove `buildUrls` method

## Improvements

- Added `generateInsecureRenderLink` method
- Remove babel
- Replace jest with vitest
- Prune unnecessary packages
- Convert to typescript
- Add typescript types
- Publish as both ESM and CJS modules
- Rename repo to `urlbox/urlbox-node`

## Fixes

- Update dependencies
