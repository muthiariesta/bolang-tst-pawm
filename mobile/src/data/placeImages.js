import { getCategory } from './categories';

// API Katalog Tempat belum menyimpan foto. Aplikasi memakai foto lokal per kategori
// (diekspor dari desain Figma). Jika suatu saat API mengirim `image_url`, foto itu yang dipakai.
const LOCAL = {
  curug: require('../../assets/images/places/curug.jpg'),
  tebing: require('../../assets/images/places/tebing.jpg'),
  gua: require('../../assets/images/places/gua.jpg'),
  kawah: require('../../assets/images/places/kawah.jpg'),
};

export function getPlaceImage(place) {
  if (place?.image_url) return { uri: place.image_url };
  const cat = getCategory(place?.category);
  return LOCAL[cat.image] || LOCAL.tebing;
}

export const ILLUSTRATION = require('../../assets/images/illustration.png');
