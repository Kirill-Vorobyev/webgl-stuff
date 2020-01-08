var vertexShaderText = 
`precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
varying vec2 fragTexCoord;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main()
{
  fragTexCoord = vertTexCoord;
  gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}`

var fragmentShaderText = 
`precision mediump float;

varying vec2 fragTexCoord;
uniform sampler2D sunSampler;
uniform sampler2D colorSampler;

void main()
{
  vec4 sunColor = texture2D(sunSampler, fragTexCoord);
  gl_FragColor =  texture2D(colorSampler, sunColor.xy);
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

    gl.clearColor(0.15,0.15,0.15,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST); // will perform a depth test on the raster for every pixel in the fragment
    gl.enable(gl.CULL_FACE); // removes a face from being rastered
    gl.frontFace(gl.CCW); // counter clockwise ordering of vertices determiens the front face
    gl.cullFace(gl.BACK); // explicitly performs the cull on the back faces, can be used on the front
    //
    // CREATE SHADERS
    //
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
    }
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
    }

    // Create program (pipeline) by attaching shaders and linking the program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error("ERROR linking program!", gl.getProgramInfoLog(program));
    }
    // Validate program to catch additional errors, only do ths in the debug releases
    gl.validateProgram(program);
    if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    }

    //
    // CREATE BUFFER
    //
    var boxVertices = 
	[ // X, Y, Z           U, V
		// Top
		-1.0, 1.0, -1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,
		1.0, 1.0, 1.0,     1, 1,
		1.0, 1.0, -1.0,    1, 0,

		// Left
		-1.0, 1.0, 1.0,    0, 0,
		-1.0, -1.0, 1.0,   1, 0,
		-1.0, -1.0, -1.0,  1, 1,
		-1.0, 1.0, -1.0,   0, 1,

		// Right
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,   0, 1,
		1.0, -1.0, -1.0,  0, 0,
		1.0, 1.0, -1.0,   1, 0,

		// Front
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,    1, 0,
		-1.0, -1.0, 1.0,    0, 0,
		-1.0, 1.0, 1.0,    0, 1,

		// Back
		1.0, 1.0, -1.0,    0, 0,
		1.0, -1.0, -1.0,    0, 1,
		-1.0, -1.0, -1.0,    1, 1,
		-1.0, 1.0, -1.0,    1, 0,

		// Bottom
		-1.0, -1.0, -1.0,   1, 1,
		-1.0, -1.0, 1.0,    1, 0,
		1.0, -1.0, 1.0,     0, 0,
		1.0, -1.0, -1.0,    0, 1,
	];

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

    var boxVertexBufferObject = gl.createBuffer(); //create buffer on the gpu
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);//bind as array buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
    gl.vertexAttribPointer(
        positionAttribLocation, //Attribute location
        3, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE, // Whether data is normalized
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.vertexAttribPointer(
        texCoordAttribLocation, //Attribute location
        2, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE, // Whether data is normalized
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex
        3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(texCoordAttribLocation);

    //
    // Create Sun Textures
    //
    /*var imageLocationDiv = document.getElementById("images-go-here");
    var imagesHTML = "";
    for(i=1;i<31;i++){
        html = '<img id="sun-171-'+i+'" src="./PNG/'+i+'.png" width="0" height="0"></img>';
        imagesHTML += html;
    }

    imageLocationDiv.innerHTML = imagesHTML;*/

    

    var sunTextures = [];
    for(i=1;i<31;i++){
        var frameTexture = gl.createTexture();
        var sun171DOM = document.getElementById("sun-171-"+i);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, sun171DOM);

        gl.bindTexture(gl.TEXTURE_2D, null);
        sunTextures.push(frameTexture);
    }

    console.log(sunTextures);

    //
    // Create Color Table Texture
    //
    var colorTableTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTableTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, document.getElementById("sdo-171-color-table"));

    gl.bindTexture(gl.TEXTURE_2D, null);

    // tell OpenGl state machine which program should be active
    gl.useProgram(program);

    //find sampler locations
    var sunSamplerLocation = gl.getUniformLocation(program, "sunSampler");
    var colorSamplerLocation = gl.getUniformLocation(program, "colorSampler");
    //set uniform from locations
    gl.uniform1i(sunSamplerLocation, 0);
    gl.uniform1i(colorSamplerLocation, 1);

    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, "mProj");

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0,0,-3.4], [0,0,0], [0,1,0]);
    glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);


    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);

    //
    //Main Render Loop
    //
    
    var identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);
    var angle = 0;
    var frameCounter = 0;
    var frameCounterDOM = document.getElementById("frame-counter");

    var loop = function () {
        frameCounter = Math.floor((performance.now() / 1000 * 30 )% 30) + 1;
        frameCounterDOM.innerText = frameCounter;
        angle = performance.now() / 1000 / 10 * 1 * Math.PI;
        glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angle, [0,1,0]);
        glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angle / 2, [1,0,0]);
        glMatrix.mat4.mul(worldMatrix, yRotationMatrix,xRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(0.15,0.15,0.15,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sunTextures[frameCounter-1]);
        //sun171DOM = document.getElementById("sun-171-"+frameCounter);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sun171DOM);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, colorTableTexture);
        

        //uses the last bound buffer
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };

    setTimeout(function(){requestAnimationFrame(loop);},1000);
    
    
};


$(window).on("load", function(){
    InitDemo();
  });  