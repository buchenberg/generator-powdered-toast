# generator-powdered-toast [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
>

## About

Generator-powdered-toast uses [Yeoman](http://yeoman.io) to generate a mock server based on a [Swagger](http://swagger.io/) specification. This is useful for front-end development when you have a swagger specification of an API that is being actively developed. No more waiting for the API developers to deploy to a development server. Get started building your boss UX right away.

Have a production or development API that is being changed? You can seemlessly proxy requests not specified in the Swagger to those upstream services by adding an optional proxy.

The powdered-toast server uses the following technolgy stack:

* [hapi.js](https://hapijs.com/) - A badass Node.js REST server from the ninjas at Walmart.com.
* A fork of [Swagmock](https://www.npmjs.com/package/swagmock) - A Swagger based mocking library.
* [swaggerize-hapi](https://github.com/krakenjs/swaggerize-hapi) - A Swagger based hapi.js plugin.
* [hapi-swaggered-ui](https://github.com/z0mt3c/hapi-swaggered-ui) - A Swagger UI implementation for hapi.js.
* [h2o2](https://github.com/hapijs/h2o2) - A proxy handler plugin for hapi.js.

## Making Powdered Toast

Make sure you have pre-installed [node.js](https://nodejs.org/), [npm](https://www.npmjs.com/), and [Yarn](https://yarnpkg.com/en/).
Install [Yeoman](http://yeoman.io) and generator-powdered-toast globally using npm.

```bash
npm install -g yo
npm install -g generator-powdered-toast
```

Then generate your project.

```bash
yo powdered-toast
```

## Running Your Shiny New Powdered Toast

Issue the following command to start the powdered-toast service locally.

```
npm start
```

## Environment

Powdered-toast uses [dotenv](https://www.npmjs.com/package/dotenv) to configure environmental variables. Take a look at the .env file in the root of the project. A description of the variables follows the example.

```
API_HOST=localhost
API_PORT=9980
UI_HOST=localhost
UI_PORT=9980
WS_PORT=9981
TLS_ENABLED=true
PROXY_UPSTREAM_PROTOCOL=http
PROXY_UPSTREAM_HOST=api.example.com
PROXY_HEADER_HOST=client.example.com
DEBUG=server,proxy
```

### API_HOST

This is the host name within the server network dns. When you run powdered-toast locally it will generally match the UI_HOST value. However, sometimes you may have different values as in a Docker stack.

### API_PORT

This is the internal network port for the API.

### UI_HOST

This is the API hostname that the client will use. In a Docker stack this could be different based on the port forwarding configuration.

### UI_PORT

This is the port that a client will use to hit the API.

### WS_PORT

This is the web sockets port used by the debugger UI.

NOTE: When powdered-toast runs in TLS mode the debugger UI is currently not working. There is an issue with connecting over wss.

### PROXY_UPSTREAM_PROTOCOL

This is the protocol for the upstream services. Can be either 'http' or 'https'.

### PROXY_UPSTREAM_HOST

This is the upstream hostname.

### PROXY_HEADER_HOST

This is the optional host header that will be set on proxy requests.

### TLS_ENABLED

If set to "true" the service will run over https with self-signed certs.

### DEBUG

There are currently two debuggers - one in the main server file and one the proxy controller. These are activated my adding them to a comma seperated string. To turn off debugging, remove the entries.

## Regenerate from Swagger using Yeoman

In the case you want to mofify the Swagger specification, the following command will use Yeoman to regenerate handlers and data.

```
npm run regenerate
```

If there are conflicts you will be prompted to overwrite.

### Swagger UI

A Swagger UI instance is included for viewing and testing the API.

/swagger-ui

## Dredd Testing

Powdered-toast includes Dredd to test your API. To run Dredd tests just run the following in a terminal:

```
npm run dredd
```

## License

Apache-2.0 © [Gregory Buchenberger]()


[npm-image]: https://badge.fury.io/js/generator-powdered-toast.svg
[npm-url]: https://npmjs.org/package/generator-powdered-toast
[travis-image]: https://travis-ci.org/buchenberg/generator-powdered-toast.svg?branch=master
[travis-url]: https://travis-ci.org/buchenberg/generator-powdered-toast
[daviddm-image]: https://david-dm.org/buchenberg/generator-powdered-toast.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/buchenberg/generator-powdered-toast
[coveralls-image]: https://coveralls.io/repos/buchenberg/generator-powdered-toast/badge.svg
[coveralls-url]: https://coveralls.io/r/buchenberg/generator-powdered-toast
