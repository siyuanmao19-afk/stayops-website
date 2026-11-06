import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getDashboard } from './api'
import type { DashboardData, Property } from './domain'

type DataState = {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  propertyById: (id: string) => Property | undefined
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getDashboard())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load StayOps data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<DataState>(() => ({
    data,
    loading,
    error,
    refresh,
    propertyById: (id) => data?.properties.find((property) => property.property_id === id),
  }), [data, loading, error, refresh])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useStayOpsData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useStayOpsData must be used inside DataProvider')
  return value
}


