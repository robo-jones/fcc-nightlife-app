const chai = require('chai');
const createMeetupLocations = require('./meetupLocations.model.js');

const expect = chai.expect;

const meetupLocationsSpec = {
    attributionHtml: 'some attribution html',
    locations: [
        {
            place: { someKey: 'some value' },
            meetups: [ { someOtherKey: 'some other value '} ]
        }
    ]
};

describe('MeetupLocations model', function() {
    const { attributionHtml, locations } = meetupLocationsSpec;
    expect(createMeetupLocations(attributionHtml, locations)).to.deep.equal(meetupLocationsSpec);
});