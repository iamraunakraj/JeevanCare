import { Link } from 'react-router-dom'
import { Button, Chip, Avatar } from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'

function DoctorCard({ doctor }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white card-hover flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar src={doctor.photo} sx={{ width: 56, height: 56 }} className="ring-2 ring-primary/10">
          {doctor.name?.charAt(0)}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-gray-900 truncate">{doctor.name}</h3>
            {doctor.verificationStatus === 'verified' && (
              <VerifiedIcon sx={{ fontSize: 16 }} className="text-primary shrink-0" />
            )}
          </div>
          <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
          <p className="text-xs text-gray-400">{doctor.qualification}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>{doctor.experience} yrs exp</span>
        <span className="flex items-center gap-0.5">
          <StarIcon sx={{ fontSize: 14 }} className="text-amber-500" />
          {doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New'}
        </span>
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-500">
        <LocationOnIcon sx={{ fontSize: 16 }} />
        <span className="truncate">{doctor.clinicName}, {doctor.area}</span>
      </div>

      <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
        <span className="font-bold text-gray-900">₹{doctor.consultationFee}</span>
        <Chip label="Available" size="small" color="success" variant="outlined" />
      </div>

      <div className="flex gap-2 mt-1">
        <Button component={Link} to={`/doctor/${doctor._id}`} variant="outlined" fullWidth size="small">
          View Profile
        </Button>
        <Button component={Link} to={`/doctor/${doctor._id}`} variant="contained" fullWidth size="small">
          Book Now
        </Button>
      </div>
    </div>
  )
}

export default DoctorCard