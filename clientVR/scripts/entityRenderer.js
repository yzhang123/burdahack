/// <reference path="decl/three.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    function createTexture(html, width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var result = new THREE.Texture(canvas);
        rasterizeHTML.drawHTML(html, canvas)
            .then(function () { return result.needsUpdate = true; });
        return result;
    }
    exports.createTexture = createTexture;
    function createMaterial(html, width, height) {
        var mat = new THREE.MeshBasicMaterial({
            map: createTexture(html, width, height),
            side: THREE.DoubleSide,
            transparent: true
        });
        return mat;
    }
    exports.createMaterial = createMaterial;
});
