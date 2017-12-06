/**
 * @author: likun,
 * @description:
 *  This tool add some hook and global config;
 * @example:
 *  import { request, createRequest } from '@likun7981/easy-fetch';
 *  const requestHandle = request('GET http://www.xxx.com',{param:1}).success(()=>{}).error(()=>{})
 *  // You can cancel it
 *  requestHandle.abort();
 *  // You want to config
 *  const reqest = createRequest({ timeout: 3000 })
 *  const requestHandle = reqest('GET http://www.xxx.com',{param:1}).success(()=>{}).error(()=>{})
 *  // Global config attrs: body, timeout, headers
 */

require('isomorphic-fetch');
const stringify = require('qs/lib/stringify');

const noop = () => {};
let configs = {};
const globalKeys = [
  'body',
  'timeout',
  'headers',
  'onSuccess',
  'onComplete',
  'successFilter',
  'onError',
  'onStart'
];
let timeoutHandle;

export const createRequest = (
  {
    headers = {},
    credentials,
    timeout = 5000,
    onStart = configs.onStart || noop,
    onComplete = configs.onComplete || noop,
    onSuccess = configs.onSuccess || noop,
    onError = configs.onError || noop,
    successFilter = configs.successFilter ||
      (response => Promise.resolve(response))
  } = {}
) => {
  timeout = typeof timeout !== 'undefined' ? timeout : configs.timeout;
  const assignHeaders = configs.headers
    ? {
        ...configs.headers,
        ...headers
      }
    : headers;
  const options = {
    ...configs,
    headers: assignHeaders
  };
  if (credentials) {
    options.credentials = credentials;
  }
  return (urlWithMethod, params = {}) => {
    let [method, url] =
      urlWithMethod.indexOf(' ') > 0
        ? urlWithMethod.split(/\s+/)
        : ['GET', urlWithMethod];

    let assignBody = configs.body
      ? {
          ...configs.body,
          ...params
        }
      : params;
    if (method !== 'GET') {
      options.method = method;
    }
    assignBody = JSON.parse(JSON.stringify(assignBody));
    if (Object.keys(assignBody).length) {
      if (method.toUpperCase() !== 'GET') {
        options.body = JSON.stringify(assignBody);
      } else {
        url += `?${stringify(assignBody)}`;
      }
    }
    let abortable;
    let promise = new Promise((resolve, reject) => {
      onStart();
      abortable = abortablePromise(fetch(url, options));
      abortable
        .then(
          response => {
            clearTimeout(timeoutHandle);
            if (response.ok) {
              const headers = response.headers;
              successFilter(response)
                .then(
                  result => {
                    onSuccess(result);
                    onComplete(null, result);
                    resolve({ result, headers });
                  },
                  error => {
                    onError(error);
                    onComplete(error);
                    reject(error);
                  }
                )
                .catch(reject);
            } else {
              const error = new Error(response.statusText);
              onError(error);
              onComplete(error);
              reject(error);
            }
          },
          error => {
            clearTimeout(timeoutHandle);
            if (!(error && error.isAbort)) {
              onError(error);
              onComplete(error);
            }
            reject(error);
          }
        )
        .catch(reject);
    });
    const requestPromise = {};

    requestPromise.success = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(({ result, headers }) => {
        fn(result, headers);
      }, noop);
      return requestPromise;
    };
    requestPromise.error = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(null, error => {
        if (!(error && error.isAbort)) fn(error);
      });
      return requestPromise;
    };
    requestPromise.complete = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise.then(
        (allOfIt = {}) => {
          const { result } = allOfIt;
          fn(null, result);
        },
        error => {
          if (!(error && error.isAbort)) fn(error);
        }
      );
      return requestPromise;
    };
    requestPromise.abort = abortable.abort;
    requestPromise.catch = promise.catch;
    if (typeof timeout !== 'undefined') {
      timeoutHandle = setTimeout(() => {
        requestPromise.abort('fetch timeout');
      }, timeout);
    }
    return requestPromise;
  };
};

export const globalConfig = (gconfig = {}) => {
  globalKeys.forEach(key => {
    configs[key] = gconfig[key];
  });
};

function abortablePromise(fetchPromise) {
  let abortFn = null;
  const abortPromise = new Promise(function(resolve, reject) {
    abortFn = function(message) {
      const cancelError = new Error(message || 'fetch canceled');
      if (!message) {
        // isAbort
        cancelError.isAbort = true;
        console.warn(cancelError.message);
        clearTimeout(timeoutHandle);
      } else {
        cancelError.isTimeout = true;
      }
      reject(cancelError);
    };
  });
  const abortablePromise = Promise.race([fetchPromise, abortPromise]);
  abortablePromise.abort = (message, fn = noop) => {
    if(typeof message === 'function'){
      fn = message;
      message = null;
    }
    fn();
    abortFn(message);
  };
  return abortablePromise;
}
