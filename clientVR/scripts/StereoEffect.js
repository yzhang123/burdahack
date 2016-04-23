/**
 * @author alteredq / http://alteredqualia.com/
 * @authod mrdoob / http://mrdoob.com/
 * @authod arodic / http://aleksandarrodic.com/
 * @authod fonserbc / http://fonserbc.github.io/
 *
 * Off-axis stereoscopic effect based on http://paulbourke.net/stereographics/stereorender/
 */

var fragmentShader = "uniform sampler2D texture; \n" + 
"uniform vec2 coefficients; \n" + 
"uniform vec2 eyeOffset; \n" + 
"uniform float vignetteX; \n" + 
"uniform float vignetteY; \n" + 

"varying vec2 xy; \n" + 

"vec2 distort(vec2 position) \n" + 
"{ \n" + 
"    vec2 p = position.xy - (eyeOffset); \n" + 
"    float radiusSquared = (p.y * p.y + p.x * p.x); \n" + 
"    float radDistorted = 1.0 + (coefficients.x + radiusSquared * coefficients.y) * radiusSquared;  \n" + 
"    p = p * radDistorted + (eyeOffset);  \n" + 
"    return p; \n" + 
"} \n" + 
 
"void main() {  \n" + 
"    vec2 nuv = 0.5 * (distort(xy) + 1.0); \n" + 
"    float d = length(nuv); \n" + 
	
"    if (!all(equal(clamp(nuv, vec2(0.0, 0.0), vec2(1.0, 1.0)), nuv))) {  \n" + 
"        gl_FragColor = vec4(0.0);  \n" + 
"    } else {  \n" + 
"        vec2 center = nuv - vec2(0.5, 0.5);  \n" + 
"        center = abs(center);  \n" + 
"        float light = 1.0;  \n" + 
"        float vX = max(center.x - (0.5 - vignetteX), 0.0);  \n" + 
"        float vY = max(center.y - (0.5 - vignetteY), 0.0);  \n" + 

"        if(vX * vignetteY > vY * vignetteX) {  \n" + 
"            light = 1.0 - vX / vignetteX;  \n" + 
"        } else {  \n" + 
"            light = 1.0 - vY / vignetteY;  \n" + 
"        }  \n" + 
"        gl_FragColor = texture2D(texture, nuv) * light;  \n" + 
"    }  \n" + 
"}";

var vertexShader = "varying vec2 xy;   \n" + 
"uniform float textureCoordScale;  \n" + 
"uniform vec2 viewportOffset;  \n" + 

"void main() {  \n" + 
"  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);  \n" + 
"  xy = (uv * 2.0 - 1.0) * textureCoordScale + viewportOffset;  \n" + 
"}";

var DistortionShader = {
	uniforms: {
        texture: {
            type: 't',
			name: 'intermediate_buffer',
            value: null
        },
        textureCoordScale: {
            type: 'f',
            value: 0.9
        },
        viewportOffset: {
            type: 'v2',
            value: new THREE.Vector2(0, 0)
        },
        eyeOffset: {
            type: 'v2',
            value: new THREE.Vector2(0, 0)
        },
        coefficients: {
            type: 'v2',
            value: new THREE.Vector2(0.12, 0.12)
        },
        vignetteX: {
            type: 'f',
            value: 0.1
        },
        vignetteY: {
            type: 'f',
            value: 0.1
        },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
}

THREE.StereoEffect = function ( renderer ) {

	// API

	this.separation = 0.15;

	/*
	 * Distance to the non-parallax or projection plane
	 */
	this.focalLength = 15;

	// internals

	var _width, _height;

	var _position = new THREE.Vector3();
	var _quaternion = new THREE.Quaternion();
	var _scale = new THREE.Vector3();

	var _cameraL = new THREE.PerspectiveCamera();
	var _cameraR = new THREE.PerspectiveCamera();
	
	var _cameraO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	var _sceneO = new THREE.Scene();
	var _quadO =  new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.ShaderMaterial(DistortionShader));
	_sceneO.add(_quadO);	

	var _fov;
	var _outer, _inner, _top, _bottom;
	var _ndfl, _halfFocalWidth, _halfFocalHeight;
	var _innerFactor, _outerFactor;
	var _buffer;
	
	var leftParams = {
		viewportOffsetY: 0,
		viewportOffsetX: -0.2,
		eyeOffsetX: 0.05,
		eyeOffsetY: 0,		
	};
	var rightParams = {
		viewportOffsetY: 0,
		viewportOffsetX: 0.2,
		eyeOffsetX: -0.05,
		eyeOffsetY: 0,		
	};

	// initialization

	renderer.autoClear = false;

	this.setSize = function ( width, height ) {

		_width = width / 2;
		_height = height;

		renderer.setSize( width, height );
		
		var renderTargetParams = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
		};
	
		_buffer = new THREE.WebGLRenderTarget(_width, _height, renderTargetParams);
	};
	
	this.render = function ( scene, camera ) {

		scene.updateMatrixWorld();

		if ( camera.parent === undefined ) camera.updateMatrixWorld();
	
		camera.matrixWorld.decompose( _position, _quaternion, _scale );
		// Stereo frustum calculation

		// Effective fov of the camera
		_fov = THREE.Math.radToDeg( 2 * Math.atan( Math.tan( THREE.Math.degToRad( camera.fov ) * 0.5 ) ) );

		_ndfl = camera.near / this.focalLength;
		_halfFocalHeight = Math.tan( THREE.Math.degToRad( _fov ) * 0.5 ) * this.focalLength;
		_halfFocalWidth = _halfFocalHeight * 0.5 * camera.aspect;

		_top = _halfFocalHeight * _ndfl;
		_bottom = -_top;
		_innerFactor = ( _halfFocalWidth + this.separation / 2.0 ) / ( _halfFocalWidth * 2.0 );
		_outerFactor = 1.0 - _innerFactor;

		_outer = _halfFocalWidth * 2.0 * _ndfl * _outerFactor;
		_inner = _halfFocalWidth * 2.0 * _ndfl * _innerFactor;

		// left

		_cameraL.projectionMatrix.makeFrustum(
			-_outer,
			_inner,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraL.position.copy( _position );
		_cameraL.rotation.copy( camera.rotation );
		_cameraL.translateX( - this.separation / 2.0 );

		// right

		_cameraR.projectionMatrix.makeFrustum(
			-_inner,
			_outer,
			_bottom,
			_top,
			camera.near,
			camera.far
		);

		_cameraR.position.copy( _position );
		_cameraR.rotation.copy( camera.rotation );
		_cameraR.translateX( this.separation / 2.0 );
		
   	 	renderer.autoClear = false
		
		renderer.setViewport(0, 0, _width, _height);
      	renderer.render(scene, _cameraL, _buffer, true);
		//renderer.render(scene, _cameraL);
		
    	DistortionShader.uniforms.viewportOffset.value = new THREE.Vector2(leftParams.viewportOffsetX, leftParams.viewportOffsetY)
    	DistortionShader.uniforms.eyeOffset.value = new THREE.Vector2(leftParams.eyeOffsetX, leftParams.eyeOffsetY)
    	DistortionShader.uniforms.texture.value = _buffer;
		renderer.setViewport(0, 0, _width, _height);
      	renderer.render(_sceneO, _cameraO);
		  
		renderer.setViewport(0, 0, _width, _height);
		renderer.render(scene, _cameraR, _buffer, true);
		renderer.render(scene, _cameraR);
		
    	DistortionShader.uniforms.viewportOffset.value = new THREE.Vector2(rightParams.viewportOffsetX, rightParams.viewportOffsetY)
    	DistortionShader.uniforms.eyeOffset.value = new THREE.Vector2(rightParams.eyeOffsetX, rightParams.eyeOffsetY)
    	DistortionShader.uniforms.texture.value = _buffer;
		renderer.setViewport(_width, 0, _width, _height);
      	renderer.render(_sceneO, _cameraO);

	};

};