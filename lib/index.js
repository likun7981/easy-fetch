'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @author: likun,
 * @description: 
 *  This tool add some hook and global config;
 * @example:
 *  import request from 'simple-fetch';
 *  const requestHandle = request('GET http://www.xxx.com',{param:1}).success(()=>{}).error(()=>{})
 *  // You can cancel it 
 *  requestHandle.abort();
 *  // You want to config 
 *  const reqest = request.newInstance({ timeout: 3000 })
 *  const requestHandle = reqest('GET http://www.xxx.com',{param:1}).success(()=>{}).error(()=>{})
 *  // Global config attrs: body, timeout, headers
 */

require('isomorphic-fetch');

var noop = function noop() {};
var configs = {};
var globalKeys = ['body', 'timeout', 'headers', 'onSuccess', 'onComplete', 'onSuccessFilter', 'onError', 'onStart'];

var globalConfig = function globalConfig() {
  var gconfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  globalKeys.forEach(function (key) {
    configs[key] = gconfig[key];
  });
};

var SimpleFetchError = exports.SimpleFetchError = function (_Error) {
  _inherits(SimpleFetchError, _Error);

  function SimpleFetchError() {
    _classCallCheck(this, SimpleFetchError);

    return _possibleConstructorReturn(this, _Error.apply(this, arguments));
  }

  return SimpleFetchError;
}(Error);

var createRequest = function createRequest() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$headers = _ref.headers,
      headers = _ref$headers === undefined ? {} : _ref$headers,
      credentials = _ref.credentials,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === undefined ? 5000 : _ref$timeout,
      _ref$onStart = _ref.onStart,
      onStart = _ref$onStart === undefined ? configs.onStart || noop : _ref$onStart,
      _ref$onComplete = _ref.onComplete,
      onComplete = _ref$onComplete === undefined ? configs.onComplete || noop : _ref$onComplete,
      _ref$onSuccess = _ref.onSuccess,
      onSuccess = _ref$onSuccess === undefined ? configs.onSuccess || noop : _ref$onSuccess,
      _ref$onError = _ref.onError,
      onError = _ref$onError === undefined ? configs.onError || noop : _ref$onError,
      _ref$onSuccessFilter = _ref.onSuccessFilter,
      onSuccessFilter = _ref$onSuccessFilter === undefined ? configs.onSuccessFilter || function (response) {
    return Promise.resolve(response);
  } : _ref$onSuccessFilter;

  timeout = timeout || configs.timeout;
  var assignHeaders = configs.headers ? _extends({}, configs.headers, headers) : headers;
  var options = _extends({}, configs, {
    headers: assignHeaders
  });
  if (credentials) {
    options.credentials = credentials;
  }
  return function (urlWithMethod) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _ref2 = urlWithMethod.indexOf(' ') > 0 ? urlWithMethod.split(/\s+/) : ['GET', urlWithMethod],
        method = _ref2[0],
        url = _ref2[1];

    var assignBody = configs.body ? _extends({}, configs.body, params) : params;
    if (method !== 'GET') {
      options.method = method;
    }
    assignBody = JSON.parse(JSON.stringify(assignBody));
    if (Object.keys(assignBody).length) {
      if (method.toUpperCase() !== 'GET') {
        options.body = JSON.stringify(assignBody);
      } else {
        url += '?' + assignBody;
      }
    }
    var promise = new Promise(function (resolve, reject) {
      onStart();
      fetch(url, options).then(function (response) {
        if (response.ok) {
          var _headers = response.headers;
          onSuccessFilter(response).then(function (result) {
            onSuccess(result);
            onComplete(null, result);
            resolve({ result: result, headers: _headers });
          }, function (error) {
            onError(error);
            onComplete(error);
            reject(error);
          })['catch'](reject);
        } else {
          var error = new SimpleFetchError(response.statusText);
          console.log(error instanceof SimpleFetchError);
          onError(error);
          onComplete(error);
          reject(error);
        }
      }, function (error) {
        onError(error);
        onComplete(error);
        reject(error);
      })['catch'](reject);
    });
    var requestPromise = {};

    promise = abortablePromise(promise);
    requestPromise.success = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then(function (_ref3) {
        var result = _ref3.result,
            headers = _ref3.headers;

        fn(result, headers);
      });
      return requestPromise;
    };
    requestPromise.error = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then(null, fn);
      return requestPromise;
    };
    requestPromise.complete = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then(function () {
        var allOfIt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var result = allOfIt.result;

        fn(null, result);
      }, fn);
      return requestPromise;
    };
    requestPromise.abort = promise.abort;
    requestPromise['catch'] = promise['catch'];
    if (timeout) {
      setTimeout(function () {
        requestPromise.abort('fetch timeout');
      }, timeout);
    }
    return requestPromise;
  };
};

var request = exports.request = createRequest();

exports.globalConfig = globalConfig;
exports.createRequest = createRequest;


function abortablePromise(fetchPromise) {
  var abortFn = null;
  var abortPromise = new Promise(function (resolve, reject) {
    abortFn = function abortFn(message) {
      reject(new SimpleFetchError(message || 'fetch aborted'));
    };
  });
  var abortablePromise = Promise.race([fetchPromise, abortPromise]);
  abortablePromise.abort = abortFn;
  return abortablePromise;
}