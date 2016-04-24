/// <reference path="types.ts" />
import { Box } from "./../shared/Box";

export class BoxText extends Box {
	public geturl(): string {
		return this.keywords.length > 0 ? "textbox?" + this.keywords[0] : "textbox";
	}

	public done(): boolean { return this.keywords.length >= 1; }
}