float PI = 3.141592653589793238;

// attribute float a_random_color;

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying vec2 vUv;
varying vec3 vPosition;
varying float v_random_color;

void main()	{
	float disc = 1.0 - length(gl_PointCoord - vec2(0.5));
	float circle = clamp(smoothstep(0.7, 1.6, disc), 0.0, 1.0);

	vec3 particle_color = uColor1;
	if(v_random_color > 0.33 && v_random_color < 0.66) particle_color = uColor2;
	if(v_random_color > 0.66) particle_color = uColor3;

	float falloff_up_down = smoothstep(0.3, 0.5, vUv.y) * smoothstep(0.7, 0.5, vUv.y);

	// gl_FragColor = vec4(particle_color,1.);
	// gl_FragColor = vec4(vec3(circle), 1.);
	gl_FragColor = vec4(particle_color, circle * falloff_up_down);
}