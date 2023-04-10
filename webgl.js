import * as glm from "gl-matrix";
import cube_vert from "./shaders/cube_vert";
import cube_frag from "./shaders/cube_frag";

/** @type {WebGLRenderingContext} */
let gl

/** @type {WebGLProgram} */
let shaderProgram

let axisAngle = 0, cubeAngle = 0, podiumAngle = 0, ambientCoeff = 1.0, shadingModel = 0, lightingModel = 0, c1 = 0, c2 = 0
let model, proj, view

main()

function main() {
  
  gl = document.getElementById("test").getContext("webgl2")

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    )
    return
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
  
  initShaderProgram(cube_vert, cube_frag)
  
  initBuffers()
  initProjMatrix()
  initViewMatrix()
  setupLights()

  initListeners()

  requestAnimationFrame(render)
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
  gl.uniform1f(gl.getUniformLocation(shaderProgram,'uLightingModel'), lightingModel);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,'uShadingModel'), shadingModel);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uAmbientCoeff"), ambientCoeff);

  // Bronze
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[6,0,0])
  initModelMatrix(6,4)
  initNormMatrix()
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.69,0.55,0.34])
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

  // Silver
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[2,0,0])
  initModelMatrix(2,4)
  initNormMatrix()

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.75,0.75,0.75])
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

  // Gold bottom
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[4,0,0])
  initModelMatrix(4,4)
  initNormMatrix()

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.83,0.686,0.216])
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

  // Gold top
  model = glm.mat4.create()
  glm.mat4.translate(model,model,[4,0,0])
  glm.mat4.translate(model,model,[0,2,0])
  initModelMatrix(4,4)
  //initNormMatrix()

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

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
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,

    // For trivial case, when one color, no/one normal
    // :: for each vertex there is unique combo of color/normal, if I understood correctly
    // so using only 8 vertices wouldn't work because we need different normals for this lab
    // -1.0,-1.0,1.0, 1.0,-1.0,1.0, 1.0,1.0,1.0, -1.0,1.0,1.0, // front
    // -1.0,-1.0,-1.0, 1.0,-1.0,-1.0, 1.0,1.0,-1.0, -1.0,1.0,-1.0 // back
  ]
  // let test = glm.vec3.create()
  // let a = glm.vec3.create()
  // let b = glm.vec3.create()
  // console.log(test)
  // console.log(glm.vec3.cross(test, 
  //   glm.vec3.subtract(b,[1.0, -1.0, 1.0],[-1.0, -1.0, 1.0]),
  //   glm.vec3.subtract(a,[-1.0, 1.0, 1.0],[-1.0, -1.0, 1.0])))
  // console.log(a)
  // console.log(b)
  // console.log(glm.vec3.normalize(test,test))

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const vertPos = gl.getAttribLocation(shaderProgram,"aVertex")
  gl.enableVertexAttribArray(vertPos)
  gl.vertexAttribPointer(vertPos, 3, gl.FLOAT, false, 0, 0)

  const indexBuffer = gl.createBuffer()
  let indices = [
    0,  1,  2,  0,  2,  3,  // front
    4,  5,  6,  4,  6,  7,  // back
    8,  9,  10, 8,  10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left

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
}