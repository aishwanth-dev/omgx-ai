/**
 * OMGX AI brand mark: the owner's logo (public/brand/logo*.webp, built by scripts/build-brand.mjs).
 * The mark carries no lettering, so the "OMGX AI" wordmark is set beside it in <Logo />.
 */

export const LOGO_SRC = "/brand/logo.webp";
export const LOGO_SRC_2X = "/brand/logo@2x.webp";

export function LogoMark({
  size = 32,
  className,
  alt = "OMGX AI",
  priority = false,
}: {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed brand asset, pre-sized; no optimiser round-trip
    <img
      className={`logo__img${className ? ` ${className}` : ""}`}
      src={LOGO_SRC}
      srcSet={`${LOGO_SRC} 256w, ${LOGO_SRC_2X} 512w`}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={alt}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : undefined}
      draggable={false}
    />
  );
}

export function Logo({ size = 32, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span className="logo">
      <LogoMark size={size} priority={priority} />
      <span className="logo__word" aria-hidden="true">
        OMGX<span className="logo__ai">AI</span>
      </span>
    </span>
  );
}
