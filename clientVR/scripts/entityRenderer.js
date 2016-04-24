/// <reference path="decl/three.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    var DynamicMaterial = (function () {
        function DynamicMaterial() {
            this.canvas = createCanvas(1, 1);
            this.texture = new THREE.Texture(this.canvas);
            this.material = new THREE.MeshBasicMaterial({
                map: this.texture,
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.01
            });
        }
        DynamicMaterial.prototype.updateTexture = function () {
            this.texture.needsUpdate = true;
        };
        DynamicMaterial.prototype.getMaterial = function () {
            return this.material;
        };
        DynamicMaterial.prototype.renderHTML = function (html) {
            var _this = this;
            rasterizeHTML.drawHTML(html)
                .then(function (image) {
                _this.canvas.width = image.image.width;
                _this.canvas.height = image.image.height;
                rasterizeHTML.drawHTML(html, _this.canvas)
                    .then(function () {
                    _this.updateTexture();
                });
            });
        };
        DynamicMaterial.prototype.renderURL = function (url) {
            var _this = this;
            rasterizeHTML.drawURL(url)
                .then(function (image) {
                _this.canvas.width = image.image.width;
                _this.canvas.height = image.image.height;
                rasterizeHTML.drawURL(url, _this.canvas)
                    .then(function () {
                    _this.updateTexture();
                });
            });
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
