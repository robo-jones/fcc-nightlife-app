async function isValidUser(db, id) {
    const sql = 'SELECT 1 FROM users WHERE id = %1';
    const values = [ id ];

    const rows = await db.query(sql, values);

    if (rows[0]) {
        return true;
    } else {
        return false;
    }
}

module.exports.factory = function(db) {
    if (!db || !db.query) {
        throw new TypeError('Invalid database connection passed to usersRepository factory');
    } else {
        return {
            isValidUser: isValidUser.bind(undefined, db)
        };
    }
};