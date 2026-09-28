/** Income source kinds, as their display words. Callers use `KIND[kind] ?? kind`. */
export const KIND: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hourly: 'Hourly',
  product: 'Product',
  lead: 'Lead',
};
