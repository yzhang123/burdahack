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

var lastMouse: any = { };
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
		console.log(vlength(n));
	}
}

function transform(data: any): void
{
	var p: Vector3D = {x: -data.DZ, y: data.DY, z: data.DX};
	var len: number = vlength(p);
	if (len > 1) p = mult(p, 1/len);
	
	data.X = null, data.Y = null, data.Z = null;

	if (vlength(p) < 0.1)
		data.DX = null, data.DY = null, data.DZ = null;
	else
		data.DX = p.x, data.DY = p.y, data.DZ = p.z;
}

function handInput(data: any): void
{
	if (data.Confidence == 'low')
		return;

	transform(data);

	var dHand = {x: data.DX, y: data.DY, z: data.DZ};

	console.log(data);
	//console.log(data.Gesture + " " + data.DX + " " + data.DY + " " + data.DZ);
	//console.log(data);
	//console.log(boxes);

	if (data.IsLeft) lastMouse[1] = data;
	else lastMouse[0] = data;

	if (data.IsLeft) return;

	for (var id in boxes)
    {	
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
    	data = JSON.parse(data);
        handInput(data);
    });
    socket.on('mouse', (data: any) =>
    {
    	handInput(data);
    });

    setInterval(() => {
    	if (boxes)
	    	socket.emit('world', boxes);
	   	if (lastMouse) {
	    	console.log(lastMouse);
	    	socket.emit('kinect-mouse', lastMouse);
	    }
    }, 1000/40);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);