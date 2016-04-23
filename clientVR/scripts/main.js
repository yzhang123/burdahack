/// <reference path="decl/three.d.ts" />
var usingDevice = false;
var camera, scene, renderer;
var isUserInteracting = false, onMouseDownMouseX = 0, onMouseDownMouseY = 0, lon = 0, onMouseDownLon = 0, lat = 0, onMouseDownLat = 0, phi = 0, theta = 0;
<<<<<<< HEAD
var mesh_cube;
var boxes = ["", "", ""];
=======
var effect;
>>>>>>> 68ea695f6bad3b1466e4660b45f3429564f27dc7
init();
animate();
function init() {
    var container, mesh;
    container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    //camera.position.z = 30;
    camera.target = new THREE.Vector3(0, 0, 0);
    scene = new THREE.Scene();
    var geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('media/background.jpg')
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    var cube_material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('media/crate.gif')
    });
    for (var i = 0; i < boxes.length; i++) {
        var cube = new THREE.BoxBufferGeometry(10, 10, 10);
        mesh_cube = new THREE.Mesh(cube, cube_material);
        mesh_cube.position.set(30 * Math.sin(i), 0, 30 * Math.cos(i));
        scene.add(mesh_cube);
    }
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
    //
    //
    window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.DeviceOrientationControls(camera);
    initDeviceOrientation();
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
    isUserInteracting = true;
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
}
function onDocumentMouseMove(event) {
    if (isUserInteracting === true) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
    }
}
function onDocumentMouseUp(event) {
    isUserInteracting = false;
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
    mesh_cube.rotation.x += 0.005;
    mesh_cube.rotation.y += 0.01;
    if (usingDevice) {
        controls.update();
    }
    else {
        lat = Math.max(-85, Math.min(85, lat));
        phi = THREE.Math.degToRad(90 - lat);
        theta = THREE.Math.degToRad(lon);
        camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
        camera.target.y = 500 * Math.cos(phi);
        camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(camera.target);
    }
    effect.render(scene, camera);
}
