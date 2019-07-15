const spicedPg = require("spiced-pg");

// try {
//     var { username, pwd } = require("./secrets.json");
// } catch (err) {
//     console.log(err);
// }

const dbUrl =
    process.env.DATABASE_URL ||
    `postgres:postgres:postgres@localhost:5432/salt-imageboard`;

const db = spicedPg(dbUrl);

module.exports.getImages = function getImages(l) {
    return db.query(
        `SELECT * FROM images
    ORDER BY id DESC
    LIMIT $1;`,
        [l || 10]
    );
};

module.exports.lowestId = function lowestId() {
    return db.query(
        `
        SELECT id FROM images ORDER BY id ASC limit 1;
        `
    );
};

module.exports.highestId = function highestId() {
    return db.query(
        `
        SELECT id FROM images ORDER BY id DESC limit 1;
        `
    );
};

module.exports.getMoreImages = function getMoreImages(lastId) {
    return db.query(
        `
        SELECT * FROM images WHERE id<$1
        ORDER BY id DESC
        LIMIT 10;

        `,
        [lastId]
    );
};

module.exports.addImage = function addImage(title, desc, username, url, tags) {
    return db.query(
        `
        INSERT INTO images(title, description, username, url, tags)
        VALUES ($1,$2,$3,$4, $5)
        RETURNING *;
        `,
        [title, desc, username, url, tags]
    );
};
// id, url, username, title, description, created_a

module.exports.getImageDetails = function getImageDetails(id) {
    return db.query(
        `
        SELECT *,
        (SELECT id FROM images WHERE id < $1 ORDER BY id DESC LIMIT 1) AS previous_id,
        (SELECT id FROM images WHERE id > $1 LIMIT 1) AS next_id
        FROM images WHERE id=$1;
        `,
        [id]
    );
};

module.exports.getImagesByTagName = function getImagesByTagName(tag) {
    return db.query(
        `
        SELECT * FROM images
        WHERE POSITION($1 in tags)>0
        ORDER BY id DESC;
        `,
        [tag]
    );
};

module.exports.getComments = function getComments(id) {
    return db.query(
        `
        SELECT * FROM comments WHERE image_id=$1;
        `,
        [id]
    );
};

module.exports.addComment = function addComment(username, comment, image_id) {
    return db.query(
        `
        INSERT INTO comments(username, comment, image_id)
        VALUES ($1, $2, $3)
        RETURNING comment, created_at, id, image_id, username;
        `,
        [username, comment, image_id]
    );
};

module.exports.deleteComments = function deleteComments(id) {
    return db.query(
        `
        DELETE FROM comments WHERE image_id = $1;
        `,
        [id]
    );
};

module.exports.deleteImage = function deleteImage(id) {
    return db.query(
        `
        DELETE FROM images WHERE id = $1 RETURNING *;
        `,
        [id]
    );
};
