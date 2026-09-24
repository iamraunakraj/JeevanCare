import { useState, useEffect } from 'react'

// Value ko turant nahi, balki 'delay' milliseconds ke baad update karta hai —
// agar us dauraan value phir badal jaaye, purana timer cancel karke naya shuru hota hai
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer) // cleanup — purana timer cancel
  }, [value, delay])

  return debouncedValue
}