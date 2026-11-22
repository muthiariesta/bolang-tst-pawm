import Badge from './Badge';
import { getCategory } from '../data/categories';

// Badge kategori dengan warna sesuai variabel category/* (Curug biru, Situs ungu, Kawah amber, alam hijau).
export default function CategoryBadge({ category, style }) {
  const cat = getCategory(category);
  return <Badge label={cat.label} tone={cat.tone} style={style} />;
}
