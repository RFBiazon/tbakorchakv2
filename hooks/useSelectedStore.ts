import { useState, useEffect } from 'react'
import lojasConfigData from '../lojas.config.json'

interface LojaConfig {
  idInterno: string;
  nomeExibicao: string;
  idApi: string;
  supabaseUrlEnvVar: string;
  supabaseKeyEnvVar: string;
}

const lojasConfig: LojaConfig[] = lojasConfigData

export function useSelectedStore() {
  const [selectedStore, setSelectedStore] = useState<string>('')

  useEffect(() => {
    // Pegar a loja do localStorage
    const storedStore = localStorage.getItem('selectedStore')
    if (storedStore) {
      setSelectedStore(storedStore)
    } else {
      // Se não tiver nada, usar a primeira loja como fallback
      if (lojasConfig.length > 0) {
        setSelectedStore(lojasConfig[0].idInterno)
      }
    }
  }, [])

  const updateSelectedStore = (storeId: string) => {
    setSelectedStore(storeId)
    localStorage.setItem('selectedStore', storeId)
  }

  return {
    selectedStore,
    updateSelectedStore,
    lojasConfig
  }
} 