var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * @author: likun,
 * @description: 
 *  This tool class can only be used to receive and process json data, 
 *  other data please use fetch native
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
import stringify from 'qs/lib/stringify';

var noop = function noop() {};
var configs = {};

var globalConfig = function globalConfig() {
  var gconfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  Object.keys(gconfig).forEach(function (key) {
    configs[key] = gconfig[key];
  });
};

var createRequest = function createRequest() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$headers = _ref.headers,
      headers = _ref$headers === undefined ? {} : _ref$headers,
      credentials = _ref.credentials,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === undefined ? 5000 : _ref$timeout,
      _ref$onStart = _ref.onStart,
      onStart = _ref$onStart === undefined ? noop : _ref$onStart,
      _ref$onComplete = _ref.onComplete,
      onComplete = _ref$onComplete === undefined ? noop : _ref$onComplete,
      _ref$onSuccess = _ref.onSuccess,
      onSuccess = _ref$onSuccess === undefined ? noop : _ref$onSuccess,
      _ref$onError = _ref.onError,
      onError = _ref$onError === undefined ? noop : _ref$onError,
      _ref$onSuccessFilter = _ref.onSuccessFilter,
      onSuccessFilter = _ref$onSuccessFilter === undefined ? function (response) {
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

    var _ref2 = urlWithMethod.indexOf(' ') ? urlWithMethod.split(/\s+/) : ['GET', urlWithMethod],
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
        url += '?' + stringify(assignBody);
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
          });
        } else {
          var error = new Error(response.statusText);
          onError(error);
          onComplete(error);
          reject(error);
        }
      }, function (error) {
        onError(error);
        onComplete(error);
        reject(error);
      });
    });
    var requestPromise = {};
    requestPromise.success = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(function (_ref3) {
        var result = _ref3.result,
            headers = _ref3.headers;

        fn(result, headers);
      }, noop);
      return requestPromise;
    };
    requestPromise.error = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(noop, fn);
      return requestPromise;
    };
    requestPromise.complete = function (fn) {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(function (result) {
        fn(null, result);
      }, fn);
      return requestPromise;
    };
    requestPromise.abort = abortablePromise(promise).abort;
    if (timeout) {
      setTimeout(function () {
        requestPromise.abort('fetch timeout');
      }, timeout);
    }
    return requestPromise;
  };
};

export var request = createRequest();

export { globalConfig, createRequest };

function abortablePromise(fetchPromise) {
  var abortFn = null;
  var abortPromise = new Promise(function (resolve, reject) {
    abortFn = function abortFn(message) {
      reject(message || 'fetch aborted');
    };
  });
  var abortablePromise = Promise.race([fetchPromise, abortPromise])['catch'](function (error) {
    console.log(error.message);
  });
  abortablePromise.abort = abortFn;
  return abortablePromise;
}