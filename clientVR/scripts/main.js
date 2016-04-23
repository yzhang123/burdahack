/// <reference path="../../comm/MessageMouse.ts" />
/// <reference path="../../comm/MessageWorld.ts" />
define(["require", "exports", "jquery", "socket.io-client"], function (require, exports, $, io) {
    "use strict";
    var TODO_debugEndpoint = "192.168.180.126:8090";
    var socket = io.connect(TODO_debugEndpoint);
    var usingDevice = false;
    var camera;
    var scene;
    var renderer;
    var currentMouseButton = null;
    var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
    var lon = 0, onMouseDownLon = 0;
    var lat = 0, onMouseDownLat = 0;
    var phi = 0, theta = 0;
    var effect;
    var controls;
    var container = document.getElementById("container");
    var entityGroup = new THREE.Group();
    var mousePos;
    var mouseMode;
    var cube_material;
    var mouse_material_open;
    var mouse_material_closed;
    var fakeGestureClose = false;
    init();
    animate();
    function init() {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 110000);
        scene = new THREE.Scene();
        var geometry = new THREE.SphereGeometry(100000, 60, 40);
        geometry.scale(-1, 1, 1);
        var material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('media/background.jpg')
        });
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        cube_material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('media/crate.gif')
        });
        mouse_material_open = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('media/hand-open.png')
        });
        mouse_material_closed = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('media/hand-closed.png')
        });
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        effect = new THREE.StereoEffect(renderer);
        //effect = renderer;
        effect.eyeSeparation = 0;
        effect.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        $("body").on("contextmenu", function (e) { e.preventDefault(); return false; });
        $("body").keydown(function (e) { if (e.keyCode == 65)
            fakeGestureClose = !fakeGestureClose; });
        //
        //
        window.addEventListener('resize', onWindowResize, false);
        controls = new THREE.DeviceOrientationControls(camera);
        initDeviceOrientation();
        socket.on("kinect-mouse", function (mouse) {
            mousePos = new THREE.Vector3(mouse.DX, mouse.DY, mouse.DZ);
            var len = mousePos.length();
            mousePos.x *= 20 / len;
            mousePos.y *= 20 / len;
            mousePos.z *= 20 / len;
            mouseMode = mouse.Gesture;
        });
        // fake world
        updateWorld({ 0: { pos: { x: 30, y: 0, z: 0 }, xw: 5, yw: 5, zw: 5 } });
        //socket.on("world", updateWorld);
    }
    function updateWorld(world) {
        scene.remove(entityGroup);
        entityGroup = new THREE.Group();
        for (var id in world) {
            var entity = world[id];
            var cube = new THREE.BoxBufferGeometry(entity.xw, entity.yw, entity.zw);
            var mesh_cube = new THREE.Mesh(cube, cube_material);
            mesh_cube.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
            entityGroup.add(mesh_cube);
        }
        var mouse = new THREE.PlaneGeometry(5, 5);
        var mesh_mouse;
        if (mouseMode == "closed")
            mesh_mouse = new THREE.Mesh(mouse, mouse_material_closed);
        else
            mesh_mouse = new THREE.Mesh(mouse, mouse_material_open);
        //mesh_mouse.position.set(mousePos.x - 5, mousePos.y - 5, )
        scene.add(entityGroup);
    }
    function initDeviceOrientation() {
        if (window.DeviceOrientationEvent)
            window.addEventListener('deviceorientation', function (event) { if (event.beta !== null)
                usingDevice = true; }, false);
    }
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        effect.setSize(window.innerWidth, window.innerHeight);
    }
    function onDocumentMouseDown(event) {
        event.preventDefault();
        currentMouseButton = event.which;
        switch (currentMouseButton) {
            case 1:
                onMouseDownMouseX = event.clientX;
                onMouseDownMouseY = event.clientY;
                onMouseDownLon = lon;
                onMouseDownLat = lat;
                break;
            case 2:
                break;
            case 3:
                break;
            default:
                console.log(currentMouseButton);
        }
    }
    function onDocumentMouseMove(event) {
        switch (currentMouseButton) {
            case 1:
                lon = (onMouseDownMouseX - event.clientX) * 0.1 + onMouseDownLon;
                lat = (event.clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;
                break;
            case 2:
                var v = new THREE.Vector3(event.clientX / container.clientWidth - 0.5, -(event.clientY / container.clientHeight - 0.5), -1);
                v.applyQuaternion(camera.quaternion);
                socket.emit("mouse", { DX: v.x, DY: v.y, DZ: v.z, Gesture: fakeGestureClose ? "closed" : "open" });
                break;
        }
    }
    function onDocumentMouseUp(event) {
        currentMouseButton = null;
    }
    // function onDocumentMouseWheel( event ) {
    //     camera.fov += ...;
    //     camera.updateProjectionMatrix();
    // }
    function animate() {
        requestAnimationFrame(animate);
        update();
    }
    function update() {
        if (usingDevice) {
            controls.update();
        }
        else {
            lat = Math.max(-85, Math.min(85, lat));
            phi = THREE.Math.degToRad(90 - lat);
            theta = THREE.Math.degToRad(lon);
            var target = new THREE.Vector3(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
            camera.lookAt(target);
        }
        effect.render(scene, camera);
    }
});
