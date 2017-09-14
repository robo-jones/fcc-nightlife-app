const chai = require('chai');
const usersRepository = require('./users.repository.js');
const sinon = require('sinon');

chai.use(require('sinon-chai'));

const expect = chai.expect;
const usersRepositoryFactory = usersRepository.factory;

describe('Users repository', function() {
    it('should export a users repository factory', function() {
        expect(usersRepository.factory).to.be.a('function');
    });

    describe('factory', function() {
        it('should create an isValidUser() function', function() {
            const mockDb = { query: () => {} };
            expect(usersRepositoryFactory(mockDb).isValidUser).to.be.a('function');
        });
        it('should throw an \'Invalid database connection passed to usersRepository factory\' TypeError if it does not receive a valid database connection', function() {
            expect(() => usersRepositoryFactory(undefined)).to.throw(TypeError, 'Invalid database connection passed to usersRepository factory');
        });
    });

    describe('isValidUser()', function() {
        const testId = 123;

        it('should query the database with the provided user id', function() {
            const mockDb = {
                query: () => Promise.resolve([])
            };
            const querySpy = sinon.spy(mockDb, 'query');
            const usersRepository = usersRepositoryFactory(mockDb);

            usersRepository.isValidUser(testId);

            expect(querySpy.firstCall.args[1]).to.deep.equal([ testId ]);
        });

        it('should return a Promise that resolves to true if the user exists', async function() {
            const mockDb = {
                query: () => Promise.resolve([ { someKey: 'some Value' } ])
            };
            const usersRepository = usersRepositoryFactory(mockDb);

            const result = await usersRepository.isValidUser(testId);

            expect(result).to.equal(true);
        });

        it('should return a Promise that resolves to false if the user does not exist', async function() {
            const mockDb = {
                query: () => Promise.resolve([ ])
            };
            const usersRepository = usersRepositoryFactory(mockDb);

            const result = await usersRepository.isValidUser(testId);

            expect(result).to.equal(false);
        });
    });
});