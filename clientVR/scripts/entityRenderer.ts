
/// <reference path="decl/three.d.ts" />

export class DynamicMaterial
{
    private canvas: HTMLCanvasElement;
    private texture : THREE.Texture;
    private material : THREE.MeshBasicMaterial;
    
    public constructor(
        private width: number,
        private height: number
    )
    {
        this.canvas = createCanvas(width, height);
        this.texture = new THREE.Texture(this.canvas);
        this.material = new THREE.MeshBasicMaterial( {
            map: this.texture,
            side: THREE.DoubleSide,
            transparent : true,
            alphaTest: 0.1
        } );
    }
    
    public getContext(): CanvasRenderingContext2D
    {
        return this.canvas.getContext("2d");
    }
    public clear(): void
    {
        this.getContext().clearRect(0,0,this.width, this.height);
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
        this.clear();
        rasterizeHTML.drawHTML(html, this.canvas)
            .then(() => this.updateTexture());
    }
    public renderURL(url: string): void
    {
        this.clear();
        rasterizeHTML.drawURL(url, this.canvas)
            .then(() => this.updateTexture());
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