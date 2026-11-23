import { createContext, useContext, useMemo, useState } from 'react';

const PlanContext = createContext(null);

// State global "rencana yang sedang disusun": tempat yang dipilih dari Katalog Tempat.
// Dibaca di Jelajahi (tombol +), Detail Tempat (Tambah ke rencana), Buat Itinerary, dan badge tab.
export function PlanProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [placesById, setPlacesById] = useState({}); // cache objek tempat untuk ditampilkan

  const remember = (place) => {
    if (place?.id) setPlacesById((prev) => ({ ...prev, [place.id]: place }));
  };

  const isSelected = (id) => selectedIds.includes(id);

  const toggle = (place) => {
    remember(place);
    setSelectedIds((prev) => (prev.includes(place.id) ? prev.filter((x) => x !== place.id) : [...prev, place.id]));
  };

  const add = (place) => {
    remember(place);
    setSelectedIds((prev) => (prev.includes(place.id) ? prev : [...prev, place.id]));
  };

  const remove = (id) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  // Dari template / Rencana Ajaib: ganti seluruh pilihan
  const replace = (ids, places = []) => {
    places.forEach(remember);
    setSelectedIds([...new Set(ids)]);
  };

  const clear = () => setSelectedIds([]);

  const value = useMemo(
    () => ({ selectedIds, placesById, isSelected, toggle, add, remove, replace, clear, remember, count: selectedIds.length }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, placesById],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
