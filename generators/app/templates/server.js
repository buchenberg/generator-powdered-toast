'use strict';
require('dotenv').config();
const Glue = require('glue');
const Path = require('path');
const debug = require('debug')('server');
const fs = require('fs');
const chalk = require('chalk');

let tls = false;

<% if (props.tls_enabled) { %>
if (process.env.TLS_ENABLED === 'true') {
    tls = {
        key: fs.readFileSync(Path.resolve('./key.pem')),
        cert: fs.readFileSync(Path.resolve('./cert.pem'))
    };
} else {
    tls = false;
}
<% } %>

<% if (!props.tls_enabled) { %>
// if (process.env.TLS_ENABLED === 'true') {
//     tls = {
//         key: fs.readFileSync(Path.resolve('./key.pem')),
//         cert: fs.readFileSync(Path.resolve('./cert.pem'))
//     };
// } else {
//     tls = false;
// }
<% } %>



const environment = {
    api: {
        host: process.env.API_HOST || 'localhost',
        port: process.env.API_PORT || 9990
    },
    ui: {
        host: process.env.UI_HOST || 'localhost',
        port: process.env.UI_PORT || 9990
    },
    ws: {
        port: process.env.WS_PORT || 9991
    }<% if (props.proxy_enabled) { %>,
    proxy: {
        upstream_host: process.env.PROXY_UPSTREAM_HOST,
        upstream_protocol: process.env.PROXY_UPSTREAM_PROTOCOL,
        header_host: process.env.PROXY_HEADER_HOST<% if (props.proxy_host_override_enabled) { %>,
        header_host: process.env.PROXY_HEADER_HOST<% } %>
        }<% } %>
        
};

const manifest = {
    server: {},
    connections: [
        {
            host: environment.api.host,
            port: environment.api.port,
            labels: 'api',
            tls: tls,
            routes: {
                cors: {
                    origin: ['*']
                }
            }

        }
    ],
    registrations: [
        {
            plugin: 'inert'
        },
        {
            plugin: 'vision'
        },
        {
            plugin: 'blipp'
        },<% if (props.proxy_enabled) { %>
        {
            plugin: 'h2o2'
        },
        {
            plugin: {
                register: './modules/proxy',
                options: {
                    upstream_protocol: environment.proxy.upstream_protocol,
                    upstream_host: environment.proxy.upstream_host<% if (props.proxy_host_override_enabled) { %>,
                    proxy_header_host: environment.proxy.header_host<% } %>
                }
            }
        },<% } %>
        {
            plugin: {
                register: 'swaggerize-hapi',
                options: {
                    api: Path.resolve('<%=specPathRel.replace(/\\/g,' / ')%>'),
                    docspath: '/swagger',
                    handlers: Path.resolve('<%=handlerPath.replace(/\\/g,' / ')%>') <%if (security) {%>,
                    security: Path.resolve('<%=securityPath.replace(/\\/g,' / ')%>') <%}%>
                }
            }
        },
        {
            plugin: {
                register: 'hapi-swaggered-ui',
                options: {
                    swaggerEndpoint: '<%= api.basePath %>/swagger',
                    path: '/swagger-ui',
                    title: 'Powdered Toast',
                    swaggerOptions: {}
                }
            }
        }
    ]
};

const options = {
    relativeTo: __dirname
};

Glue.compose(manifest, options, (err, server) => {
    if (err) {
        throw err;
    }
    server.start(() => {
        server.plugins.swagger.setHost(server.info.host + ':' + server.info.port);
        debug(`Swagger UI is running on ${chalk.cyan(chalk.underline(server.info.uri + '/swagger-ui'))}`);
    });
});