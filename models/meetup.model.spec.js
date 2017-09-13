const chai = require('chai');
const createMeetup = require('./meetup.model.js');

const expect = chai.expect;

const meetupModelSpec = {
    id: 123,
    name: 'some event',
    type: 'some event type',
    startDate: Date.now(),
    endDate: new Date(Date.now() + 86400000), //1 day later
    location: 'some place id',
    creator: 'some user id',
    attendees: ['some user id']
};

describe('Meetup model', function() {
    it('should create a properly formed meetup object', function() {
        expect(createMeetup(meetupModelSpec)).to.deep.equal(meetupModelSpec);
    });

    it('should default attendees to the creator, if no attendees are provided', function() {
        const { id, name, type, startDate, endDate, location, creator } = meetupModelSpec;
        const attendeeLessMeetup = { id, name, type, startDate, endDate, location, creator };
        expect(createMeetup(attendeeLessMeetup)).to.deep.equal(meetupModelSpec);
    });
});