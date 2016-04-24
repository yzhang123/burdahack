/**
 * @author alteredq / http://alteredqualia.com/
 * @authod mrdoob / http://mrdoob.com/
 * @authod arodic / http://aleksandarrodic.com/
 * @authod fonserbc / http://fonserbc.github.io/
 *
 * Off-axis stereoscopic effect based on http://paulbourke.net/stereographics/stereorender/
 */

THREE.TrivialEffect = function ( renderer ) {

	this.setSize = function ( width, height ) {
		renderer.setSize( width, height );
	};
	
	this.render = function ( scene, camera ) {
      	renderer.render(scene, camera);
	};

};