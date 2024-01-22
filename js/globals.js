////////
// constants
////////
const sr = 10;
const ARC_SEGMENTS = 200;
const BITS = 3;
const TEXTURE_WIDTH = 256; // points on the texture
const SceneBackground = new THREE.Color( 0x000000 );
const ArrowObjFile = "./img/bad_arrow.obj";
const SphereTexture = "./img/world-map-1748403_edit.png";
//const SphereTexture = "./img/globe_highres.png";
const referenceGeometry = new THREE.Geometry();
referenceGeometry.vertices = Array(2).fill().map(_ => new THREE.Vector3());
const clock = new THREE.Clock();

var gParams = {

    'rotationX': -0.25,
    'rotationY': 0.5,
    'rotationZ': 0,

    'scaleX': 1,
    'scaleY': 1,
    'scaleZ': 1,

    'scaleModifier': 0,

    'path': 1,//0.001,

    'orderCounts': [],
    'orderPos': 0,
    'animationsSpeed':  0.3,
    'animationOverlap': 0.2,
};
////////
// global var
////////
var scene, camera, renderer, orbit;
var arrow, bowList = [];
var gui;

////////
// arrow Materials
////////
var arrow_materialdefault = new THREE.MeshPhongMaterial({
    color: 0x000000,
});
var arrow_material = [];
arrow_material[0] = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 1,
    //map = new THREE.TextureLoader().load( "" ),
});
var glow_texture = new THREE.TextureLoader().load( "./img/glow_texture.png" );
console.log(glow_texture)
glow_texture.center = new THREE.Vector2( 0.5, 0.5);
/*
glow_texture.offset = new THREE.Vector2( 0, 0);
glow_texture.rotation = 1 * Math.PI;
glow_texture.repeat = new THREE.Vector2( 10, 1);
*/

arrow_material[1] = new THREE.MeshPhongMaterial({
     //color: 0x000000,
    //color: 0xffff00,
    transparent: true,
    opacity:0.5,
    map: glow_texture,
    //side: THREE.DoubleSide
});
arrow_material[2] = new THREE.MeshPhongMaterial({
    // color: 0x000000
    color: 0xffff00,
    transparent: true,
    opacity: 0.0,
    //map = new THREE.TextureLoader().load( "" ),
});