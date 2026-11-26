import { useId } from "react";
import type { ArtworkOverlay, LineFit, ConcealedBounds } from "./artwork";

export default function MushafArtwork({
  source,
  width,
  height,
  fits,
  overlays,
  concealed = [],
}: {
  source: string;
  width: number;
  height: number;
  fits: LineFit[];
  overlays: ArtworkOverlay[];
  concealed?: ConcealedBounds[];
}) {
  const imageId = useId();
  const inkMaskId = useId();
  const linkedInkId = useId();
  const concealMaskId = useId();
  const strips: LineFit[] = [];
  let y = 0;
  for (const fit of fits) {
    if (fit.top > y)
      strips.push({ top: y, bottom: fit.top, scale: 1, offset: 0 });
    strips.push(fit);
    y = fit.bottom;
  }
  if (y < height) strips.push({ top: y, bottom: height, scale: 1, offset: 0 });

  return (
    <svg
      className="mushaf-fitted-image"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <image id={imageId} href={source} width={width} height={height} />
        {concealed.length > 0 && (
          <mask
            id={concealMaskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <rect width={width} height={height} fill="white" />
            {concealed.map(([left, top, right, bottom], i) => (
              <rect
                key={i}
                x={left}
                y={top}
                width={right - left}
                height={bottom - top}
                fill="black"
              />
            ))}
          </mask>
        )}
        {overlays.length > 0 && (
          <mask
            id={inkMaskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <rect width={width} height={height} fill="white" />
            {overlays.map(({ key, bounds: [left, top, right, bottom] }) => (
              <rect
                key={key}
                x={left}
                y={top}
                width={right - left}
                height={bottom - top}
                fill="black"
              />
            ))}
          </mask>
        )}
        {overlays.some(({ linked }) => linked) && (
          <filter id={linkedInkId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope=".8" intercept=".02" />
              <feFuncG type="linear" slope=".5" intercept=".45" />
              <feFuncB type="linear" slope=".53" intercept=".35" />
            </feComponentTransfer>
          </filter>
        )}
      </defs>
      {strips.map(({ top, bottom, scale, offset }) => (
        <svg
          key={top}
          y={top}
          width={width}
          height={bottom - top}
          viewBox={`0 ${top} ${width} ${bottom - top}`}
          overflow="hidden"
        >
          <g
            transform={`matrix(${scale} 0 0 1 ${offset} 0)`}
            mask={concealed.length ? `url(#${concealMaskId})` : undefined}
          >
            <use
              className="mushaf-black-ink"
              href={"#" + imageId}
              mask={overlays.length ? `url(#${inkMaskId})` : undefined}
            />
            {overlays
              .filter(({ bounds }) => bounds[1] < bottom && bounds[3] > top)
              .map(({ key, bounds, linked }) => {
                const [left, overlayTop, right, overlayBottom] = bounds;
                const overlayWidth = right - left;
                const overlayHeight = overlayBottom - overlayTop;
                return (
                  <svg
                    key={key}
                    x={left}
                    y={overlayTop}
                    width={overlayWidth}
                    height={overlayHeight}
                    viewBox={`${left} ${overlayTop} ${overlayWidth} ${overlayHeight}`}
                    overflow="hidden"
                  >
                    <use
                      href={"#" + imageId}
                      filter={linked ? `url(#${linkedInkId})` : undefined}
                    />
                  </svg>
                );
              })}
          </g>
        </svg>
      ))}
    </svg>
  );
}
