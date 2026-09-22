import Razorpay from 'razorpay'

let razorpayInstance = null

// Function ke andar banaya — isse yeh sirf tab chalega jab actually zaroorat
// hogi (order create karte waqt), tab tak dotenv.config() chal chuka hoga
function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

export default getRazorpay