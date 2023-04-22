import * as glm from "gl-matrix";
import cube_vert from "./shaders/cube_vert";
import cube_frag from "./shaders/cube_frag";
import image_list from "./images/*";

/** @type {WebGLRenderingContext} */
let gl;

/** @type {WebGLProgram} */
let shaderProgram;

let axisAngle = 0, cubeAngle = 0, podiumAngle = 0, 
  ambientCoeff = 1.0, shadingModel = 0, lightingModel = 0, c1 = 0.0001, c2 = 0;
let model, proj, view, indices, brickTexture, iceTexture, woodTexture, onetex, twotex, threetex,
  propDig = 0.5, propMat = 0.5, propCol = 0.5;

main();

function main() {
  
  gl = document.getElementById("test").getContext("webgl2");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  setupWebGL();
  
  initShaderProgram(cube_vert, cube_frag);
  
  initBuffers();
  initProjMatrix();
  initViewMatrix();
  setupLights();

  initListeners();
  setupTextures();

  requestAnimationFrame(render);
}

function setupTextures(){
  brickTexture = gl.createTexture();
  threetex = gl.createTexture();
  setTexture([image_list['red_brick.png'], image_list['trthree.png']], [brickTexture,threetex]);
     
  iceTexture = gl.createTexture();
  twotex = gl.createTexture();
  setTexture([image_list['ice.jpg'], image_list['trtwo.png']], [iceTexture,twotex]);

  woodTexture = gl.createTexture();
  onetex = gl.createTexture();
  setTexture([image_list['wood.jpg'], image_list['trone.png']], [woodTexture, onetex]);
}

function setupWebGL() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
}

function setTexture(urls, textures) {
  for(let i = 0; i < urls.length; i++){
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]));

    let image = new Image();
    image.onload = function() {
      handleTextureLoaded(image, textures[i]);
    }
    // image.crossOrigin = "anonymous";
    image.src = urls[i];

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"+i), i);
  }
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}



function initListeners(){
  window.addEventListener("keydown", e => {
    switch(e.key) {
      case "q": {
        axisAngle -= 0.05
        break
      }
      case "e": {
        axisAngle += 0.05
        break
      }
      case "a": {
        cubeAngle -= 0.05
        break
      }
      case "d": {
        cubeAngle += 0.05
        break
      }
      case "z": {
        podiumAngle -= 0.05
        break
      }
      case "c": {
        podiumAngle += 0.05
        break
      }
    }
  })

  document.getElementById('btn-lighting').onclick = () => {
    let text = document.getElementById('lightingModel')
    lightingModel++
    if (lightingModel == 4) lightingModel = 0
    if (lightingModel == 0) text.textContent = 'Phong Lighting Model'
    else if (lightingModel == 1) text.textContent = 'Lambert Lighting Model'
    else if (lightingModel == 2) text.textContent = 'Blinn-Phong Lighting Model'
    else text.textContent = 'Toon Lighting Model'
  }

  document.getElementById('btn-shading').onclick = () => {
    let text = document.getElementById('shadingModel')
    if (shadingModel == 0) {
      shadingModel = 1
      text.textContent = 'Phong Shading Model'
    }
    else {
      shadingModel = 0
      text.textContent = 'Gouraud Shading Model'
    }
  }

  document.getElementById('myRange').oninput = () => {
    ambientCoeff = Number(document.getElementById('myRange').value) + 1.0;
  }

  document.getElementById('c1-range').oninput = () => {
    c1 = Number(document.getElementById('c1-range').value);
  }

  document.getElementById('c2-range').oninput = () => {
    c2 = Number(document.getElementById('c2-range').value);
  }

  document.getElementById('digit-range').value = propDig;
  document.getElementById('material-range').value = propMat;

  document.getElementById('material-range').oninput = () => {
    propMat = Number(document.getElementById('material-range').value);
  }

  document.getElementById('digit-range').oninput = () => {
    propDig = Number(document.getElementById('digit-range').value);
  }

  // console.log(document.getElementById('color-range').value);
  // document.getElementById('color-range').oninput = () => {
  //   propCol = Number(document.getElementById('color-range').value);
  //   temp = 1 - propCol - (propDig + propMat);
  //   if (temp < 0) {
  //     propCol = Math.ceil(propCol*100)/100;
  //     temp = 1 - propCol - (propDig + propMat);
  //     if (propDig == 0) propMat += temp;
  //     else if (propMat == 0) propDig += temp;
  //     else{
  //       propDig += temp/2;
  //       propMat += temp/2;
  //     }
  //   }
  //   else {
  //     propCol = Math.floor(propCol*100)/100;
  //     temp = 1 - propCol - (propDig + propMat);
  //     if (propDig == 1) propMat += temp;
  //     else if (propMat == 1) propDig += temp;
  //     else{
  //       propDig += temp/2;
  //       propMat += temp/2;
  //     }
  //   }
  //   propDig = Math.max(propDig,0.0);
  //   propMat = Math.max(propMat,0.0);
    
  //   document.getElementById('color-range').value = propCol;
  //   document.getElementById('digit-range').value = propDig;
  //   document.getElementById('material-range').value = propMat;
  // }
  //
}

function setupLights() {
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uLightPosition"),[10,10,5])
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uAmbientLightColor"),[0.1,0.1,0.1])
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uDiffuseLightColor"),[0.7,0.7,0.7])
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uSpecularLightColor"),[1.0,1.0,1.0])
}

function initModelMatrix(xOffset, podCenter) { // 4
  // y axis
  glm.mat4.translate(model,model,[-xOffset,0,0])
  glm.mat4.rotate(model,model,axisAngle,[0,1,0])
  glm.mat4.translate(model,model,[xOffset,0,0])

  // podium rotation
  glm.mat4.translate(model,model,[podCenter - xOffset,0,0])
  glm.mat4.rotate(model,model,podiumAngle,[0,1,0])
  glm.mat4.translate(model,model,[xOffset - podCenter,0,0])
  
  // cube rotation
  glm.mat4.rotate(model,model,cubeAngle,[0,1,0])
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"uModel"),false,model)
}

function initProjMatrix() {
  proj = glm.mat4.create();
  glm.mat4.perspective(proj,  Math.PI / 4, 
    gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"uProj"),false,proj)
}

function initViewMatrix() {
  view = glm.mat4.create()
  glm.mat4.lookAt(view, [0,0,20], [0,0,0], [0, 1, 0])
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"uView"),false,view)
}

function initNormMatrix(){
  const mvMatrix = glm.mat4.create(), nMatrix = glm.mat3.create()
  glm.mat4.multiply(mvMatrix,view,model)
  glm.mat3.normalFromMat4(nMatrix, mvMatrix)
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix)
}

// for testing
function printglMat(mat, k) {
  let res = ''
  for(let i = 0; i < mat.length; i++) {
    res+=mat[i] + ' '
    if ((i+1) % k == 0) res+='\n'
  }
  console.log(res)
}

function render(){
  gl.viewport(0,0,gl.canvas.width, gl.canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT)
  

  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc1"), c1);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc2"), c2);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uAmbientCoeff"), ambientCoeff);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uPropCol"), propCol);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uPropMat"), propMat);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uPropDig"), propDig);

  gl.uniform1f(gl.getUniformLocation(shaderProgram,'uLightingModel'), lightingModel);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,'uShadingModel'), shadingModel);

  // Bronze
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[6,0,0])
  initModelMatrix(6,4)
  initNormMatrix()
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.69,0.55,0.34])
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, brickTexture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, threetex);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  // Silver
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[2,0,0])
  initModelMatrix(2,4)
  initNormMatrix()

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.75,0.75,0.75])

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, iceTexture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, twotex);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  // Gold bottom
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[4,0,0])
  initModelMatrix(4,4)
  initNormMatrix()

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.83,0.686,0.216])
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, woodTexture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, onetex);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  // Gold top
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[4,0,0])
  glm.mat4.translate(model,model,[0,2,0])
  initModelMatrix(4,4)
  //initNormMatrix()

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  requestAnimationFrame(render)
}

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(vsSource, fsSource) {
  const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program
  shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(
      shaderProgram)}`)
    return null
  }
  gl.useProgram(shaderProgram)
}

// creates a shader of the given type, uploads the source and compiles it.
function loadShader(type, source) {
  const shader = gl.createShader(type)

  // Send the source to the shader object
  gl.shaderSource(shader, source)

  // Compile the shader program
  gl.compileShader(shader)

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function initBuffers() {
  const posBuffer  = gl.createBuffer()
  // const indexBuffer = gl.createBuffer()
  let vertices = [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

    // Back face
    1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0,

    // Top face
    -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,

    // For trivial case, when one color, no/one normal
    // :: for each vertex there is unique combo of color/normal, if I understood correctly
    // so using only 8 vertices wouldn't work because we need different normals for this lab
    // -1.0,-1.0,1.0, 1.0,-1.0,1.0, 1.0,1.0,1.0, -1.0,1.0,1.0, // front
    // -1.0,-1.0,-1.0, 1.0,-1.0,-1.0, 1.0,1.0,-1.0, -1.0,1.0,-1.0 // back
  ]

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const vertPos = gl.getAttribLocation(shaderProgram,"aVertex")
  gl.enableVertexAttribArray(vertPos)
  gl.vertexAttribPointer(vertPos, 3, gl.FLOAT, false, 0, 0)

  const indexBuffer = gl.createBuffer()
  indices = [
    0,  1,  2,  2,  3,  0,  // front
    4,  5,  6,  6,  7,  4,  // back
    8,  9,  10, 10, 11, 8,  // top
    12, 13, 14, 14, 15, 12, // bottom
    16, 17, 18, 18, 19, 16, // right
    20, 21, 22, 22, 23, 20 // left

    // for trivial case, when one color, no/one normal
    // 0, 1, 2, 0, 2, 3, // front
    // 4, 5, 6, 4, 6, 7, // back
    // 7, 3, 2, 7, 2, 6, // top
    // 0, 4, 5, 0, 5, 1, // bottom
    // 0, 3, 7, 0, 7, 4, // left
    // 1, 2, 6, 1, 6, 5  // right
  ]

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  const normalsBuffer = gl.createBuffer()
  const vertexNormals = [
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ]

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW)

  const normalPos = gl.getAttribLocation(shaderProgram,"aNormal")
  gl.enableVertexAttribArray(normalPos)
  gl.vertexAttribPointer(normalPos, 3, gl.FLOAT, false, 0, 0)

  const textCoordsBuffer = gl.createBuffer();
  const textureCoordinates = [];
  for (let i=0; i<6; i++) { textureCoordinates.push(0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0 ); }

  gl.bindBuffer(gl.ARRAY_BUFFER, textCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  const aTextCoords = gl.getAttribLocation(shaderProgram,"aTextureCoords");
  gl.enableVertexAttribArray(aTextCoords);
  gl.vertexAttribPointer(aTextCoords, 2, gl.FLOAT, false, 0, 0);
}