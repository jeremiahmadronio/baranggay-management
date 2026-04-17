export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Matches format: +63 XXX XXX XXXX
  return /^\+63 \d{3} \d{3} \d{4}$/.test(phone)
}

export const validateUsername = (username: string): boolean => {
  // Alphanumeric and underscore only
  return /^[a-zA-Z0-9_]+$/.test(username)
}

export const formatPhoneInput = (value: string): string => {
  let cleaned = value.replace(/[^\d+]/g, '')

  if (!cleaned.startsWith('+63')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+63' + cleaned.substring(1)
    } else if (cleaned.startsWith('63')) {
      cleaned = '+' + cleaned
    } else if (cleaned.length > 0 && cleaned !== '+') {
      cleaned = '+63' + cleaned
    }
  }

  const match = cleaned.match(/^(\+63)(\d{0,3})(\d{0,3})(\d{0,4})$/)
  if (match) {
    let formatted = match[1]
    if (match[2]) formatted += ' ' + match[2]
    if (match[3]) formatted += ' ' + match[3]
    if (match[4]) formatted += ' ' + match[4]
    return formatted
  }

  return cleaned.substring(0, 17) 
}
