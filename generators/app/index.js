'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const pem = require('pem');
const Util = require('../../lib/util');
const routeGen = require('../../lib/routegen');
const JsYaml = require('js-yaml');
const Path = require('path');
const Parser = require('swagger-parser');
const Pkg = require('../../package.json');

module.exports = class extends Generator {

  constructor(args, opts) {
    super(args, opts);
    this.argument('appname', {type: String, required: false});
    this.argument('specPath', {type: String, required: false});
    this.argument('handlerPath', {type: String, required: false});
    this.argument('dataPath', {type: String, required: false});
    this.argument('securityPath', {type: String, required: false});
  }

  _setDefaults() {
    var basePath = this.destinationRoot();
    Util.updateConfigPath(this);
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
        route = routeGen(self, path, pathObj);

        if (route.operations && route.operations.length > 0) {
          self.fs.copyTpl(
            self.templatePath('handler.js'),
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
        route = routeGen(self, path, pathObj);
        // Generate the data files.
        if (route.operations && route.operations.length > 0) {
          self.fs.copyTpl(
            self.templatePath('data.js'),
            self.genFilePath,
            route
          );
        }
      });
    }
  }

  _mockgen() {
    var tmpl = {
      apiConfigPath: Util.relative(this.destinationPath(this.mockgenPath), this.apiConfigPath)
    };
    this.fs.copyTpl(
      this.templatePath('mockgen.js'),
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
          self.templatePath('security.js'),
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
      Parser.parse(api, function (error, refApi) {
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
      name: 'project_name',
      message: 'Your project name',
      default: this.options.appname || this.appname
    }, {
      type: 'input',
      name: 'developer_name',
      message: 'Your name',
      save: true
    }, {
      type: 'input',
      name: 'developer_email',
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
      name: 'tls_enabled',
      message: 'Would you like to enable TLS?'
    },
    {
      type: 'confirm',
      name: 'make_keys',
      message: 'Would you like to generate SSL keys?'
    }];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  configuring() {
    if (this.props.specPath) {
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
    this._handlers();
    this._security();
    this._mockgen();
    this._data();
  }

  install() {
    if (this.props.make_keys) {
      this._makeKeys();
    }
    this.yarnInstall();
  }

};
