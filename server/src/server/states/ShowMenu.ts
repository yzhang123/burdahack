/// <reference path="../State.ts" />

import { StateMachine } from "../StateMachine";
import MyMath = require("./../MyMath");
import State = require("./../State");
import { Hand } from "./../Hand";
import { BoxText } from "./../../shared/BoxText";
import { BoxImage } from "./../../shared/BoxImage";

export class ShowMenu implements State {
	private itemIsSelected: boolean;
	private newid: string;

	public constructor(public host: StateMachine, public callbacks: any, public menuPos: Vector3D,
		public forceHandID?: number)
	{
		console.log("GRAB-FORCE-menu: " + forceHandID);
		//this.menuPos = MyMath.mult(this.menuPos, 40);
	}

	public createUID(): string
	{
	    return "BOX" + new Date().getTime();
	}

	public onHandInput(currHand: Hand): void
	{
		if (currHand.gestureNow == "closed")
		{
			console.log("EXITA");
			delete this.host.boxes[this.newid];
			this.host.state = this.host.stateFreeHand;
		}
		
		var a: Vector3D = {x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z};
		var b: Vector3D = {x: this.menuPos.x, y: this.menuPos.y, z: this.menuPos.z};
		a = MyMath.mult(a, 1/MyMath.vlength(a));
		b = MyMath.mult(b, 1/MyMath.vlength(b));

		var diff: Vector3D = MyMath.vecdiff(a, b);
		var len = MyMath.vlength(diff);
		console.log(len);
		if (len > 0.1 && !this.itemIsSelected) {
			this.newid = this.createUID();
			var crd: Vector3D = {
				x: this.menuPos.x, y: this.menuPos.y, z: this.menuPos.z}
			crd = MyMath.mult(crd, 40);


			if (diff.y < 0 && Math.abs(diff.y) > Math.abs(diff.x)
				&& Math.abs(diff.y) > Math.abs(diff.z)) {
				console.log("A"); // unten
				this.host.boxes[this.newid] = new BoxText(crd, 10);
			} else if (diff.x < 0 && Math.abs(diff.x) > Math.abs(diff.y)
				&& Math.abs(diff.x) > Math.abs(diff.z)) {
				console.log("B"); // rechts
				this.host.boxes[this.newid] = new BoxText(crd, 10);
			} else {
				console.log("C"); // links
				this.host.boxes[this.newid] = new BoxImage(crd, 10);
			}
			console.log("HIDE");
			this.callbacks.hideMenu();
			this.itemIsSelected = true;
		}

		console.log(this.itemIsSelected);
		console.log(this.newid);
		console.log(this.host.boxes[this.newid]);

		if (this.itemIsSelected && this.newid && this.host.boxes[this.newid]) {
			if (this.host.boxes[this.newid].done()) {
				console.log("OK!");
				this.itemIsSelected = false;
				this.host.state = this.host.stateFreeHand;
			}
		}
	}

	public onEnter(): void
	{
		this.newid = null;
		this.itemIsSelected = false;
		this.callbacks.showMenu();
	}

	public onLeave(): void
	{
		if (this.itemIsSelected && this.newid)
		{
			console.log("EXITB");
			delete this.host.boxes[this.newid];
		}
	}

	public speechInput(word: string): void
	{
		if (!this.newid) return;

		console.log("edit recevied: " + word + " => " + this.newid);
		this.host.boxes[this.newid].feedParams(word);
		if (this.host.boxes[this.newid].done()) {
			console.log("OK!");
			this.itemIsSelected = false;
			this.host.state = this.host.stateFreeHand;
		}
	}
}