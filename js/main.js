init();
animate();

function init(){
    container = document.getElementById( 'container' );

    scene = new THREE.Scene();
    scene.background = SceneBackground;

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
    camera.position.z = 30;
    camera.position.y = 0;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    orbit = new THREE.OrbitControls( camera, renderer.domElement );
    orbit.enableZoom = true;

    var light = new THREE.AmbientLight( 0xAAAAAA );
    scene.add( light );
/*
    var helper = new THREE.GridHelper( 2000, 100 );
    helper.position.y = - 199;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );
*/
    stats = new Stats();
    container.appendChild( stats.dom );
    
    gui = new dat.GUI()

    initGUI();

    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );

    var loader = new THREE.OBJLoader();
    loader.load( ArrowObjFile,
    function ( object ) {
        //object.children.splice(1, 2);

        arrow = object;

        object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                // just for smooth shading
                var geo = new THREE.Geometry().fromBufferGeometry( child.geometry );
                geo.mergeVertices()
                geo.computeVertexNormals()
                child.geometry = new THREE.BufferGeometry().fromGeometry( geo );
            }
        });


        geoms = arrow.children.map(child => child.geometry);
        bbs = geoms.map(geo => {
            geo.computeBoundingBox();
            return geo.boundingBox;
        });

        console.log('boundingbox', bbs);

        referenceGeometry.vertices[0].set(
            Math.min(...bbs.map(bb => bb.min.x)),
            Math.min(...bbs.map(bb => bb.min.y)),
            Math.min(...bbs.map(bb => bb.min.z))
        )

        referenceGeometry.vertices[1].set(
            Math.max(...bbs.map(bb => bb.max.x)),
            Math.max(...bbs.map(bb => bb.max.y)),
            Math.max(...bbs.map(bb => bb.max.z))
        )
        gParams.scaleModifier = Math.abs(referenceGeometry.vertices[0].z)+Math.abs(referenceGeometry.vertices[1].z);

        for( var i = 0; i < bowList.length; i++) {
            bowList[i].initWithArrow();
        }
    },
    function ( xhr ) {
        //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },
    function ( err ) {
        console.error( 'An error happened' );
    });

    initBows();
    
    ////////
    // add Sphere
    ////////
    var sphereTexture = new THREE.TextureLoader().load(SphereTexture);
    var sphereGeometry = new THREE.SphereGeometry( sr, 32, 32 );
    var sphereMaterial = new THREE.MeshPhongMaterial( {map: sphereTexture, opacity: 1,transparent: true,side: THREE.DoubleSide} );
    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.rotation.y = -0.5*Math.PI;
    scene.add( sphere );
}

function initGUI() {
    gui.add( gParams, 'path', 0.001, 1 ).step( 0.0001 ).onChange( updateModel );
    gui.add( gParams, 'animationsSpeed', 0.1, 1 ).step( 0.01 ).onChange( updateModel );
    gui.add( gParams, 'orderPos', 0, 100 );
    gui.add( gParams, 'animationOverlap', 0, 1 ).step( 0.1 ).onChange( updateModel );
    
    gui.open();
}

function initBows() {
    for( var i = 0; i < Bows.length; i++ ) {
        bowList.push( new Bow( Bows[ i ] ) );
        gParams.orderCounts.push(Bows[ i ].order)
    }
    gParams.orderCounts = [...new Set(gParams.orderCounts)].sort();
}

function updateModel() {
    for( var i = 0; i < bowList.length; i++) {
        bowList[i].params = gParams;
        bowList[i].updateModelAll();
    }
}

function render() {
    stats.begin();
    renderer.render( scene, camera );
    stats.end();
}

function animate(){
    var clockStep = clock.getDelta();

    gParams.path += clockStep * gParams.animationsSpeed;
    if( gParams.path > (1 + gParams.animationOverlap) ) {
        gParams.path %= 1 + gParams.animationOverlap;
        gParams.orderPos++;
        gParams.orderPos %= gParams.orderCounts.length;
    }


    updateModel();

    
    requestAnimationFrame( animate );
    render();
    stats.update();
    
    gui.updateDisplay();
}

    