// The inspiration grid: two columns of places, laid out in repeating blocks of
// four — a wide tile, then a tall one beside two squares. A last block with
// fewer places still fills its rows.

/** One block of the grid, top to bottom. */
export type BentoBlock<T> =
  | { readonly kind: 'wide'; readonly tile: T }
  | { readonly kind: 'pair'; readonly tiles: readonly [T, T] }
  | {
      readonly kind: 'cluster';
      readonly tall: T;
      readonly squares: readonly [T, T];
    };

const BLOCK = 4;

const blocksOf = <T>(chunk: readonly T[]): BentoBlock<T>[] => {
  const [a, b, c, d] = chunk;

  if (a === undefined) return [];

  if (b === undefined) return [{ kind: 'wide', tile: a }];

  if (c === undefined) return [{ kind: 'pair', tiles: [a, b] }];

  if (d === undefined)
    return [
      { kind: 'wide', tile: a },
      { kind: 'pair', tiles: [b, c] },
    ];

  return [
    { kind: 'wide', tile: a },
    { kind: 'cluster', tall: b, squares: [c, d] },
  ];
};

/** The places as grid blocks, in order. */
export const bentoLayout = <T>(tiles: readonly T[]): BentoBlock<T>[] =>
  Array.from({ length: Math.ceil(tiles.length / BLOCK) }, (_, index) =>
    blocksOf(tiles.slice(index * BLOCK, (index + 1) * BLOCK)),
  ).flat();
