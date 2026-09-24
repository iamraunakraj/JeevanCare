import Doctor from '../models/Doctor.model.js'
import { doctorProfileSchema } from '../validators/doctor.validator.js'

export async function getMyDoctorProfile(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }
    res.json({ success: true, doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function updateMyDoctorProfile(req, res) {
  try {
    const parsed = doctorProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      parsed.data,
      { new: true, runValidators: true }
    )

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    res.json({ success: true, message: 'Profile updated successfully', doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Aaj ke din (day-of-week) ke hisaab se doctor available hai ya nahi, check karta hai
function isAvailableToday(schedule) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[new Date().getDay()]
  const todayEntry = schedule?.find((entry) => entry.day === today)
  return !!todayEntry?.isWorking
}

export async function getDoctors(req, res) {
  try {
    const {
      search,
      specialization,
      area,
      city,
      minFee,
      maxFee,
      minExperience,
      availableToday,
      sortBy,
      page = 1,
      limit = 9,
    } = req.query

    // Sirf verified doctors hi public search mein dikhenge
    const filter = { verificationStatus: 'verified' }

    if (specialization) filter.specialization = specialization
    if (area) filter.area = area
    if (city) filter.city = city

    if (minFee || maxFee) {
      filter.consultationFee = {}
      if (minFee) filter.consultationFee.$gte = Number(minFee)
      if (maxFee) filter.consultationFee.$lte = Number(maxFee)
    }

    if (minExperience) {
      filter.experience = { $gte: Number(minExperience) }
    }

    // Free-text search: naam, specialization, clinic naam, area mein se kahin bhi match ho
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
      ]
    }

    // Sorting options
    let sort = { createdAt: -1 }
    if (sortBy === 'fee_low') sort = { consultationFee: 1 }
    if (sortBy === 'fee_high') sort = { consultationFee: -1 }
    if (sortBy === 'experience') sort = { experience: -1 }
    if (sortBy === 'rating') sort = { rating: -1 }

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(50, Math.max(1, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    let doctors = await Doctor.find(filter).sort(sort).skip(skip).limit(limitNum)
    const totalCount = await Doctor.countDocuments(filter)

    // "Available today" filter database query mein nahi kiya kyunki yeh
    // schedule array ke andar ek dynamic (aaj ke din pe depend) check hai —
    // isliye fetch karne ke baad application-level pe filter kiya
    if (availableToday === 'true') {
      doctors = doctors.filter((d) => isAvailableToday(d.schedule))
    }

    res.json({
      success: true,
      doctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }
    res.json({ success: true, doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Filter dropdowns ke liye — available specializations aur areas ki list
export async function getFilterOptions(req, res) {
  try {
    const specializations = await Doctor.distinct('specialization', { verificationStatus: 'verified' })
    const areas = await Doctor.distinct('area', { verificationStatus: 'verified' })
    res.json({ success: true, specializations, areas })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
// Typeahead suggestions — patient jaise-jaise type kare, matching results turant dikhao
export async function getSearchSuggestions(req, res) {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, suggestions: [] })
    }

    const regex = new RegExp(q.trim(), 'i') // case-insensitive partial match

    // Specializations jo match karte hain (unique list, max 4)
    const matchingSpecializations = await Doctor.distinct('specialization', {
      verificationStatus: 'verified',
      specialization: regex,
    })

    // Doctors jinka naam ya clinic naam match kare (max 5)
    const matchingDoctors = await Doctor.find({
      verificationStatus: 'verified',
      $or: [{ name: regex }, { clinicName: regex }],
    })
      .select('name specialization clinicName area photo')
      .limit(5)

    const suggestions = [
      ...matchingSpecializations.slice(0, 4).map((spec) => ({
        type: 'specialization',
        label: spec,
        subtitle: 'Specialization',
      })),
      ...matchingDoctors.map((doc) => ({
        type: 'doctor',
        label: doc.name,
        subtitle: `${doc.specialization} · ${doc.clinicName}, ${doc.area}`,
        doctorId: doc._id,
        photo: doc.photo,
      })),
    ]

    res.json({ success: true, suggestions })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}