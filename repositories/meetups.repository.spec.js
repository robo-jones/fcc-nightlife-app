const chai = require('chai');
const sinon = require('sinon');
const meetupsRepository = require('./meetups.repository.js');
const createUserObject = require('../models/user.model.js');
const createMeetupObject = require('../models/meetup.model.js');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const meetupsRepositoryFactory = meetupsRepository.factory;

describe('Meetups repository', function() {
    it('should export a factory function', function() {
        expect(meetupsRepository.factory).to.be.a('function');
    });

    describe('factory function', function() {
        const mockDb = { query: () => {} };

        it('should create a getMeetups() function', function() {
            expect(meetupsRepositoryFactory(mockDb).getMeetups).to.be.a('function');
        });
        it('should create an addAttendee() function', function() {
            expect(meetupsRepositoryFactory(mockDb).addAttendee).to.be.a('function');
        });
        it('should create an addMeetup() function', function() {
            expect(meetupsRepositoryFactory(mockDb).addMeetup).to.be.a('function');
        });
        it('should create a removeAttendee() function', function() {
            expect(meetupsRepositoryFactory(mockDb).removeAttendee).to.be.a('function');
        });
        it('should throw an \'Invalid database connection passed to meetupsRepository factory\' TypeError if it does not receive a valid database connection', function() {
            expect(() => meetupsRepositoryFactory(undefined)).to.throw(TypeError, 'Invalid database connection passed to meetupsRepository factory');
        });
    });

    describe('getMeetups()', function() {
        const testLocations= ['some place id', 'some other place id'];
        const testType = 'some event type';
        const testStartDate = new Date('June 9, 2018');
        const testEndDate = new Date('June 10, 2018');

        it('should query the database for meetups at the provided locations', function() {
            const mockDb = {
                query: function() {}
            };
            const dbSpy = sinon.stub(mockDb, 'query').resolves([]);
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedRawSql = `SELECT meetups.id,
                                           meetups.name,
                                           meetups.type,
                                           meetups.startDate,
                                           meetups.endDate,
                                           meetups.location,
                                           JSON_AGG((SELECT data FROM (SELECT u1.id, u1.username) data))::json->0 AS creator,
                                           JSON_AGG((SELECT data FROM (SELECT u2.id, u2.uertname) data)) AS attendees
                                    FROM meetups
                                    LEFT JOIN users u1 ON u1.id = meetups.creator
                                    LEFT JOIN users u2 ON u2.id = ANY(meetups.attendees)
                                    WHERE meetups.location = ANY($1) AND meetups.startDate >= $2 AND meetups.endDate <= $3
                                    GROUP BY meetups.id;`;
            const expectedSql = expectedRawSql.replace(/\s+/g,' ').trim(); //since this is a YUGE query, trim any formatting spaces from it to make comparison less brittle

            meetupsRepository.getMeetups(testLocations);

            expect(dbSpy.firstCall.args[0].replace(/\s+/g,' ').trim()).to.equal(expectedSql); //trim any formatting spaces from the actual sql to ensure a good comparison
            expect(dbSpy.firstCall.args[1]).to.contain(testLocations);
        });

        it('should return a Promise that resolves to an array of properly formed Meetup objects', function() {
            const testPerson = createUserObject({ id: 789, name: 'some user' });
            const testMeetupData = {
                id: 123,
                name: 'some event',
                type: 'nightlife',
                startDate: new Date('June 9, 2018'),
                endDate: new Date('June 9, 2018'),
                location: '456',
                creator: testPerson,
                attendees: [ testPerson ]
            };
            const testMeetups = [ createMeetupObject(testMeetupData), createMeetupObject(testMeetupData) ];
            const mockDb = {
                query: () => Promise.resolve([ testMeetupData, testMeetupData ])
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            const result = meetupsRepository.getMeetups(testLocations);

            return expect(result).to.eventually.deep.equal(testMeetups);
        });

        it('should filter meetups by type', function() {
            const mockDb = {
                query: function() {}
            };
            const dbSpy = sinon.stub(mockDb, 'query').resolves([]);
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedRawSql = `SELECT meetups.id,
                                           meetups.name,
                                           meetups.type,
                                           meetups.startDate,
                                           meetups.endDate,
                                           meetups.location,
                                           JSON_AGG((SELECT data FROM (SELECT u1.id, u1.username) data))::json->0 AS creator,
                                           JSON_AGG((SELECT data FROM (SELECT u2.id, u2.uertname) data)) AS attendees
                                    FROM meetups
                                    LEFT JOIN users u1 ON u1.id = meetups.creator
                                    LEFT JOIN users u2 ON u2.id = ANY(meetups.attendees)
                                    WHERE meetups.location = ANY($1) AND meetups.type = $2 AND meetups.startDate >= $3 AND meetups.endDate <=$4
                                    GROUP BY meetups.id;`;
            const expectedSql = expectedRawSql.replace(/\s+/g,' ').trim(); //since this is a YUGE query, trim any formatting spaces from it to make comparison less brittle
            meetupsRepository.getMeetups(testLocations, testType);

            expect(dbSpy.firstCall.args[0].replace(/\s+/g,' ').trim()).to.equal(expectedSql); //trim any formatting spaces from the actual sql to ensure a good comparison
            expect(dbSpy.firstCall.args[1]).to.contain(testType);
        });

        it('should filter meetups by start date', function() {
            const mockDb = {
                query: function() {}
            };
            const dbSpy = sinon.stub(mockDb, 'query').resolves([]);
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedRawSql = `SELECT meetups.id,
                                           meetups.name,
                                           meetups.type,
                                           meetups.startDate,
                                           meetups.endDate,
                                           meetups.location,
                                           JSON_AGG((SELECT data FROM (SELECT u1.id, u1.username) data))::json->0 AS creator,
                                           JSON_AGG((SELECT data FROM (SELECT u2.id, u2.uertname) data)) AS attendees
                                    FROM meetups
                                    LEFT JOIN users u1 ON u1.id = meetups.creator
                                    LEFT JOIN users u2 ON u2.id = ANY(meetups.attendees)
                                    WHERE meetups.location = ANY($1) AND meetups.type = $2 AND meetups.startDate >= $3 AND meetups.endDate <=$4
                                    GROUP BY meetups.id;`;
            const expectedSql = expectedRawSql.replace(/\s+/g,' ').trim(); //since this is a YUGE query, trim any formatting spaces from it to make comparison less brittle
            meetupsRepository.getMeetups(testLocations, testType, testStartDate);

            expect(dbSpy.firstCall.args[0].replace(/\s+/g,' ').trim()).to.equal(expectedSql); //trim any formatting spaces from the actual sql to ensure a good comparison
            expect(dbSpy.firstCall.args[1]).to.contain(testStartDate);
        });

        it('should filter meetups by end date', function() {
            const mockDb = {
                query: function() {}
            };
            const dbSpy = sinon.stub(mockDb, 'query').resolves([]);
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedRawSql = `SELECT meetups.id,
                                           meetups.name,
                                           meetups.type,
                                           meetups.startDate,
                                           meetups.endDate,
                                           meetups.location,
                                           JSON_AGG((SELECT data FROM (SELECT u1.id, u1.username) data))::json->0 AS creator,
                                           JSON_AGG((SELECT data FROM (SELECT u2.id, u2.uertname) data)) AS attendees
                                    FROM meetups
                                    LEFT JOIN users u1 ON u1.id = meetups.creator
                                    LEFT JOIN users u2 ON u2.id = ANY(meetups.attendees)
                                    WHERE meetups.location = ANY($1) AND meetups.type = $2 AND meetups.startDate >= $3 AND meetups.endDate <=$4
                                    GROUP BY meetups.id;`;
            const expectedSql = expectedRawSql.replace(/\s+/g,' ').trim(); //since this is a YUGE query, trim any formatting spaces from it to make comparison less brittle

            meetupsRepository.getMeetups(testLocations, testType, testStartDate, testEndDate);

            expect(dbSpy.firstCall.args[0].replace(/\s+/g,' ').trim()).to.equal(expectedSql); //trim any formatting spaces from the actual sql to ensure a good comparison
            expect(dbSpy.firstCall.args[1]).to.contain(testEndDate);
        });

        it('should provide default values for start/end dates', function() {
            const mockDb = {
                query: function() {}
            };
            const dbSpy = sinon.stub(mockDb, 'query').resolves([]);
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            meetupsRepository.getMeetups(testLocations);

            expect(dbSpy.firstCall.args[1]).to.not.contain(undefined);
        });

        it('should reject the Promise with an \'Error occurred in database operation\' and the message if any errors occurs in the database', function() {
            const testDbMessage = 'some database error message';
            const expectedMessage = `Error ocurred in database operation: ${testDbMessage}`;
            const mockDb = {
                query: () => { throw new Error(testDbMessage) }
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.getMeetups(testLocations)).to.eventually.be.rejectedWith(expectedMessage);
        });
    });

    describe('addAttendee()', function() {
        const testMeetupId = 123;
        const testAttendees = [456];
        const newAttendee = 789;

        it('should query the database for the provided meetup id', function() {
            const mockDb = {
                query: () => Promise.resolve([{ attendees: testAttendees }])
            };
            const querySpy = sinon.spy(mockDb, 'query');
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedSql = 'SELECT attendees FROM meetups WHERE id = $1;';

            meetupsRepository.addAttendee(testMeetupId, newAttendee);

            expect(querySpy.firstCall.args[0]).to.equal(expectedSql);
            expect(querySpy.firstCall.args[1]).to.contain(testMeetupId);
        });

        it('should reject the Promise with an \'Invalid meetup id passed to meetupsRepository.addAttendee()\' error, if the meetup id is not in the database', function() {
            const testMessage = 'Invalid meetup id passed to meetupsRepository.addAttendee()';
            const mockDb = {
                query: () => Promise.resolve([])
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.addAttendee(testMeetupId, newAttendee)).to.eventually.be.rejectedWith(testMessage);
        });

        it('should add the new attendee to the attendees of the meetup', async function() {
            const expectedAttendees = testAttendees.concat(newAttendee);
            const mockDb = {
                query: () => Promise.resolve([{ attendees: testAttendees }])
            };
            const expectedSql = 'UPDATE meetups SET attendees = $1 WHERE id = $2;';
            const querySpy = sinon.spy(mockDb, 'query');
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            await meetupsRepository.addAttendee(testMeetupId, newAttendee);

            expect(querySpy.secondCall.args[0]).to.equal(expectedSql);
            expect(querySpy.secondCall.args[1][0]).to.deep.equal(expectedAttendees);
        });

        it('should reject the Promise with an \'Error occurred in database operation\' and the message if any errors occurs in the database', function() {
            const testDbMessage = 'some database error message';
            const expectedMessage = `Error ocurred in database operation: ${testDbMessage}`;
            const mockDb = {
                query: () => { throw new Error(testDbMessage) }
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.addAttendee(testMeetupId, newAttendee)).to.eventually.be.rejectedWith(expectedMessage);
        });
    });

    describe('addMeetup()', function() {
        const testPerson = createUserObject({ id: 789, name: 'some user' });
        const testMeetupData = {
            name: 'some event',
            type: 'nightlife',
            startDate: new Date('June 9, 2018'),
            endDate: new Date('June 9, 2018'),
            location: '456',
            creator: testPerson
        };
        const testMeetup = createMeetupObject(testMeetupData);

        it('should insert the provided meetup into the database', function() {
            const { name, type, startDate, endDate, location, creator, attendees } = testMeetup;
            const expectedArgs = [name, type, startDate, endDate, location, creator, attendees];
            const mockDb = {
                query: function() {}
            };
            const expectedSql = 'INSERT INTO meetups (name, type, startDate, endDate, location, creator, attendees) VALUES ($1, $2, $3, $4, $5, $6, $7);';
            const querySpy = sinon.spy(mockDb, 'query');
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            meetupsRepository.addMeetup(testMeetup);

            expect(querySpy.firstCall.args[0]).to.equal(expectedSql);
            expect(querySpy.firstCall.args[1]).to.deep.equal(expectedArgs);
        });

        it('should reject the Promise with an \'Error occurred in database operation\' and the message if any errors occurs in the database', function() {
            const testDbMessage = 'some database error message';
            const expectedMessage = `Error ocurred in database operation: ${testDbMessage}`;
            const mockDb = {
                query: () => { throw new Error(testDbMessage) }
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.addMeetup(testMeetup)).to.eventually.be.rejectedWith(expectedMessage);
        });
    });

    describe('removeAttendee()', function() {
        const testMeetupId = 123;
        const testAttendees = [456, 789];
        const attendeeToBeRemoved = 789;

        it('should search for the provided meetup id in the database', function() {
            const mockDb = {
                query: () => Promise.resolve([ { attendees: testAttendees } ])
            };
            const querySpy = sinon.spy(mockDb, 'query');
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedSql = 'SELECT attendees FROM meetups WHERE id = $1;';

            meetupsRepository.removeAttendee(testMeetupId, attendeeToBeRemoved);

            expect(querySpy.firstCall.args[0]).to.equal(expectedSql);
            expect(querySpy.firstCall.args[1]).to.deep.equal([ testMeetupId ]);
        });

        it('should return a rejected Promise with an \'Invalid meetup id provided to meetups.removeAttendee()\' Error if the provided meetup id is not in the database', function() {
            const mockDb = {
                query: () => Promise.resolve([])
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.removeAttendee(testMeetupId, attendeeToBeRemoved)).to.eventually.be.rejectedWith('Invalid meetup id provided to meetups.removeAttendee()');
        });

        it('should return a rejected Promise with an \'user id provided to meetups.removeAttendee() is not attending provided meetup\' Error if the provided user is not attending the provided meetup', function() {
            const mockDb = {
                query: () => Promise.resolve([ { attendees: testAttendees } ])
            };
            const notAttendingId = 321;
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.removeAttendee(testMeetupId, notAttendingId)).to.eventually.be.rejectedWith('user id provided to meetups.removeAttendee() is not attending provided meetup');
        });

        it('should remove the provided user from the provided meetup', async function() {
            const mockDb = {
                query: () => Promise.resolve([ { attendees: testAttendees } ])
            };
            const querySpy = sinon.spy(mockDb, 'query');
            const meetupsRepository = meetupsRepositoryFactory(mockDb);
            const expectedAttendees = testAttendees.filter((id) => (id !== attendeeToBeRemoved));
            const expectedSql = 'UPDATE meetups SET attendees = $1 WHERE id = $2;';

            await meetupsRepository.removeAttendee(testMeetupId, attendeeToBeRemoved);

            expect(querySpy.secondCall.args[0]).to.equal(expectedSql);
            expect(querySpy.secondCall.args[1]).to.deep.equal([ expectedAttendees ]);
        });

        it('should reject the Promise with an \'Error occurred in database operation\' and the message if any errors occurs in the database', function() {
            const testDbMessage = 'some database error message';
            const expectedMessage = `Error ocurred in database operation: ${testDbMessage}`;
            const mockDb = {
                query: () => { throw new Error(testDbMessage) }
            };
            const meetupsRepository = meetupsRepositoryFactory(mockDb);

            return expect(meetupsRepository.removeAttendee(testMeetupId, attendeeToBeRemoved)).to.eventually.be.rejectedWith(expectedMessage);
        });
    });
});