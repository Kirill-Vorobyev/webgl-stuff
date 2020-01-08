var vertexShaderText = 
`precision mediump float;

attribute vec3 position;
attribute vec2 texcoord;
varying vec2 fragTexCoord;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat4 mSdo;

void main()
{
  vec4 pos = mProj * mView * mWorld * vec4(position, 1.0);
  vec4 texPos = mProj * mView * mSdo * vec4(position, 1.0);
  gl_Position = pos;
  float scale = 0.396;
  vec2 texPosOffset = vec2(texPos.x*scale + 0.5, texPos.y*scale + 0.5);
  fragTexCoord = texPosOffset.xy;
}`

var fragmentShaderText = 
`precision mediump float;

varying vec2 fragTexCoord;
uniform sampler2D sunSampler;
uniform sampler2D colorSampler;

void main()
{
  vec4 sunColor = texture2D(sunSampler, fragTexCoord);
  gl_FragColor =  texture2D(colorSampler, sunColor.xx);
}`

var InitDemo = function () {
    console.log("We're in InitDemo();");
    var canvas = document.getElementById("game-surface");
    var gl = canvas.getContext('webgl');
    if(!gl){
        console.log("webgl not supported, falling back to expriemental-webgl context");
        var gl = canvas.getContext('experimental-webgl');
    }
    if(!gl){
        console.log("your browser does not support webgl :[");
    }

    // if you need to change size do both of these to inform gl
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    // gl.viewport(0,0, window.innerWidth, window.innerHeight);
    var clearLuminance = 0.0;
    gl.clearColor(clearLuminance,clearLuminance,clearLuminance,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST); // will perform a depth test on the raster for every pixel in the fragment
    gl.enable(gl.CULL_FACE); // removes a face from being rastered
    gl.frontFace(gl.CCW); // counter clockwise ordering of vertices determiens the front face
    gl.cullFace(gl.BACK); // explicitly performs the cull on the back faces, can be used on the front
    //
    // CREATE SHADERS
    //

    var programInfo = twgl.createProgramInfo(gl, [vertexShaderText,fragmentShaderText]);
    console.log(programInfo);

    //
    // Create Sun Texture
    //
    var boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, document.getElementById("sun-171"));

    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(boxTexture);
    //
    // Create Color Table Texture
    //
    var colorTableTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTableTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, document.getElementById("sdo-171-color-table"));

    gl.bindTexture(gl.TEXTURE_2D, null);

    // tell OpenGl state machine which program should be active
    gl.useProgram(programInfo.program);

    //
    // CREATE BUFFER
    //
    var sphereBuffer = twgl.primitives.createSphereBufferInfo(gl, 1, 128, 64);

    //
    // CREATE VIEW MATRICES
    //
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    var sdoViewMatrix = new Float32Array(16);
    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0,0,-7], [0,0,0], [0,1,0]);
    glMatrix.mat4.ortho(projMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 1000.0);

    var sdoOffsetAngle = 45 * Math.PI/180;
    var sdoXRotationMatrix = new Float32Array(16);
    var sdoYRotationMatrix = new Float32Array(16);
    var sdoIdentityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(sdoIdentityMatrix);
    glMatrix.mat4.identity(sdoViewMatrix);
    //glMatrix.mat4.rotate(sdoYRotationMatrix, sdoIdentityMatrix, sdoOffsetAngle, [0,1,0]);
    //glMatrix.mat4.rotate(sdoXRotationMatrix, sdoIdentityMatrix, sdoOffsetAngle, [1,0,0]);
    //glMatrix.mat4.mul(sdoViewMatrix, sdoYRotationMatrix,sdoXRotationMatrix);

    uniforms = {
        mWorld: worldMatrix,
        mView: viewMatrix,
        mProj: projMatrix,
        mSdo: sdoViewMatrix,
        sunSampler: boxTexture,
        colorSampler: colorTableTexture
    }

    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);

    //
    //Main Render Loop
    //
    
    var identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);
    var angle = 0;

    var loop = function () {
        angle = performance.now() / 1000 / 10 * 2 * Math.PI;
        glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angle / 2 , [0,1,0]);
        //glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angle / 2 , [1,0,0]);
        glMatrix.mat4.mul(worldMatrix, yRotationMatrix,identityMatrix);

        gl.clearColor(clearLuminance,clearLuminance,clearLuminance,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, colorTableTexture);
        
        
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, sphereBuffer);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElements(gl.TRIANGLES, sphereBuffer.numElements, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    
};