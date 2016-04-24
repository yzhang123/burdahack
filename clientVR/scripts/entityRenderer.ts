
/// <reference path="decl/three.d.ts" />

export class DynamicMaterial
{
    private canvas: HTMLCanvasElement;
    private texture : THREE.Texture;
    private material : THREE.MeshBasicMaterial;
    
    public constructor()
    {
        this.canvas = createCanvas(1, 1);
        this.texture = new THREE.Texture(this.canvas);
        this.material = new THREE.MeshBasicMaterial( {
            map: this.texture,
            side: THREE.DoubleSide,
            transparent : true,
            alphaTest: 0.01
        } );
    }
    
    public updateTexture(): void
    {
        this.texture.needsUpdate = true;
    }
    
    public getMaterial(): THREE.MeshBasicMaterial
    {
        return this.material;
    }
    
    public renderHTML(html: string): void
    {
        rasterizeHTML.drawHTML(html)
            .then(image => {
                this.canvas.width = image.image.width;
                this.canvas.height = image.image.height;
                rasterizeHTML.drawHTML(html, this.canvas)
                    .then(() => {
                        this.updateTexture();
                    });
            });
    }
    public renderURL(url: string): void
    {
        rasterizeHTML.drawURL(url)
            .then(image => {
                this.canvas.width = image.image.width;
                this.canvas.height = image.image.height;
                rasterizeHTML.drawURL(url, this.canvas)
                    .then(() => {
                        this.updateTexture();
                    });
            });
    }
}

export function createCanvas(width: number, height: number): HTMLCanvasElement
{
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;    
}

export function createMaterial(html: string, width: number, height: number)
{
    var mat = new DynamicMaterial(width, height);
    mat.renderHTML(html);
    return mat.getMaterial();
}