/// <reference path="types.ts" />

export class Box {
	public xw: number;
	public yw: number;
	public zw: number;
	public keywords: string[] = [];

	public constructor(public pos: Vector3D, w: number)
	{
		this.xw = w;
		this.yw = w;
		this.zw = w;
	}

	public geturl(): string { return "textbox?text=Hello"; }

	public feedParams(key: string): void { this.keywords.push(key); } 

	public done(): boolean { return false; }

	public getPayload(): IBox
	{
		return {xw: this.xw, yw: this.yw, zw: this.zw, pos: this.pos, url: this.geturl()};
	}
}

export type Boxes = { [uid: string]: Box };