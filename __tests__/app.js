'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('generator-powdered-toast:app', () => {
  beforeAll(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        projectName: 'foo',
        developerName: 'Greg',
        developerEmail: 'none@ya.com',
        specPath: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml',
        tlsEnabled: true,
        makeKeys: true,
        proxyEnabled: true,
        proxyUpstreamProtocol: 'http',
        proxyUpstreamHost: 'google.com',
        proxyHostOverrideEnabled: false

      });
  });

  it('creates files', () => {
    assert.file([
      'server.js'
    ]);
  });
});
