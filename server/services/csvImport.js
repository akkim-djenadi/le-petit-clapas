const { parse } = require('csv-parse/sync');

const COLUMN_ALIASES = {
  name: ['name', 'nom', 'nom du commerce', 'commerce', 'enseigne'],
  address: ['address', 'adresse', 'adresse complète'],
  lat: ['lat', 'latitude'],
  lng: ['lng', 'lon', 'longitude'],
  category: ['category', 'catégorie', 'categorie', 'type'],
  subcategory: ['subcategory', 'sous-catégorie', 'sous_categorie', 'sous catégorie'],
  phone: ['phone', 'téléphone', 'telephone', 'tel'],
  website: ['website', 'site', 'site web', 'url'],
  email: ['email', 'mail', 'e-mail'],
  description: ['description', 'desc', 'présentation'],
  image: ['image', 'photo', 'img', 'photo principale', 'fichier image'],
};

const detectColumns = (headers) => {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const mapping = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const found = headers.find((h, i) => aliases.includes(lowerHeaders[i]));
    if (found) mapping[field] = found;
  }
  return mapping;
};

const buildGithubImageUrl = (filename) =>
  `${process.env.GITHUB_RAW_BASE}/${filename.trim()}`;

const parseCSV = (buffer) => {
  const content = buffer.toString('utf-8').replace(/^﻿/, ''); // strip BOM
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  return records;
};

const validateRow = (row, mapping) => {
  const errors = [];
  if (!row[mapping.name]) errors.push('Nom manquant');
  if (mapping.lat && row[mapping.lat] && isNaN(parseFloat(row[mapping.lat]))) errors.push('Latitude invalide');
  if (mapping.lng && row[mapping.lng] && isNaN(parseFloat(row[mapping.lng]))) errors.push('Longitude invalide');
  return errors;
};

module.exports = { parseCSV, detectColumns, buildGithubImageUrl, validateRow };
