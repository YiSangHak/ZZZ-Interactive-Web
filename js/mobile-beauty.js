import { isMobileExperience } from "./config.js";
import { appState } from "./core/state.js";

// Edge-aware smoothing only inside detected faces. No geometry or skin hue changes.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision mediump float;
varying vec2 uv;
uniform sampler2D camera;
uniform vec2 pixel;
uniform vec4 faces[3];
uniform int faceCount;

float faceMask(vec2 point) {
  float mask = 0.0;
  for (int i = 0; i < 3; i++) {
    if (i < faceCount) {
      vec2 center = (faces[i].xy + faces[i].zw) * 0.5;
      vec2 radius = max((faces[i].zw - faces[i].xy) * vec2(0.54, 0.56), vec2(0.001));
      float distance = length((point - center) / radius);
      mask = max(mask, 1.0 - smoothstep(0.78, 1.0, distance));
    }
  }
  return mask;
}

void accumulate(vec2 offset, vec2 point, vec3 center, float spatial,
                inout vec3 total, inout float weightSum) {
  vec3 sampleColor = texture2D(camera, point + offset * pixel).rgb;
  vec3 difference = sampleColor - center;
  // Retain high-contrast details such as lashes, lips and hair.
  float weight = spatial * exp(-dot(difference, difference) / 0.012);
  total += sampleColor * weight;
  weightSum += weight;
}

void main() {
  vec2 point = vec2(1.0 - uv.x, uv.y);
  vec3 original = texture2D(camera, point).rgb;
  float mask = faceMask(vec2(point.x, 1.0 - point.y));
  vec3 color = original;
  if (mask > 0.001) {
    vec3 total = original;
    float weight = 1.0;
    accumulate(vec2( 2.0,  0.0), point, original, 0.9, total, weight);
    accumulate(vec2(-2.0,  0.0), point, original, 0.9, total, weight);
    accumulate(vec2( 0.0,  2.0), point, original, 0.9, total, weight);
    accumulate(vec2( 0.0, -2.0), point, original, 0.9, total, weight);
    accumulate(vec2( 3.5,  3.5), point, original, 0.7, total, weight);
    accumulate(vec2(-3.5,  3.5), point, original, 0.7, total, weight);
    accumulate(vec2( 3.5, -3.5), point, original, 0.7, total, weight);
    accumulate(vec2(-3.5, -3.5), point, original, 0.7, total, weight);
    accumulate(vec2( 7.0,  0.0), point, original, 0.4, total, weight);
    accumulate(vec2(-7.0,  0.0), point, original, 0.4, total, weight);
    accumulate(vec2( 0.0,  7.0), point, original, 0.4, total, weight);
    accumulate(vec2( 0.0, -7.0), point, original, 0.4, total, weight);
    vec3 smoothColor = total / weight;
    float luminance = dot(original, vec3(0.299, 0.587, 0.114));
    float cb = 0.5 + (original.b - luminance) * 0.564;
    float cr = 0.5 + (original.r - luminance) * 0.713;
    float skin = smoothstep(0.28, 0.36, cb) * (1.0 - smoothstep(0.54, 0.62, cb))
               * smoothstep(0.48, 0.54, cr) * (1.0 - smoothstep(0.72, 0.80, cr));
    float detail = length(original - smoothColor);
    float preserve = 1.0 - smoothstep(0.045, 0.14, detail);
    color = mix(original, smoothColor, mask * skin * preserve * 0.86);
    // A small luminance lift preserves the visitor's natural skin color.
    color += mask * skin * 0.018 * (1.0 - color);
  }
  gl_FragColor = vec4(color, 1.0);
}`;

function startBeauty() {
  const canvas = document.getElementById("beauty-canvas");
  const video = document.getElementById("webcam");
  const root = document.documentElement;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return; // Keep the existing camera filter on unsupported devices.

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const pixel = gl.getUniformLocation(program, "pixel");
  const faces = gl.getUniformLocation(program, "faces[0]");
  const faceCount = gl.getUniformLocation(program, "faceCount");
  let lastFrame = -1;
  let lastDraw = 0;
  let frame;

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    root.classList.remove("beauty-ready");
  }, { once: true });
  canvas.addEventListener("webglcontextrestored", () => startBeauty(), { once: true });

  function render(now) {
    if (video.readyState >= 2 && video.videoWidth && !document.hidden
        && now - lastDraw >= 1000 / 30 && video.currentTime !== lastFrame) {
      try {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.uniform2f(pixel, 1 / video.videoWidth, 1 / video.videoHeight);
        const regions = appState.faceRegions.slice(0, 3);
        const bounds = new Float32Array(12);
        regions.forEach((region, index) => bounds.set(region, index * 4));
        gl.uniform4fv(faces, bounds);
        gl.uniform1i(faceCount, regions.length);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        root.classList.add("beauty-ready");
        lastFrame = video.currentTime;
        lastDraw = now;
      } catch (error) {
        root.classList.remove("beauty-ready");
        console.warn("피부 보정 대신 기본 카메라를 표시합니다.", error);
        return;
      }
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
}

if (isMobileExperience) {
  try { startBeauty(); }
  catch (error) { console.warn("피부 보정을 시작할 수 없습니다.", error); }
}
