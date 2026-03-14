const ITERATIONS = 100_000
const HASH_ALGO = 'SHA-256'

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes.buffer
}

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const saltBuffer = crypto.getRandomValues(new Uint8Array(16))
  const salt = bufferToHex(saltBuffer)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    256
  )

  return { hash: bufferToHex(bits), salt }
}

export async function verifyPassword(password, storedHash, storedSalt) {
  const encoder = new TextEncoder()
  const saltBuffer = new Uint8Array(hexToBuffer(storedSalt))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    256
  )

  return bufferToHex(bits) === storedHash
}
