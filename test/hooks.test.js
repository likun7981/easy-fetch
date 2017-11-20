const {
  host,
  paths,
  urls,
  goodResponse,
  doneHandle,
  errorHandle
} = require('./helper');
const nock = require('nock');
const sinon = require('sinon');
const { createRequest } = require('../index');
const { expect } = require('chai');

describe('hook', () => {
  describe('different stages', () => {
    const onErrorSpy = sinon.spy();
    const onStartSpy = sinon.spy();
    const onCompleteSpy = sinon.spy();
    const onSuccessSpy = sinon.spy();
    let request;
    beforeEach(() => {
      onErrorSpy.reset();
      onStartSpy.reset();
      onCompleteSpy.reset();
      onSuccessSpy.reset();
      request = createRequest({
        onStart: onStartSpy,
        onComplete: onCompleteSpy,
        onError: onErrorSpy,
        onSuccess: onSuccessSpy
      });
    });
    it('good request call onStart,onComplete,onSuccess', done => {
      nock(host)
        .get(paths.success)
        .reply(200, goodResponse);
      const request = createRequest({
        onStart: onStartSpy,
        onSuccess: response => {
          errorHandle(() => {
            expect(response.ok).equal(true);
          });
        },
        onError: onErrorSpy,
        onComplete: (error, response) => {
          errorHandle(() => {
            expect(error).equal(null);
            expect(response.ok).equal(true);
          });
        }
      });
      request(urls.success).complete(e => {
        if (e && e.isTestError) return done(e);
        doneHandle(() => {
          expect(onStartSpy.called).equal(true);
          expect(onErrorSpy.called).equal(false);
        }, done);
      });
    });
    it('bad request call onStart,onComplete,onSuccess', done => {
      nock(host)
        .get(paths.fail)
        .reply(404);
      const request = createRequest({
        onStart: onStartSpy,
        onError: error => {
          errorHandle(() => {
            expect(error).to.be.a('error');
          });
        },
        onSuccess: onSuccessSpy,
        onComplete: (error, response) => {
          errorHandle(() => {
            expect(error).to.be.a('error');
            expect(response).equal(undefined);
          });
        }
      });
      request(urls.fail).error(e => {
        if (e && e.isTestError) return done(e);
        doneHandle(() => {
          expect(onStartSpy.called).equal(true);
          expect(onSuccessSpy.called).equal(false);
        }, done);
      });
    });
    it('order of good request : onStart -> onSuccess -> onComplete', done => {
      nock(host)
        .get(paths.success)
        .reply(200, goodResponse);
      request(urls.success).success(() => {
        doneHandle(() => {
          expect(onStartSpy.calledBefore(onSuccessSpy)).equal(true);
          expect(onSuccessSpy.calledBefore(onCompleteSpy)).equal(true);
          expect(onCompleteSpy.called).equal(true);
        }, done);
      });
    });
    it('order of bad request : onStart -> onError -> onComplete', done => {
      nock(host)
        .get(paths.fail)
        .reply(404);
      request(urls.fail).error(() => {
        doneHandle(() => {
          expect(onStartSpy.calledBefore(onErrorSpy)).equal(true);
          expect(onErrorSpy.calledBefore(onCompleteSpy)).equal(true);
          expect(onCompleteSpy.called).equal(true);
        }, done);
      });
    });
  });
  it('the fiter when success request', done => {
    nock(host)
      .get(paths.success)
      .reply(200, goodResponse);
    const request = createRequest({
      successFilter: response => response.text()
    });
    request(urls.success).success(result => {
      doneHandle(() => {
        expect(result).equal(goodResponse);
      }, done);
    });
  });
});
