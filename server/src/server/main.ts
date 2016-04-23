/// <reference path="../decls/node.d.ts" />
/// <reference path="../decls/mongodb.d.ts" />
/// <reference path="../decls/express.d.ts" />
/// <reference path="../decls/socket.io.d.ts" />
/// <reference path="../decls/body-parser.d.ts" />
/// <reference path="../decls/jquery.d.ts" />
/// <reference path="../decls/mongoose.d.ts" />
/// <reference path="../decls/bcrypt.d.ts" />
/// <reference path="../decls/cookie-parser.d.ts" />
/// <reference path="../decls/async.d.ts" />
/// <reference path="../decls/googlemaps.d.ts" />
/// <reference path="../decls/multer.d.ts" />
/// <reference path="../shared/types.ts" />

// config
var confAppIp: string = "localhost";
var confAppPort: number = process.env.PORT || 8090;

import express = require("express");
import socketio = require("socket.io");
import fs = require("fs");
import async = require('async');
import multer = require("multer");
import Routing = require("./Routing");

// APP
var app = express();
var server = require("http").createServer(app);
var io = socketio.listen(server);

Routing(io, app);

var allViews: { [uid: string]: DeviceView } = { };
var boxes: { [uid: string]: Box } = { };

boxes[0] = {pos: {x: 30, y: 0, z: 0}, w:10, h:10};

function updateState(box: Box, gesture: string, deltaHand: Vector3D): void
{

}

io.on('connection', socket =>
{
    socket.on('update-device-view', (deviceView: DeviceView) =>
    {
        allViews[deviceView.id] = deviceView;
    });

    socket.on('hand', (data: any) => {
        for (var id in boxes)
        {	
        	var box = boxes[id];
        	updateState(box, data.Gesture, <Vector3D>{x: data.DX, y: data.DY, z: data.DZ});
        }
    });

    setInterval(() => {
    	socket.emit('world', boxes);
    }, 1000/40);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);