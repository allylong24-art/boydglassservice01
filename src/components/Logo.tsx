import { BUSINESS, LOGO_SRC } from "../lib/business"

type LogoProps = {
  /** Classes for the logo image, used when `LOGO_SRC` is configured. */
  imgClassName?: string
  /** Classes for the "BG" monogram shown when there is no logo image. */
  monogramClassName?: string
  /** Classes for the company name shown beside the monogram. */
  nameClassName?: string
}

/**
 * The company logo. Renders the logo image when one is configured, and falls
 * back to the "BG" monogram plus the company name when `LOGO_SRC` is empty.
 * The image is the wordmark crop, which already contains the company name, so
 * no separate text is rendered alongside it.
 */
export function Logo({ imgClassName, monogramClassName, nameClassName }: LogoProps) {
  if (LOGO_SRC) {
    return <img src={LOGO_SRC} alt={BUSINESS.name} className={imgClassName} />
  }

  return (
    <>
      <div className={monogramClassName}>BG</div>
      <span className={nameClassName ?? "font-bold text-current text-lg tracking-tight"}>
        {BUSINESS.name}
      </span>
    </>
  )
}
