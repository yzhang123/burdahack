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
import MyMath = require("./MyMath");

// APP
var app = express();
var server = require("http").createServer(app);
var io = socketio.listen(server);

Routing(io, app);

interface State {
	grabbed: boolean;
	//lockid: number;
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


var lastMouse: any = { };

class HandData {
	public id: number;
	public posPrev: Vector3D = null;
	public posNow: Vector3D = null;
	public gesturePrev: string;
	public gestureNow: string;
}

// right, left hand
var hands: HandData[] = [new HandData(), new HandData()];
var currHand: HandData;

// 0 = nothing (leave state as is), 1 = grab, 2 = release-all
function updateStateGrab(boxid: string, grabAction: number): void
{
	var box = boxes[boxid];
	var hitval: number = MyMath.vcos(box.pos, currHand.posPrev);
	if (hitval > 0.9 && grabAction == 1)
		boxState[boxid].grabbed = true;

	if (grabAction == 2)
		boxState[boxid].grabbed = false;
}

function update(boxid: string): void
{
	if (boxState[boxid].grabbed)
	{
		var n: Vector3D = {x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z};
		n = MyMath.mult(n, 30/MyMath.vlength(n)); // normalize at 30
		boxes[boxid].pos = n;
	}
}

function transform(data: any): void
{
	var p: Vector3D = {x: -data.DZ, y: data.DY, z: data.DX};
	var len: number = MyMath.vlength(p);
	if (len > 1) p = MyMath.mult(p, 1/len);
	
	data.X = null, data.Y = null, data.Z = null;

	if (MyMath.vlength(p) < 0.1)
		data.DX = null, data.DY = null, data.DZ = null;
	else
		data.DX = p.x, data.DY = p.y, data.DZ = p.z;
}

function handInput(data: any): void
{
	if (data.Confidence == 'low')
		return;

	transform(data);

	console.log(data);
	//console.log(data.Gesture + " " + data.DX + " " + data.DY + " " + data.DZ);
	//console.log(data);
	//console.log(boxes);

	var handID: number = 0;
	if (data.IsLeft) handID = 1;

	lastMouse[handID] = data;

	if (data.IsLeft) return;

	currHand = hands[handID];
	var dHand = {x: data.DX, y: data.DY, z: data.DZ};
	currHand.posPrev = currHand.posNow;
	currHand.posNow = dHand;

	currHand.gesturePrev = currHand.gestureNow;
	currHand.gestureNow = data.Gesture;

	if (!(currHand.posPrev && currHand.posNow)) return;

	for (var id in boxes)
    {	
    	if (currHand.gesturePrev != "closed" && currHand.gestureNow == "closed")
    		updateStateGrab(id, 1); // grab? grab if grab
    	if (currHand.gestureNow == "open")
    		updateStateGrab(id, 2); // release

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