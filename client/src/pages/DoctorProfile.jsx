import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Chip, Avatar, CircularProgress, Divider } from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import { getDoctorById } from '../services/doctor.service.js'

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}
function getDirectionsUrl(doctor) {
  if (doctor.latitude && doctor.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${doctor.latitude},${doctor.longitude}`
  }
  // Lat/long nahi hai to address se hi search kar do
  const query = encodeURIComponent(`${doctor.clinicName}, ${doctor.address}, ${doctor.area}, ${doctor.city}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

function DoctorProfile() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getDoctorById(id)
      .then((res) => setDoctor(res.doctor))
      .catch(() => setError('Doctor not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <CircularProgress />
      </div>
    )
  }

  if (error || !doctor) {
    return <div className="text-center py-20 text-gray-500">Doctor not found.</div>
  }

  return (
    <div className=" flex flex-col max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
  <Avatar src={doctor.photo} sx={{ width: 96, height: 96 }} className="text-2xl shrink-0">
    {doctor.name?.charAt(0)}
  </Avatar>

  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold">{doctor.name}</h1>
      {doctor.verificationStatus === 'verified' && (
        <VerifiedIcon className="text-primary" fontSize="small" />
      )}
    </div>
    <p className="text-gray-600">{doctor.specialization} · {doctor.qualification}</p>
    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
      <span>{doctor.experience} years experience</span>
      <span className="flex items-center gap-1">
        <StarIcon sx={{ fontSize: 16 }} className="text-yellow-500" />
        {doctor.rating > 0 ? `${doctor.rating.toFixed(1)} (${doctor.reviewCount} reviews)` : 'No reviews yet'}
      </span>
    </div>

    <Button
      href={getDirectionsUrl(doctor)}
      target="_blank"
      rel="noopener noreferrer"
      variant="text"
      size="small"
      startIcon={<LocationOnIcon />}
      className="!mt-3 !-ml-2"
    >
      Get Directions
    </Button>
  </div>

  <div className="flex flex-col gap-2 w-full md:w-52 shrink-0">
    <Button component={Link} to={`/book/${doctor._id}`} variant="contained" size="large">
      Book Appointment
    </Button>
    <Button component={Link} to={`/token/${doctor._id}`} variant="outlined" size="large">
      Get Digital Token
    </Button>
  </div>
</div>

      <Divider className="my-6" />

      {/* About */}
      {doctor.about && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-gray-600 text-sm">{doctor.about}</p>
        </section>
      )}

      {/* Clinic Info */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Clinic Details</h2>
        {doctor.clinicPhoto && (
  <img src={doctor.clinicPhoto} alt="Clinic" className="w-full h-48 object-cover rounded-xl mb-4" />
)}
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <LocationOnIcon fontSize="small" className="text-gray-400" />
            <span>{doctor.clinicName}, {doctor.address}, {doctor.area}, {doctor.city}</span>
          </div>
          {doctor.phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon fontSize="small" className="text-gray-400" />
              <span>{doctor.phone}</span>
            </div>
          )}
          <div className="mt-1">
            <span className="font-semibold text-gray-900">Consultation Fee: ₹{doctor.consultationFee}</span>
          </div>
        </div>
      </section>

      {/* Services */}
      {doctor.services?.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Services</h2>
          <div className="flex flex-wrap gap-2">
            {doctor.services.map((service) => (
              <Chip key={service} label={service} variant="outlined" />
            ))}
          </div>
        </section>
      )}

      {/* Timings */}
      {doctor.schedule?.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Timings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {doctor.schedule.map((entry) => (
              <div
                key={entry.day}
                className="flex justify-between border border-gray-100 rounded-lg px-3 py-2"
              >
                <span className="capitalize text-gray-700">{DAY_LABELS[entry.day]}</span>
                <span className={entry.isWorking ? 'text-gray-900' : 'text-gray-400'}>
                  {entry.isWorking ? `${entry.startTime} – ${entry.endTime}` : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default DoctorProfile