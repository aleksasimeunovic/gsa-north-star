import { createContext, useContext } from 'react'

// Milan = comfortable (larger targets, more explanation), Jelena = compact.
export type Density = 'comfortable' | 'compact'
export const DensityContext = createContext<Density>('comfortable')
export const useDensity = () => useContext(DensityContext)
