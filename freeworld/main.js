/**
 * @type {
    {
        __proto__: any
        create: () => number[] | Float32Array
        clone: (t: any) => number[] | Float32Array
        copy: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array
        fromValues: (t: number, a: number, r: number, e: number, u: number, o: number, i: number, h: number, c: number, s: number, M: number, f: number, l: number, v: number, b: number, m: annumbery) => number[] | Float32Array
        set: (t: number, n: number, a: number, r: number, e: number, u: number, o: number, i: number, h: number, c: number, s: number, M: number, f: number, l: number, v: number, b: number, m: number) => number[] | Float32Array
        identity: (t: number[] | Float32Array) => number[] | Float32Array
        transpose: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array
        invert: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array | null
        adjoint: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array
        determinant: (t: number[] | Float32Array) => number
        multiply: (t: number[] | Float32Array, n: number[] | Float32Array, a: number[] | Float32Array) => number[] | Float32Array
        translate: (dest: number[] | Float32Array, n: number[] | Float32Array, xyz: number[] | Float32Array) => number[] | Float32Array
        scale: (t: number[] | Float32Array, n: number[] | Float32Array, a: number[] | Float32Array) => number[] | Float32Array
        rotate: (t: number[] | Float32Array, n: number[] | Float32Array, a: number, r: number[] | Float32Array) => number[] | Float32Array
        rotateX: (t: number[] | Float32Array, n: number[] | Float32Array, a: number) => number[] | Float32Array
        rotateY: (t: number[] | Float32Array, n: number[] | Float32Array, a: number) => number[] | Float32Array
        rotateZ: (t: number[] | Float32Array, n: number[] | Float32Array, a: number) => number[] | Float32Array
        fromTranslation: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array
        fromScaling: (t: number[] | Float32Array, n: number[] | Float32Array) => number[] | Float32Array
        fromRotation: (t: number[] | Float32Array, n: number, a: number[] | Float32Array) => number[] | Float32Array
        fromXRotation: (t: number[] | Float32Array, n: number) => number[] | Float32Array
        fromYRotation: (t: number[] | Float32Array, n: number) => number[] | Float32Array
        fromZRotation: (t: number[] | Float32Array, n: number) => number[] | Float32Array
        fromRotationTranslation: (t: number[] | Float32Array, n: number[] | Float32Array, a: number[] | Float32Array) => number[] | Float32Array
        fromQuat2: (t: number[] | Float32Array, a: number[] | Float32Array) => number[] | Float32Array
        // TODO More docs
    }
   }
 */
var mat4 = glMatrix.mat4

let started = false
/**
 * @type {{position:WebGLBuffer}}
 */
let buffers
/**
 * @type {{program:WebGLProgram attribLoc:{vertPos:number} uniformLoc:{projectionMatrix:WebGLUniformLocation modelViewMatrix:WebGLUniformLocation}}}
 */
let programInfo
/**
 * @type {WebGLRenderingContext}
 */
var gl

/**
 * Get an element by id
 *
 * @param {string} id The identifier of element
 * @returns The found element
 */
function $i(id) {
    return document.getElementById(id)
}

/**
 * Get the `WebGLRenderingContext`
 *
 * @param {string} canvas The canvas
 * @returns {WebGLRenderingContext} The GL context
 */
function getWebGLContext(canvas) {
    return $i(canvas).getContext('webgl')
}

/**
 * Compile a shader by source
 *
 * @param {WebGLRenderingContext} gl The GL context
 * @param {number} type The shader type
 * @param {string} src The shader source
 * @returns The shader id
 */
function loadShader(gl, type, src) {
    let shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let msg = 'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
        console.error(msg)
        alert(msg)
        gl.deleteShader(shader)
        return null
    }
    return shader
}

/**
 * Initialize the program
 *
 * @param {WebGLRenderingContext} gl The GL context
 * @param {string} vshSrc The vertex shader source
 * @param {string} fshSrc The fragment shader source
 * @returns The program id
 */
function initProgram(gl, vshSrc, fshSrc) {
    let vsh = loadShader(gl, gl.VERTEX_SHADER, vshSrc)
    let fsh = loadShader(gl, gl.FRAGMENT_SHADER, fshSrc)
    let program = gl.createProgram()
    gl.attachShader(program, vsh)
    gl.attachShader(program, fsh)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let msg = 'Unable to initialize the shader program: ' + gl.getProgramInfoLog(program)
        console.error(msg)
        alert(msg)
        return null
    }
    return program
}

/**
 * Initialize buffers (in program)
 *
 * @param {WebGLRenderingContext} gl The GL context
 * @returns The object include vertex buffer
 */
function initBuffers(gl) {
    let buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    let vertices = [
        // V0
        0.0, 1.0, 1.0,
        // V1
        0.0, 0.0, 1.0,
        // V2
        1.0, 0.0, 1.0,
        // V3
        1.0, 1.0, 1.0
    ]
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    )
    return {
        position: buffer
    }
}

/**
 * Render the world
 *
 * @param {WebGLRenderingContext} gl The GL context
 * @param {{program:WebGLProgram attribLoc:{vertPos:number} uniformLoc:{projectionMatrix:WebGLUniformLocation modelViewMatrix:WebGLUniformLocation}}} programInfo 
 * @param {{position:WebGLBuffer}} buffers 
 */
function render(gl, programInfo, buffers) {
    gl.clearColor(0.4, 0.6, 0.9, 1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    let projectionMatrix = mat4.create()
    mat4.perspective(
        projectionMatrix,
        70 * Math.PI / 180,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.5,
        1000.0
    );
    let modelViewMatrix = mat4.create()
    mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [0.0, 0.0, -1.0]
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.enableVertexAttribArray(programInfo.attribLoc.vertPos)
    gl.vertexAttribPointer(
        programInfo.attribLoc.vertPos,
        3,
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.useProgram(programInfo.program)
    gl.uniformMatrix4fv(
        programInfo.uniformLoc.projectionMatrix,
        false,
        projectionMatrix
    )
    gl.uniformMatrix4fv(
        programInfo.uniformLoc.modelViewMatrix,
        false,
        modelViewMatrix
    )
    gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function start() {
    if (!started) {
        gl = getWebGLContext('screen')
        if (!gl) {
            alert('无法加载 WebGL')
            return;
        }
        $i('start-btn').innerText = '刷新'
        $i('screen').style.display = 'block'
        let vshBlock = $i('vshBlock').innerText
        let fshBlock = $i('fshBlock').innerText
        let shaderProgram = initProgram(gl, vshBlock, fshBlock)
        programInfo = {
            program: shaderProgram,
            attribLoc: {
                vertPos: gl.getAttribLocation(shaderProgram, 'vert')
            },
            uniformLoc: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'modelViewMatrix')
            }
        }
        buffers = initBuffers(gl)
        started = true
    }
    render(gl, programInfo, buffers)
}