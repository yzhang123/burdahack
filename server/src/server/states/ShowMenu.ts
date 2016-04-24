/// <reference path="../State.ts" />

import { StateMachine } from "../StateMachine";
import MyMath = require("./../MyMath");
import State = require("./../State");
import { Hand } from "./../Hand";
import { BoxText } from "./../../shared/BoxText";

export class ShowMenu implements State {
	private itemIsSelected: boolean;
	private newid: string;

	public constructor(public host: StateMachine, public callbacks: any, public menuPos: Vector3D,
		public forceHandID?: number)
	{
		console.log("GRAB-FORCE-menu: " + forceHandID);
	}

	public createUID(): string
	{
	    return "BOX" + new Date().getTime();
	}

	public onHandInput(currHand: Hand): void
	{
		if (this.itemIsSelected)
			return;

		var diff: Vector3D = MyMath.vecdiff(currHand.posNow, this.menuPos);
		var len = MyMath.vlength(diff);

		if (len > 0.3) {
			this.newid = this.createUID();

			if (diff.y < 0 && Math.abs(diff.y) > Math.abs(diff.x)
				&& Math.abs(diff.y) > Math.abs(diff.z)) {
				console.log("A"); // unten
				this.host.boxes[this.newid] = new BoxText(this.menuPos, 10);
			} else if (diff.x < 0 && Math.abs(diff.x) > Math.abs(diff.y)
				&& Math.abs(diff.x) > Math.abs(diff.z)) {
				console.log("B"); // rechts
				this.host.boxes[this.newid] = new BoxText(this.menuPos, 10);
			} else {
				console.log("C"); // links
				this.host.boxes[this.newid] = new BoxText(this.menuPos, 10);
			}
			console.log("HIDE");
			this.itemIsSelected = true;
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
		this.callbacks.hideMenu();
	}

	public speechInput(word: string): void
	{
		if (!this.newid) return;

		console.log("edit recevied: " + word + " => " + this.newid);
		this.host.boxes[this.newid].feedParams(word);
		if (this.host.boxes[this.newid].done())
			this.host.state = this.host.stateFreeHand;
	}
}