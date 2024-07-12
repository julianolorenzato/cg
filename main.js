import { retrieveOBJ } from "./retrieve.js";

const vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform vec3 u_viewWorldPosition;
uniform mat4 u_matrix;

out vec3 v_normal;
out vec3 v_surfaceToView;
out vec2 v_texcoord;
out vec4 v_color;

void main() {
  vec4 worldPosition = u_world * a_position;
  gl_Position = u_matrix * a_position;
  v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
  v_normal = mat3(u_world) * a_normal;
  v_texcoord = a_texcoord;
  v_color = a_color;
}
`;

const fs = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main () {
  vec3 normal = normalize(v_normal);

  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

  outColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      specular * pow(specularLight, shininess),
      effectiveOpacity);
}
`;

const world = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0]
]

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

  const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  gl.useProgram(programInfo.program);

  // ------------ global parameters ------------------
  const fieldOfViewInRadians = degToRad(60);

  // camera parameters (estavam dentro de drawScene)
  var cameraPosition = [0, 10, 20];
  const target = [0, 0, 0];
  const up = [0, 1, 0];

  // -------------- objects retreive ----------------
  const baseObjects = {
    road: await retrieveOBJ("obj2/road_straight.obj", gl, programInfo),
    building: await retrieveOBJ("obj2/building_A.obj", gl, programInfo),
  };

  let objects = []

  for (let i = 0; i < world.length; i++) {
    for (let j = 0; j < world[i].length; j++) {
      if (world[i][j] == 1) {
        objects.push({obj: baseObjects.road, position: [i * 2, 0, j * 2], rotation: degToRad(0)})
      } else {
        objects.push({obj: baseObjects.building, position: [i * 2, 0, j * 2], rotation: degToRad(90)})
      }
    }
  }

  // -------------- for each object --------------------
  let specificObjectUniforms = {
    u_matrix: m4.identity(),
  };

  let waterYRotation = 0;
  let waterXRotation = 0;

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time = time * 0.0005;

    waterYRotation = time;
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

    var cameraMatrix = m4.lookAt(cameraPosition, target, up);
    // cameraMatrix = m4.xRotate(cameraMatrix, degToRad(10));

    const viewMatrix = m4.inverse(cameraMatrix);

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_viewWorldPosition: cameraPosition,
    };

    twgl.setUniforms(programInfo, sharedUniforms);

    // ------------ draw ---------------

    objects.forEach(({ obj, position, rotation }) => {
      let u_world = m4.yRotation(0);

      specificObjectUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        position,
        waterXRotation,
        rotation
      );

      for (let { bufferInfo, vao, material } of obj) {
        // set the attributes for this part.
        gl.bindVertexArray(vao);
        // calls gl.uniform
        twgl.setUniforms(
          programInfo,
          {
            u_matrix: specificObjectUniforms.u_matrix,
            u_world,
          },
          material
        );
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    });

    twgl.setUniforms(programInfo, specificObjectUniforms);

    requestAnimationFrame(drawScene);
  }

  // ------ event listeners ---------
  window.addEventListener(
    "wheel",
    (e) => (cameraPosition[2] += e.deltaY * 0.01)
  );

  // --------------- utility functions---------------------
  function computeMatrix(
    viewProjectionMatrix,
    translation,
    xRotation,
    yRotation
  ) {
    var matrix = m4.translate(
      viewProjectionMatrix,
      translation[0],
      translation[1],
      translation[2]
    );
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }
}

main();
