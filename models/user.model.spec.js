const chai = require('chai');
const createUserObject = require('./user.model.js');

const expect = chai.expect;


const userModelSpec = {
    id: 1234,
    username: 'some user'
};
    
describe('Place model', function() {
    
    it('should create a properly formed User object', function() {
        const { id, username } = userModelSpec;
        expect(createUserObject(id, username)).to.deep.equal(userModelSpec);
    });
});