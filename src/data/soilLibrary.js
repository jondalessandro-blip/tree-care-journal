export const soilLibrary = [

  {

    id: 'fully-inorganic',

    name: '1. Fully Inorganic - Fast Drain',

    shortName: 'Inorganic Fast Drain',

    mix: '1/3 Akadama, 1/3 Pumice, 1/3 Lava (Boons Mix)',

    characteristics: 'Excellent aeration, max drainage, prevents rot. No nutrients held - needs daily water + regular fertilizer.',

    bestFor: 'Conifers, pines, junipers, refinement, show trees',

    ph: '5.5-6.5 normal, 7.0-8.0 + lime chip for Alkaline Lover tag',

    color: '#D9EAD3',

    useWhen: 'Foliage is Conifer OR Climate is Cold Hardy Conifer OR Tags includes Alkaline Lover'

  },

  {

    id: 'semi-inorganic',

    name: '2. Semi-Inorganic - Balanced',

    shortName: 'Balanced',

    mix: '50% Akadama, 25% Pumice, 25% Lava + 5-10% fir bark',

    characteristics: 'Holds moisture longer, bark feeds slowly. Most common all-around mix.',

    bestFor: 'Deciduous, Maples, Elms, Boxwood, Azalea with kanuma variant',

    ph: '5.5-6.5 normal, 4.5-5.5 for Acid Lover tag using kanuma',

    color: '#FFF2CC',

    useWhen: 'Foliage is Deciduous OR Foliage is Broadleaf Evergreen OR Tags includes Acid Lover'

  },

  {

    id: 'organic-heavy',

    name: '3. Organic-Heavy - Retentive',

    shortName: 'Organic Retentive',

    mix: 'Peat/compost/fir bark + pumice/perlite + coarse sand',

    characteristics: 'Very water retentive, nutrient rich, can compact over time. Good for fast growth.',

    bestFor: 'Tropicals, Ficus, Figs, Jade, starters, trunk building, Bonchi',

    ph: '6.0-7.0',

    color: '#D0E0E3',

    useWhen: 'Climate is Tropical & Subtropical OR Foliage is Succulent OR Tags includes Fruit/Berry for tropical fruits'

  }

];

export const defaultSoilByTree = (tree) => {

  const tags = tree.tags || [];

  if (tags.includes('Acid Lover')) return 'semi-inorganic';

  if (tags.includes('Alkaline Lover')) return 'fully-inorganic';

  const foliage = tree.foliage || '';

  const climate = tree.climate || '';

  if (foliage === 'Conifer' || climate === 'Cold Hardy Conifer') return 'fully-inorganic';

  if (foliage === 'Deciduous' || foliage === 'Broadleaf Evergreen') return 'semi-inorganic';

  if (climate === 'Tropical & Subtropical' || foliage === 'Succulent / Desert') return 'organic-heavy';

  return 'semi-inorganic';

};
