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

interface State {
	grabbed: boolean;
}

var allViews: { [uid: string]: DeviceView } = { };
var boxes: { [uid: string]: Box } = { };
var boxState: { [uid: string]: State } = { };

boxes[0] = {pos: {x: 30, y: 0, z: 0}, xw:10, yw:10, zw: 10};

function vcos(a: Vector3D, b: Vector3D): number
{
	var na: number = Math.sqrt(skalar(a, a));
	var nb: number = Math.sqrt(skalar(b, b));
	var cosv: number = skalar(a, b) / (na * nb);
	return cosv;
}
function skalar(a: Vector3D, b: Vector3D): number
{
	return (a.x*b.x + a.y*b.y + a.z*b.z);
}
function vlength(v: Vector3D): number
{
	return Math.sqrt(skalar(v, v));
}
function vecdiff(a: Vector3D, b: Vector3D): Vector3D
{
	return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function mult(a: Vector3D, m: number): Vector3D
{
	return {x: a.x*m, y: a.y*m, z: a.z*m};
}

var dHand0: Vector3D = null;
var dHand1: Vector3D = null;

function updateState(box: Box, gesture: string): void
{
	var hitval: number = vcos(box.pos, dHand0);
	if (hitval > 0.9 && gesture == "Closed")
	{
		var n: Vector3D = {x: dHand1.x, y: dHand1.y, z: dHand1.z};
		n = mult(n, 30/vlength(n)); // normalize at 30
		box.pos = dHand1;
	}
}

function handInput(data: any): void
{
	console.log(data.Gesture + " " + data.DX + " " + data.DY + " " + data.DZ);
	for (var id in boxes)
    {	
    	var dHand = {x: data.DX, y: data.DY, z: data.DZ};
    	dHand0 = dHand1;
    	dHand1 = dHand;

    	var box = boxes[id];

    	if (dHand0 && dHand1)
        	updateState(box, data.Gesture);
    }
}

io.on('connection', socket =>
{
    socket.on('update-device-view', (deviceView: DeviceView) =>
    {
        allViews[deviceView.id] = deviceView;
    });

    socket.on('hand', (data: any) => {
        handInput(data);
    });
    socket.on('mouse', (data: any) =>
    {
    	handInput(data);
    });

    setInterval(() => {
    	socket.emit('world', boxes);
    	socket.emit('kinect-mouse', dHand1);
    }, 1000/40);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);