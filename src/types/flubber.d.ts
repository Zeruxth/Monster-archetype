/* flubber ships no types — minimal shim for the pieces the About morph uses.
   Simplified: with `string: false` the interpolators actually return point
   rings, but we always keep the default (path-string output), so the return
   types here say `string`. */
declare module 'flubber' {
  /** A shape: an SVG path `d` string or a sampled point ring. */
  export type Ring = Array<[number, number]>;
  export type Shape = string | Ring;

  export interface Options {
    /** Sampling density — max distance between adjacent points (default 10,
        in shape coordinate units). */
    maxSegmentLength?: number;
    /** true (default): interpolators return SVG path strings. */
    string?: boolean;
    /** separate/combine: return ONE interpolator for all pieces (joined into
        a single path string) instead of an array. */
    single?: boolean;
  }

  export type Interpolator = (t: number) => string;

  /** 1 ring → 1 ring. */
  export function interpolate(from: Shape, to: Shape, options?: Options): Interpolator;
  /** N rings → N rings, paired by index. */
  export function interpolateAll(from: Shape[], to: Shape[], options?: Options): Interpolator[];
  /** 1 ring → N rings (the source splits into pieces). */
  export function separate(from: Shape, to: Shape[], options?: Options): Interpolator[];
  /** N rings → 1 ring (the pieces merge). */
  export function combine(from: Shape[], to: Shape, options?: Options): Interpolator[];

  export function splitPathString(d: string): string[];
  export function toPathString(ring: Ring): string;
}
