import { Fragment, type CSSProperties } from "react";
import { normalise, revealStep, splitLines } from "@/lib/text/words";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Word-by-word heading reveal (TextReveal adaptation), rendered on the server.
 * The full text sits in an sr-only span; the visible word spans are aria-hidden.
 * Nothing is hidden in this markup: the start state exists only in CSS under
 * html.motion, and RevealObserver adds `is-in` once 35% of the heading is in view.
 * `trigger="intro"` is skipped by the observer; the homepage intro adds `is-intro`.
 * Pass an array to force line breaks.
 */
export function RevealHeading({
  as: Tag = "h2",
  text,
  id,
  className,
  trigger = "view",
  style,
}: {
  as?: HeadingTag;
  text: string | readonly string[];
  id?: string;
  className?: string;
  trigger?: "view" | "intro";
  style?: CSSProperties;
}) {
  const lines = splitLines(text);
  const words = lines.flat();
  const step = revealStep(words.length);
  let i = 0;
  const forced = typeof text !== "string";
  return (
    <Tag
      id={id}
      className={className}
      data-reveal={trigger}
      style={{ ...style, "--rt-step": `${Number(step.toFixed(4))}s` } as CSSProperties}
    >
      <span className="sr-only">{normalise(words.join(" "))}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => {
          const content = line.map((word, wi) => {
            const n = i++;
            return (
              <Fragment key={wi}>
                <span className="rw">
                  <span className="rw__in" style={{ "--i": n } as CSSProperties}>
                    {word}
                  </span>
                </span>
                {wi < line.length - 1 ? " " : null}
              </Fragment>
            );
          });
          return forced ? (
            <span key={li} className="rw-line">
              {content}
            </span>
          ) : (
            <span key={li}>{content}</span>
          );
        })}
      </span>
    </Tag>
  );
}
