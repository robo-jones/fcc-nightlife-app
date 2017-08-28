const createMeetupLocations = require('../models/meetupLocations.model.js');
const createMeetupObject = require('../models/meetup.model.js');

async function findMeetupLocations(placesRepo, meetupsRepo, location, locationFilter, eventFilter) {
    const placeResults = await placesRepo.getPlaces(location, (locationFilter || {}), (eventFilter || {}));
    const placeIds = placeResults.places.map((place) => (place.id));
    const meetups = await meetupsRepo.getMeetups(placeIds);
    const locations = placeResults.places.map((place) => ({
                                                  place,
                                                  meetups: meetups.filter((meetup) => (meetup.location === place.id))
                                          }));
    return createMeetupLocations(placeResults.attributionHtml, locations);
};

async function createMeetup(placesRepo, meetupsRepo, placeId, name, type, creator, startDate, endDate) {
    if (!await placesRepo.isValidPlace(placeId)) {
        throw new Error('Invalid place id passed to createMeetup');
    } else {
        const newMeetup = createMeetupObject(undefined, name, type, startDate, endDate, placeId, creator);
        await meetupsRepo.addMeetup(newMeetup);
    }
};

function factory(placesRepo, meetupsRepo, usersRepo) {
    //verify that all repositories are proviced, and that the provided repositories have all necessary methods
    if (!placesRepo) {
        throw new TypeError('Invalid placesRepo passed to meetups factory');
    }
    if (!placesRepo.getPlaces) {
        throw new TypeError('Invalid placesRepo passed to meetups factory');
    }
    if (!placesRepo.isValidPlace) {
        throw new TypeError('Invalid placesRepo passed to meetups factory');
    }

    if (!meetupsRepo) {
        throw new TypeError('Invalid meetupsRepo passed to meetups factory');
    }
    if (!meetupsRepo.getMeetups) {
        throw new TypeError('Invalid meetupsRepo passed to meetups factory');
    }
    if (!meetupsRepo.addMeetup) {
        throw new TypeError('Invalid meetupsRepo passed to meetups factory');
    }
    if (!meetupsRepo.addAttendee) {
        throw new TypeError('Invalid meetupsRepo passed to meetups factory');
    }
    if (!meetupsRepo.removeAttendee) {
        throw new TypeError('Invalid meetupsRepo passed to meetups factory');
    }

    if(!usersRepo) {
        throw new TypeError('Invalid usersRepo passed to meetups factory');
    }
    if(!usersRepo.isValidUser) {
        throw new TypeError('Invalid usersRepo passed to meetups factory');
    }

    return {
        findMeetupLocations: findMeetupLocations.bind(undefined, placesRepo, meetupsRepo),
        createMeetup: createMeetup.bind(undefined, placesRepo, meetupsRepo),
        rsvp: () => {},
        unRsvp: () => {}
    };
}

module.exports = { factory };