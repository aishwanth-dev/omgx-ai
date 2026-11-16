import type { CSSProperties } from "react";
import { HERO_ACCESSIBLE_NAME, HERO_PHRASES, HERO_STATIC, LOOP_SECONDS, PHRASE_SECONDS } from "@/lib/story/heroPhrases";

/**
 * Homepage H1: a fixed first line ("Think beyond,") that dissolves in word by word, and a second line that loops
 * through the approved phrases with one CSS animation (no timers). The accessible name is the sr-only full text.
 * Without html.motion (no JS, reduced motion) the loop is off and the headline reads "Think beyond." / "Engineer what's next.".
 * HomeStory adds `is-intro` (starts the dissolve and the loop) and `is-paused` (off screen).
 */
export function HeroTitle() {
  const words = HERO_STATIC.split(" ");
  return (
    <h1
      id="hero-title"
      className="story__title t-display-xl"
      data-reveal="intro"
      style={{ "--phrase-s": `${PHRASE_SECONDS}s`, "--cycle": `${LOOP_SECONDS}s` } as CSSProperties}
    >
      <span className="sr-only">{HERO_ACCESSIBLE_NAME}</span>
      <span className="story__static" aria-hidden="true">
        {words.map((word, i) => (
          <span key={word}>
            <span className="rw">
              <span className="rw__in" style={{ "--i": i } as CSSProperties}>
                {word}
                {i === words.length - 1 && (
                  <>
                    <span className="story__punct story__punct--comma">,</span>
                    <span className="story__punct story__punct--period">.</span>
                  </>
                )}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
      <span className="story__phrases" aria-hidden="true">
        {HERO_PHRASES.map((phrase, k) => (
          <span key={phrase} className="story__phrase" style={{ "--k": k } as CSSProperties}>
            {phrase}
          </span>
        ))}
      </span>
    </h1>
  );
}
