/// <reference path="../../comm/MessageMouse.ts" />
/// <reference path="../../comm/MessageWorld.ts" />

/// <reference path="decl/three.d.ts" />
/// <reference path="decl/require.d.ts" />
/// <reference path="decl/jquery.d.ts" />
/// <reference path="decl/socket.io-client.d.ts" />
 
import $ = require("jquery");
import io = require("socket.io-client");
var TODO_debugEndpoint = "192.168.180.126:8090";
var socket: SocketIOClient.Socket = io.connect(TODO_debugEndpoint);

import { createTexture, createMaterial } from "entityRenderer";

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
var mesh_mouses : THREE.Mesh[] = [];
var mesh_menu: THREE.Mesh;

var menu_material : THREE.Material;
var cube_material : THREE.MeshBasicMaterial;
var mouse_material_open : THREE.Material;
var mouse_material_closed : THREE.Material;
var mouse_positions : THREE.Vector3[] = [];
var fakeGestureClose = false;

init(document.location.href.indexOf("mono=1") > -1);
animate();

function materialFromImage(url : string)
{
    return new THREE.MeshBasicMaterial( {
        map: textureLoader.load( url ),
        //side: THREE.DoubleSide,
        transparent : true
    } );;
}

function init(useMono : bool) {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.8, 11000 );
    scene = new THREE.Scene();
    var geometry = new THREE.SphereGeometry( 10000, 60, 40 );
    geometry.scale( - 1, 1, 1 );
    var material = materialFromImage( 'media/background.jpg');
    material.transparent=false;
    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    cube_material = materialFromImage( 'media/crate.gif');
    mouse_material_open = materialFromImage( 'media/hand-open.png');
    mouse_material_closed = materialFromImage( 'media/hand-closed.png');
    cube_material = createMaterial("<p style='color:red'>HALLO</p>",64,64);
    
    menu_material = materialFromImage('media/menu1.png');
    renderer = new THREE.WebGLRenderer();
    
    renderer.setPixelRatio( window.devicePixelRatio );

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
    
    mesh_menu = new THREE.Mesh(new THREE.PlaneBufferGeometry(4, 4), menu_material);
    mesh_mouses.push(new THREE.Mesh(new THREE.PlaneBufferGeometry(2.5, 2.5).scale(-1, 1, 1), mouse_material_closed));
    mesh_mouses.push(new THREE.Mesh(new THREE.PlaneBufferGeometry(2.5, 2.5), mouse_material_closed));
    mouse_positions.push(new THREE.Vector3(5, 0, 0));
    mouse_positions.push(new THREE.Vector3(5, 0, 0));
    socket.on("kinect-mouse", (mouses : MessageMouses) => {
        updateMouse(mouses);
    });
    //updateMouse(new THREE.Vector3(15, 5, 5), "open");
    scene.add(mesh_mouses[0]);
    scene.add(mesh_mouses[1]);
    
    // fake world
    updateWorld({ 0: { pos: { x: 3, y: 0, z: 0 }, xw: 0.5, yw: 0.5, zw: 0.5 } });
    socket.on("world", updateWorld);
    socket.on("show-menu", openMenu);
    socket.on("hide-menu", closeMenu);
    //openMenu();
}

// use current right mouse
function openMenu()
{
    scene.add(mesh_menu);
    mesh_menu.position.set(mouse_positions[1].x, mouse_positions[1].y, mouse_positions[1].z);
    mesh_menu.lookAt(camera.position);
    setTimeout( closeMenu, 0, 5 );
}

function closeMenu()
{
    scene.remove(mesh_menu);
}

function updateMouse(mouses : MessageMouses)
{
    for (var id in mouses)
    {
        var mousePos = new THREE.Vector3(mouses[id].DX, mouses[id].DY, mouses[id].DZ);
        
        console.log(mousePos); 
        mousePos.x *= 10;
        mousePos.y *= 10;
        mousePos.z *= 10;
        var index = mouses[id].IsLeft ? 0 : 1; 
        mouse_positions[index] = mousePos;
        if (mouses[id].Gesture == "closed")
            mesh_mouses[index].material =  mouse_material_closed;
        else
            mesh_mouses[index].material = mouse_material_open;
        mesh_mouses[index].position.set(mousePos.x, mousePos.y, mousePos.z);
        mesh_mouses[index].lookAt(camera.position);
    }
    //console.log("updateMouse(" + mousePos.toArray() + ", " + mouseMode + ")");

}


function updateWorld(world : MessageWorld)
{
    //console.log("updateWorld(...)");
    scene.remove(entityGroup);
    entityGroup = new THREE.Group(); 
    for (var id in world)
    {
        var entity = world[id];
        var cube = new THREE.PlaneBufferGeometry(entity.xw, entity.yw);
        var mesh_cube = new THREE.Mesh( cube, cube_material );
        mesh_cube.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        mesh_cube.lookAt(camera.position);
        entityGroup.add(mesh_cube);
    }
    scene.add(entityGroup);
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
            break;
        case 2: 
            var v = new THREE.Vector3( event.clientX / container.clientWidth - 0.5, -(event.clientY / container.clientHeight - 0.5), -1 );
            v.applyQuaternion( camera.quaternion );
            socket.emit("mouse", <MessageMouse>{ DX: v.x, DY: v.y, DZ: v.z, Gesture: fakeGestureClose ? "closed" : "open" });
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
function update() {
    if (usingDevice)
    {
        controls.update();
    }
    else
    {
        lat = Math.max( - 85, Math.min( 85, lat ) );
        phi = THREE.Math.degToRad( 90 - lat );
        theta = THREE.Math.degToRad( lon - originRotation );
        var target = new THREE.Vector3( 
            500 * Math.sin( phi ) * Math.cos( theta ),
            500 * Math.cos( phi ),
            500 * Math.sin( phi ) * Math.sin( theta ) 
        );
        camera.lookAt( target );
    }
    effect.render( scene, camera );
}



function goFullScreen()
{
    originRotation = lon;
    var elem : any = container;
    if (elem.requestFullScreen) {
        elem.requestFullScreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen();
    }
}