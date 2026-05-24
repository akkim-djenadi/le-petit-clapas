const { parseCSV, detectColumns, buildGithubImageUrl } = require('../services/csvImport');

describe('detectColumns', () => {
  test('détecte les colonnes standard françaises', () => {
    const headers = ['Nom du commerce', 'Adresse', 'Latitude', 'Longitude', 'Catégorie', 'Photo'];
    const mapping = detectColumns(headers);
    expect(mapping.name).toBe('Nom du commerce');
    expect(mapping.address).toBe('Adresse');
    expect(mapping.lat).toBe('Latitude');
    expect(mapping.lng).toBe('Longitude');
    expect(mapping.category).toBe('Catégorie');
    expect(mapping.image).toBe('Photo');
  });

  test('détecte les colonnes anglaises', () => {
    const headers = ['name', 'address', 'lat', 'lng', 'category'];
    const mapping = detectColumns(headers);
    expect(mapping.name).toBe('name');
    expect(mapping.lat).toBe('lat');
  });
});

describe('buildGithubImageUrl', () => {
  test('construit l\'URL GitHub raw correctement', () => {
    process.env.GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces';
    const url = buildGithubImageUrl('bistrot-paul.jpg');
    expect(url).toBe('https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces/bistrot-paul.jpg');
  });
});

describe('parseCSV', () => {
  test('parse un CSV simple', async () => {
    const csv = `name,address,lat,lng,category\nLe Bistrot,1 rue Test,43.6,3.88,Restauration`;
    const rows = await parseCSV(Buffer.from(csv));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Le Bistrot');
    expect(rows[0].lat).toBe('43.6');
  });
});
