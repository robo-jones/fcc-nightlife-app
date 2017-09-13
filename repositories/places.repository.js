const apiConfig = require('../config/config.js').googlePlacesApi;
const createPlace = require('../models/place.model.js');
const createPlaceResults = require('../models/placeResults.model.js');

async function getPlaces(getAsJson, location, type, radius) {
    const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiConfig.apiKey}&location=${location.lat},${location.lng}&radius=${radius}&type=${type}`;
    const apiResponse = await getAsJson(requestUrl);
    if (apiResponse.status !== 'OK' && apiResponse.status !== 'ZERO_RESULTS') {
        throw new Error(`Error with Google API request in placesRepository.getPlaces(): ${apiResponse.status}`);
    }
    const places = apiResponse.results.map((result) => createPlace(result.place_id, result.name, result.photos[0].photo_reference, result.photos[0].html_attributions));
    const placeResults = createPlaceResults(apiResponse.html_attributions, apiResponse.next_page_token, places);

    return placeResults;
};

async function isValidPlace(getAsJson, placeId) {
    const requesrUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${apiConfig.apiKey}`;
    const apiResponse = await getAsJson(requesrUrl);

    if (apiResponse.status !== 'OK' && apiResponse.status !== 'NOT_FOUND' && apiResponse.status !== 'ZERO_RESULTS') {
        throw new Error(`Error with Google API request in placesRepository.isValidPlace(): ${apiResponse.status}`);
    }

    return ((apiResponse.status !== 'NOT_FOUND') && (apiResponse.status !== 'ZERO_RESULTS'));
};

function factory(getAsJson) {
    if (!getAsJson) {
        throw new TypeError('Invalid getJson function passed to placesRepository factory');
    }
    if (typeof(getAsJson) !== 'function') {
        throw new TypeError('Invalid getJson function passed to placesRepository factory');
    }
    return {
        getPlaces: getPlaces.bind(undefined, getAsJson),
        isValidPlace: isValidPlace.bind(undefined, getAsJson)
    };
}

module.exports = { factory };