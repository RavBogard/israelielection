import "./maps.css";
import { at, frameOf, lineOf, placeOf, ringsPath, viewBox, wbAreas, xy, type LngLat } from "./geo";

/** E1 has no locality code; its point is the one Wikipedia gives for the area (31.8011N, 35.2817E). */
const E1: LngLat = [35.2816667, 31.8011111];
const E1_SOURCE = "https://en.wikipedia.org/wiki/E1_(Jerusalem)";
const F = frameOf(34.74, 31.32, 35.74, 32.58);

type Label = { name: string; p: LngLat; side: "l" | "r" | "t" | "b"; kind?: "town" | "region" };

/**
 * The lead of the West Bank issue page: where Areas A, B and C lie (ink, grey and the pale cell),
 * the Green Line dashed as a labelled reference line, and three places the page turns on. Geometry
 * from OCHA's published Oslo areas file, simplified, in public/maps/west-bank-areas.json.
 */
export default function WestBankAreas() {
  const { areas, greenLine, source, greenLineSource } = wbAreas;
  const towns = [
    { name: "Jerusalem", p: placeOf(3000), side: "l" },
    { name: "Ariel", p: placeOf(3570), side: "r" },
    { name: "Ma'ale Adumim", p: placeOf(3616), side: "r" },
    { name: "E1", p: E1, side: "t" },
  ].filter((t): t is Label => !!t.p);
  const regions: Label[] = [
    { name: "Israel", p: [34.78, 31.95], side: "r", kind: "region" },
    { name: "Jordan", p: [35.6, 31.62], side: "r", kind: "region" },
  ];
  const r = F.w / 110;
  return (
    <figure className="map-fig wb-areas">
      <figcaption className="ct">The occupied West Bank under the Oslo II zones: Areas A, B and C</figcaption>
      <div className="map-body">
        <div className="map-frame" style={{ aspectRatio: `${F.w} / ${F.h}` }}>
          <svg viewBox={viewBox(F)} role="img" aria-label="Map of the West Bank. Area C, under full Israeli control, covers most of the territory and surrounds the scattered pieces of Areas A and B. The Green Line runs along its western edge. Ariel lies deep inside, north of Jerusalem; Ma'ale Adumim and E1 lie just east of Jerusalem.">
            <path className="m-c" d={ringsPath(areas.C)} />
            <path className="m-b" d={ringsPath(areas.B)} />
            <path className="m-a" d={ringsPath(areas.A)} />
            <path className="m-ej" d={ringsPath(areas.EJ)} />
            <path className="m-nml" d={ringsPath(areas.NML)} />
            <path className="m-green" d={lineOf(greenLine)} />
            {towns.map((t) => {
              const [cx, cy] = xy(t.p);
              return <circle key={t.name} className="m-dot" cx={cx} cy={cy} r={r} />;
            })}
          </svg>
          {[...regions, ...towns].map((t) => (
            <span key={t.name} className={`m-lab ${t.side}${t.kind === "region" ? " region" : ""}`} style={at(F, t.p)} aria-hidden="true">{t.name}</span>
          ))}
          <span className="m-lab gl" style={at(F, [34.93, 32.3])} aria-hidden="true">Green Line</span>
        </div>
        <ul className="fig-key map-key">
          <li><i className="mk m-a" />Area A, the Palestinian cities, under the Palestinian Authority: about 18%</li>
          <li><i className="mk m-b" />Area B, Palestinian civil and Israeli security control: about 22%</li>
          <li><i className="mk m-c" />Area C, full Israeli control: about 60%</li>
          <li><i className="mk m-ej" />East Jerusalem, annexed by Israel, outlined</li>
          <li><i className="mk line" />The Green Line, the 1949 armistice line, along the western edge</li>
          <li><i className="mk dot" />Ariel and Ma&apos;ale Adumim, settlements; E1, the land between Ma&apos;ale Adumim and Jerusalem</li>
        </ul>
      </div>
      <p className="fig-src cs">
        Areas: <a href={source.url}>OCHA occupied Palestinian territory, from the Palestinian Authority Ministry of Planning</a> (HDX, dataset dated 2004), simplified. The file labels Area B as a second Area A; the polygon holding Area B villages such as Abu Dis and Taybeh is drawn as Area B. Hebron&apos;s H1 is drawn with Area A, H2 with Area C, and the Wye River nature reserve with Area B; the Latrun no man&apos;s land is outlined.
        {" "}Green Line: the western edge of <a href={greenLineSource.url}>OCHA&apos;s West Bank outline</a>. Places: the vote map&apos;s locality points; E1 from <a href={E1_SOURCE}>Wikipedia</a>. Shares of the territory: <a href="https://www.btselem.org/area_c/what_is_area_c">B&apos;Tselem</a>.
      </p>
    </figure>
  );
}
