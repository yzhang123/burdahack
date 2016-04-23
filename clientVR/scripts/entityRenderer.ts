
/// <reference path="decl/three.d.ts" />

export function createTexture(html: string, width: number, height: number): THREE.Texture
{
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var result = new THREE.Texture(canvas);
    rasterizeHTML.drawHTML(html, canvas)
        .then(() => result.needsUpdate = true);
    return result;
}

export function createMaterial(html: string, width: number, height: number)
{
    var mat = new THREE.MeshBasicMaterial( {
        map: createTexture(html, width, height),
        side: THREE.DoubleSide,
        transparent : true
    } );
    return mat;
}