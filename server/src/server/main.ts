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
import { Box, Boxes } from "./../shared/Box";
import { BoxText } from "./../shared/BoxText";
import { StateMachine } from "./StateMachine";
import { Hand } from "./Hand";

// APP
var app = express();
var server = require("http").createServer(app);
var io = socketio.listen(server);

Routing(io, app);

function createUID(): string
{
    return "BOX" + new Date().getTime();
}

interface State {
	grabbed: boolean;
	//lockid: number;
}

var allViews: { [uid: string]: DeviceView } = { };
var boxes: { [uid: string]: Box } = { };
var boxState: { [uid: string]: State } = { };

boxes[0] = new Box({x: 30, y: 0, z: 0}, 10);
boxes[1] = new Box({x: 0, y: 0, z: 30}, 10);
boxes[2] = new Box({x: 0, y: 0, z: -30}, 10);

boxState[0] = {grabbed: false};
boxState[1] = {grabbed: false};
boxState[2] = {grabbed: false};

var lastMouse: any = { };

// right, left hand
var hands: Hand[] = [new Hand(), new Hand()];
var menuPos: Vector3D = null;
var currHand: Hand;
var editMode: boolean = false;
var editBoxID: string = null;
hands[0].id = 0;
hands[1].id = 1;


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

var stateMachine: StateMachine = new StateMachine({
	sendWorld: (boxes: Boxes) => {
		var data: { [uid: string]: IBox } = { };
		for (var id in boxes)
			data[id] = boxes[id].getPayload();

    	io.sockets.emit('world', data);
	},
	sendKinectMouse: (mousedata: MultMouseData) => {
		//console.log(mousedata);
		io.sockets.emit('kinect-mouse', mousedata);
	},
	showMenu: () => {
		io.sockets.emit('show-menu');
	}
});

stateMachine.state = stateMachine.stateFreeHand;

io.on('connection', socket =>
{
	function globalUpdate(): void
	{
		if (editMode) return;

		if (currHand.gestureNow == "lasso") {
			socket.broadcast.emit("show-menu", {});
    		menuPos = {x: currHand.posNow.x,
    				   y: currHand.posNow.y,
    				   z: currHand.posNow.z}
    	}
	}

	/*
	function update(boxid: string): void
	{
		// edit mode section
		if (editBoxID && boxes[editBoxID].done())
		{
			console.log("NEW BOX");
			console.log(boxes[editBoxID].keywords);
			console.log(boxes[editBoxID].pos);
			editBoxID = null;
		}
		//////////////////////
		if (editMode) return;

		if (boxState[boxid].grabbed)
		{
			var n: Vector3D = {x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z};
			var len: number = MyMath.vlength(n);
			n = MyMath.mult(n, Math.max(10, len*50)/len); // normalize at 30

			boxes[boxid].pos = n;
		}

		if (menuPos) {
			var diff: Vector3D = MyMath.vecdiff(currHand.posNow, menuPos);
			var len = MyMath.vlength(diff);

			if (len > 0.3) {
				var id = createUID();

				if (diff.y < 0 && Math.abs(diff.y) > Math.abs(diff.x)
					&& Math.abs(diff.y) > Math.abs(diff.z)) {
					editMode = false;
					console.log("A"); // unten
					boxes[id] = new BoxText(menuPos, 10);
					boxState[id] = { grabbed: false };
				} else if (diff.x < 0 && Math.abs(diff.x) > Math.abs(diff.y)
					&& Math.abs(diff.x) > Math.abs(diff.z)) {
					editMode = false;
					console.log("B"); // rechts
				} else {
					editMode = false;
					console.log("C"); // links
				}
				socket.broadcast.emit("hide-menu");
				menuPos = null;
				console.log("HIDE");
			}
		}
	}*/

	function handInput(data: any)
	{
		if (data.Confidence == 'low')
			return;

		transform(data);

		stateMachine.updateHand(data);
	}

    socket.on('update-device-view', (deviceView: DeviceView) =>
    {
        allViews[deviceView.id] = deviceView;
    });

    socket.on('hand', (data: any) => {
    	data = JSON.parse(data);
        handInput(data);
    });

    socket.on('speech-input', (key: string) =>
    {
    	if (!editBoxID || boxes[editBoxID].done()) return;
    	boxes[editBoxID].feedParams(key);
    });

    socket.on('mouse', (data: any) =>
    {
    	handInput(data);
    });
   // socket.on('keyword-input', (keyword: string))

    setInterval(() => {
    	stateMachine.update();
    }, 1000/40);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);