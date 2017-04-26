'use strict';
require('dotenv').config();
const Glue = require('glue');
const Path = require('path');
const debug = require('debug')('server');
const fs = require('fs');
const chalk = require('chalk');

let tls;

if (process.env.TLS_ENABLED === 'true') {
    tls = {
        key: fs.readFileSync(Path.resolve('./key.pem')),
        cert: fs.readFileSync(Path.resolve('./cert.pem'))
    };
} else {
    tls = false;
}

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
    }
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
        },
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