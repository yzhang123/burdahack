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

	public debug(): void
	{
		console.log(this.id);
		if (this.posPrev) console.log("pprv: " + this.posPrev.x + " " + this.posPrev.y + " " + this.posPrev.z);
		if (this.posNow) console.log("pnow: " + this.posNow.x + " " + this.posNow.y + " " + this.posNow.z);
		if (this.gesturePrev) console.log("gprev" + this.gesturePrev);
		if (this.gestureNow) console.log("gnow: " + this.gestureNow);
	}
}

// right, left hand
var hands: HandData[] = [new HandData(), new HandData()];
var menuPos: Vector3D = null;
var currHand: HandData;
var editMode: boolean = false;
hands[0].id = 0;
hands[1].id = 1;

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


io.on('connection', socket =>
{
	function update(boxid: string): void
	{
		if (boxState[boxid].grabbed)
		{
			var n: Vector3D = {x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z};
			n = MyMath.mult(n, 30/MyMath.vlength(n)); // normalize at 30
			boxes[boxid].pos = n;
		}

		if (menuPos) {
			var diff: Vector3D = MyMath.vecdiff(currHand.posNow, menuPos);
			var len = MyMath.vlength(diff);

			if (len > 0.4) {
				if (diff.y < 0 && Math.abs(diff.y) > Math.abs(diff.x)
					&& Math.abs(diff.y) > Math.abs(diff.z)) {
					editMode = false;
					console.log("A"); // untne
				} else if (diff.x < 0 && Math.abs(diff.x) > Math.abs(diff.y)
					&& Math.abs(diff.x) > Math.abs(diff.z)) {
					editMode = false;
					console.log("B"); // rechts
				} else {
					editMode = false;
					console.log("C"); // link
				}
				socket.broadcast.emit("hide-menu");
				menuPos = null;
				console.log("HIDE");
			}
		}
	}

	function handInput(data: any)
	{
		if (data.Confidence == 'low')
			return;

		transform(data);

		var handID: number = 0;
		if (data.IsLeft) handID = 1;

		lastMouse[handID] = data;

		currHand = hands[handID];
		var dHand = {x: data.DX, y: data.DY, z: data.DZ};
		currHand.posPrev = currHand.posNow;
		currHand.posNow = dHand;

		currHand.gesturePrev = currHand.gestureNow;
		currHand.gestureNow = data.Gesture;



		if (!(currHand.posPrev && currHand.posNow)) return;

		if (currHand.gestureNow == "lasso") {
			socket.broadcast.emit("show-menu", {});
    		menuPos = {x: currHand.posNow.x,
    				   y: currHand.posNow.y,
    				   z: currHand.posNow.z}
    	}

		for (var id in boxes)
	    {
	    	if (currHand.gestureNow == "closed") {
		    	if (currHand.gesturePrev != "closed")
		    		updateStateGrab(id, 1); // grab? grab if grab
		    } else if (currHand.gestureNow == "open") {
	    		updateStateGrab(id, 2); // release
	    	}

	        update(id);
	    }
	}

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
   // socket.on('keyword-input', (keyword: string))

    setInterval(() => {
    	if (boxes)
	    	socket.emit('world', boxes);
	   	if (lastMouse) {
	    	socket.emit('kinect-mouse', lastMouse);
	    }
    }, 1000/40);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);