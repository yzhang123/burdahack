/// <reference path="../State.ts" />

import { StateMachine } from "../StateMachine";
import MyMath = require("./../MyMath");
import State = require("./../State");
import { Hand } from "./../Hand";

export class StateGrab implements State {

	public constructor(public host: StateMachine, public callbacks: any, public boxid: string, public forceHandID?: number)
	{
		console.log("GRAB-FORCE: " + forceHandID);
	}

	public onHandInput(currHand: Hand): void
	{
		var n: Vector3D = {x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z};
		var len: number = MyMath.vlength(n);
		n = MyMath.mult(n, Math.max(10, len*50)/len);

		this.host.boxes[this.boxid].pos = n;

		if (currHand.gestureNow != "closed")
			this.host.state = this.host.stateFreeHand;
	}

	public onEnter(): void
	{
		console.log("Enter grab");
	}

	public onLeave(): void
	{
		
	}
}