/// <reference path="../decls/express.d.ts" />
/// <reference path="../decls/express-session.d.ts" />
/// <reference path="../decls/ejs.d.ts" />
/// <reference path="EntitiesRenderer.ts" />

import express = require("express");
import fs = require("fs");
import ejs = require('ejs');
import bodyParser = require("body-parser");
import session = require("express-session");
import { renderEntity } from "./EntitiesRenderer";

var MongoStore = require('connect-mongo')(session);
var path = require("path");
var sharedsession = require("express-socket.io-session");
var request = require("request");

export = (io: any, app: express.Express) => {
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

    var entityRequestHandler: express.RequestHandler = (req, res) => {
        var url = req.url.substring(1);
        var parts = url.split("?");
        var params = parts.length == 1 
            ? { } 
            : JSON.parse('{"' + decodeURI(parts[1]).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        
        res.contentType("text/html; charset=UTF-8");
        res.write(renderEntity(parts[0], params));
        res.end();
    };
    app.use("/entity/", entityRequestHandler);

    app.use('/image/', function(req, res) {  
      var url = decodeURIComponent(req.url.substring(1));
      req.pipe(request(url)).pipe(res);
    });

    app.use("/", express.static("../clientVR", { maxAge: 0 }));
}