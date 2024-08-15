#version 300 es

uniform mat3 transform;

in vec2 pos;

void main() {
  gl_Position = vec4(transform * vec3(pos, 1.0), 1.0);
}
