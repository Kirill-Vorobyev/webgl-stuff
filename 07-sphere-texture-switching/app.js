var vertexShaderText = 
`precision mediump float;

attribute vec3 position;
attribute vec2 texcoord;
varying vec2 fragTexCoord;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat4 mSdo;
uniform mat4 mPlane;
uniform float scale;

void main()
{
  vec4 pos = mProj * mView * mWorld * mPlane * vec4(position, 1.0);
  vec4 texPos = mProj * mView * mSdo * mPlane * vec4(position, 1.0);
  gl_Position = pos;
  vec2 texPosOffset = vec2(texPos.x*scale + 0.5, texPos.y*scale + 0.5);
  fragTexCoord = texPosOffset.xy;
}`

var fragmentShaderText = 
`precision mediump float;

varying vec2 fragTexCoord;
uniform sampler2D sunSampler;
uniform sampler2D colorSampler;
uniform bool planeShader;

void main()
{
  vec4 sunColor = texture2D(sunSampler, fragTexCoord);
  if(planeShader){
    vec4 texColor =  texture2D(colorSampler, sunColor.xx);
    if(sunColor.x == 1.0){
        gl_FragColor = vec4(texColor.x,texColor.y,texColor.z,0.0);
    }else{
        gl_FragColor = vec4(texColor.x,texColor.y,texColor.z,texColor.w);
    }
    
  }else{
    gl_FragColor =  texture2D(colorSampler, sunColor.xx);
  }
}`

var InitDemo = function () {
    // 
    // CONSTANTS
    //
    var solarProjectionScale = 0.396;
    var cameraDist = 1.25;

    //
    // INIT GL
    //
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
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    //gl.enable(gl.DEPTH_TEST); // will perform a depth test on the raster for every pixel in the fragment
    gl.enable(gl.CULL_FACE); // removes a face from being rastered
    gl.frontFace(gl.CCW); // counter clockwise ordering of vertices determiens the front face
    gl.cullFace(gl.BACK); // explicitly performs the cull on the back faces, can be used on the front

    //
    // CREATE SHADERS
    //

    var programInfo = twgl.createProgramInfo(gl, [vertexShaderText,fragmentShaderText]);

    //
    // Create Sun Texture
    //
    var sunTextures = [];
    for(i=1;i<31;i++){
        var frameTexture = gl.createTexture();
        var sun171DOM = document.getElementById("sun-171-"+i);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, sun171DOM);

        gl.bindTexture(gl.TEXTURE_2D, null);
        sunTextures.push(frameTexture);
    }
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
    var sphereBuffer = twgl.primitives.createSphereBufferInfo(gl, 1, 128, 64, 0, Math.PI, Math.PI, 2 * Math.PI);
    var planeBuffer = twgl.primitives.createPlaneBufferInfo(gl,4,4);

    //
    // CREATE VIEW MATRICES
    //
    var identityMatrix = new Float32Array(16);
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    var sdoViewMatrix = new Float32Array(16);
    var planeViewMatrix = new Float32Array(16);
    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0,0,-7], [0,0,0], [0,1,0]);
    glMatrix.mat4.ortho(projMatrix, -cameraDist, cameraDist, -cameraDist, cameraDist, 0.1, 1000.0);

    var sdoOffsetAngle = 45 * Math.PI/180;
    var sdoXRotationMatrix = new Float32Array(16);
    var sdoYRotationMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);
    glMatrix.mat4.identity(sdoViewMatrix);
    glMatrix.mat4.identity(planeViewMatrix);
    //glMatrix.mat4.rotate(sdoYRotationMatrix, identityMatrix, sdoOffsetAngle, [0,1,0]);
    //glMatrix.mat4.rotate(sdoXRotationMatrix, identityMatrix, sdoOffsetAngle, [1,0,0]);
    //glMatrix.mat4.mul(sdoViewMatrix, sdoYRotationMatrix,sdoXRotationMatrix);
    glMatrix.mat4.rotate(planeViewMatrix, identityMatrix, degreesToRad(-90), [1,0,0]);

    uniformsSphere = {
        mWorld: worldMatrix,
        mView: viewMatrix,
        mProj: projMatrix,
        mSdo: sdoViewMatrix,
        mPlane: identityMatrix,
        scale: solarProjectionScale*cameraDist,
        colorSampler: colorTableTexture,
        planeShader: false
    }

    uniformsPlane = {
        mWorld: worldMatrix,
        mView: viewMatrix,
        mProj: projMatrix,
        mSdo: identityMatrix,
        mPlane: planeViewMatrix,
        scale: solarProjectionScale*cameraDist,
        colorSampler: colorTableTexture,
        planeShader: true
    }

    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);

    var drawObjects1 = [];
    var drawObjects2 = [];

    drawObjects1.push({
        programInfo: programInfo,
        bufferInfo: planeBuffer,
        uniforms: uniformsPlane
    });

    drawObjects2.push({
        programInfo: programInfo,
        bufferInfo: sphereBuffer,
        uniforms: uniformsSphere
    })


    //
    //Main Render Loop
    //
    var angle = 0;
    var angleDirection = 1;//positive or negative
    var angleTick = 0.2;
    var maxAngle = 60;

    var targetFps = 20;
    var frameCounter = 0;
    var frameCounterDOM = document.getElementById("frame-counter");

    var loop = function () {
        frameCounter = Math.floor((performance.now() / 1000 * targetFps )% 30) + 1;
        frameCounterDOM.innerText = frameCounter;
        if(angle>maxAngle){
            angleDirection = -1;
        }else if(angle<-maxAngle){
            angleDirection = 1;
        }
        angle += angleTick * angleDirection;
        glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, degreesToRad(angle) , [0,1,0]);
        //glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angle / 2 , [1,0,0]);
        glMatrix.mat4.mul(worldMatrix, yRotationMatrix, identityMatrix);

        gl.clearColor(clearLuminance,clearLuminance,clearLuminance,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sunTextures[frameCounter-1]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, colorTableTexture);

        
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        twgl.drawObjectList(gl, drawObjects1);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        twgl.drawObjectList(gl, drawObjects2);

        requestAnimationFrame(loop);

    };

    requestAnimationFrame(loop);
    
};

function degreesToRad(deg){
    return deg * Math.PI/180;
}