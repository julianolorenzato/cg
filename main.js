"use strict";

import { fetchOBJ } from "./fetch.js";

var vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_color;

uniform vec4 u_colorMult;

out vec4 outColor;

void main() {
   outColor = v_color * u_colorMult;
}
`;

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Tell the twgl to match position with a_position
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  const obj = await fetchOBJ('./obj/streetlight.obj')

  const cubeInfo = twgl.createBufferInfoFromArrays(gl, obj.geometries[0].data);

  const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  const cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeInfo);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const fieldOfViewInRadians = degToRad(60);

  const cubeUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };

  const cubeTranslation = [0, 0, 0];

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
  }

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time = time * 0.0005;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    const projectionMatrix = m4.perspective(
      fieldOfViewInRadians,
      aspect,
      1,
      2000
    );

    const cameraPosition = [0, 0, 2];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    const viewMatrix = m4.inverse(cameraMatrix);

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    const xRotation = time;
    const yRotation = -time;

    gl.useProgram(programInfo.program);

    // ------------ draw ---------------

    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      cubeTranslation,
      xRotation,
      yRotation
    );

    twgl.setUniforms(programInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeInfo);

    requestAnimationFrame(drawScene);
  }
}

main();
