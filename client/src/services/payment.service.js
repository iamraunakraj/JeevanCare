import api from './api.js'

export async function createOrder(appointmentId) {
  const res = await api.post('/payments/create-order', { appointmentId })
  return res.data
}

export async function verifyPayment(data) {
  const res = await api.post('/payments/verify', data)
  return res.data
}

export async function markCashPaid(appointmentId) {
  const res = await api.patch(`/payments/${appointmentId}/mark-paid`)
  return res.data
}

export async function checkPaymentStatus(appointmentId) {
  const res = await api.get(`/payments/status/${appointmentId}`)
  return res.data
}

// Razorpay ka checkout script dynamically load karta hai (ek hi baar)
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// Poora payment flow ek function mein wrap kiya — checkout kholna, response handle karna
export async function openRazorpayCheckout({ appointmentId, doctorName, onSuccess, onFailure }) {
  const scriptLoaded = await loadRazorpayScript()
  if (!scriptLoaded) {
    onFailure('Could not load payment gateway. Check your internet connection.')
    return
  }

  try {
    const orderRes = await createOrder(appointmentId)

    const options = {
      key: orderRes.keyId,
      amount: orderRes.order.amount,
      currency: orderRes.order.currency,
      name: 'JeevanCare',
      description: `Consultation with ${doctorName}`,
      order_id: orderRes.order.id,
      handler: async function (response) {
        try {
          await verifyPayment({
            appointmentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          onSuccess()
        } catch (err) {
          onFailure('Payment verification failed. Please contact support.')
        }
      },
      modal: {
        // Popup band hote hi (chahe payment hui ho ya cancel hui ho), hum
        // reconciliation check karte hain — agar 'handler' miss hua tha
        // (jaisa netbanking mein hota hai), yahan se payment status pakड़ liya jaayega
        ondismiss: async function () {
          try {
            const statusRes = await checkPaymentStatus(appointmentId)
            if (statusRes.appointment.paymentStatus === 'payment_paid') {
              onSuccess()
            } else {
              onFailure('Payment was not completed.')
            }
          } catch (err) {
            onFailure('Payment was cancelled.')
          }
        },
      },
      theme: { color: '#0d6efd' },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (err) {
    onFailure(err.response?.data?.message || 'Could not start payment')
  }
}