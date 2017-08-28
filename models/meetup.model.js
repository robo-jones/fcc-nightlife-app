module.exports = function(id, name, type, startDate, endDate, location, creator, attendees = [creator]) {
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