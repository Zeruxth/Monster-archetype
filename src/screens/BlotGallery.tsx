import { Blot } from '../components/Blot';
import {
  BLOT_SHAPES,
  EMOTION_ORDER,
  FULL_VARIANT_COUNT,
  SPOT_VARIANT_COUNT,
} from '../data/blots';
import type { BlotMode } from '../components/Blot';
import './BlotGallery.css';

/**
 * Dev-only review sheet for the blot library (open at #blots). For each of the 8
 * silhouettes it shows:
 *  - a "gradients" row: the black base + all 8 fully-coloured variations;
 *  - one row per emotion colour: that colour's 6 spot variations.
 * Not part of the app flow — a scratch surface for eyeballing the variations.
 */
export function BlotGallery() {
  return (
    <div className="blot-gallery">
      <h1 className="blot-gallery__title">Blot variations</h1>
      {BLOT_SHAPES.map((shape) => (
        <section key={shape.id} className="blot-gallery__blot">
          <h2 className="blot-gallery__heading">Blot {shape.id}</h2>

          {/* Gradients: black base + the 8 fully-coloured variations. */}
          <div className="blot-gallery__row">
            <h3 className="blot-gallery__subheading">gradients</h3>
            <div className="blot-gallery__tiles">
              <Tile shapeId={shape.id} mode={{ kind: 'black' }} label="black" />
              {Array.from({ length: FULL_VARIANT_COUNT }, (_, v) => (
                <Tile
                  key={`full-${v}`}
                  shapeId={shape.id}
                  mode={{ kind: 'full', variant: v }}
                  label={`full ${v + 1}`}
                />
              ))}
            </div>
          </div>

          {/* One row per colour: its 6 spot variations. */}
          {EMOTION_ORDER.map((color) => (
            <div key={color} className="blot-gallery__row">
              <h3 className="blot-gallery__subheading">{color}</h3>
              <div className="blot-gallery__tiles">
                {Array.from({ length: SPOT_VARIANT_COUNT }, (_, v) => (
                  <Tile
                    key={`${color}-${v}`}
                    shapeId={shape.id}
                    mode={{ kind: 'spot', color, variant: v }}
                    label={`v${v + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function Tile({
  shapeId,
  mode,
  label,
}: {
  shapeId: number;
  mode: BlotMode;
  label: string;
}) {
  return (
    <figure className="blot-gallery__tile">
      <div className="blot-gallery__frame">
        <Blot shapeId={shapeId} mode={mode} />
      </div>
      <figcaption className="blot-gallery__caption">{label}</figcaption>
    </figure>
  );
}
