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

export = (io: any, app: any, mongoose: any) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    var sessionInstance = session(
    {
        resave: true,
        saveUninitialized: true,
        secret: 'this is an awesome secret',
      //  cookie: { secure: true },
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    });

    io.use(sharedsession(sessionInstance,
    {
        autoSave: true
    }));

    app.use(sessionInstance);

    /*
    var pages: string[] = ["/"];
    
    // checks if the url wants index.html back (== access to a page)
    function isPage(url: string): boolean
    {
        if (url.indexOf("?") != -1) url = url.substr(0, url.indexOf("?"));

        var res: boolean = false;
        pages.forEach(page => { if (url == page || url == page.substr(0, page.length - 1)) res = true; });

        return res;  
    }

    function sendIndex(res: express.Response, ogdata: {image: string, url: string, descr: string}): void
    {
        fs.readFile(path.join(__dirname, "../../client/index.html"), 'utf8', (err, data) =>
            {
                res.send(ejs.render(data, {
                    'ogimage': ogdata.image,
                    'ogurl': ogdata.url,
                    'ogdescription': ogdata.descr
                }));
            });
    }

    app.use((req: any, res: any, next: any) =>
    {
        if (!isPage(req.url)) { next(); return; }

        req.session.channel = undefined;

        sendIndex(res, {});
    });*/

    // all pages represent index.html => we want to root them to build/client.
    //pages.forEach(page => app.use(page, express.static("../clientVR", { maxAge: 0 })));

    app.use("/", express.static("../clientVR", { maxAge: 0 }));
}