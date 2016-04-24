/// <reference path="decl/three.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    var DynamicMaterial = (function () {
        function DynamicMaterial(width, height) {
            this.width = width;
            this.height = height;
            this.canvas = createCanvas(width, height);
            this.texture = new THREE.Texture(this.canvas);
            this.material = new THREE.MeshBasicMaterial({
                map: this.texture,
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.1
            });
        }
        DynamicMaterial.prototype.getContext = function () {
            return this.canvas.getContext("2d");
        };
        DynamicMaterial.prototype.clear = function () {
            this.getContext().clearRect(0, 0, this.width, this.height);
        };
        DynamicMaterial.prototype.updateTexture = function () {
            this.texture.needsUpdate = true;
        };
        DynamicMaterial.prototype.getMaterial = function () {
            return this.material;
        };
        DynamicMaterial.prototype.renderHTML = function (html) {
            var _this = this;
            this.clear();
            rasterizeHTML.drawHTML(html, this.canvas)
                .then(function () { return _this.updateTexture(); });
        };
        DynamicMaterial.prototype.renderURL = function (url) {
            var _this = this;
            this.clear();
            rasterizeHTML.drawURL(url, this.canvas)
                .then(function () { return _this.updateTexture(); });
        };
        return DynamicMaterial;
    }());
    exports.DynamicMaterial = DynamicMaterial;
    function createCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    exports.createCanvas = createCanvas;
    function createMaterial(html, width, height) {
        var mat = new DynamicMaterial(width, height);
        mat.renderHTML(html);
        return mat.getMaterial();
    }
    exports.createMaterial = createMaterial;
});
