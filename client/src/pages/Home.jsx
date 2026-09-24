import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, InputAdornment, Chip, Avatar } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VerifiedIcon from '@mui/icons-material/Verified'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SearchAutocomplete from '../components/SearchAutocomplete.jsx'

const POPULAR_SPECIALIZATIONS = [
  'Cardiologist', 'Dentist', 'Dermatologist', 'Orthopedic', 'ENT',
  'Neurologist', 'Gynecologist', 'General Physician', 'Pediatrician',
]

const HOW_IT_WORKS = [
  { icon: SearchIcon, title: 'Find a Doctor', desc: 'Search by name, specialization, or area near you.' },
  { icon: CalendarMonthIcon, title: 'Book Instantly', desc: 'Pick a slot or grab a digital token in seconds.' },
  { icon: AccessTimeIcon, title: 'Track Live Queue', desc: 'Know exactly when to reach — no more waiting rooms.' },
]

function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch() {
    const params = query ? `?search=${encodeURIComponent(query)}` : ''
    navigate(`/doctors${params}`)
  }

  return (
    <div>
      {/* Hero */}
      <div className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative animate-fade-in-up">
          <Chip
            icon={<LocationOnIcon sx={{ color: 'white !important' }} />}
            label="Serving Ara"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', mb: 3 }}
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Find the Right Doctor,<br />Skip the Wait
          </h1>
          <p className="text-teal-50 mt-4 text-lg max-w-xl mx-auto">
            Book appointments and get digital tokens — track your queue in real time from home.
          </p>

          <div className="max-w-2xl mx-auto mt-8 bg-white p-2 rounded-2xl shadow-xl">
  <SearchAutocomplete variant="hero" />
</div>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {POPULAR_SPECIALIZATIONS.map((spec) => (
              <Chip
                key={spec}
                label={spec}
                onClick={() => navigate(`/doctors?specialization=${encodeURIComponent(spec)}`)}
                className="cursor-pointer"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How JeevanCare Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="text-center card-hover p-6 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-primary" fontSize="large" />
                </div>
                <h3 className="font-semibold mb-1">{i + 1}. {step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-10 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">100%</p>
            <p className="text-xs text-gray-500 uppercase mt-1">Verified Doctors</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">Live</p>
            <p className="text-xs text-gray-500 uppercase mt-1">Queue Tracking</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">0₹</p>
            <p className="text-xs text-gray-500 uppercase mt-1">Booking Fee</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home