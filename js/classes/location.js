function Location(name, bgradg,bgradm,bgrads,bgrado, lgradg,lgradm,lgrads,lgrado){
    var bgrad, lgrad;
    var x=0,y,z=0,l=1;

    function round(a) {
        if( Math.round( a * 1_000_000_000) < 0 )
            return Math.round( a * 1_000_000_000) / 1_000_000_000;
        return a;
    }

    init = () => { 
        this.name = name;
        bgrad = bgradg + bgradm/60 + bgrads/3600;
        bgrad = (bgrado === "S") ? -bgrad : bgrad;
        lgrad = lgradg + lgradm/60 + lgrads/3600;
        lgrad = (lgrado === "W") ? -lgrad : lgrad;
        bgrad= bgrad / 180 * Math.PI;
        lgrad= lgrad / 180 * Math.PI;
    };
    calc = () => { // calculate vector from angle
        if( Math.abs( bgrad ) === 90 ) {
            y = bgrad / 90;
        }else if( Math.abs( lgrad ) === 90 ) {
            x = bgrad / -90; 
            y = Math.tan( bgrad ) * x;
            l = Math.sqrt( x * x + y * Y + z * z );
        }else{
            x = Math.sin( lgrad);
            z = Math.cos( lgrad);
            l = Math.sqrt( x * x + z * z);
            y = Math.tan( bgrad ) * l;
            l = Math.sqrt( x * x + y * y + z * z );
        }
        this.v = new THREE.Vector3( 
            round( x / l ), 
            round( y / l ), 
            round( z / l ));
        this.bgrad = round( bgrad );
        this.lgrad = round( lgrad );
    };

    init();
    calc();
}