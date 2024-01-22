function Bow( data ) {
    var arrows = [], normalArrow, glowArrow;
    var cs = new THREE.Group();
    var v1, v2;
    var order = data.order;
    var ellipse;
    var splinesProto = {}, splines = [];
    
    var vertsDist = 0;
/*
    var params = {				
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,

        rotationX: 0.5,
        rotationY: 0.5,
        rotationZ: 0,

        translateX: 0,
        translateY: 0,
        translateZ: 0,
    };
*/

//cs.position.z = data.order * 30;
    function init() {
        v1 = Locations[data.from].v;
        v2 = Locations[data.to].v;
        
        calculateCoordSysRotation();
        //generateEllipsePoints();
        generatePath();

        //scene.add(cs);
        this._isInit = true;
        if( !arrow && !this._isInitWithArrow) return;
        //initWithArrow();
    };

    function initWithArrow() {
        
        if( !this._isInit ){
            //init();
        } 
        //if(!this._isInitWithArrow) return;

        for( var i = 0; i < arrow.children.length; i++ ) {
            splines[i] = {};
            splines[i].centripetal = splinesProto.centripetal.clone();
            splines[i].chordal = splinesProto.chordal.clone();
            splines[i].uniform = splinesProto.uniform.clone();
            arrows[i] =  new ArrowIntern( i );
            updateModel(i);
            scene.add(arrows[i].mesh);
        }
        this._isInitWithArrow = true;
    };

    function updateModel( arrowID ) {
        var modifierObject = new THREE.Object3D();
        modifierObject.scale.x = gParams.scaleX*1.5;
        modifierObject.scale.y = gParams.scaleY*1.5;
        var path = gParams.path;
        if( path > 1 ) path = 1;
        modifierObject.scale.z = vertsDist * path / gParams.scaleModifier;

        modifierObject.rotation.x = gParams.rotationX * Math.PI;
        modifierObject.rotation.y = gParams.rotationY * Math.PI;
        modifierObject.rotation.z = gParams.rotationZ * Math.PI;

        
        arrows[arrowID].mesh.matrixAutoUpdate = false;
        modifierObject.updateMatrix();
        arrows[arrowID].mesh.matrix.copy(modifierObject.matrix);

        moo = referenceGeometry.clone().applyMatrix(modifierObject.matrix);

        // use x-axis aligned
        min = Math.min(...moo.vertices.map(v => v.x));
        len = Math.max(...moo.vertices.map(v => v.x)) - min;
        
        arrows[arrowID].updateUniform('spineOffset', -min);
        arrows[arrowID].updateUniform('spineLength', len);

        if( order === gParams.orderCounts[gParams.orderPos]) {
            arrows[arrowID].show( true );
        }else{
            arrows[arrowID].show( false );
        }

        updateSplineOutline( arrowID )
    };

    function calculateCoordSysRotation() {
        // calculate angle between locations
        let po1 = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
        let po2 = Math.sqrt( v1.x*v1.x + v1.y*v1.y + v1.z*v1.z );
        let po3 = Math.sqrt( v2.x*v2.x + v2.y*v2.y + v2.z*v2.z );
        if(Math.abs(po1 / (po2 * po3)) > 1)
            angleBetweenLocations = Math.acos(1);
        else
            angleBetweenLocations = Math.acos(Math.abs(po1/(po2*po3)));

        // calculate normalVector between loactions and zero point and middle point between
        if( angleBetweenLocations === 0 ) {
            let orinetVector = new Vector3(-1,0,0)

            normalVector = new Vector3( 
                v1.y*orinetVector.z - v1.z*orinetVector.y,
                v1.z*orinetVector.x - v1.x*orinetVector.z,
                v1.x*orinetVector.y - v1.y*orinetVector.x
            );
            middlePointBetweenLocations = new Vector3(
                -(v1.y*normalVector.z - v1.z*normalVector.y),
                -(v1.z*normalVector.x - v1.x*normalVector.z),
                -(v1.x*normalVector.y - v1.y*normalVector.x)
            );
        }else{
            normalVector = new THREE.Vector3(
                v1.y*v2.z - v1.z*v2.y,
                v1.z*v2.x - v1.x*v2.z,
                v1.x*v2.y - v1.y*v2.x
            );
            let l = Math.sqrt(Math.pow(normalVector.x,2)+Math.pow(normalVector.y,2)+Math.pow(normalVector.z,2));
            normalVector.x /= l; normalVector.y /= l; normalVector.z /= l;

            middlePointBetweenLocations = new THREE.Vector3(
                ( v1.x + 0.5*( v2.x - v1.x ) ),
                ( v1.y + 0.5*( v2.y - v1.y ) ),
                ( v1.z + 0.5*( v2.z - v1.z ) )
            );
        }
        middlePointBetweenLocationsLength = Math.sqrt(middlePointBetweenLocations.x*middlePointBetweenLocations.x + middlePointBetweenLocations.y*middlePointBetweenLocations.y + middlePointBetweenLocations.z*middlePointBetweenLocations.z);
    

        ////////
        // calculate rotation in axis
        ////////
        let nvrx, nvry, mprx, mpry, mprz;
        // rotation on x-axis
        nvrx = -Math.atan(normalVector.y/normalVector.z);
        if(normalVector.z < 0) nvrx += 1*Math.PI; 
        normalVector.x_rot1 = normalVector.x;
        normalVector.y_rot1 = Math.sqrt(normalVector.y*normalVector.y + normalVector.z*normalVector.z)*Math.sin(0);
        normalVector.z_rot1 = Math.sqrt(normalVector.y*normalVector.y + normalVector.z*normalVector.z)*Math.cos(0);
            
        mprx = -Math.atan(middlePointBetweenLocations.z/middlePointBetweenLocations.y);
        if(middlePointBetweenLocations.y < 0) mprx += 1*Math.PI;
        middlePointBetweenLocations.x_rot1 = middlePointBetweenLocations.x;
        middlePointBetweenLocations.y_rot1 = Math.sqrt(middlePointBetweenLocations.y*middlePointBetweenLocations.y + middlePointBetweenLocations.z*middlePointBetweenLocations.z)*Math.cos(nvrx+mprx);
        middlePointBetweenLocations.z_rot1 = -Math.sqrt(middlePointBetweenLocations.y*middlePointBetweenLocations.y + middlePointBetweenLocations.z*middlePointBetweenLocations.z)*Math.sin(nvrx+mprx);

         // rotation on y-axis
        nvry = Math.atan(normalVector.x_rot1/normalVector.z_rot1);

        if(middlePointBetweenLocations.z_rot1 === 0) mpry = 0.5*Math.PI;
        else{ 
            mpry = Math.atan(middlePointBetweenLocations.x_rot1/middlePointBetweenLocations.z_rot1);
            if(middlePointBetweenLocations.z_rot1 > 0) mpry += 1*Math.PI;
        }
        middlePointBetweenLocations.x_rot2 = -Math.sqrt(middlePointBetweenLocations.x_rot1*middlePointBetweenLocations.x_rot1 + middlePointBetweenLocations.z_rot1*middlePointBetweenLocations.z_rot1)*Math.sin(mpry-nvry);
        middlePointBetweenLocations.y_rot2 = middlePointBetweenLocations.y_rot1;
        middlePointBetweenLocations.z_rot2 = Math.sqrt(middlePointBetweenLocations.x_rot1*middlePointBetweenLocations.x_rot1 + middlePointBetweenLocations.z_rot1*middlePointBetweenLocations.z_rot1)*Math.cos(mpry-nvry);
        
        // rotation on z-axis
        mprz = -Math.atan(middlePointBetweenLocations.x_rot2/middlePointBetweenLocations.y_rot2);
        if(middlePointBetweenLocations.y_rot2 < 0) mprz += 1*Math.PI;

        rotation = new THREE.Vector3(nvrx, nvry, mprz);

        cs.rotation.set(rotation.x,rotation.y,rotation.z);
    };

    function generateEllipsePoints() {
        if( angleBetweenLocations === 0 ){
            ellipse = new THREE.EllipseCurve(0,  0, sr, sr*(0.1), 0, Math.PI, false, 0);
        }else{
            ellipse = new THREE.EllipseCurve(
                0,  middlePointBetweenLocationsLength*sr,
                0.5*Math.sqrt(Math.pow(v2.x-v1.x,2)+
                Math.pow(v2.y-v1.y,2)+
                Math.pow(v2.z-v1.z,2))*sr,
                sr*(0.1+(1-middlePointBetweenLocationsLength)),
                0,  Math.PI, false, 0
            );
        }
    };






    function generatePath() {
        var geometry, curve;
        //var ellipsePoints = ellipse.getPoints( 32 );

        var positions = [
        ];

        //for ( var i = 0; i < ellipsePoints.length; i ++ ) {
        //    var newPoint3 = new THREE.Vector3(ellipsePoints[i].x, ellipsePoints[i].y, 0)
        //    positions.push(newPoint3);
        //}
        var v1m = new THREE.Vector3(v1.x*sr,v1.y*sr,v1.z*sr);
        var mPBL = middlePointBetweenLocations;
        var v2m = new THREE.Vector3(v2.x*sr,v2.y*sr,v2.z*sr);

        //scene.add()
        positions = [
            //new THREE.Vector3(v1.x*sr*0.95,v1.y*sr*0.95,v1.z*sr*0.95),
            v1m,
            new THREE.Vector3(mPBL.x*sr/mPBL.length()*1.1,mPBL.y*sr/mPBL.length()*1.1,mPBL.z*sr/mPBL.length()*1.1),
            v2m
        ];

        geometry = new THREE.Geometry();
        for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
            geometry.vertices.push( new THREE.Vector3() );
        }
        curve = new THREE.CatmullRomCurve3( positions );
        curve.curveType = 'catmullrom';
        curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
            color: 0xff0000,
            opacity: 0.35,
            linewidth: 2
            } ) );
        splinesProto.uniform = curve;


        curve = new THREE.CatmullRomCurve3( positions, true );
        curve.curveType = 'centripetal';
        curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
            color: 0x00ff00,
            opacity: 0.35,
            linewidth: 2
            } ) );
        splinesProto.centripetal = curve;

        curve = new THREE.CatmullRomCurve3( positions );
        curve.curveType = 'chordal';
        curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
            color: 0x0000ff,
            opacity: 0.35,
            linewidth: 2
            } ) );
        splinesProto.chordal = curve;

        for ( var k in splinesProto ) {
            var spline = splinesProto [ k ];
            splineMesh = spline.mesh;
            for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
                var p = splineMesh.geometry.vertices[ i ];
                var t = i /  ( ARC_SEGMENTS - 1 );
                spline.getPoint( t, p );
            }
            splineMesh.geometry.verticesNeedUpdate = true;
        }

        var verts = splinesProto.centripetal.mesh.geometry.vertices;
        var minDist=sr*10;
        var minPos;
        for( i = 0; i < verts.length; i++ ) {
            if(minDist>v2m.distanceTo(verts[i])){
                minDist=v2m.distanceTo(verts[i]);
                minPos=i;
            }
        }

        for( i = 0; i < minPos+1; i++ ) {
            vertsDist += verts[i].distanceTo(verts[i+1])
        }
console.log(vertsDist)
gParams.scaleModifier
        
        //console.log( splinesProto.centripetal.mesh.geometry.vertices );
        //scene.add( splinesProto.centripetal.mesh );
    };

    function updateSplineOutline( arrowID ) {
/*
        for ( var k in splines[arrowID] ) {
            var spline = splines[arrowID][ k ];
            splineMesh = spline.mesh;
            for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
                var p = splineMesh.geometry.vertices[ i ];
                var t = i /  ( ARC_SEGMENTS - 1 );
                spline.getPoint( t, p );
            }
            splineMesh.geometry.verticesNeedUpdate = true;
        }
        */
        updateSplineTexture( arrowID );
    }

    function updateSplineTexture( arrowID ) {
        if ( !arrows[arrowID].texture ) return;

        splines[arrowID].centripetal.arcLengthDivisions = 200;
        splines[arrowID].centripetal.updateArcLengths()
        splineLen = splines[arrowID].centripetal.getLength()
        var pathSegment = len / splineLen // should clam max to 1

        // updateUniform('spineOffset', 0);
        arrows[arrowID].updateUniform('pathSegment', pathSegment);

        var splineCurve = splines[arrowID].centripetal;
        // uniform chordal centripetal
        var points = splineCurve.getSpacedPoints(TEXTURE_WIDTH - 1);
        // getPoints() - unequal arc lengths
        var frenetFrames = splineCurve.computeFrenetFrames(TEXTURE_WIDTH - 1, false);
        // console.log(frenetFrames);

        // console.log('points', points);
        for (var i = 0; i < TEXTURE_WIDTH; i++) {
            var pt = points[i];
            setTextureValue(i, pt.x, pt.y, pt.z, 0, arrowID);
            pt = frenetFrames.tangents[i];
            setTextureValue(i, pt.x, pt.y, pt.z, 1, arrowID);
            pt = frenetFrames.normals[i];
            setTextureValue(i, pt.x, pt.y, pt.z, 2, arrowID);
            pt = frenetFrames.binormals[i];
            setTextureValue(i, pt.x, pt.y, pt.z, 3, arrowID);
        }

        arrows[arrowID].texture.needsUpdate = true;
    }

    function setTextureValue(index, x, y, z, o, arrowID) {
        const image = arrows[arrowID].texture.image;
        const { width, height, data } = image;
        console.log()
        const i = BITS * width * (o || 0);
        data[index * BITS + i + 0] = x;
        data[index * BITS + i + 1] = y;
        data[index * BITS + i + 2] = z;
    }

    function updateModelAll(){
        if(!arrow) return;
        for( var i = 0; i < arrow.children.length; i++ ) {
            updateModel(i);
        }
    }

    //this.params = params;
    this.initWithArrow = initWithArrow;
    this.updateModelAll = updateModelAll;
    this.splines = splines;
    init();
}