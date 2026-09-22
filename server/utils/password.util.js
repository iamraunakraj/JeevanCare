import bcrypt from 'bcryptjs'
export async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(plainPassword, salt)   
}
// Login ke time — user ne jo password type kiya, use stored hash se compare karta hai
export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}