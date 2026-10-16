/**
 * 0–100 per city: mostly Wikipedia page views (what people look up), partly
 * how many Wikipedia languages cover the place (lasting significance). Both
 * on a log scale relative to the city's most-viewed spot, so one giant
 * doesn't flatten everything else to zero.
 */
const VIEWS_WEIGHT = 0.7;
const SITELINKS_WEIGHT = 0.3;

const logShare = (value: number, max: number): number =>
  max <= 0 ? 0 : Math.log10(1 + value) / Math.log10(1 + max);

export type PopularityInput = {
  /** `null` when the page views couldn't be fetched — never read as nobody looking. */
  readonly views: number | null;
  readonly sitelinks: number;
};

export const popularityScores = (
  inputs: readonly PopularityInput[],
): number[] => {
  const maxViews = Math.max(0, ...inputs.map((input) => input.views ?? 0));
  const maxSitelinks = Math.max(0, ...inputs.map((input) => input.sitelinks));

  return inputs.map(({ views, sitelinks }) => {
    const sitelinkShare = logShare(sitelinks, maxSitelinks);
    // Unknown views: the sitelinks stand in for them.
    const viewShare =
      views === null ? sitelinkShare : logShare(views, maxViews);

    return Math.round(
      100 * (VIEWS_WEIGHT * viewShare + SITELINKS_WEIGHT * sitelinkShare),
    );
  });
};
