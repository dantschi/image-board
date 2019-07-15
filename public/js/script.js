(function() {
    Vue.component("pic-pop-modal", {
        template: "#modal-template",
        props: ["imageId"],
        data: function() {
            return {
                img: {},
                comments: [],
                form: {
                    comment: "",
                    username: ""
                },
                tags: [],
                isDisabled: false
            };
        },
        mounted: function() {
            var self = this;
            console.log(" Vue component 'this'", this);
            axios
                .get("/pic/" + self.imageId)
                .then(function(r) {
                    console.log("axios GET /pic/ query answer: ", r);
                    self.comments = r.data.comments;
                    self.img = r.data;
                    self.tags = r.data.tags.split(",");
                    for (var i = 0; i < self.tags.length; i++) {
                        self.tags[i] = self.tags[i].trim();
                    }

                    console.log("self tags: ", self.tags);
                })
                .catch(function(err) {
                    console.log("axios GET /pic/ query error: ", err);
                });

            // axios
            //     .get("/getcomments/" + this.clickedPicture.id)
            //     .then(function(rslt) {
            //         console.log("/getcomments result: ", rslt.data);
            //         self.comments = rslt.data;
            //     })
            //     .catch(function(err) {
            //         console.log("/getcomments error", err);
            //     });

            // axios.get("/pic/" + this.clickedPicture);
        },
        methods: {
            addComment: function() {
                var self = this;
                self.isDisabled = true;
                console.log("addcomment form ", this.form);

                axios
                    .post("/addcomment", {
                        name: self.form.username,
                        comment: self.form.comment,
                        id: self.img.id
                    })
                    .then(function(rslt) {
                        console.log("/addcomment return result: ", rslt);
                        self.img.comments.unshift(rslt.data.rows["0"]);
                        self.form.comment = "";
                        self.form.username = "";
                        self.isDisabled = false;
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            },
            reply: function(e) {
                console.log("reply fires: ", e);
            }
        },
        watch: {
            // any time the "imageId" is changing, the function runs
            imageId: function() {
                var self = this;
                console.log(" Vue component 'this'", this);
                axios
                    .get("/pic/" + self.imageId)
                    .then(function(r) {
                        console.log("axios GET /pic/ query answer: ", r);
                        self.img = r.data;
                        self.comments = r.data.comments;
                        self.tags = r.data.tags.split(",");

                        console.log("self tags: ", self.tags);
                    })
                    .catch(function(err) {
                        self.tags = [];
                        console.log("axios GET /pic/ query error: ", err);
                    });
            }
        }
    }); // closes Vue component

    new Vue({
        el: ".wrapper",
        data: {
            clickedPicture: location.hash.slice(1),
            imageId: "",
            images: [],
            //this form is the data to store the form from the html
            form: {
                title: "",
                description: "",
                username: "",
                tags: "",
                file: null
            },
            previousHighest: null,
            lowestId: null,
            more: true,
            newImage: false,
            isDisabled: false
        },
        mounted: function() {
            var self = this;
            axios.get("/images").then(function(rslt) {
                self.images = rslt.data;
                console.log("/GET frontend", rslt.data);
                self.highestId = self.images[0].id;
                if (self.images.length < 10) {
                    self.more = false;
                }
            });
            axios.get("/lowest-id").then(function(rslt) {
                console.log("lowest id", rslt);
                self.lowestId = rslt.data;
                console.log("self.lowestId", self.lowestId);
            });

            addEventListener("hashchange", function(e) {
                console.log("hashchange event: ", e);
                // for (var prop in e) {
                //     console.log(prop);
                // }
                var hashDetail = e.newURL;
                if (Number.isInteger(parseInt(location.hash.slice(1)))) {
                    console.log("is number!");
                    self.imageId = location.hash.slice(1);
                } else {
                    console.log("not number");
                }
                console.log(hashDetail.slice(hashDetail.indexOf("#") + 1));
                console.log(
                    typeof parseInt(
                        hashDetail.slice(hashDetail.indexOf("#") + 1)
                    )
                );
                console.log(parseInt("i am very cool"));

                // console.log("hashDetail", Object.keys(hashDetail));
            });

            setInterval(function() {
                axios
                    .get("/highest-id")
                    .then(function(rslt) {
                        console.log(
                            "getting highest image id",
                            self.highestId,
                            rslt.data,
                            self.newImage
                        );
                        if (self.images[0].id != rslt.data) {
                            self.newImage = true;
                        } else {
                            self.newImage = false;
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            }, 5000);
        },

        methods: {
            changeImageNext: function(e) {
                console.log("changeImagePrevious", e);
                // self.imageId = img.
            },
            deleteImg: function(e) {
                var self = this;
                console.log("deleteImg fires", e);
                axios
                    .post("delete/" + e, {
                        arrLength: self.images.length
                    })
                    .then(function(rslt) {
                        console.log("delete result", rslt.data);
                        self.images = rslt.data;
                    });
            },
            changeImagePrevious: function(e) {
                console.log("changeImageNext", e);
            },
            refreshPage: function() {
                console.log("refreshPage fires");
                location.reload();

                //////////////////// OR \\\\\\\\\\\\\\\\\\\\\\\\
                // maybe this one would be better, so not the whole page loads

                // axios.get("/images").then(function(rslt) {
                //     self.images = rslt.data;
                //     console.log("/GET frontend", rslt.data);
                //     if (self.images.length < 10) {
                //         self.more = false;
                //     }
                // });
            },
            showByTagName: function(e) {
                var self = this;
                console.log("showByTagName fires!!!", e);
                self.imageId = "";
                var tagToDisplay = e;
                location.hash = `${tagToDisplay}`;
                axios
                    .get("/images-by-tagname/" + tagToDisplay)
                    .then(function(rslt) {
                        console.log("images-by-tagname result: ", rslt.data);
                        self.images = rslt.data;
                    })
                    .catch(function(err) {
                        console.log("/images-by-tagname error:", err);
                    });
            },

            close: function() {
                var self = this;
                self.imageId = "";
                location.hash = "";
                console.log("close fires, location.hash", location.hash);
            },
            showMore: function() {
                var self = this;
                var lastId = this.images[this.images.length - 1].id;

                console.log(lastId);
                axios.get("/get-more-images/" + lastId).then(function(rslt) {
                    console.log("get-more-images/ result", rslt.data);
                    for (var i = 0; i < rslt.data.length; i++) {
                        if (
                            rslt.data[rslt.data.length - 1].id == self.lowestId
                        ) {
                            self.more = false;
                        }
                        console.log("self.more", self.more);
                        self.images.push(rslt.data[i]);
                    }

                    console.log("images array: ", self.images);
                });

                // console.log("showMore fires");
            },

            //

            handleFileChange: function(e) {
                console.log("handleFileChange is running", e.target.files[0]);
                // "this" refers to THIS Vue instance
                this.form.file = e.target.files[0];
                console.log("this: ", this);
            },
            uploadFile: function(e) {
                var self = this;
                this.isDisabled = true;
                console.log("uploadFile running", e);

                var formData = new FormData();

                formData.append("file", this.form.file);
                formData.append("title", this.form.title);
                formData.append("username", this.form.username);
                formData.append("description", this.form.description);
                formData.append("tags", this.form.tags);
                // if you log formData, the result is {}, but that is okay
                console.log("formData: ", formData);

                axios
                    .post("/upload", formData)
                    .then(function(resp) {
                        console.log("after upload response: ", resp);
                        console.log(self.images);
                        self.images.unshift({
                            created_at: resp.data.created_at,
                            description: resp.data.desc,
                            id: resp.data.id,
                            title: resp.data.title,
                            url: resp.data.url,
                            tags: resp.data.tags,
                            username: resp.data.username
                        });
                        this.form.file = "";
                        this.form.title = "";
                        this.form.username = "";
                        this.form.description = "";
                        this.form.tags = "";
                        self.isDisabled = false;
                        this.highestId = resp.data.id;
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            }
        }
    });
})();
