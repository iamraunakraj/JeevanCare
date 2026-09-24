import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DoctorCard from '../components/DoctorCard.jsx'
import { searchDoctors, getFilterOptions } from '../services/doctor.service.js'
import SearchAutocomplete from '../components/SearchAutocomplete.jsx'

function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [doctors, setDoctors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState({ specializations: [], areas: [] })
  const [filtersLoaded, setFiltersLoaded] = useState(false) 

  // URL query params hi humare "source of truth" hain filters ke liye —
  // isse URL share karne pe bhi wahi filters apply rehte hain (link shareable ban jaata hai)
  const search = searchParams.get('search') || ''
  const specialization = searchParams.get('specialization') || ''
  const area = searchParams.get('area') || ''
  const sortBy = searchParams.get('sortBy') || ''
  const page = Number(searchParams.get('page')) || 1

  useEffect(() => {
  getFilterOptions()
    .then((res) =>
      setFilterOptions({ specializations: res.specializations, areas: res.areas })
    )
    .finally(() => setFiltersLoaded(true)) // yeh line add karo
}, [])

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await searchDoctors({ search, specialization, area, sortBy, page, limit: 9 })
      setDoctors(res.doctors)
      setPagination(res.pagination)
    } catch (err) {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [search, specialization, area, sortBy, page])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1') // filter badalte hi page 1 pe wapas jaao
    setSearchParams(next)
  }

  function handlePageChange(event, value) {
    const next = new URLSearchParams(searchParams)
    next.set('page', value)
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters() {
    setSearchParams({})
  }

  const hasActiveFilters = search || specialization || area || sortBy

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">Doctors in Ara</h1>
      <p className="text-gray-500 mb-6">
        {pagination.totalCount ?? doctors.length} doctors found
      </p>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="min-w-[280px] flex-1">
         <SearchAutocomplete />
    </div>

        {filtersLoaded && (
  <FormControl size="small" className="min-w-[160px]">
    <InputLabel>Specialization</InputLabel>
    <Select
      label="Specialization"
      value={specialization}
      onChange={(e) => updateParam('specialization', e.target.value)}
    >
      <MenuItem value="">All</MenuItem>
      {filterOptions.specializations.map((s) => (
        <MenuItem key={s} value={s}>{s}</MenuItem>
      ))}
    </Select>
  </FormControl>
)}

        {filtersLoaded && (
  <FormControl size="small" className="min-w-[140px]">
    <InputLabel>Area</InputLabel>
    <Select label="Area" value={area} onChange={(e) => updateParam('area', e.target.value)}>
      <MenuItem value="">All</MenuItem>
      {filterOptions.areas.map((a) => (
        <MenuItem key={a} value={a}>{a}</MenuItem>
      ))}
    </Select>
  </FormControl>
)}

        <FormControl size="small" className="min-w-[160px]">
          <InputLabel>Sort By</InputLabel>
          <Select label="Sort By" value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)}>
            <MenuItem value="">Newest</MenuItem>
            <MenuItem value="fee_low">Fee: Low to High</MenuItem>
            <MenuItem value="fee_high">Fee: High to Low</MenuItem>
            <MenuItem value="experience">Most Experienced</MenuItem>
            <MenuItem value="rating">Highest Rated</MenuItem>
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Chip label="Clear filters" onClick={clearFilters} onDelete={clearFilters} />
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No doctors found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Doctors