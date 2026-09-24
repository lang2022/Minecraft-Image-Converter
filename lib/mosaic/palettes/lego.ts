import type { MosaicColor } from '../engine';

/**
 * LEGO solid-color palette. Hex values are sRGB approximations of the LEGO
 * brick colors as community-scanned by Brick Architect / BrickLink; the
 * engine matches in LAB space so small deviations stay perceptually tight.
 */
export const legoPalette: MosaicColor[] = [
  // Neutrals
  { id: 'white', name: 'White', hex: '#F2F3F2', category: 'Neutrals' },
  { id: 'very-light-gray', name: 'Very Light Bluish Gray', hex: '#E6E3DA', category: 'Neutrals' },
  { id: 'light-gray', name: 'Light Bluish Gray', hex: '#A0A5A9', category: 'Neutrals' },
  { id: 'dark-gray', name: 'Dark Bluish Gray', hex: '#6C6E68', category: 'Neutrals' },
  { id: 'black', name: 'Black', hex: '#1B2A34', category: 'Neutrals' },

  // Reds & oranges
  { id: 'bright-red', name: 'Bright Red', hex: '#C91A09', category: 'Warm' },
  { id: 'dark-red', name: 'Dark Red', hex: '#720E0F', category: 'Warm' },
  { id: 'bright-orange', name: 'Bright Orange', hex: '#FE8A18', category: 'Warm' },
  { id: 'dark-orange', name: 'Dark Orange', hex: '#91501C', category: 'Warm' },
  { id: 'bright-light-orange', name: 'Bright Light Orange', hex: '#F8BB3D', category: 'Warm' },

  // Yellows
  { id: 'bright-yellow', name: 'Bright Yellow', hex: '#F2CD37', category: 'Warm' },
  { id: 'bright-light-yellow', name: 'Bright Light Yellow', hex: '#FFF04D', category: 'Warm' },

  // Greens
  { id: 'bright-green', name: 'Bright Green', hex: '#4B9F4A', category: 'Greens' },
  { id: 'dark-green', name: 'Dark Green', hex: '#184632', category: 'Greens' },
  { id: 'bright-yellowish-green', name: 'Lime', hex: '#BBE90B', category: 'Greens' },
  { id: 'sand-green', name: 'Sand Green', hex: '#A0BCAC', category: 'Greens' },

  // Blues & teals
  { id: 'bright-blue', name: 'Bright Blue', hex: '#0055BF', category: 'Blues' },
  { id: 'medium-blue', name: 'Medium Blue', hex: '#5A93DB', category: 'Blues' },
  { id: 'dark-blue', name: 'Dark Blue', hex: '#19325D', category: 'Blues' },
  { id: 'dark-azure', name: 'Dark Azure', hex: '#078BC9', category: 'Blues' },
  { id: 'medium-azure', name: 'Medium Azure', hex: '#36AEBF', category: 'Blues' },
  { id: 'dark-turquoise', name: 'Dark Turquoise', hex: '#008F9B', category: 'Blues' },
  { id: 'sand-blue', name: 'Sand Blue', hex: '#6074A1', category: 'Blues' },

  // Purples & pinks
  { id: 'bright-violet', name: 'Bright Violet', hex: '#8A3FFC' },
  { id: 'dark-purple', name: 'Dark Purple', hex: '#5F2683', category: 'Purples' },
  { id: 'medium-lavender', name: 'Medium Lavender', hex: '#A06EB9', category: 'Purples' },
  { id: 'lavender', name: 'Lavender', hex: '#B48CC0', category: 'Purples' },
  { id: 'magenta', name: 'Magenta', hex: '#923978', category: 'Purples' },
  { id: 'bright-pink', name: 'Bright Pink', hex: '#E4ADC8', category: 'Purples' },
  { id: 'dark-pink', name: 'Dark Pink', hex: '#C870A0', category: 'Purples' },

  // Earth tones
  { id: 'tan', name: 'Tan', hex: '#E4CD9E', category: 'Earth' },
  { id: 'dark-tan', name: 'Dark Tan', hex: '#958A73', category: 'Earth' },
  { id: 'reddish-brown', name: 'Reddish Brown', hex: '#582A12', category: 'Earth' },
  { id: 'dark-brown', name: 'Dark Brown', hex: '#352100', category: 'Earth' },
  { id: 'nougat', name: 'Nougat', hex: '#D67E58', category: 'Earth' },
  { id: 'medium-nougat', name: 'Medium Nougat', hex: '#AA7D55', category: 'Earth' },
];