import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  modalOpen: false,
  modalContent: null,
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),

  // ── Datos de empresa (para sidebar y reportes) ──
  empresa: {
    nombre: 'VerticalTech',
    logo_url: null,
    nit: '',
    nrc: '',
    telefono: '',
    correo: '',
    direccion: '',
  },
  setEmpresa: (data) =>
    set((s) => ({ empresa: { ...s.empresa, ...data } })),
}));

export default useAppStore;
