
export function vcos(a: Vector3D, b: Vector3D): number
{
	var na: number = Math.sqrt(skalar(a, a));
	var nb: number = Math.sqrt(skalar(b, b));
	var cosv: number = skalar(a, b) / (na * nb);
	return cosv;
}
export function skalar(a: Vector3D, b: Vector3D): number
{
	return (a.x*b.x + a.y*b.y + a.z*b.z);
}
export function vlength(v: Vector3D): number
{
	return Math.sqrt(skalar(v, v));
}
export function vecdiff(a: Vector3D, b: Vector3D): Vector3D
{
	return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
export function mult(a: Vector3D, m: number): Vector3D
{
	return {x: a.x*m, y: a.y*m, z: a.z*m};
}