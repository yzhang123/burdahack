/// <reference path="State.ts" />

import { FreeHand } from "./states/FreeHand";
import { Box, Boxes } from "../shared/Box";
import { Hand } from "./Hand";
import State = require("./State");

export class StateMachine {
	public boxes: Boxes = { };
	
	public stateFreeHand: State;

	private _state: State;

	public hands: Hand[];

	private lastMouseData: MultMouseData;
	public currHandID: number;

	public constructor(public callbacks) {
		this.initStates();
		this.hands = [new Hand(), new Hand()];
		this.lastMouseData = { };

		this.boxes[0] = new Box({x: 30, y: 0, z: 0}, 10);
		this.boxes[1] = new Box({x: 0, y: 0, z: 30}, 10);
		this.boxes[2] = new Box({x: 0, y: 0, z: -30}, 10);
	}

	public initStates(): void
	{
		this.stateFreeHand = new FreeHand(this, this.callbacks);
	}

	public set state(value: State)
	{
		if (this._state && this._state.onLeave) this._state.onLeave();
		this._state = value;
		if (this._state && this._state.onEnter) this._state.onEnter();
	}

	public get state(): State
	{
		return this._state;
	}

	public update(): void
	{
		this.callbacks.sendWorld(this.boxes);
		this.callbacks.sendKinectMouse(this.lastMouseData);
	}

	public updateHand(data: MouseData): void
	{
		var handID: number = 0;
		if (data.IsLeft) handID = 1;
		this.currHandID = handID;

		this.lastMouseData[handID] = data;

		var currHand: Hand = this.hands[handID];
		var dHand = {x: data.DX, y: data.DY, z: data.DZ};
		currHand.posPrev = currHand.posNow;
		currHand.posNow = dHand;

		currHand.gesturePrev = currHand.gestureNow;
		currHand.gestureNow = data.Gesture;	

		if (!(currHand.posPrev && currHand.posNow)) return;

		if (this.state && (this.state.forceHandID === undefined || this.state.forceHandID == handID))
			this.state.onHandInput(currHand);
	}

	public speechInput(word: string): void
	{
		if (this.state.speechInput)
			this.state.speechInput(word);
	}
}