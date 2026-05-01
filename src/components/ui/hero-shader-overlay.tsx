import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface HeroShaderOverlayProps {
  className?: string
}

type RgbaColor = [number, number, number, number]

interface ShaderTheme {
  skyColor: RgbaColor
  cloudColor: RgbaColor
  lightColor: RgbaColor
  speed: number
}

const NOISE_TEXTURE_PATH = '/static/noise.png'

const DEFAULT_THEME: ShaderTheme = {
  skyColor: [0.36, 0.65, 0.79, 0.08],
  cloudColor: [0.2, 0.3, 0.5, 0.2],
  lightColor: [1, 1, 1, 0.24],
  speed: 1,
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_noiseTexture;
uniform float u_speed;
uniform vec4 u_skyColor;
uniform vec4 u_cloudColor;
uniform vec4 u_lightColor;

const float MARCH_START = 200.0;
const float MARCH_STEP = 2.0;
const float CLOUD_SCALE = 0.05;
const int MAX_STEPS = 100;
const float RAY_DIRECTION_X = 0.8;
const float HORIZON_OFFSET = 0.001;
const float CLOUD_DENSITY_BASE = 1.0;
const float CLOUD_ALPHA_MULTIPLIER = 0.4;

vec4 alphaBlend(vec4 baseColor, vec4 layerColor) {
  float outputAlpha = layerColor.a + baseColor.a * (1.0 - layerColor.a);
  vec3 outputRgb =
    layerColor.rgb * layerColor.a +
    baseColor.rgb * baseColor.a * (1.0 - layerColor.a);

  if (outputAlpha > 0.0) {
    outputRgb /= outputAlpha;
  }

  return vec4(outputRgb, clamp(outputAlpha, 0.0, 1.0));
}

float sampleNoiseLayer(vec4 position, float scale) {
  vec2 noiseUv = fract((scale * position.zw + ceil(scale * position.x)) / 200.0);
  float noiseSample = texture2D(u_noiseTexture, noiseUv).y;
  return (noiseSample / scale) * 4.0;
}

float sampleCloudField(vec4 position) {
  float scale = 2.0;
  float cloudField = position.w + CLOUD_DENSITY_BASE;

  for (int octave = 0; octave < 4; octave += 1) {
    cloudField -= sampleNoiseLayer(position, scale);
    scale *= 2.0;
  }

  return cloudField;
}

void main() {
  vec2 coord = gl_FragCoord.xy;
  vec4 rayDirection = vec4(RAY_DIRECTION_X, 0.0, coord / u_resolution.y - HORIZON_OFFSET);

  vec4 outputColor = u_skyColor;
  outputColor.rgb -= rayDirection.w;

  float travel = MARCH_START + sin(dot(coord, coord));

  for (int step = 0; step < MAX_STEPS; step += 1) {
    travel -= MARCH_STEP;

    if (travel < 0.0) {
      break;
    }

    vec4 samplePosition = CLOUD_SCALE * travel * rayDirection;
    samplePosition.xz += u_time * 0.5 * u_speed;
    samplePosition.x += sin(u_time * 0.25 * u_speed) * 0.25;

    float density = sampleCloudField(samplePosition);

    if (density < 0.0) {
      float shadeStrength = clamp(-density, 0.0, 1.0);
      vec4 shadedCloud = mix(u_lightColor, u_cloudColor, shadeStrength);

      float densityAlpha = clamp(-density * CLOUD_ALPHA_MULTIPLIER, 0.0, 1.0);
      shadedCloud.a *= densityAlpha;

      outputColor = alphaBlend(outputColor, shadedCloud);
    }
  }

  gl_FragColor = outputColor;
}
`

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function parseHexChannel(hexValue: string) {
  const parsed = Number.parseInt(hexValue, 16)
  return Number.isFinite(parsed) ? parsed / 255 : 0
}

function parseCssColor(value: string, fallback: RgbaColor): RgbaColor {
  const trimmedValue = value.trim().toLowerCase()

  if (!trimmedValue) return fallback

  if (trimmedValue.startsWith('#')) {
    const hex = trimmedValue.slice(1)

    if (hex.length === 3 || hex.length === 4) {
      const r = parseHexChannel(`${hex[0]}${hex[0]}`)
      const g = parseHexChannel(`${hex[1]}${hex[1]}`)
      const b = parseHexChannel(`${hex[2]}${hex[2]}`)
      const a = hex.length === 4 ? parseHexChannel(`${hex[3]}${hex[3]}`) : 1
      return [r, g, b, a]
    }

    if (hex.length === 6 || hex.length === 8) {
      const r = parseHexChannel(hex.slice(0, 2))
      const g = parseHexChannel(hex.slice(2, 4))
      const b = parseHexChannel(hex.slice(4, 6))
      const a = hex.length === 8 ? parseHexChannel(hex.slice(6, 8)) : 1
      return [r, g, b, a]
    }
  }

  if (trimmedValue.startsWith('rgb')) {
    const rgbMatch = trimmedValue.match(/rgba?\(([^)]+)\)/)
    if (!rgbMatch) return fallback

    const channels = rgbMatch[1]
      .split(/[\s,\/]+/)
      .map((part) => Number(part))
      .filter((part) => Number.isFinite(part))

    if (channels.length >= 3) {
      const r = clamp01(channels[0] / 255)
      const g = clamp01(channels[1] / 255)
      const b = clamp01(channels[2] / 255)
      const a = channels.length >= 4 ? clamp01(channels[3]) : 1
      return [r, g, b, a]
    }
  }

  return fallback
}

function readCssVariable(styles: CSSStyleDeclaration, variableName: string) {
  return styles.getPropertyValue(variableName).trim()
}

function readAlphaVariable(
  styles: CSSStyleDeclaration,
  variableName: string,
  fallback: number,
) {
  const alphaValue = Number(readCssVariable(styles, variableName))
  return Number.isFinite(alphaValue) ? clamp01(alphaValue) : fallback
}

function readSpeedVariable(styles: CSSStyleDeclaration, fallback: number) {
  const speedValue = Number(readCssVariable(styles, '--hero-shader-speed'))
  return Number.isFinite(speedValue) ? speedValue : fallback
}

function readShaderTheme(): ShaderTheme {
  const styles = getComputedStyle(document.documentElement)

  const skyColor = parseCssColor(
    readCssVariable(styles, '--hero-shader-sky-color'),
    DEFAULT_THEME.skyColor,
  )
  const cloudColor = parseCssColor(
    readCssVariable(styles, '--hero-shader-cloud-color'),
    DEFAULT_THEME.cloudColor,
  )
  const lightColor = parseCssColor(
    readCssVariable(styles, '--hero-shader-light-color'),
    DEFAULT_THEME.lightColor,
  )

  return {
    skyColor: [
      skyColor[0],
      skyColor[1],
      skyColor[2],
      readAlphaVariable(
        styles,
        '--hero-shader-sky-alpha',
        DEFAULT_THEME.skyColor[3],
      ),
    ],
    cloudColor: [
      cloudColor[0],
      cloudColor[1],
      cloudColor[2],
      readAlphaVariable(
        styles,
        '--hero-shader-cloud-alpha',
        DEFAULT_THEME.cloudColor[3],
      ),
    ],
    lightColor: [
      lightColor[0],
      lightColor[1],
      lightColor[2],
      readAlphaVariable(
        styles,
        '--hero-shader-light-alpha',
        DEFAULT_THEME.lightColor[3],
      ),
    ],
    speed: readSpeedVariable(styles, DEFAULT_THEME.speed),
  }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SOURCE,
  )

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return program
}

export default function HeroShaderOverlay({
  className,
}: HeroShaderOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    })

    if (!gl) return

    const program = createProgram(gl)
    if (!program) return

    const buffer = gl.createBuffer()
    if (!buffer) {
      gl.deleteProgram(program)
      return
    }

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const speedLocation = gl.getUniformLocation(program, 'u_speed')
    const skyColorLocation = gl.getUniformLocation(program, 'u_skyColor')
    const cloudColorLocation = gl.getUniformLocation(program, 'u_cloudColor')
    const lightColorLocation = gl.getUniformLocation(program, 'u_lightColor')
    const noiseTextureLocation = gl.getUniformLocation(
      program,
      'u_noiseTexture',
    )
    const positionLocation = gl.getAttribLocation(program, 'a_position')

    if (
      !resolutionLocation ||
      !timeLocation ||
      !speedLocation ||
      !skyColorLocation ||
      !cloudColorLocation ||
      !lightColorLocation ||
      !noiseTextureLocation ||
      positionLocation < 0
    ) {
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      return
    }

    const noiseTexture = gl.createTexture()
    if (!noiseTexture) {
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([127, 127, 127, 255]),
    )
    gl.uniform1i(noiseTextureLocation, 0)

    const noiseImage = new Image()
    noiseImage.onload = () => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        noiseImage,
      )
    }
    noiseImage.src = NOISE_TEXTURE_PATH

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const applyThemeUniforms = () => {
      const theme = readShaderTheme()

      gl.uniform1f(speedLocation, theme.speed)
      gl.uniform4f(
        skyColorLocation,
        theme.skyColor[0],
        theme.skyColor[1],
        theme.skyColor[2],
        theme.skyColor[3],
      )
      gl.uniform4f(
        cloudColorLocation,
        theme.cloudColor[0],
        theme.cloudColor[1],
        theme.cloudColor[2],
        theme.cloudColor[3],
      )
      gl.uniform4f(
        lightColorLocation,
        theme.lightColor[0],
        theme.lightColor[1],
        theme.lightColor[2],
        theme.lightColor[3],
      )
    }

    applyThemeUniforms()

    const themeObserver = new MutationObserver(() => {
      applyThemeUniforms()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio))
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    let frameId = 0
    const startTime = performance.now()

    const render = (now: number) => {
      resizeCanvas()

      const elapsedSeconds = (now - startTime) / 1000
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, elapsedSeconds)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      frameId = window.requestAnimationFrame(render)
    }

    frameId = window.requestAnimationFrame(render)
    window.addEventListener('resize', resizeCanvas)

    return () => {
      themeObserver.disconnect()
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resizeCanvas)
      noiseImage.onload = null
      gl.deleteTexture(noiseTexture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full opacity-90',
        className,
      )}
      ref={canvasRef}
    />
  )
}
