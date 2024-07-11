import { parseOBJ } from "./parsers.js";

const vertexShaderSource = `#version 300 es
    
in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
    gl_Position = u_matrix * a_position;
    v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
    
precision highp float;
    
in vec4 v_color;
out vec4 outColor;
    
void main() {
    outColor = v_color;
}
`;

async function main() {
  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("something got wrong");
  }

  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  console.log(gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS));
  gl.attachShader(program, vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  console.log(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS));
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  gl.useProgram(program);

  // -----------------------------------------------------------------------------

  const streetLightPromise = fetch("./obj/streetlight.obj")
    .then((resp) => resp.text())
    .then((text) => parseOBJ(text));

  const carPolicePromise = fetch("./obj/car_police.obj")
    .then((resp) => resp.text())
    .then((text) => parseOBJ(text));

  const waterTowerPromise = fetch("./obj/watertower.obj")
    .then((resp) => resp.text())
    .then((text) => parseOBJ(text));

  const [streetLight, carPolice, waterTower] = await Promise.all([
    streetLightPromise,
    carPolicePromise,
    waterTowerPromise,
  ]);

  // -----------------------------------------------------------------------------

  // associa buffer ao atributo de vértice
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

  //  cria buffer de posição
  const positionBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  //  cria buffer de cor
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

  console.log(m4);

  gl.uniform4fv(
    matrixUniformLocation,
    // false,
    m4.translate(new Float32Array([1, 0, 0]))
  );

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  setCarPoliceGeometry(carPolice);
  gl.drawArrays(gl.TRIANGLES, 0, streetLight.position.length);

  setStreetLightGeometry(streetLight);
  gl.drawArrays(gl.TRIANGLES, 0, waterTower.position.length);

  setWaterTowerGeometry(waterTower);
  gl.drawArrays(gl.TRIANGLES, 0, carPolice.position.length);

  function setCarPoliceGeometry(carPolice) {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(carPolice.position),
      gl.STATIC_DRAW
    );
  }

  function setStreetLightGeometry(streetLight) {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(streetLight.position),
      gl.STATIC_DRAW
    );
  }

  function setWaterTowerGeometry(waterTower) {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(waterTower.position),
      gl.STATIC_DRAW
    );
  }
}

document.addEventListener("DOMContentLoaded", main);
