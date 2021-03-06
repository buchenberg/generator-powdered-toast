'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const pem = require('pem');
const JsYaml = require('js-yaml');
const Path = require('path');
const Parser = require('swagger-parser');
const Pkg = require('../../package.json');

const operationType = [
  'get',
  'post',
  'put',
  'delete',
  'head',
  'options',
  'patch'
];

module.exports = class extends Generator {

  constructor(args, opts) {
    super(args, opts);
    this.argument('appname', {type: String, required: false});
    this.argument('specPath', {type: String, required: false});
    this.argument('handlerPath', {type: String, required: false});
    this.argument('dataPath', {type: String, required: false});
    this.argument('securityPath', {type: String, required: false});
  }

  _startsWith(str, substr) {
    if (str.substr(0, substr.length) === substr) {
      return true;
    }
    return false;
  }

  _buildRelativePath(from, to) {
    var dirname = Path.dirname(from);
    var relative = Path.relative(dirname, to);
    if (this._startsWith(relative, '.' + Path.sep) || this._startsWith(relative, '..' + Path.sep)) {
      return relative;
    }
    return '.' + Path.sep + relative;
  }

  _routeGen(path, pathObj) {
    var pathStr = path.replace(/^\/|\/$/g, '');
    var mockgenPath = Path.join(this.dataPath, 'mockgen.js');
    var dataPath = Path.join(this.dataPath, pathStr + '.js');
    var route = {
      basePath: (this.api.basePath && this.api.basePath !== '/') ? this.api.basePath : '',
      path: path,
      apiPathRel: this._buildRelativePath(this.genFilePath, this.apiConfigPath),
      mockgenPath: this._buildRelativePath(this.genFilePath, this.destinationPath(mockgenPath)),
      dataPath: this._buildRelativePath(this.genFilePath, this.destinationPath(dataPath)),
      handlerDir: this._buildRelativePath(this.genFilePath, this.destinationPath(this.handlerPath)),
      operations: [],
      security: this.security,
      securityPath: this._buildRelativePath(this.genFilePath, this.destinationPath(this.securityPath))
    };

    Object.keys(pathObj).forEach(function (method) {
      var commonParams = [];
      var operationObj = pathObj[method];
      method = method.toLowerCase();
      if (method === 'parameters') {
        /*
         * A list of parameters that are applicable for all the operations described under this path.
         * These parameters can be overridden at the operation level, but cannot be removed there.
         * The list MUST NOT include duplicated parameters
         */
        commonParams = operationObj;
      } else if (operationType.indexOf(method) !== -1) {
        /*
         * The operation for the Path. get, post. put etc.
         */
        var parameters = commonParams;
        var validateResp = false;
        var response;
        var responses = operationObj.responses;
        var respArr = responses ? Object.keys(responses) : [];
        if (respArr.length > 0) {
          // Sort the array to maintain the order of keys.
          // Use the first response as the default response
          response = respArr.sort()[0];
          if (responses[response] && responses[response].schema) {
            validateResp = true;
          }
        }
        if (operationObj.parameters) {
          parameters = commonParams.concat(operationObj.parameters);
        }

        route.operations.push({
          name: operationObj.operationId,
          description: operationObj.description,
          summary: operationObj.summary,
          method: method,
          parameters: parameters && parameters.map(function (p) {
            return p.name;
          }).join(', '),
          produces: operationObj.produces && operationObj.produces.join(', '),
          responses: respArr,
          response: response,
          validateResp: validateResp
        });
      }
    });
    return route;
  }

  _setDefaults() {
    var basePath = this.destinationRoot();
    this._updateConfigPath();
    this.appName = Path.basename(basePath);
    this.handlerPath = this.options.handlerPath || '.' + Path.sep + 'modules' + Path.sep + 'mocks' + Path.sep + 'handlers';
    this.dataPath = this.options.dataPath || '.' + Path.sep + 'modules' + Path.sep + 'mocks' + Path.sep + 'data';
    this.mockgenPath = Path.join(this.dataPath, 'mockgen.js');
    this.securityPath = this.options.securityPath || '.' + Path.sep + 'security';
    this.security = false;
    if (this.api &&
      this.api.securityDefinitions &&
      Object.keys(this.api.securityDefinitions).length > 0) {
      this.security = true;
    }
    this.generatorVersion = Pkg.version;
  }

  _updateConfigPath() {
    var ext = '.json';
    this.ymlApi = false;
    if (this.specPath &&
      (Path.extname(this.specPath) === '.yml' || Path.extname(this.specPath) === '.yaml')) {
      ext = Path.extname(this.specPath);
      this.ymlApi = true;
    }
    this.specPathRel = '.' + Path.sep + 'modules' + Path.sep + 'mocks' + Path.sep + 'config' + Path.sep + 'swagger' + ext;
    this.apiConfigPath = this.options.apiConfigPath || Path.join(this.destinationPath(), this.specPathRel);
  }

  _makeKeys() {
    this.log('Making self-signed keys for TLS...');
    var self = this;
    pem.createCertificate({days: 365, selfSigned: true}, function (err, keys) {
      if (err) {
        return self.log(err);
      }
      self.fs.write(
        self.destinationPath('key.pem'),
        keys.serviceKey
      );
      self.fs.write(
        self.destinationPath('cert.pem'),
        keys.certificate
      );
    });
  }

  _specPath() {
    if (this.options.specPath) {
      this._validateApi(this.options.specPath);
    }
  }

  _handlers() {
    var self = this;
    var paths = this.api.paths;
    if (paths) {
      Object.keys(paths).forEach(function (path) {
        var pathStr = path.replace(/^\/|\/$/g, '');
        var handlerPath = Path.join(self.handlerPath, pathStr + '.js');
        var pathObj = paths[path];
        var route;
        /*
          * Schema Extensions for Handlers: (x-handler)
          * An alternative to automatically determining handlers based on a directory structure,
          * handlers can be specified using x-handler
          */
        if (pathObj['x-handler']) {
          handlerPath = pathObj['x-handler'];
        }
        // Set the genFilePath path
        self.genFilePath = self.destinationPath(handlerPath);
        // Generate the route template obj.
        route = self._routeGen(path, pathObj);

        if (route.operations && route.operations.length > 0) {
          self.fs.copyTpl(
            self.templatePath('mocks/handler.js'),
            self.genFilePath,
            route
          );
        }
      });
    }
  }

  _data() {
    var self = this;
    var paths = this.api.paths;
    if (paths) {
      Object.keys(paths).forEach(function (path) {
        var pathStr = path.replace(/^\/|\/$/g, '');
        var dataPath = Path.join(self.dataPath, pathStr + '.js');
        var pathObj = paths[path];
        var route;
        // Set the genFilePath path
        self.genFilePath = self.destinationPath(dataPath);
        // Generate the route template obj.
        route = self._routeGen(path, pathObj);
        // Generate the data files.
        if (route.operations && route.operations.length > 0) {
          self.fs.copyTpl(
            self.templatePath('mocks/data.js'),
            self.genFilePath,
            route
          );
        }
      });
    }
  }

  _mockgen() {
    var tmpl = {
      apiConfigPath: this._buildRelativePath(this.destinationPath(this.mockgenPath), this.apiConfigPath)
    };
    this.fs.copyTpl(
      this.templatePath('mocks/mockgen.js'),
      this.destinationPath(this.mockgenPath),
      tmpl
    );
  }

  _security() {
    var self = this;
    var def = this.api.securityDefinitions;
    var securityPath;
    if (def && Object.keys(def).length > 0) {
      // Generate authorize handlers for securityDefinitions
      Object.keys(def).forEach(function (defName) {
        securityPath = Path.join(self.securityPath, defName + '.js');
        self.fs.copyTpl(
          self.templatePath('mocks/security.js'),
          self.destinationPath(securityPath),
          {
            name: defName,
            type: def[defName].type,
            description: def[defName].description
          }
        );
      });
    }
  }

  _validateApi(apiPath) {
    var done = this.async();
    var self = this;
    this.log(`Validating swagger for ${apiPath}`);
    Parser.validate(apiPath, function (error, api) {
      if (error) {
        self.log('Swagger validation failed!');
        done(error);
      }
      self.api = api;
      Parser.parse(apiPath, function (error, refApi) {
        if (error) {
          self.log('Swagger parsing failed!');
          done(error);
        }
        self.refApi = refApi;
        done();
      });
    });
  }

  initializing() {
    this._specPath();
    this._setDefaults();
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      `Did someone call for ${chalk.red('powdered-toast')}? ${chalk.yellow('Leave everything to me!')}`
    ));
    const prompts = [{
      type: 'input',
      name: 'projectName',
      message: 'Your project name',
      default: this.options.appname || this.appname
    }, {
      type: 'input',
      name: 'developerName',
      message: 'Your name',
      save: true
    }, {
      type: 'input',
      name: 'developerEmail',
      message: 'Your email',
      save: true
    },
    {
      type: 'input',
      name: 'specPath',
      message: 'Path (or URL) to swagger document:',
      required: true,
      default: this.options.specPath
    },
    {
      type: 'confirm',
      name: 'tlsEnabled',
      message: 'Would you like to enable TLS?'
    },
    {
      when: function (response) {
        return response.tlsEnabled;
      },
      type: 'confirm',
      name: 'makeKeys',
      message: 'Would you like to generate SSL keys?'
    },
    {
      type: 'confirm',
      name: 'proxyEnabled',
      message: 'Would you like to add a proxy?'
    },
    {
      when: function (response) {
        return response.proxyEnabled;
      },
      type: 'list',
      name: 'proxyUpstreamProtocol',
      message: 'What is the upstream host protocol?',
      choices: ['http', 'https'],
      default: 'http'
    },
    {
      when: function (response) {
        return response.proxyEnabled;
      },
      name: 'proxyUpstreamHost',
      message: 'What is the upstream host?',
      default: 'api.example.com'
    },
    {
      when: function (response) {
        return response.proxyEnabled;
      },
      type: 'confirm',
      name: 'proxyHostOverrideEnabled',
      message: 'Would you like to override the host header sent by the proxy?'
    },
    {
      when: function (response) {
        return response.proxyHostOverrideEnabled;
      },
      name: 'proxy_header_host',
      message: 'What would you like to send in the host header?',
      default: 'client.example.com'
    }];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  configuring() {
    if (this.props.specPath) {
      this.specPath = this.props.specPath;
      this._updateConfigPath();
      this._validateApi(this.props.specPath);
    }
  }

  writing() {
    this.fs.copy(
      this.templatePath('.*'),
      this.destinationPath()
    );
    // Package
    this.fs.copyTpl(
      this.templatePath('package.json'),
      this.destinationPath('package.json'),
      this
    );
    // Environment
    this.fs.copyTpl(
      this.templatePath('.env'),
      this.destinationPath('.env'),
      this
    );
    // README
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('README.md'),
      this
    );
    // Dredd
    this.fs.copyTpl(
      this.templatePath('dredd.yml'),
      this.destinationPath('dredd.yml'),
      this
    );
    var apiContent;
    if (this.refApi) {
      this.log('ref API found');
      // Write the contents of the specPath location to local config file.
      if (this.ymlApi) {
        apiContent = JsYaml.dump(this.refApi);
      } else {
        apiContent = JSON.stringify(this.refApi, null, 4);
      }
      this.fs.write(this.apiConfigPath, apiContent);
    } else {
      this.log('NO ref API found!');
    }
    // Server.js
    this.fs.copyTpl(
      this.templatePath('server.js'),
      this.destinationPath('server.js'),
      this
    );
    if (this.props.proxyEnabled) {
      this.fs.copyTpl(
        this.templatePath('proxy/*'),
        this.destinationPath('modules/proxy'),
        this
      );
    }
    this._handlers();
    this._security();
    this._mockgen();
    this._data();
  }

  install() {
    if (this.props.makeKeys) {
      this._makeKeys();
    }
    this.yarnInstall();
  }

};
