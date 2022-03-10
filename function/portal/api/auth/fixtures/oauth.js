const env = require('../../../env-urls');

async function authPayload(username = 'qa@absencesoft.com') {
  return {
    grant_type: 'password',
    username,
    password: env.loginInfo.default.password,
  };
}

module.exports = {
  authPayload,
};
