import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  // Sidebar
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile Menu
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // Theme (future use)
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Global Loading
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // Modals
  activeModal: string | null
  modalData: Record<string, unknown> | null
  openModal: (modalId: string, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Command Palette
  isCommandPaletteOpen: boolean
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar
      isSidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      // Mobile Menu
      isMobileMenuOpen: false,
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newNotification = { ...notification, id }
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))

        // Auto remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 5000)
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Global Loading
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modalId, data) =>
        set({ activeModal: modalId, modalData: data || null }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Command Palette
      isCommandPaletteOpen: false,
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
    }),
    {
      name: 'hephaitos-ui-store',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// ========================================
// Selector Hooks for Optimized Re-renders
// ========================================

/** Select sidebar collapsed state */
export const useSidebarCollapsed = () => useUIStore((state) => state.isSidebarCollapsed)

/** Select mobile menu state */
export const useMobileMenuOpen = () => useUIStore((state) => state.isMobileMenuOpen)

/** Select current theme */
export const useTheme = () => useUIStore((state) => state.theme)

/** Select notifications */
export const useNotifications = () => useUIStore((state) => state.notifications)

/** Select global loading state */
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)

/** Select active modal */
export const useActiveModal = () => useUIStore((state) => state.activeModal)

/** Select modal data */
export const useModalData = () => useUIStore((state) => state.modalData)

/** Select command palette state */
export const useCommandPaletteOpen = () => useUIStore((state) => state.isCommandPaletteOpen)

/** Select sidebar actions */
export const useSidebarActions = () => useUIStore((state) => ({
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
}))

/** Select notification actions */
export const useNotificationActions = () => useUIStore((state) => ({
  add: state.addNotification,
  remove: state.removeNotification,
  clear: state.clearNotifications,
}))

/** Select modal actions */
export const useModalActions = () => useUIStore((state) => ({
  open: state.openModal,
  close: state.closeModal,
}))
