const chai = require('chai');
const config = require('./config.js');

const expect = chai.expect;

describe('config', function() {
    it('should export an object with configuration data', function() {
        expect(config).to.be.an('object');
    });

    it('should have all the required fields', function() {
        expect(config.googlePlacesApi).to.exist;
    });

    describe('google places API', function() {
        it('should retrieve the API key from process.env.GOOGLE_API_KEY', function() {
            expect(config.googlePlacesApi.apiKey).to.equal(process.env.GOOGLE_API_KEY);
        });
    });
});