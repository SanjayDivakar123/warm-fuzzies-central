import { useState } from "react"
import "@/components/hero/sticky-text-hero.css"

const words = [
  "lead.",
  "inspire.",
  "adapt.",
  "build.",
  "grow.",
  "connect.",
  "succeed."
]

export function StickyTextHero() {
  const [animate, setAnimate] = useState(true)

  return (
    <>
      <header className="sticky-text-header" style={{ "--count": words.length } as React.CSSProperties}>
        <section className="sticky-content">
          <h1>
            <span aria-hidden="true">you can&nbsp;</span>
            <span className="sr-only">you can lead teams.</span>
          </h1>
          <ul aria-hidden="true">
            {words.map((word, i) => (
              <li key={word} style={{ "--i": i } as React.CSSProperties}>
                {word}
              </li>
            ))}
          </ul>
        </section>
      </header>

      <main className={`sticky-main ${animate ? 'animate' : ''}`}>
        <section>
          <p className="fluid-text">
            discover your leadership color.<br />
            <a href="/free-assessment">start your journey</a>.
          </p>
        </section>
      </main>

      <div className="spacer" />
    </>
  )
}
