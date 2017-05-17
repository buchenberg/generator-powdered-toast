# <%= props.project_name %>

Powdered Toast Mock Server

Swagger api [location](<%= specPathRel.replace(/\\/g,'/') %>)

## Installing and Running

### Prerequisites

#### NodeJS, NPM, Yarn

Install the latest [Node 6 or 7](https://nodejs.org) and NPM.

Install [Yarn](https://yarnpkg.com/en/) because I said so. Make sure you commit your yarn.lock file if you use source control.

#### Yeoman

Optional: Install [Yeoman](http://yeoman.io/) globally for generating handlers from Swagger

```
npm install -g yo
```

The [powdered-toast](https://www.npmjs.com/package/generator-powdered-toast) Yeoman generator is installed in node_modules already.

### Run the server

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





