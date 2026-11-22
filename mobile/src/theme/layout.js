// Breakpoint & lebar maksimum konten untuk tampilan responsif.
// Desain Figma dibuat di frame 390 dp. Di layar lebar (tablet / lipat / landscape)
// konten dibatasi agar baris teks dan form tidak terlalu panjang.
export const BREAKPOINTS = {
  wide: 600, // HP besar, lipat, landscape
  tablet: 768,
  desktop: 1024,
};

export const MAX_WIDTH = {
  form: 560, // form & layar detail
  content: 760, // daftar satu kolom
  list: 1120, // grid beberapa kolom
};

export const MIN_TOUCH = 44; // area sentuh minimum (dp)
