var sliderVS =
"attribute vec2 a_position;\
attribute vec2 a_texCoord;\
\
uniform vec2 u_res;\
varying vec2 v_texCoord;\
\
void main() {\
	gl_Position = vec4(((a_position / u_res) * 2.0 - 1.0) * vec2(1, -1), 0, 1);\
	v_texCoord = a_texCoord;\
}";

var sliderFS =
"precision highp float;\
\
uniform sampler2D u_image;\
uniform sampler2D u_image1;\
uniform sampler2D u_image2;\
uniform float disp;\
uniform float x_fac;\
uniform float y_fac;\
varying vec2 v_texCoord;\
\
void main() {\
    vec4 disp2 = texture2D(u_image2, v_texCoord);\
    vec2 distortedPosition = vec2(v_texCoord.x + disp * (disp2.r * x_fac), v_texCoord.y);\
    vec2 distortedPosition2 = vec2(v_texCoord.x - (1.0 - disp) * (disp2.r * y_fac), v_texCoord.y);\
    vec4 _texture = texture2D(u_image, distortedPosition);\
    vec4 _texture2 = texture2D(u_image1, distortedPosition2);\
    gl_FragColor = mix(_texture, _texture2, disp);\
}";

var fake3DVS =
"attribute vec2 a_position;\
attribute vec2 a_texCoord;\
\
uniform vec2 u_res;\
varying vec2 v_texCoord;\
varying vec2 u_res1;\
\
void main() {\
	gl_Position = vec4(((a_position / u_res) * 2.0 - 1.0) * vec2(1, -1), 0, 1);\
	v_texCoord = a_texCoord;\
	u_res1 = u_res;\
}";

var fake3DFS =
"precision highp float;\
\
uniform sampler2D u_image;\
uniform sampler2D u_image1;\
uniform vec2 mouse;\
varying vec2 u_res1;\
varying vec2 v_texCoord;\
uniform float x_fac;\
uniform float y_fac;\
\
vec2 mirrored(vec2 v){\
    vec2 m = mod(v,2.);\
    return mix(m,2.0 - m, step(1.0 ,m));\
}\
\
void main() {\
	vec2 uv = v_texCoord.xy ;\
	vec2 vUv = (uv - vec2(0.5)) + vec2(0.5);\
	vec4 tex1 = texture2D(u_image1,mirrored(vUv));\
	vec2 fake3d = vec2(vUv.x + (tex1.r - 0.5)*mouse.x/x_fac, vUv.y + (tex1.r - 0.5)*mouse.y/y_fac);\
	gl_FragColor = texture2D(u_image,mirrored(fake3d));\
}";