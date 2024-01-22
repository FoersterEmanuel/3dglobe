function ArrowIntern( _arrowPart ) {
    var mesh, ownMaterial;
    var bufferUniforms = {}, uniforms;
    var vertexShader;
    var texture;

    function init () {
        mesh = arrow.children[ _arrowPart ].clone();
        if( _arrowPart <= arrow_material.length )
            ownMaterial = arrow_material[ _arrowPart ].clone();
        else
            ownMaterial = arrow_materialdefault.clone();

        modifyShader( ownMaterial );

        texture = initTexture();

        mesh.material = ownMaterial;
    };

    function updateUniform( name, v ) {
        if (!uniforms) {
            bufferUniforms[name] = v;
            return
        }
        uniforms[name].value = v;
    };

    function modifyShader( material ) {
        if (material.__ok) return;
        material.__ok = true;
        
        material.onBeforeCompile = ( shader ) => {
            if (shader.__modified) return;
            shader.__modified = true;
            
            uniforms = Object.assign(shader.uniforms, {
                texture: { value: texture },
                pathOffset: { type: 'f', value: 0 }, // time of path curve
                pathSegment: { type: 'f', value: 1 }, // fractional length of path
                spineOffset: { type: 'f', value: 10 },
                spineLength: { type: 'f', value: 10 },
                flow: { type: 'i', value: 1 },
            });

            for (var k in bufferUniforms) {
                updateUniform(k, bufferUniforms[k]);
            }

            vertexShader = `
                uniform sampler2D texture;

                uniform float pathOffset;
                uniform float pathSegment;
                uniform float spineOffset;
                uniform float spineLength;
                uniform int flow;

                float textureLayers = 4.; // look up takes (i + 0.5) / textureLayers

                ${shader.vertexShader}
                `
                vertexShader = vertexShader.replace(
                    '#include <defaultnormal_vertex>',
                    `
                    vec4 worldPos = modelMatrix * vec4(position, 1.);
        
                    bool bend = flow > 0;
                    float spinePortion = bend ? (worldPos.x + spineOffset) / spineLength : 0.;
                    float xWeight = bend ? 0. : 1.;
                    float mt = spinePortion * pathSegment + pathOffset;
        
                    vec3 spinePos = texture2D(texture, vec2(mt, (0.5) / textureLayers)).xyz;
                    vec3 a = texture2D(texture, vec2(mt, (1. + 0.5) / textureLayers)).xyz;
                    vec3 b = texture2D(texture, vec2(mt, (2. + 0.5) / textureLayers)).xyz;
                    vec3 c = texture2D(texture, vec2(mt, (3. + 0.5) / textureLayers)).xyz;
                    mat3 basis = mat3(a, b, c);
        
                    vec3 transformed = basis
                        * vec3(worldPos.x * xWeight, worldPos.y * 1., worldPos.z * 1.)
                        + spinePos;
        
                    vec3 transformedNormal = normalMatrix * (basis * objectNormal);
                    `
                ).replace(
                    '#include <begin_vertex>',
                    ''
                ).replace(
                    '#include <project_vertex>',
                    `
                    vec4 mvPosition = viewMatrix * vec4( transformed, 1.0 );
                    // vec4 mvPosition = viewMatrix * worldPos;
                    gl_Position = projectionMatrix * mvPosition;
                    `
                );

                shader.vertexShader = vertexShader;
//                console.log('Current shader template', vertexShader);
        };
    }

    function initTexture() {
        if ( ! renderer.extensions.get( "OES_texture_float" ) ) {
            console.log("No OES_texture_float support for float textures.");
        }
    
        if ( renderer.capabilities.maxVertexTextures === 0 ) {
            console.log("No support for vertex shader textures.");
        }
    
        const height = 4;
    
        const dataArray = new Float32Array( TEXTURE_WIDTH * height * BITS );
        const dataTexture = new THREE.DataTexture(
            dataArray,
            TEXTURE_WIDTH,
            height,
            THREE.RGBFormat,
            THREE.FloatType
        );
    
        dataTexture.wrapS = THREE.RepeatWrapping;
        dataTexture.wrapY = THREE.RepeatWrapping;
        dataTexture.magFilter = THREE.LinearFilter;
        dataTexture.needsUpdate = true;
    
        return dataTexture;
    }

    function show(v) {
        mesh.visible = v;
    }

    init();

    this.updateUniform = updateUniform;
    this.texture = texture;
    this.mesh = mesh;
    this.show = show;
}