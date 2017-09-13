module.exports = function(meetupData) {
    let { id, name, type, startDate, endDate, location, creator, attendees } = meetupData;
    if (!attendees) {
        attendees = [ creator ];
    }
    return {
        id,
        name,
        type,
        startDate,
        endDate,
        location,
        creator,
        attendees
    };
};