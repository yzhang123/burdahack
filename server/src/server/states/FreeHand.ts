/// <reference path="../State.ts" />

import { StateMachine } from "../StateMachine";
import MyMath = require("./../MyMath");
import { Hand } from "./../Hand";
import State = require("./../State");
import { StateGrab } from "./StateGrab";
import { ShowMenu } from "./ShowMenu";

export class FreeHand implements State {

	public constructor(public host: StateMachine, public callbacks: any)
	{

	}

	private checkGrab(currHand: Hand, boxid: string): boolean
	{
		var box = this.host.boxes[boxid];
		var hitval: number = MyMath.vcos(box.pos, currHand.posPrev);
		if (hitval > 0.9)
			return true;

		return false;
	}

	public onHandInput(currHand: Hand): void
	{
		if (currHand.gestureNow == "closed")
		{
			for (var id in this.host.boxes)
			{
				if (this.checkGrab(currHand, id)) {
					this.host.state = new StateGrab(this.host, this.callbacks, id, this.host.currHandID);
					break;
				}
			}
		}
		else if (currHand.gestureNow == "lasso" && this.host.currHandID == 1)
		{
			this.host.state = new ShowMenu(this.host, this.callbacks,
				{x: currHand.posNow.x, y: currHand.posNow.y, z: currHand.posNow.z}, this.host.currHandID);
		}
	}

	public onEnter(): void
	{
		console.log("Enter freehand");
	}

	public onLeave(): void
	{
		
	}
}