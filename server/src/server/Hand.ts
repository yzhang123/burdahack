export class Hand {
	public id: number;
	public posPrev: Vector3D = null;
	public posNow: Vector3D = null;
	public gesturePrev: string;
	public gestureNow: string;

	public debug(): void
	{
		console.log(this.id);
		if (this.posPrev) console.log("pprv: " + this.posPrev.x + " " + this.posPrev.y + " " + this.posPrev.z);
		if (this.posNow) console.log("pnow: " + this.posNow.x + " " + this.posNow.y + " " + this.posNow.z);
		if (this.gesturePrev) console.log("gprev" + this.gesturePrev);
		if (this.gestureNow) console.log("gnow: " + this.gestureNow);
	}
}