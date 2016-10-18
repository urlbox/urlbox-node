# urlbox-screenshots

Quickly generate screenshots using the urlbox.io screenshot as a service API. 

Signup at [Urlbox.io](https://urlbox.io) to get your API key and secret.

## Installation

```
npm install urlbox --save
```

## Example

```js
import Urlbox from 'urlbox';

// Get your API key and secret from urlbox.io
const urlbox = Urlbox(YOUR_API_KEY, YOUR_API_SECRET);

// See all urlbox screenshot options at urlbox.io/docs
const options = {
  url: 'github.com',
  thumb_width: 600,
  format: 'jpg',
  quality: 80
}

const imgUrl = urlbox.buildUrl(options);
// https://api.urlbox.io/v1/YOUR_API_KEY/TOKEN/jpg?url=github.com&thumb_width=600&quality=80
```

Now stick that url in an img tag to render the screenshot!

![Urlbox Screenshot of github.com](https://api.urlbox.io/v1/ca482d7e-9417-4569-90fe-80f7c5e1c781/5a9a56f05cf1229bd8f2edf4a0e6c218ccea1bb7/jpeg?url=github.com&thumb_width=600&quality=80)