const request = require('supertest');
const env = require('../../env-urls');
const { authPayload } = require('./fixtures/oauth');

class AuthAPI {
  static async getAuthToken(username) {
    return request(env.authURL)
      .post('/oauth2/token')
      .send(await authPayload(username))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-AT-APPLICATION', 'Portal')
      .expect(200)
      .then((response) => {
        const token = response.body.access_token;
        return token;
      });
  }
}
module.exports = {
  AuthAPI,
};
