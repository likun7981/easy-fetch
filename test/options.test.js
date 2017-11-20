const { host, paths, urls, doneHandle } = require('./helper');
const nock = require('nock');
const { createRequest } = require('../index');
const { expect } = require('chai');

describe('options', () => {
  it('set request headers, it should be effected', done => {
    nock(host)
      .get(paths.success)
      .reply(200, function() {
        return this.req.headers['x-test-header'][0];
      });
    const request = createRequest({
      headers: {
        'x-test-header': 'basic'
      }
    });
    request(urls.success).success(response => {
      response.text().then(result => {
        doneHandle(() => {
          expect(result).equal('basic');
        }, done);
      });
    });
  });
  it('set timeout=3000ms, after 4000ms, the request should be timeout', done => {
    nock(host)
      .get(paths.delay)
      .delay(4000)
      .reply(200);
    const request = createRequest({
      timeout: 3000
    });
    request(urls.delay).error(error => {
      doneHandle(() => {
        expect(error.message).equal('fetch timeout');
      }, done);
    });
  });
});
