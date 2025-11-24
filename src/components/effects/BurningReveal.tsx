import { useEffect, useRef, useState } from "react"
import "@/components/effects/burning-reveal.css"

export function BurningReveal({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return

    const devicePixelRatio = Math.min(window.devicePixelRatio, 2)
    let startTime = performance.now()
    let animationProgress = 0.3
    let animationFrameId: number

    let uniforms: Record<string, WebGLUniformLocation | null>
    let textTexture: WebGLTexture | null

    const textCanvas = document.createElement("canvas")
    const textCtx = textCanvas.getContext("2d")
    if (!textCtx) return

    function createTextTexture(gl: WebGLRenderingContext) {
      textCanvas.width = 2048
      textCanvas.height = 1024

      textCtx.fillStyle = "white"
      textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height)

      textCtx.fillStyle = "black"
      textCtx.font = "bold 320px Arial"
      textCtx.textAlign = "center"
      textCtx.textBaseline = "middle"
      textCtx.fillText("RoleColor™", textCanvas.width / 2, textCanvas.height / 2)

      textTexture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, textTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

      gl.clearColor(1.0, 1.0, 1.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }

    function initShader() {
      const vsSource = `
        precision mediump float;
        varying vec2 vUv;
        attribute vec2 a_position;

        void main() {
            vUv = a_position;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `

      const fsSource = `
        precision mediump float;
        varying vec2 vUv;
        uniform vec2 u_resolution;
        uniform float u_progress;
        uniform float u_time;
        uniform sampler2D u_text;

        float rand(vec2 n) {
            return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 n) {
            const vec2 d = vec2(0., 1.);
            vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
            return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
        }

        float fbm(vec2 n) {
            float total = 0.0, amplitude = .4;
            for (int i = 0; i < 4; i++) {
                total += noise(n) * amplitude;
                n += n;
                amplitude *= 0.6;
            }
            return total;
        }

        void main() {
            vec2 uv = vUv;
            uv.x *= min(1., u_resolution.x / u_resolution.y);
            uv.y *= min(1., u_resolution.y / u_resolution.x);

            vec2 screenUv = vUv * 0.5 + 0.5;
            screenUv.y = 1.0 - screenUv.y;

            float t = u_progress;

            vec4 textColor = texture2D(u_text, screenUv);
            vec3 color = textColor.rgb;

            float main_noise = 1. - fbm(.75 * uv + 10. - vec2(.3, .9 * t));

            float paper_darkness = smoothstep(main_noise - .1, main_noise, t);
            color -= vec3(.99, .95, .99) * paper_darkness;

            vec3 fire_color = fbm(6. * uv - vec2(0., .005 * u_time)) * vec3(6., 1.4, .0);
            float show_fire = smoothstep(.4, .9, fbm(10. * uv + 2. - vec2(0., .005 * u_time)));
            show_fire += smoothstep(.7, .8, fbm(.5 * uv + 5. - vec2(0., .001 * u_time)));

            float fire_border = .02 * show_fire;
            float fire_edge = smoothstep(main_noise - fire_border, main_noise - .5 * fire_border, t);
            fire_edge *= (1. - smoothstep(main_noise - .5 * fire_border, main_noise, t));
            color += fire_color * fire_edge;

            float opacity = 1. - smoothstep(main_noise - .0005, main_noise, t);

            gl_FragColor = vec4(color, opacity);
        }
      `

      const gl = canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl") as WebGLRenderingContext | null
      if (!gl) {
        console.error("WebGL is not supported")
        return null
      }

      function createShader(gl: WebGLRenderingContext, sourceCode: string, type: number) {
        const shader = gl.createShader(type)
        if (!shader) return null
        gl.shaderSource(shader, sourceCode)
        gl.compileShader(shader)

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("Shader compile error:", gl.getShaderInfoLog(shader))
          gl.deleteShader(shader)
          return null
        }
        return shader
      }

      const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER)
      const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER)
      if (!vertexShader || !fragmentShader) return null

      const shaderProgram = gl.createProgram()
      if (!shaderProgram) return null
      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)
      gl.linkProgram(shaderProgram)

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(shaderProgram))
        return null
      }

      uniforms = {}
      const uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS)
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(shaderProgram, i)
        if (uniformInfo) {
          uniforms[uniformInfo.name] = gl.getUniformLocation(shaderProgram, uniformInfo.name)
        }
      }

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
      const vertexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

      gl.useProgram(shaderProgram)

      const positionLocation = gl.getAttribLocation(shaderProgram, "a_position")
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      createTextTexture(gl)
      return gl
    }

    const gl = initShader()
    if (!gl) return

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    function resizeCanvas() {
      if (!canvasEl || !gl) return
      canvasEl.width = window.innerWidth * devicePixelRatio
      canvasEl.height = window.innerHeight * devicePixelRatio
      gl.viewport(0, 0, canvasEl.width, canvasEl.height)
      if (uniforms.u_resolution) {
        gl.uniform2f(uniforms.u_resolution, canvasEl.width, canvasEl.height)
      }
    }

    function render() {
      if (!gl || !canvasEl) return

      const currentTime = performance.now()
      const elapsed = (currentTime - startTime) / 8000

      if (elapsed <= 1) {
        animationProgress = 0.3 + 0.7 * easeInOut(elapsed)
      } else {
        setIsVisible(false)
        setTimeout(() => {
          onComplete()
        }, 500)
        return
      }

      if (uniforms.u_time) gl.uniform1f(uniforms.u_time, currentTime)
      if (uniforms.u_progress) gl.uniform1f(uniforms.u_progress, animationProgress)

      gl.activeTexture(gl.TEXTURE0)
      if (textTexture) gl.bindTexture(gl.TEXTURE_2D, textTexture)
      if (uniforms.u_text) gl.uniform1i(uniforms.u_text, 0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    render()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="burning-reveal-container">
      <div className="burning-hero-section">
        <div className="burning-hero-content">
          <h1 className="burning-hero-title">Discover Your Leadership</h1>
          <p className="burning-hero-subtitle">Unlock your unique RoleColor™ profile</p>
        </div>
      </div>
      <canvas ref={canvasRef} id="fire-overlay" />
    </div>
  )
}
