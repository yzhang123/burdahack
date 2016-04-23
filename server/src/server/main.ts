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
boxes[1] = {pos: {x: -30, y: 0, z: 0}, xw:10, yw:10, zw: 10};
boxes[2] = {pos: {x: 0, y: 0, z: 30}, xw:10, yw:10, zw: 10};
boxes[3] = {pos: {x: 0, y: 0, z: -30}, xw:10, yw:10, zw: 10};
boxState[0] = {grabbed: false};
boxState[1] = {grabbed: false};
boxState[2] = {grabbed: false};
boxState[3] = {grabbed: false};

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
var gesture0: string;
var gesture1: string;

// 0 = nothing (leave state as is), 1 = grab, 2 = release-all
function updateStateGrab(boxid: string, grabAction: number): void
{
	var box = boxes[boxid];
	var hitval: number = vcos(box.pos, dHand0);
	if (hitval > 0.9 && grabAction == 1)
		boxState[boxid].grabbed = true;

	if (grabAction == 2)
		boxState[boxid].grabbed = false;
}

function update(boxid: string): void
{
	if (boxState[boxid].grabbed)
	{
		var n: Vector3D = {x: dHand1.x, y: dHand1.y, z: dHand1.z};
		n = mult(n, 30/vlength(n)); // normalize at 30
		boxes[boxid].pos = n;
	}
}

function handInput(data: any): void
{
	console.log(data.Gesture + " " + data.DX + " " + data.DY + " " + data.DZ);
	console.log(boxes);
	for (var id in boxes)
    {	
    	var dHand = {x: data.DX, y: data.DY, z: data.DZ};
    	dHand0 = dHand1; dHand1 = dHand;
    	gesture0 = gesture1; gesture1 = data.Gesture;

    	if (dHand0 && dHand1)
    	{        	
        	if (gesture0 != "closed" && gesture1 == "closed") updateStateGrab(id, 1); // grab? grab if grab
        	if (gesture1 == "open") updateStateGrab(id, 2); // release
        }

        update(id);
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