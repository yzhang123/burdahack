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
var request = require('ajax-request');

// APP
var app = express();
var server = require("http").createServer(app);
var io = socketio.listen(server);

var allViews: { [uid: string]: DeviceView } = { };

Routing(io, app);

function createUID(): string
{
    return "BOX" + new Date().getTime();
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
	},
	hideMenu: () => {
		io.sockets.emit('hide-menu');
	}
});

stateMachine.state = stateMachine.stateFreeHand;

io.on('connection', socket =>
{
	console.log("connected.");
	function handInput(data: any)
	{
		if (data.Confidence == 'low')
			return;

		transform(data);

		stateMachine.updateHand(data);
	}

    socket.on('head-rot', (data: any) =>
    {
        io.sockets.emit('head-rot', data);
    });

    socket.on('hand', (data: any) => {
    	data = JSON.parse(data);
        handInput(data);
    });

    socket.on('keyword', (key: string) =>
    {
    	stateMachine.speechInput(key);
    });

    socket.on('mouse', (data: any) =>
    {
    	handInput(data);
    });
   // socket.on('keyword-input', (keyword: string))

    setInterval(() => {
    	
    	stateMachine.update();
    }, 1000/10);
});

console.log("Running on port: " + confAppPort);
server.listen(confAppPort);