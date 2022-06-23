float PI = 3.141592653589793238;

attribute float a_random_size;
attribute float a_random_color;

uniform float time;
uniform sampler2D texture1;

varying vec2 vUv;
varying vec3 vPosition;
varying float v_random_color;
void main() {
  vUv = uv;
  v_random_color = a_random_color;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  gl_PointSize = 20. * a_random_size * ( 1. / - mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}