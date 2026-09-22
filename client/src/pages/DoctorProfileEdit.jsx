import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { uploadDoctorPhoto, uploadClinicPhoto } from '../services/upload.service.js'
import { Avatar } from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material'
import { doctorProfileFormSchema } from '../validations/doctor.validation.js'
import { getMyDoctorProfile, updateMyDoctorProfile } from '../services/doctor.service.js'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Agar doctor ka profile pehli baar bana hai (signup ke time), uska schedule
// khaali hoga — isliye hum yahan default 7 din ka structure bana lete hain.
function buildDefaultSchedule(existingSchedule = []) {
  return DAYS.map((day) => {
    const found = existingSchedule.find((entry) => entry.day === day)
    return found || { day, isWorking: false, startTime: '10:00', endTime: '18:00' }
  })
}

function DoctorProfileEdit() {
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  //for uploading image on cloudniary
  const [doctorPhotoUrl, setDoctorPhotoUrl] = useState('')
const [clinicPhotoUrl, setClinicPhotoUrl] = useState('')
const [uploadingDoctorPhoto, setUploadingDoctorPhoto] = useState(false)
const [uploadingClinicPhoto, setUploadingClinicPhoto] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(doctorProfileFormSchema),
  })

  const scheduleValues = watch('schedule') || []

  // Component load hote hi doctor ka existing data fetch karo aur form mein bhar do
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getMyDoctorProfile()
        const d = res.doctor
        setDoctorPhotoUrl(d.photo || '')
          setClinicPhotoUrl(d.clinicPhoto || '')
          reset({
          specialization: d.specialization === 'Not set' ? '' : d.specialization,
          qualification: d.qualification === 'Not set' ? '' : d.qualification,
          experience: d.experience || 0,
          about: d.about || '',
          consultationFee: d.consultationFee || 0,
          clinicName: d.clinicName === 'Not set' ? '' : d.clinicName,
          address: d.address === 'Not set' ? '' : d.address,
          area: d.area === 'Not set' ? '' : d.area,
          city: d.city || 'Ara',
          phone: d.phone || '',
          servicesText: (d.services || []).join(', '),
          schedule: buildDefaultSchedule(d.schedule),
          maxPatientsPerDay: d.maxPatientsPerDay || 30,
          averageConsultationTime: d.averageConsultationTime || 10,
          latitude: d.latitude || '',
         longitude: d.longitude || '',
        })
      } catch (err) {
        setServerError('Could not load your profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [reset])

  async function onSubmit(data) {
    setServerError('')
    setSuccessMsg('')
    try {
      const services = data.servicesText
        ? data.servicesText.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      await updateMyDoctorProfile({
        ...data,
        services,
      })
      setSuccessMsg('Profile updated successfully')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }
   async function handleDoctorPhotoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  setUploadingDoctorPhoto(true)
  try {
    const res = await uploadDoctorPhoto(file)
    setDoctorPhotoUrl(res.photoUrl)
  } catch (err) {
    setServerError('Photo upload failed')
  } finally {
    setUploadingDoctorPhoto(false)
  }
}

async function handleClinicPhotoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  setUploadingClinicPhoto(true)
  try {
    const res = await uploadClinicPhoto(file)
    setClinicPhotoUrl(res.photoUrl)
  } catch (err) {
    setServerError('Clinic photo upload failed')
  } finally {
    setUploadingClinicPhoto(false)
  }
}
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">Edit Clinic Profile</h1>
      <p className="text-gray-500 text-sm mb-6">
        This information will be shown to patients on your public profile.
      </p>

      {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}
      {successMsg && <Alert severity="success" className="mb-4">{successMsg}</Alert>}

      <Paper elevation={1} className="p-6 rounded-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          //for adding image in profssiona detail
            <div className="flex items-center gap-6 mb-2">
  <div className="text-center">
    <Avatar src={doctorPhotoUrl} sx={{ width: 80, height: 80 }} className="mx-auto mb-2" />
    <label>
      <input type="file" accept="image/*" hidden onChange={handleDoctorPhotoChange} />
      <Button size="small" component="span" startIcon={<PhotoCameraIcon />} disabled={uploadingDoctorPhoto}>
        {uploadingDoctorPhoto ? 'Uploading...' : 'Your Photo'}
      </Button>
    </label>
  </div>

  <div className="text-center">
    <Avatar
      src={clinicPhotoUrl}
      variant="rounded"
      sx={{ width: 80, height: 80 }}
      className="mx-auto mb-2"
    />
    <label>
      <input type="file" accept="image/*" hidden onChange={handleClinicPhotoChange} />
      <Button size="small" component="span" startIcon={<PhotoCameraIcon />} disabled={uploadingClinicPhoto}>
        {uploadingClinicPhoto ? 'Uploading...' : 'Clinic Photo'}
      </Button>
    </label>
  </div>
</div>
          <h2 className="font-medium text-gray-700">Professional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Specialization"
              placeholder="e.g. Cardiologist"
              {...register('specialization')}
              error={!!errors.specialization}
              helperText={errors.specialization?.message}
              fullWidth
            />
            <TextField
              label="Qualification"
              placeholder="e.g. MBBS, MD"
              {...register('qualification')}
              error={!!errors.qualification}
              helperText={errors.qualification?.message}
              fullWidth
            />
            <TextField
              label="Experience (years)"
              type="number"
              {...register('experience')}
              error={!!errors.experience}
              helperText={errors.experience?.message}
              fullWidth
            />
            <TextField
              label="Consultation Fee (₹)"
              type="number"
              {...register('consultationFee')}
              error={!!errors.consultationFee}
              helperText={errors.consultationFee?.message}
              fullWidth
            />
          </div>
          <TextField
            label="About You"
            multiline
            rows={3}
            {...register('about')}
            error={!!errors.about}
            helperText={errors.about?.message}
            fullWidth
          />

          <Divider className="my-2" />

          <h2 className="font-medium text-gray-700">Clinic Details</h2>
          <TextField
            label="Clinic Name"
            {...register('clinicName')}
            error={!!errors.clinicName}
            helperText={errors.clinicName?.message}
            fullWidth
          />
          <TextField
            label="Full Address"
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message}
            fullWidth
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Area / Locality"
              placeholder="e.g. Nawada Chowk"
              {...register('area')}
              error={!!errors.area}
              helperText={errors.area?.message}
              fullWidth
            />
            <TextField
              label="City"
              {...register('city')}
              error={!!errors.city}
              helperText={errors.city?.message}
              fullWidth
            />
            <TextField
              label="Clinic Phone"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              fullWidth
            />
            <TextField
  label="Latitude (optional)"
  type="number"
  placeholder="e.g. 25.5541"
  {...register('latitude')}
  fullWidth
/>
<TextField
  label="Longitude (optional)"
  type="number"
  placeholder="e.g. 84.6717"
  {...register('longitude')}
  fullWidth
/>
          </div>

          <TextField

            label="Services (comma-separated)"
            placeholder="e.g. ECG, Heart Checkup, Blood Pressure Consultation"
            {...register('servicesText')}
            fullWidth
          />

          <Divider className="my-2" />

          <h2 className="font-medium text-gray-700">Weekly Schedule</h2>
          <div className="flex flex-col gap-2">
            {scheduleValues.map((entry, index) => (
              <div key={entry.day} className="flex items-center gap-3 flex-wrap">
                <Controller
  name={`schedule.${index}.isWorking`}
  control={control}
  render={({ field }) => (
    <FormControlLabel
      className="w-40 capitalize"
      control={
        <Switch
          checked={field.value}
          onChange={(e) => field.onChange(e.target.checked)}
        />
      }
      label={entry.day}
    />
  )}
/>
                <TextField
                  label="Start"
                  type="time"
                  size="small"
                  {...register(`schedule.${index}.startTime`)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="End"
                  type="time"
                  size="small"
                  {...register(`schedule.${index}.endTime`)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
            ))}
          </div>

          <Divider className="my-2" />

          <h2 className="font-medium text-gray-700">Queue Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Max Patients Per Day"
              type="number"
              {...register('maxPatientsPerDay')}
              error={!!errors.maxPatientsPerDay}
              helperText={errors.maxPatientsPerDay?.message}
              fullWidth
            />
            <TextField
              label="Average Consultation Time (minutes)"
              type="number"
              {...register('averageConsultationTime')}
              error={!!errors.averageConsultationTime}
              helperText={errors.averageConsultationTime?.message}
              fullWidth
            />
          </div>

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} className="mt-2 self-start">
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
          </Button>
        </form>
      </Paper>
    </div>
  )
}

export default DoctorProfileEdit