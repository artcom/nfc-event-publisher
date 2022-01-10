# NFC Event Publisher

Publishes tag payloads to the broker provided by a [bootstrap-server](https://github.com/artcom/bootstrap-server). For TAG_ISO_14443_3 ("simple tags") the payload needs to be encoded as custom url. For TAG_ISO_14443_4 (Android tags) the payload is parsed as is.

## Run locally

* Copy `config.json.template` into `config.json` (default location) and change `bootstrapUrl` and `tagScheme` properties, OR
* provide `config.json` in another location and point to it via cli args `npm start -- configFile=<pathToConfig.json>`

```bash
npm install
npm start
```
