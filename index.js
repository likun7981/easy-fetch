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

const globalConfig = (gconfig = {}) => {
  globalKeys.forEach(key => {
    configs[key] = gconfig[key];
  });
};

const createRequest = (
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
  timeout = timeout || configs.timeout;
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
        url += `?${assignBody}`;
      }
    }
    let promise = new Promise((resolve, reject) => {
      onStart();
      fetch(url, options)
        .then(
          response => {
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
            onError(error);
            onComplete(error);
            reject(error);
          }
        )
        .catch(reject);
    });
    const requestPromise = {};

    promise = abortablePromise(promise);
    requestPromise.success = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then(({ result, headers }) => {
        fn(result, headers);
      });
      return requestPromise;
    };
    requestPromise.error = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then(null, error => {
        fn(error);
      });
      return requestPromise;
    };
    requestPromise.complete = fn => {
      fn = typeof fn === 'function' ? fn : noop;
      promise = promise.then((allOfIt = {}) => {
        const { result } = allOfIt;
        fn(null, result);
      }, fn);
      return requestPromise;
    };
    requestPromise.abort = promise.abort;
    requestPromise.catch = promise.catch;
    if (timeout) {
      setTimeout(() => {
        requestPromise.abort('fetch timeout');
      }, timeout);
    }
    return requestPromise;
  };
};

export const request = createRequest();

export { globalConfig, createRequest };

function abortablePromise(fetchPromise) {
  let abortFn = null;
  const abortPromise = new Promise(function(resolve, reject) {
    abortFn = function(message) {
      reject(new Error(message || 'fetch aborted'));
    };
  });
  const abortablePromise = Promise.race([fetchPromise, abortPromise]);
  abortablePromise.abort = abortFn;
  return abortablePromise;
}
