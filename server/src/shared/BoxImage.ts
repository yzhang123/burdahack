/// <reference path="types.ts" />
import { Box } from "./../shared/Box";
var request = require('ajax-request');

export class BoxImage extends Box {
	private imgurl: string = null;

	public geturl(): string {

		return this.keywords.length > 0 ? "imgbox?url=" + this.imgurl : "textbox";
	}

	public done(): boolean {
		if (!this.imgurl) return false;
		return this.keywords.length >= 1;
	}

	public feedParams(key: string): void
	{
		

		if (this.keywords.length == 0) this.keywords.push(key);
		else this.keywords[0] = key;
	} 
}


//https://bingapis.azure-api.net/api/v5/images/search?q=cats&count=1&offset=0&mkt=en-us&safeSearch=Moderate