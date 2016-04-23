/// <reference path="../decls/express.d.ts" />
/// <reference path="../decls/express-session.d.ts" />
/// <reference path="../decls/ejs.d.ts" />

import express = require("express");
import fs = require("fs");
import ejs = require('ejs');
import bodyParser = require("body-parser");
import session = require("express-session");

var MongoStore = require('connect-mongo')(session);
var path = require("path");
var sharedsession = require("express-socket.io-session");

export = (io: any, app: any) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    var sessionInstance = session(
    {
        resave: true,
        saveUninitialized: true,
        secret: 'this is an awesome secret',
      //  cookie: { secure: true },
      //  store: new MongoStore({ mongooseConnection: mongoose.connection })
    });

    io.use(sharedsession(sessionInstance,
    {
        autoSave: true
    }));

    app.use(sessionInstance);

    app.use("/", express.static("../clientVR", { maxAge: 0 }));
}