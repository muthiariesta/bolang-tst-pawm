// Galat API dengan pesan ramah dalam Bahasa Indonesia.
// Kode mengikuti tabel galat di README backend ({"error":"KODE","message":"..."}).

export const FRIENDLY_MESSAGES = {
  EMAIL_TAKEN: 'Email sudah terdaftar. Silakan masuk.',
  PLACE_EXISTS: 'Tempat dengan ID ini sudah ada di Katalog Tempat.',
  NOT_FINISHED: 'Tandai itinerary selesai dulu sebelum dibagikan sebagai template.',
  UNAUTHORIZED: 'Silakan masuk terlebih dahulu.',
  TOKEN_EXPIRED: 'Sesi kamu berakhir. Silakan masuk lagi.',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah.',
  INVALID_API_KEY: 'API key tidak valid.',
  FORBIDDEN: 'Kamu tidak punya akses untuk aksi ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  PLACE_NOT_FOUND: 'Tempat tidak ditemukan di Katalog Tempat.',
  VALIDATION_ERROR: 'Data belum lengkap atau tidak valid.',
  INVALID_ORDER: 'Urutan stop tidak valid.',
  DATE_OUT_OF_RANGE: 'Tanggal harus antara hari ini dan 15 hari ke depan.',
  RATE_LIMITED: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
  UPSTREAM_UNAVAILABLE: 'Data cuaca sedang tidak tersedia.',
  NETWORK: 'Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.',
  TIMEOUT: 'Server terlalu lama merespons. Coba lagi sebentar lagi.',
  NO_BASE_URL: 'EXPO_PUBLIC_API_URL belum diisi di file .env.',
  NO_ORCHESTRATOR: 'Layanan Orkestrasi Rencana belum tersedia.',
};

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function friendlyMessage(code, fallback) {
  return (code && FRIENDLY_MESSAGES[code]) || fallback || 'Terjadi kesalahan. Coba lagi.';
}

export function isAuthError(error) {
  return error?.status === 401;
}
