export interface Place {
  type: 'place';
  label: string;
  embedCode: string;
}

const theWorldData = {
  type: 'place',
  label: 'The world',
  embedCode:
    '-508.00781250000006%2C-88.33883839556601%2C-123.75000000000001%2C87.9027214302662',
} as const;

// Continents
const europeData = {
  type: 'place',
  label: 'Europe',
  embedCode:
    '-22.67578125%2C14.43468021529728%2C42.62695312500001%2C78.69910592550542',
} as const;

const asiaData = {
  type: 'place',
  label: 'Asia',
  embedCode:
    '56.60156250000001%2C14.944784875088372%2C121.90429687500001%2C78.80197997387756',
} as const;

// Countries
const japanData = {
  type: 'place',
  label: 'Japan',
  embedCode:
    '122.12402343750001%2c6.577303118123887%2c154.77539062500003%2c54.67383096593114&',
} as const;

const italyData = {
  type: 'place',
  label: 'Italy',
  embedCode:
    '4.548339843750001%2C29.49698759653577%2C20.874023437500004%2C51.56341232867588',
} as const;

// Cities
const tokyoData = {
  type: 'place',
  label: 'Tokyo',
  embedCode:
    '134.12109375000003%2C14.668625907385914%2C150.44677734375003%2C40.463666324587685',
} as const;

const romeData = {
  type: 'place',
  label: 'Rome',
  embedCode:
    '12.227783203125002%2C41.549700145132725%2C12.73796081542969%2C42.235635122140614',
} as const;

export const places = {
  data: theWorldData,
  commands: {
    asia: {
      data: asiaData,
      commands: {
        japan: {
          data: japanData,
          commands: {
            tokyo: {
              data: tokyoData,
            },
          },
        },
      },
    },
    europe: {
      data: europeData,
      commands: {
        italy: {
          data: italyData,
          commands: {
            rome: {
              data: romeData,
            },
          },
        },
      },
    },
  },
} as const;
