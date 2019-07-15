const express = require("express");
const app = express();
const db = require("./utils/db");
const s3 = require("./s3");
const bodyParser = require("body-parser");

app.use(express.static("./public"));
// app.use(express.static("./uploads"));

// 'npm i' or 'npm install' installs the dependencies from package.js

////////////// FROM CLASS NOTES

const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");
// const router = require("./routers/router");

const diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});

// app.use(router);

app.use(bodyParser.json());

app.get("/images", (req, res) => {
    db.getImages()
        .then(rslt => {
            res.json(rslt.rows);
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/lowest-id", (req, res) => {
    db.lowestId()
        .then(rslt => {
            console.log("lowestId", rslt);
            res.json(rslt.rows[0].id);
        })
        .catch(err => {
            console.log(err);
        });
});
app.get("/images-by-tagname/:tag", (req, res) => {
    console.log(req.params.tag);
    db.getImagesByTagName(req.params.tag)
        .then(r => {
            console.log("/tag query result", r.rows);
            res.json(r.rows);
        })
        .catch(e => console.log(e));
});
app.get("/highest-id", (req, res) => {
    db.highestId()
        .then(r => {
            console.log("highest image id: ", r.rows[0].id);
            res.json(r.rows[0].id);
        })
        .catch(err => {
            console.log(err);
        });
});
app.get("/pic/*", (req, res) => {
    console.log("req.param: ", req.params);
    let id = req.params["0"];

    Promise.all([db.getImageDetails(id), db.getComments(id)]).then(rslt => {
        console.log(
            "get image detail promise result (first): ",
            rslt[0].rows,
            "2nd",
            rslt[1].rows
        );
        let {
            id,
            url,
            username,
            title,
            description,
            created_at,
            previous_id,
            next_id,
            tags
        } = rslt[0].rows[0];

        let comments = rslt[1].rows.reverse();

        res.json({
            success: true,
            id: id,
            url: url,
            username: username,
            title: title,
            description: description,
            created_at: created_at,
            comments: comments,
            previous_id: previous_id,
            next_id: next_id,
            tags: tags
        });
    });

    // db.getImageDetails(id)
    //     .then(r => {
    //         console.log("result from image details:", r.rows);
    //
    //         let {
    //             id,
    //             url,
    //             username,
    //             title,
    //             description,
    //             created_at
    //         } = r.rows[0];
    //         res.json({
    //             success: true,
    //             id: id,
    //             url: url,
    //             username: username,
    //             title: title,
    //             description: description,
    //             created_at: created_at
    //         });
    //     })
    //     .catch(e => {
    //         console.log(e);
    //     });
});
app.get("/getcomments/*", (req, res) => {
    console.log("/getcomments GET request: ", req.params);
    let id = req.params["0"];
    db.getComments(id)
        .then(r => {
            console.log("/getcomments query result: ", r);
            res.json(r.rows.reverse());
        })
        .catch(err => {
            console.log(err);
        });
});
app.get("/get-more-images/*", (req, res) => {
    // console.log("get-more-images request ", req.params["0"]);
    let lastId = req.params["0"];
    db.getMoreImages(lastId)
        .then(function(rslt) {
            console.log("getMoreImages result: ", rslt);
            res.json(rslt.rows);
        })
        .catch(function(err) {
            console.log("getMoreImages error: ", err);
        });
});
app.post("/addcomment", (req, res) => {
    let { name, comment, id } = req.body;
    db.addComment(name, comment, id)
        .then(rslt => {
            // console.log("/addcomment result: ", rslt);
            res.json(rslt);
        })
        .catch(err => {
            console.log("/addcomment error: ", err);
        });
    // console.log("addcomment post:", req);
});

app.post("/upload", uploader.single("file"), s3.upload, function(req, res) {
    let { title, description, username, tags } = req.body;
    // let title = req.body.title;
    // let desc = req.body.description;
    // let username = req.body.username;
    let fileUrl =
        "https://s3.amazonaws.com/danielvarga-salt/" + req.file.filename;

    //req.file refers to the image that was just uploaded

    // If nothing went wrong the file is already in the uploads directory
    if (req.file) {
        db.addImage(title, description, username, fileUrl, tags)
            .then(resp => {
                let resObj = resp.rows[0];
                resObj.success = true;
                console.log("query response at upload", resObj);
                // console.log("/addimage query response: ", resp.rows[0]);
                res.json(resObj);
            })
            .catch(e => {
                console.log(e);
            });
    } else {
        res.json({
            success: false
        });
    }
});

app.post("/delete/:id", (req, res) => {
    console.log("length", req.body.arrLength);
    console.log("/delete request params", req.params.id);
    db.deleteComments(req.params.id)
        .then(() => {
            console.log(`image ${req.params.id} comments are deleted`);
            db.deleteImage(req.params.id).then(r => {
                console.log(`image ${req.params.id} is deleted, result: `, r);
                db.getImages(req.body.arrLength)
                    .then(rslt => {
                        res.json(rslt.rows);
                    })
                    .catch(e => {
                        console.log(e);
                    });
            });
        })
        .catch(err => {
            console.log("error in delete", err);
        });
});

/////////////

// let cities = [
//     {
//         name: "Berlin",
//         country: "Germany"
//     },
//     {
//         name: "New York",
//         country: "USA"
//     },
//     {
//         name: "Sarajevo",
//         country: "BiH"
//     }
// ];
//the server should get the request here
// app.get("/cities", (req, res) => {
//     console.log("GET /cities hit");
//     // we use res.json() to send DATA back to the frontend as a response
//     res.json(cities);
//     // res.send("hey, here is the server!!!");
// });

app.listen(8080, () => console.log("Server is listening on port 8080"));
