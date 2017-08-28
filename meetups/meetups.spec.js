const chai = require('chai');
const sinon = require('sinon');
const meetups = require('./meetups.js');
const createPlace = require('../models/place.model.js');
const createPlaceResults = require('../models/placeResults.model.js');
const createMeetupLocations = require('../models/meetupLocations.model.js');
const createMeetup = require('../models/meetup.model.js');

const expect = chai.expect;
const meetupsFactory = meetups.factory;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('meetups business object', function() {
    it('should export an meetups factory function', function() {
        expect(meetups.factory).to.be.a('function');
    });

    describe('meetups factory function', function() {
        const mockPlacesRepo = { getPlaces() {}, isValidPlace() {} };
        const mockMeetupsRepo = { getMeetups() {}, addMeetup() {}, addAttendee() {}, removeAttendee() {} };
        const mockUsersRepo = { isValidUser() {} };
        it('should create a findMeetupLocations() function', function() {
            expect(meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo).findMeetupLocations).to.be.a('function');
        });

        it('should create a createMeetup() function', function() {
            expect(meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo).createMeetup).to.be.a('function');
        });

        it('should create a rsvp() function', function() {
            expect(meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo).rsvp).to.be.a('function');
        });

        it('should create an unRsvp() function', function() {
            expect(meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo).unRsvp).to.be.a('function');
        });

        it('should throw a \'Invalid placesRepo passed to meetups factory\' TypeError if it does not receive a placesRepo with the required methods', function() {
            //meetups requires a placesRepo with getPlaces() and isValidPlace() methods
            const testErrorMessage = 'Invalid placesRepo passed to meetups factory';

            //chai requires expect(...).to.throw() to be provided a function, so meetupsFactory must be wrapped in another function in order to test for errors thrown based on specific arguments
            expect(() => meetupsFactory(undefined, mockMeetupsRepo, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory({ getPlaces() {}, undefined }, mockMeetupsRepo, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory({ undefined, isValidPlace() {} }, mockMeetupsRepo, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
        });

        it('should throw a \'Invalid meetupsRepo passed to meetups factory\' TypeError if it does not receive a meetupsRepo with the required methods', function() {
            //meetups requires a meetupsRepo with getMeetups() , addMeetup(), addAttendee(), and removeAttendee() methods
            const testErrorMessage = 'Invalid meetupsRepo passed to meetups factory';

            //chai requires expect(...).to.throw() to be provided a function, so meetupsFactory must be wrapped in another function in order to test for errors thrown based on specific arguments
            expect(() => meetupsFactory(mockPlacesRepo, undefined, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory(mockPlacesRepo, { undefined, addMeetup() {}, addAttendee() {}, removeAttendee() {} }, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory(mockPlacesRepo, { getMeetups() {}, undefined, addAttendee() {}, removeAttendee() {} }, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory(mockPlacesRepo, { getMeetups() {}, addMeetup() {}, undefined, removeAttendee() {} }, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory(mockPlacesRepo, { getMeetups() {}, addMeetup() {}, addAttendee() {}, undefined }, mockUsersRepo)).to.throw(TypeError, testErrorMessage);
        });
        it('should throw a \'Invalid usersRepo passed to meetups factory\' TypeError if it does not receive a usersRepo with the required methods', function() {
            //meetups requires a meetupsRepo with a isValidUser() method
            const testErrorMessage = 'Invalid usersRepo passed to meetups factory';

            //chai requires expect(...).to.throw() to be provided a function, so meetupsFactory must be wrapped in another function in order to test for errors thrown based on specific arguments
            expect(() => meetupsFactory(mockPlacesRepo, mockMeetupsRepo, undefined)).to.throw(TypeError, testErrorMessage);
            expect(() => meetupsFactory(mockPlacesRepo, mockMeetupsRepo, { undefined })).to.throw(TypeError, testErrorMessage);
        });
    });

    describe('findMeetupLocations()', function() {
        let mockPlacesRepo, mockMeetupsRepo;
        const testCity = 'some city';
        const testPlace = createPlace('1234', 'some place');
        const testAttributionHtml = 'some attribution html';
        const testPlaceResults = createPlaceResults(testAttributionHtml, undefined, [testPlace]);
        const testMeetup = createMeetup(undefined, 'some meetup', 'some meetup type', Date.now(), undefined, testPlace.id, 'some creator', ['some user id']);
        const testMeetupLocations = createMeetupLocations(testAttributionHtml, [{ place: testPlace, meetups: [testMeetup] }]);
        const mockUsersRepo = { isValidUser() {} };

        beforeEach(function() {
            mockPlacesRepo = {
                getPlaces(location, types, radius) { return Promise.resolve(testPlaceResults); },
                isValidPlace() {}
            };
            mockMeetupsRepo = {
                getMeetups(locations, type, fromDate, toDate) { return Promise.resolve([testMeetup]); },
                addMeetup() {},
                addAttendee() {},
                removeAttendee() {}
            };
        });

        it('should query the places repository with the supplied parameters', async function() {
            const testLocationFilter = { type: 'some location type' };
            const testMeetupFilter = { type: 'some meetup type' };
            const getPlacesSpy = sinon.spy(mockPlacesRepo, 'getPlaces');
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            await meetups.findMeetupLocations(testCity, testLocationFilter, testMeetupFilter);

            expect(getPlacesSpy).to.have.been.calledWith(testCity, testLocationFilter, testMeetupFilter);
        });

        it('should provide default values for locationFilter and meetupFilter', async function() {
            const getPlacesSpy = sinon.spy(mockPlacesRepo, 'getPlaces');
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            await meetups.findMeetupLocations(testCity);

            expect(getPlacesSpy).to.have.been.calledWith(testCity, {}, {});
        });

        it('should query the meetups repository with the place ids extracted from the return of placeRepo.getPlaces()', async function() {
            const getMeetupsSpy = sinon.spy(mockMeetupsRepo, 'getMeetups');
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            await meetups.findMeetupLocations(testCity);

            expect(getMeetupsSpy).to.have.been.calledWith([testPlace.id]);
        });

        it('should return a Promise that resolves to an meetupLocations object containing the requested meetups at the requested location', function() {
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            const result = meetups.findMeetupLocations(testCity);

            return expect(result).to.eventually.become(testMeetupLocations);
        });

        it('should pass through errors from placesRepo.getPlaces()', function() {
            const testError = new Error('some error with getPlaces()');
            sinon.stub(mockPlacesRepo, 'getPlaces').rejects(testError);
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            const result = meetups.findMeetupLocations(testCity);

            return expect(result).to.eventually.be.rejectedWith(testError);
        });

        it('should pass through errors from meetupsRepo.getMeetups()', function() {
            const testError = new Error('some error with getMeetups()');
            sinon.stub(mockMeetupsRepo, 'getMeetups').rejects(testError);
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);

            const result = meetups.findMeetupLocations(testCity);

            return expect(result).to.eventually.be.rejectedWith(testError);
        });
    });

    describe('createMeetup()', function() {
        let mockPlacesRepo, mockMeetupsRepo;
        const mockUsersRepo = { isValidUser() {} };
        const testPlace = createPlace('1234', 'some place');
        const testMeetup = createMeetup(undefined, 'some meetup', 'some meetup type', Date.now(), undefined, testPlace.id, 'some creator id', ['some creator id']);

        beforeEach(function() {
            mockPlacesRepo = {
                getPlaces() {},
                isValidPlace(placeId) {
                    return Promise.resolve(true);
                }
            };
            mockMeetupsRepo = {
                getMeetups() {},
                addMeetup() {},
                addAttendee() {},
                removeAttendee() {}
            };
        });

        it('should check that the provided placeId is valid', function() {
            const isValidPlaceSpy = sinon.spy(mockPlacesRepo, 'isValidPlace');
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);
            const { name, type, creator, startDate } = testMeetup;

            meetups.createMeetup(testPlace.id, name, type, creator, startDate);

            expect(isValidPlaceSpy).to.have.been.calledWith(testPlace.id);
        });

        it('should return a rejected Promise with an \'Invalid place id passed to createMeetup\' error if the placeId is invalid', function() {
            sinon.stub(mockPlacesRepo, 'isValidPlace').returns(Promise.resolve(false));
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);
            const { name, type, creator, startDate } = testMeetup;

            const result = meetups.createMeetup(testPlace.id, name, type, creator, startDate);

            return expect(result).to.eventually.be.rejectedWith('Invalid place id passed to createMeetup');
        });

        it('should call meetupsRepo.addMeetup() with a properly formed Meetup object', async function() {
            const addMeetupSpy = sinon.spy(mockMeetupsRepo, 'addMeetup');
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);
            const { name, type, creator, startDate } = testMeetup;

            await meetups.createMeetup(testPlace.id, name, type, creator, startDate);

            expect(addMeetupSpy).to.have.been.calledWith(testMeetup);
        });

        it('should pass through errors from meetupsRepo.addMeetup()', function() {
            const testError = new Error('an error occurred in addMeetup()');
            sinon.stub(mockMeetupsRepo, 'addMeetup').rejects(testError);
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);
            const { name, type, creator, startDate } = testMeetup;

            const result = meetups.createMeetup(testPlace.id, name, type, creator, startDate);

            return expect(result).to.eventually.be.rejectedWith(testError);
        });

        it('should pass through errors from placesRepo.isValidPlace()', function() {
            const testError = new Error('an error occurred in isValidPlace()');
            sinon.stub(mockPlacesRepo, 'isValidPlace').rejects(testError);
            const meetups = meetupsFactory(mockPlacesRepo, mockMeetupsRepo, mockUsersRepo);
            const { name, type, creator, startDate } = testMeetup;

            const result = meetups.createMeetup(testPlace.id, name, type, creator, startDate);

            return expect(result).to.eventually.be.rejectedWith(testError);
        });
    });
});