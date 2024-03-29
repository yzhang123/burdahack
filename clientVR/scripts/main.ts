/// <reference path="../../comm/MessageMouse.ts" />
/// <reference path="../../comm/MessageWorld.ts" />

/// <reference path="decl/three.d.ts" />
/// <reference path="decl/require.d.ts" />
/// <reference path="decl/jquery.d.ts" />
/// <reference path="decl/socket.io-client.d.ts" />

import $ = require("jquery");
import io = require("socket.io-client");
var TODO_debugEndpoint = "192.168.180.126:8090";
//var TODO_debugEndpoint = "192.168.173.101:8090";
var socket: SocketIOClient.Socket = io.connect(TODO_debugEndpoint);

import { createMaterial, DynamicMaterial } from "entityRenderer";

var textureLoader = new THREE.TextureLoader();
    
    
var originRotation: number = 0;
var usingDevice = false;
var camera : THREE.PerspectiveCamera;
var scene : THREE.Scene;
var renderer : THREE.WebGLRenderer;
var currentMouseButton: number = null;
var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var lon = 0, onMouseDownLon = 0;
var lat = 0, onMouseDownLat = 0;
var phi = 0, theta = 0;
var effect : any;
var controls : any;
var container = document.getElementById("container");
var entityGroup = new THREE.Group();
var cursorGroup = new THREE.Group();
var menuGroup = new THREE.Group();
var backgroundGroup = new THREE.Group();
var mesh_mouses : THREE.Mesh[] = [];
var mesh_menu: THREE.Mesh;
var menu_visible : boolean = false;

var menu_material : THREE.Material;
var cube_material : THREE.MeshBasicMaterial;
var mouse_materials : { [id: string] : THREE.Material } = {};
var mouse_positions : THREE.Vector3[] = [];
var fakeGestureClose = false;

var mesh_back: THREE.Mesh, mesh_front: THREE.Mesh;

var materialCache: { [url: string]: THREE.MeshBasicMaterial } = {};
function getMaterial(url: string): THREE.MeshBasicMaterial
{
    var cached = materialCache[url];
    if (cached) return cached;
    var mat = new DynamicMaterial();
    mat.renderURL("entity/" + url);
    console.log(url);
    return materialCache[url] = mat.getMaterial();
}

init(document.location.href.indexOf("mono=1") > -1);
animate();

function materialFromImage(url : string)
{
    return new THREE.MeshBasicMaterial( {
        map: textureLoader.load( url ),
        side: THREE.DoubleSide,
        transparent : true,
        depthWrite: false
    } );;
}

function init(useMono : boolean ) {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 11000 );
    scene = new THREE.Scene();
    scene.add(backgroundGroup);
    scene.add(entityGroup);
    scene.add(menuGroup);
    scene.add(cursorGroup);
    
    var geometry_back = new THREE.SphereGeometry( 10000, 60, 40 );
    geometry_back.scale( - 1, 1, 1 );
    var geometry_front = new THREE.SphereGeometry( 9500, 60, 40 );
    geometry_front.scale( - 1, 1, 1 );
    var material_back = materialFromImage( 'media/background.jpg');
    var material_front = materialFromImage( 'media/background_front.png');
    material_back.transparent=false;
    material_front.transparent=true;
    mesh_back = new THREE.Mesh( geometry_back, material_back );
    mesh_front = new THREE.Mesh( geometry_front, material_front );
    backgroundGroup.add( mesh_back );
    backgroundGroup.add( mesh_front );
    mouse_materials["open"] = materialFromImage( 'media/hand-open.png');
    mouse_materials["closed"] = materialFromImage( 'media/hand-closed.png');
    mouse_materials["lasso"] = materialFromImage( 'media/hand-lasso.png');
    
    menu_material = materialFromImage('media/menu1.png');
    renderer = new THREE.WebGLRenderer();
    
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.sortObjects = false;

    if(useMono) {
        effect = new THREE.TrivialEffect(renderer);
    } else {
        effect = new THREE.StereoEffect(renderer);
    }
    //effect = renderer;
    effect.eyeSeparation = 0;
    effect.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    
    var body = $("body");
    
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    body.on("contextmenu", e => { e.preventDefault(); return false; });
    body.keydown(e => { if (e.keyCode == 65) fakeGestureClose = !fakeGestureClose; });
    body.on("touchstart", () => goFullScreen());
    //
    
    //
    window.addEventListener( 'resize', onWindowResize, false );
    controls = new THREE.DeviceOrientationControls( camera );
    initDeviceOrientation();
    
    mesh_menu = new THREE.Mesh(new THREE.PlaneBufferGeometry(0.8, 0.8), menu_material);
    mesh_mouses.push(new THREE.Mesh(new THREE.PlaneBufferGeometry(0.5, 0.5), mouse_materials["closed"]));
    mesh_mouses.push(new THREE.Mesh(new THREE.PlaneBufferGeometry(0.5, 0.5).scale(-1, 1, 1), mouse_materials["closed"]));
    mouse_positions.push(new THREE.Vector3(5, 0, 0));
    mouse_positions.push(new THREE.Vector3(5, 0, 0));
    socket.on("kinect-mouse", (mouses : MessageMouses) => {
        updateMouse(mouses);
    });
    updateMouse({
        "0": { DX: 0.8, DY: 0.1, DZ: 0.1, Gesture: "open" },
        "1": { DX: 0.8, DY: -0.1, DZ: -0.1, Gesture: "open" }
    });
    cursorGroup.add(mesh_mouses[0]);
    cursorGroup.add(mesh_mouses[1]);
    
    // fake world
    var world: MessageWorld = { 
        0: { pos: { x: 20, y: 0, z: 0 }, xw: 0.5, yw: 0.5, url: "textbox?text=test" },
        1: { pos: { x: 0, y: 0, z: 20 }, xw: 0.5, yw: 0.5, url: "imgbox?url=/media/menu.png" }, 
        2: { pos: { x: -20, y: 0, z: 0 }, xw: 0.5, yw: 0.5, url: "textbox?text=qweqqweqwe" } 
    };
    setInterval(() => updateWorld(world), 40);
    socket.on("world", (w: MessageWorld) => world = w);
    socket.on("show-menu", openMenu);
    socket.on("hide-menu", closeMenu);
    //openMenu();
    
    if (useMono)
        socket.on("head-rot", (lookAt: THREE.Vector3) => {
            camera.lookAt( lookAt );
        });
}

// use current right mouse
function openMenu()
{
    if (menu_visible) return;
    menuGroup.add(mesh_menu);
    mesh_menu.position.set(mouse_positions[1].x, mouse_positions[1].y, mouse_positions[1].z);
    mesh_menu.lookAt(camera.position);
    menu_visible = true;
}

function closeMenu()
{
    menu_visible = false;
    menuGroup.remove(mesh_menu);
}

function updateMouse(mouses : MessageMouses)
{
    for (var id in mouses)
    {
        var mousePos = new THREE.Vector3(mouses[id].DX, mouses[id].DY, mouses[id].DZ);
        //console.log(mousePos); 
        mousePos.x *= 10;
        mousePos.y *= 10;
        mousePos.z *= 10;
        mouse_positions[id] = mousePos;
        mesh_mouses[id].material = mouse_materials[mouses[id].Gesture] || mesh_mouses[id].material;
        mesh_mouses[id].position.set(mousePos.x, mousePos.y, mousePos.z);
        mesh_mouses[id].lookAt(camera.position);
    }
    //console.log("updateMouse(" + mousePos.toArray() + ", " + mouseMode + ")");

}

function updateWorld(world : MessageWorld)
{
    entityGroup.children.forEach(x => entityGroup.remove(x));
    for (var id in world)
    {
        var entity = world[id];
        
        var mat = getMaterial(entity.url);
        
        var scale = 0.05;
        var cube: THREE.PlaneBufferGeometry;
        if (!mat.map.image)
            cube = new THREE.PlaneBufferGeometry(entity.xw, entity.yw);
        else
            cube = new THREE.PlaneBufferGeometry(
                scale * mat.map.image.width, 
                scale * mat.map.image.height);
        var mesh_cube = new THREE.Mesh( cube, mat );
        mesh_cube.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        mesh_cube.lookAt(camera.position);
        entityGroup.add(mesh_cube);
    }
}

function initDeviceOrientation()
{
    if (window.DeviceOrientationEvent)
        window.addEventListener('deviceorientation', function(event) {if (event.beta !== null) usingDevice = true}, false);   
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseDown( event : MouseEvent ) {
    event.preventDefault();
    currentMouseButton = event.which;
    switch (currentMouseButton)
    {
        case 1: //left
            onMouseDownMouseX = event.clientX;
            onMouseDownMouseY = event.clientY;
            onMouseDownLon = lon;
            onMouseDownLat = lat;
            break;
        case 2: //middle
            break;
        case 3: //right
            goFullScreen();
            break;
        default:
            console.log(currentMouseButton);
    }
}
function onDocumentMouseMove( event : MouseEvent ) {
    switch ( currentMouseButton ) 
    {
        case 1:
            lon = ( onMouseDownMouseX - event.clientX ) * 0.1 + onMouseDownLon;
            lat = ( event.clientY - onMouseDownMouseY ) * 0.1 + onMouseDownLat;
            
            lat = Math.max( - 85, Math.min( 85, lat ) );
            phi = THREE.Math.degToRad( 90 - lat );
            theta = THREE.Math.degToRad( lon - originRotation );
            var target = new THREE.Vector3( 
                500 * Math.sin( phi ) * Math.cos( theta ),
                500 * Math.cos( phi ),
                500 * Math.sin( phi ) * Math.sin( theta ) 
            );
            camera.lookAt( target );
            break;
        case 2: 
            var v = new THREE.Vector3( event.clientX / container.clientWidth - 0.5, -(event.clientY / container.clientHeight - 0.5), -1 );
            v.applyQuaternion( camera.quaternion );
            socket.volatile.emit("mouse", <MessageMouse>{ DX: v.x, DY: v.y, DZ: v.z, Gesture: fakeGestureClose ? "closed" : "open" });
            break;
    }
}
function onDocumentMouseUp( event : MouseEvent ) {
    currentMouseButton = null;
}
// function onDocumentMouseWheel( event ) {
//     camera.fov += ...;
//     camera.updateProjectionMatrix();
// }
function animate() {
    requestAnimationFrame( animate );
    update();
}
var throttle = 0;
function update() {
    if (usingDevice)
    {
        controls.update();
    }
    mesh_back.rotation.y += 0.0001;
    effect.render( scene, camera );
    
    var v = new THREE.Vector3( 0, 0, -1 );
    v.applyQuaternion( camera.quaternion );
    if (usingDevice && ++throttle == 3)
    {
        socket.volatile.emit("head-rot", v);
        throttle = 0;
    }
}



function goFullScreen()
{
    originRotation = lon;
    var elem : any = container;
    if(usingDevice) {
        controls.updateAlphaOffsetAngle(controls.alpha);
    }
    if (elem.requestFullScreen) {
        elem.requestFullScreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen();
    }
}