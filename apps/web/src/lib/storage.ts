/** Accès localStorage tolérant (navigation privée, stockage bloqué…). */
export const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // stockage indisponible : on ignore
    }
  },
}
