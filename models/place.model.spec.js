const chai = require('chai');
const createPlace = require('./place.model.js');

const expect = chai.expect;


const placeModelSpec = {
    id: '1234',
    name: 'some place',
    photoId: 'some photo id',
    photoAttributionHtml: 'some photoAttributionHtml'
};
    
describe('Place model', function() {
    
    it('should create a properly formed place object', function() {
        const { id, name, photoId, photoAttributionHtml } = placeModelSpec;
        expect(createPlace(id, name, photoId, photoAttributionHtml)).to.deep.equal(placeModelSpec);
    });
});

module.exports = placeModelSpec;