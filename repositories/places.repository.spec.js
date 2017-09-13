const chai = require('chai');
const sinon = require('sinon');
const placesRepo = require('./places.repository.js');
const apiConfig = require('../config/config.js').googlePlacesApi;
const createPlaceResults = require('../models/placeResults.model.js');
const createPlace = require('../models/place.model.js');

const placesRepoFactory = placesRepo.factory;
const expect = chai.expect;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('Places Repository', function() {
    it('should export a factory function', function() {
        expect(placesRepo.factory).to.be.a('function');
    });

    describe('factory function', function() {
        const mockGetJson = function() {};
        it('should create a getPlaces() function', function() {
            expect(placesRepoFactory(mockGetJson).getPlaces).to.be.a('function');
        });

        it('should create a isValidPlace() function', function() {
            expect(placesRepoFactory(mockGetJson).isValidPlace).to.be.a('function');
        });

        it('should throw an \'Invalid getJson function passed to placesRepository factory\' TypeError if it does not receive a valid getJson function', function() {
            const testError = new TypeError('Invalid getJson function passed to placesRepository factory');
            expect(() => placesRepoFactory(undefined)).to.throw(TypeError, testError.message);
            expect(() => placesRepoFactory({})).to.throw(TypeError, testError.message);
        });
    });

    describe('getPlaces()', function() {
        const testLocation = {
            lat: 45,
            lng: 123
        };
        const testPlaceType = 'somePlaceType';
        const testSearchRadius = 50000;
        const mockApiResponse = {
                html_attributions: ['1'],
                results: [
                    {
                        geometry: {
                            location: {
                                lat: 123,
                                lng: 123
                            }
                        },
                        icon: 'someiconurl',
                        id: '321',
                        name: 'somewhere',
                        opening_hours: {
                            open_now: true
                        },
                        photos: [
                            {
                                height: 100,
                                html_attributions: ['1'],
                                photo_reference: 'somephotoreference',
                                width: 100
                            }
                        ],
                        place_id: '123',
                        scope: 'GOOGLE',
                        alt_ids: [
                            {
                                place_id: '231',
                                scope: 'APP'
                            }
                        ],
                        reference: 'somereference',
                        types: ['bar', 'food'],
                        vicinity: 'some location'
                    }
                ],
                status: 'OK',
                next_page_token: 'sometoken'
            };
        const testPlace = createPlace(mockApiResponse.results[0].place_id, mockApiResponse.results[0].name, mockApiResponse.results[0].photos[0].photo_reference, mockApiResponse.results[0].photos[0].html_attributions);
        const expectedPlaceResults = createPlaceResults(mockApiResponse.html_attributions, mockApiResponse.next_page_token, testPlace);

        it('should make a request to the google places api', function() {
            const expectedUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiConfig.apiKey}&location=${testLocation.lat},${testLocation.lng}&radius=${testSearchRadius}&type=${testPlaceType}`;
            const getAsJsonSpy = sinon.stub().resolves(mockApiResponse);
            const placesRepo = placesRepoFactory(getAsJsonSpy);

            placesRepo.getPlaces(testLocation, testPlaceType, testSearchRadius);

            expect(getAsJsonSpy).to.have.been.calledWith(expectedUrl);
        });

        it('should return a Promise that resolves to a PlaceResults object with the places from the google API', function() {
            const mockGetAsJson = sinon.stub().resolves(mockApiResponse);
            const placesRepo = placesRepoFactory(mockGetAsJson);

            return expect(placesRepo.getPlaces(testLocation, testPlaceType, testSearchRadius)).to.eventually.deep.equal(expectedPlaceResults);
        });

        it('should reject the Promise with an \'Error with Google API request in placesRepository.getPlaces()\' Error, with the status code from the API if an error occurs with the Google places API', function() {
            const firstMockGetAsJson = sinon.stub().resolves({ status: 'OVER_QUERY_LIMIT' });
            const firstExpectedError = new Error('Error with Google API request in placesRepository.getPlaces(): OVER_QUERY_LIMIT');
            const firstPlacesRepo = placesRepoFactory(firstMockGetAsJson);

            const firstResult = firstPlacesRepo.getPlaces(testLocation, testPlaceType, testSearchRadius);

            const secondMockGetAsJson = sinon.stub().resolves({ status: 'REQUEST_DENIED' });
            const secondExpectedError = new Error('Error with Google API request in placesRepository.getPlaces(): REQUEST_DENIED');
            const secondPlacesRepo = placesRepoFactory(secondMockGetAsJson);

            const secondResult = secondPlacesRepo.getPlaces(testLocation, testPlaceType, testSearchRadius);

            const thirdMockGetAsJson = sinon.stub().resolves({ status: 'INVALID_REQUEST' });
            const thirdExpectedError = new Error('Error with Google API request in placesRepository.getPlaces(): INVALID_REQUEST');
            const thirdPlacesRepo = placesRepoFactory(thirdMockGetAsJson);

            const thirdResult = thirdPlacesRepo.getPlaces(testLocation, testPlaceType, testSearchRadius);

            return Promise.all([expect(firstResult).to.eventually.be.rejectedWith(firstExpectedError.message),
                                expect(secondResult).to.eventually.be.rejectedWith(secondExpectedError.message),
                                expect(thirdResult).to.eventually.be.rejectedWith(thirdExpectedError.message)]);
        });
    });

    describe('isValidPlace()', function() {
        const testPlaceId = '123';
          it('should make a request to the google places api', function() {
              const expectedUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${testPlaceId}&key=${apiConfig.apiKey}`;
              const getAsJsonSpy = sinon.stub().resolves({ status: 'OK' });
              const placesRepo = placesRepoFactory(getAsJsonSpy);

              placesRepo.isValidPlace(testPlaceId);

              expect(getAsJsonSpy).to.have.been.calledWith(expectedUrl);
          });

          it('should return a Promise that resolves to true if the google places api has a matching place', function() {
              const mockGetAsJson = sinon.stub().resolves({ status: 'OK' });
              const placesRepo = placesRepoFactory(mockGetAsJson);

              const result = placesRepo.isValidPlace(testPlaceId);

              return expect(result).to.eventually.equal(true);
          });

          it('should return a Promise that resolves to false if the google places api does not have a matching place', function() {
              const firstMockGetAsJson = sinon.stub().resolves({ status: 'NOT_FOUND' });
              const firstPlacesRepo = placesRepoFactory(firstMockGetAsJson);

              const firstResult = firstPlacesRepo.isValidPlace(testPlaceId);

              const secondMockGetAsJson = sinon.stub().resolves({ status: 'ZERO_RESULTS' });
              const secondPlacesRepo = placesRepoFactory(secondMockGetAsJson);

              const secondResult = secondPlacesRepo.isValidPlace(testPlaceId);

              return Promise.all([expect(firstResult).to.eventually.equal(false),
                                  expect(secondResult).to.eventually.equal(false)]);
          });

          it('should reject the Promise with an \'Error with Google API request in placesRepository.isValidPlace()\' Error, with the status code from the API if an error occurs with the Google places API', function() {
            const firstMockGetAsJson = sinon.stub().resolves({ status: 'OVER_QUERY_LIMIT' });
            const firstExpectedError = new Error('Error with Google API request in placesRepository.isValidPlace(): OVER_QUERY_LIMIT');
            const firstPlacesRepo = placesRepoFactory(firstMockGetAsJson);
            const firstResult = firstPlacesRepo.isValidPlace(testPlaceId);

            const secondMockGetAsJson = sinon.stub().resolves({ status: 'REQUEST_DENIED' });
            const secondExpectedError = new Error('Error with Google API request in placesRepository.isValidPlace(): REQUEST_DENIED');
            const secondPlacesRepo = placesRepoFactory(secondMockGetAsJson);
            const secondResult = secondPlacesRepo.isValidPlace(testPlaceId);

            const thirdMockGetAsJson = sinon.stub().resolves({ status: 'INVALID_REQUEST' });
            const thirdExpectedError = new Error('Error with Google API request in placesRepository.isValidPlace(): INVALID_REQUEST');
            const thirdPlacesRepo = placesRepoFactory(thirdMockGetAsJson);
            const thirdResult = thirdPlacesRepo.isValidPlace(testPlaceId);

            const fourthMockGetAsJson = sinon.stub().resolves({ status: 'UNKNOWN_ERROR' });
            const fourthExpectedError = new Error('Error with Google API request in placesRepository.isValidPlace(): UNKNOWN_ERROR');
            const fourthPlacesRepo = placesRepoFactory(fourthMockGetAsJson);
            const fourthResult = fourthPlacesRepo.isValidPlace(testPlaceId);

            return Promise.all([expect(firstResult).to.eventually.be.rejectedWith(firstExpectedError.message),
                                expect(secondResult).to.eventually.be.rejectedWith(secondExpectedError.message),
                                expect(thirdResult).to.eventually.be.rejectedWith(thirdExpectedError.message),
                                expect(fourthResult).to.eventually.be.rejectedWith(fourthExpectedError.message)]);
        });
    });
});