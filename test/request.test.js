const nock = require('nock');
const { request } = require('../index');
const { expect } = require('chai');
const { host, paths, urls, goodResponse } = require('./helper');

describe('request', () => {
  it('should be defined', () => {
    expect(request).to.be.a('function');
  });
  it('should be success of requests', done => {
    nock(host)
      .get(paths.success)
      .reply(200, goodResponse);
    request(urls.success).success(response => {
      response.text().then(text => {
        expect(text).to.equal(goodResponse);
        done();
      });
    });
  });
  it('should do the right thing with bad requests', done => {
    nock(host)
      .get(paths.fail)
      .reply(404);
    request(urls.fail).error(error => {
      expect(error).to.be.an('error');
      done();
    });
  });
  describe('should be completed with', () => {
    it('good request', done => {
      nock(host)
        .get(paths.success)
        .reply(200, goodResponse);
      request(urls.success).complete((error, response) => {
        expect(error).to.equal(null);
        expect(response.ok).to.equal(true);
        done();
      });
    });
    it('bad request', done => {
      nock(host)
        .get(paths.fail)
        .reply(404);
      request(urls.fail).complete((error, response) => {
        expect(error).to.be.an('error');
        expect(response).to.equal(undefined);
        done();
      });
    });
  });
});
