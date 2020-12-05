// WebGL context, canvas and shaderprogram objects
var gl;
var canvas;
var shaderProgram;

var mySphere0;
var mySphere1;
mySphere0 = new Sphere(0.5,
                      glMatrix.vec3.fromValues(1.0, 0.0, 0.0), 
                      glMatrix.vec3.fromValues(0.0, 0.0, 0.0),
                      glMatrix.vec3.fromValues(0.0, 0.0, 0.0),
                      glMatrix.vec3.fromValues(1.0, 0.0, 0.0));
mySphere1 = new Sphere(1.0,
                      glMatrix.vec3.fromValues(0.0, 0.0, -1.0), 
                      glMatrix.vec3.fromValues(0.0, 0.0, 0.0),
                      glMatrix.vec3.fromValues(0.0, 0.0, 0.0),
                      glMatrix.vec3.fromValues(0.0, 1.0, 0.0));
var mySpheres = [];
mySpheres.push(mySphere0);
mySpheres.push(mySphere1);

// View parameters
var eyePt = glMatrix.vec3.fromValues(0.0,0.0,40.0);
var viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0);
var up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
var viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = glMatrix.mat3.create();

// Create ModelView matrix
var mvMatrix = glMatrix.mat4.create();

//Create Projection matrix
var pMatrix = glMatrix.mat4.create();

var mvMatrixStack = [];

//light position
var lightx=1.0;
var lighty=1.0;
var lightz=1.0;

//light intensity
var alight =0.0;
var dlight =1.0;
var slight =1.0;

//shinines, of course
var shiny = 100.0;

//-----------------------------------------------------------------
//Color conversion  helper functions
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
  glMatrix.mat3.transpose(nMatrix,nMatrix);
  glMatrix.mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = glMatrix.mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders(vshader,fshader) {
  vertexShader = loadShaderFromDOM(vshader);
  fragmentShader = loadShaderFromDOM(fshader);
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformDiffuseMaterialColor = gl.getUniformLocation(shaderProgram, "uDiffuseMaterialColor");
  shaderProgram.uniformAmbientMaterialColor = gl.getUniformLocation(shaderProgram, "uAmbientMaterialColor");
  shaderProgram.uniformSpecularMaterialColor = gl.getUniformLocation(shaderProgram, "uSpecularMaterialColor");

  shaderProgram.uniformShininess = gl.getUniformLocation(shaderProgram, "uShininess");    
}


//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32Array} a diffuse material color
 * @param {Float32Array} a ambient material color
 * @param {Float32Array} a specular material color 
 * @param {Float32} the shininess exponent for Phong illumination
 */
function uploadMaterialToShader(dcolor, acolor, scolor,shiny) {
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColor, dcolor);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColor, acolor);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColor, scolor);
    
  gl.uniform1f(shaderProgram.uniformShininess, shiny);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s); 
}


//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    var transformVec = glMatrix.vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    glMatrix.mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up); 
    glMatrix.vec3.set(transformVec,20,20,20);
    glMatrix.mat4.scale(mvMatrix, mvMatrix,transformVec);
    
    uploadLightsToShader([lightx,lighty,lightz],[alight,alight,alight],[dlight,dlight,dlight],[slight,slight,slight]);
    setMatrixUniforms();
    for (var i =0; i<mySpheres.length; i++){
        //Get material color
        colorVal = mySpheres[i].color;
        R = colorVal[0];
        G = colorVal[1];
        B = colorVal[2];
        uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],shiny);
        mySpheres[i].setupBuffers();
        mySpheres[i].draw();
    }

}

//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 * Where all the physics should happen
 */
function animate() {

}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders("shader-vs","shader-fs");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

