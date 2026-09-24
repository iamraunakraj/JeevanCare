import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, InputAdornment, Paper, CircularProgress, Avatar } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { useDebounce } from '../hooks/useDebounce.js'
import { getSearchSuggestions } from '../services/doctor.service.js'

function SearchAutocomplete({ variant = 'default', placeholder = 'Search doctor, specialization, clinic or area' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 1) {
      setSuggestions([])
      return
    }
    setLoading(true)
    getSearchSuggestions(debouncedQuery)
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(value) {
    setShowDropdown(false)
    navigate(`/doctors?search=${encodeURIComponent(value)}`)
  }

  function handleSuggestionClick(suggestion) {
    setShowDropdown(false)
    if (suggestion.type === 'doctor') {
      navigate(`/doctor/${suggestion.doctorId}`)
    } else {
      setQuery(suggestion.label)
      navigate(`/doctors?specialization=${encodeURIComponent(suggestion.label)}`)
    }
  }

  const isHero = variant === 'hero'

  return (
    <div ref={containerRef} className="relative w-full">
      <TextField
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={(e) => e.key === 'Enter' && query && handleSearch(query)}
        variant={isHero ? 'standard' : 'outlined'}
        size={isHero ? 'medium' : 'small'}
        slotProps={{
          input: {
            disableUnderline: isHero,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className={isHero ? 'text-gray-400' : undefined} fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
            ),
          },
        }}
        className={isHero ? 'px-2' : ''}
      />

      {showDropdown && query.length > 0 && suggestions.length > 0 && (
        <Paper
          elevation={3}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <div
              key={`${s.type}-${i}`}
              onClick={() => handleSuggestionClick(s)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
            >
              {s.type === 'doctor' ? (
                <Avatar src={s.photo} sx={{ width: 32, height: 32 }}>{s.label.charAt(0)}</Avatar>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <LocalHospitalIcon className="text-primary" sx={{ fontSize: 16 }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                <p className="text-xs text-gray-500 truncate">{s.subtitle}</p>
              </div>
            </div>
          ))}
        </Paper>
      )}

      {showDropdown && query.length > 0 && !loading && suggestions.length === 0 && (
        <Paper elevation={3} className="absolute top-full left-0 right-0 mt-2 rounded-xl p-4 z-50">
          <p className="text-sm text-gray-500 text-center">No matches. Press Enter to search anyway.</p>
        </Paper>
      )}
    </div>
  )
}

export default SearchAutocomplete