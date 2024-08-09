#version 300 es

precision highp float;

uniform vec4 offset_scale;

out vec4 outColor;

vec2 pixel_to_hex(vec2 p) {
    // Algorithm from Charles Chambers
    // with modifications and comments by Chris Cox 2023
    p *= vec2(1.0, -1.0) / vec2(sqrt(3.0));
    float t = sqrt(3.0) * p.y + 1.0;
    float t2 = floor(t + p.x);
    float q = (t2 + 2.0 * p.x + 1.0) / 3.0;
    float r = (t2 + t - p.x) / 3.0;
    return vec2(floor(q), -floor(r));
}
vec2 pixel_to_hex_f(vec2 p) {
    return vec2(
        sqrt(3.0) / 3.0 * p.x + -1.0 / 3.0 * p.y,
        2.0 / 3.0 * p.y
    );
}
vec3 hex_qrs(vec2 qr) {
    return vec3(qr, -qr.x - qr.y);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898f, 78.233f))) *
        43758.5453123f);
}

void main() {
    vec2 pos = (gl_FragCoord.xy + offset_scale.xy) / offset_scale.zw;
    vec2 hex = pixel_to_hex(pos);

    vec2 hexf = pixel_to_hex_f(pos);
    vec3 diff = abs(hex_qrs(hex) - hex_qrs(hexf));
    float dist = max(diff.x + diff.y, max(diff.x + diff.z, diff.y + diff.z));
    float border = 1.0 - step(0.95, dist) * (dist - 0.95 + 0.01) / 0.1;

    float noice = (random(hex) - 0.5) / 75.0;
    outColor = vec4(vec3((0.2 + noice) * border), 1.0);
}
