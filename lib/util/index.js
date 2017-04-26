'use strict';
var Path = require('path');

/**
 * List of supported operations
 */
var operationType = [
  'get',
  'post',
  'put',
  'delete',
  'head',
  'options',
  'patch'
];

module.exports = {
  relative: buildRelativePath,
  operationType: operationType,
  updateConfigPath: updateConfigPath
};

/**
 * Build relative path for module import.
 */
function buildRelativePath(from, to) {
  var dirname = Path.dirname(from);
  var relative = Path.relative(dirname, to);
  if (startsWith(relative, '.' + Path.sep) || startsWith(relative, '..' + Path.sep)) {
        // Path is not originating from dirname
    return relative;
  }
        // Path is originating from dirname. Prefix `./` for dirname
  return '.' + Path.sep + relative;
}


/**
 * Update the apiConfigPath values based on options or user prompts
 */
function updateConfigPath(generator) {
  var ext = '.json';
  generator.ymlApi = false;
  if (generator.specPath &&
        (Path.extname(generator.specPath) === '.yml' || Path.extname(generator.specPath) === '.yaml')) {
    ext = Path.extname(generator.specPath);
    generator.ymlApi = true;
  }
  generator.specPathRel = '.' + Path.sep + 'modules' + Path.sep + 'mocks' + Path.sep + 'config' + Path.sep + 'swagger' + ext;
  generator.apiConfigPath = generator.options.apiConfigPath || Path.join(generator.destinationPath(), generator.specPathRel);
}

function startsWith(str, substr) {
  if (str.substr(0, substr.length) === substr) {
    return true;
  }
  return false;
}

