const chai = require('chai');
const createPlaceResults = require('./placeResults.model.js');

const expect = chai.expect;

describe('PlaceResults model', function() {
    const testPlace = { someKey: 'some value' };
    
    const placeResultsModelSpec = {
        attributionHtml: 'some attributionHtml',
        nextPageToken: '1234',
        places: [testPlace]
    };
    
    it('should create a properly formed placeResults object', function() {
        const { attributionHtml, nextPageToken, places } = placeResultsModelSpec;
        expect(createPlaceResults(attributionHtml, nextPageToken, places)).to.deep.equal(placeResultsModelSpec);
    });
    
    it('should coerce places to an array if no places are provided, or if only one place is provided', function() {
        const { attributionHtml, nextPageToken, places } = placeResultsModelSpec;
        expect(createPlaceResults(attributionHtml, nextPageToken, undefined).places).to.be.an('array');
        expect(createPlaceResults(attributionHtml, nextPageToken, places[0]).places).to.be.an('array');
    });
});