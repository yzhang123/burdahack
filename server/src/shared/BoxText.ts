/// <reference path="types.ts" />
import { Box } from "./../shared/Box";

export class BoxText extends Box {
	public geturl(): string {
		return this.keywords.length > 0 ? "textbox?text=" + this.keywords[0] : "textbox";
	}

	public done(): boolean { return this.keywords.length >= 1; }
}

//https://bingapis.azure-api.net/api/v5/images/search?q=cats&count=1&offset=0&mkt=en-us&safeSearch=Moderate