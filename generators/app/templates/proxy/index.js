'use strict';
const debug = require('debug')('proxy');

exports.register = function (server, options, next) {

    const config = {
        payload: {
            parse: false
        },
        // Needed for legacy cookies that violate RFC 6265
        state: {
            parse: false,
            failAction: 'ignore'
        }
    };

    const handler = {
        proxy: {
            passThrough: true,
            mapUri: function (request, callback) {
                const upstreamUrl = `${options.upstream_protocol}://${options.upstream_host}${request.raw.req.url}`
                <% if (props.proxyHostOverrideEnabled) { %>
                request.headers.host = options.proxy_header_host || request.headers.host;
                <% } %>
                debug(`Request to ${upstreamUrl}`);
                callback(null, upstreamUrl, request.headers);
            },
            onResponse: function (err, res, request, reply, settings, ttl) {
                let response = err || res;
                reply(response);
            }
        }
    };

    server.route({
        method: '*',
        path: '/{path*}',
        config: config,
        handler: handler
    });
    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};