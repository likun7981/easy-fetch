export const host = 'https://simple-fetch.org';

export const paths = {
  success: '/success',
  fail: '/fail',
  delay: '/delay'
};
export const urls = {
  success: host + paths.success,
  fail: host + paths.fail,
  delay: host + paths.delay
};

export const goodResponse = 'Hello World';

export const doneHandle = (expect, done, e) => {
  try {
    expect();
  } catch (e) {
    if (e.isTestError) return done(e);
  }
  done();
};
export const errorHandle = expect => {
  try {
    expect();
  } catch (e) {
    e.isTestError = true;
    throw e;
  }
};
