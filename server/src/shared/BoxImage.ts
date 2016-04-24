/// <reference path="types.ts" />
import { Box } from "./../shared/Box";
var request = require('ajax-request');
var https = require("https");

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
		console.log("IMGKEY " + key);
		var options = {
		 host: 'bingapis.azure-api.net',
		 path: '/api/v5/images/search?q=' + key + '&count=1&offset=0&mkt=en-us&safeSearch=Moderate',
		 method: 'GET',
		 headers: { 'Ocp-Apim-Subscription-Key': '9d99a2d9e16d4eecb399b438683fdd5e' }
		};

		var callback = (response) => {
		 var str = '';

		 response.on('data', function (chunk) {
		   str += chunk;
		 });

		 response.on('end', () => {
		   //the whole response has been recieved, so we just print it out here
		  // console.log(str);
		   var obj: any = JSON.parse(str);

		  // console.log(str);
		   this.imgurl = obj.value[0].contentUrl;
		   this.imgurl ="/image/" + encodeURIComponent(this.imgurl);
		   console.log("URL: " + this.imgurl);
			});
		}

		https.request(options, callback).end();

		if (this.keywords.length == 0) this.keywords.push(key);
		else this.keywords[0] = key;
	} 
}


//https://bingapis.azure-api.net/api/v5/images/search?q=cats&count=1&offset=0&mkt=en-us&safeSearch=Moderate