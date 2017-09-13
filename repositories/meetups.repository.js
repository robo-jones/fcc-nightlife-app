const createMeetupObject = require('../models/meetup.model.js');

const defaultOffset = 604800000; //one week in milliseconds

async function getMeetups(db, locations, type, startDate = Date.now(), endDate = (startDate + defaultOffset)) {
    try {
        if (!type) {
            const sql = `SELECT meetups.id,
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
            const values = [locations, startDate, endDate];

            const rows = await db.query(sql, values);

            return rows.map((row) => createMeetupObject(row));
        } else {
            const sql = `SELECT meetups.id,
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
            const values = [locations, type, startDate, endDate];

            const rows = await db.query(sql, values);

            return rows.map((row) => createMeetupObject(row));
        }
    } catch (error) {
        throw new Error(`Error ocurred in database operation: ${error.message}`);
    }
}

async function addAttendee(db, meetupId, userId) {
    const meetupLookupSql = 'SELECT attendees FROM meetups WHERE id = $1;';
    const meetupLookupValues = [meetupId];

    try {
        const rows = await db.query(meetupLookupSql, meetupLookupValues);
        if (!rows[0]) {
            throw new Error('Invalid meetup id passed to meetupsRepository.addAttendee()');
        }
        const newAttendees = rows[0].attendees.concat(userId);

        const addNewAttendeeSql = 'UPDATE meetups SET attendees = $1 WHERE id = $2;';
        const addNewAttendeeValues = [newAttendees, meetupId];

        await db.query(addNewAttendeeSql, addNewAttendeeValues);
    } catch(error) {
        throw new Error(`Error ocurred in database operation: ${error.message}`);
    }
}

async function addMeetup(db, meetup) {
    try {
        const { name, type, startDate, endDate, location, creator, attendees } = meetup;
        const values = [name, type, startDate, endDate, location, creator, attendees];
        const sql = 'INSERT INTO meetups (name, type, startDate, endDate, location, creator, attendees) VALUES ($1, $2, $3, $4, $5, $6, $7);';

        await db.query(sql, values);
    } catch (error) {
        throw new Error(`Error ocurred in database operation: ${error.message}`);
    }
}

async function removeAttendee(db, meetupId, userId) {
    const lookupSql = 'SELECT attendees FROM meetups WHERE id = $1';
    const lookupValues = [ meetupId ];

    try {
        const rows = await db.query(lookupSql, lookupValues);

        if (!rows[0]) {
            throw new Error('Invalid meetup id provided to meetups.removeAttendee()');
            return;
        }
        if (!rows[0].attendees.includes(userId)) {
            throw new Error('user id provided to meetups.removeAttendee() is not attending provided meetup');
            return;
        }

        const newAttendees = rows[0].attendees.filter((id) => (id !== userId));

        const updateSql = 'UPDATE meetups SET attendees = $1 WHERE id = $2';
        const updateValues = [ newAttendees ];

        await db.query(updateSql, updateValues);
    } catch (error) {
        throw new Error(`Error ocurred in database operation: ${error.message}`);
    }
}

module.exports.factory = function(db) {
    return {
        getMeetups: getMeetups.bind(undefined, db),
        addAttendee: addAttendee.bind(undefined, db),
        addMeetup: addMeetup.bind(undefined, db),
        removeAttendee: removeAttendee.bind(undefined, db)
    };
};