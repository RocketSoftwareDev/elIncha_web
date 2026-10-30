// Genera los dos secretos del admin para cargarlos en Netlify.
// Uso:  pnpm clave-admin
// Pide la contraseña sin mostrarla y NO la guarda en ningún archivo.

import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline'

function preguntarOculto(texto) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = s => { if (s.includes(texto)) rl.output.write(s) }
    rl.question(texto, r => { rl.close(); process.stdout.write('\n'); resolve(r) })
  })
}

const clave = await preguntarOculto('Contraseña nueva del admin (mín. 12 caracteres): ')
if (clave.length < 12) {
  console.error('Muy corta: usa al menos 12 caracteres.')
  process.exit(1)
}
const repetida = await preguntarOculto('Repítela: ')
if (clave !== repetida) {
  console.error('No coinciden.')
  process.exit(1)
}

// Mismo formato que src/lib/auth/clave.ts
const sal = randomBytes(16)
const hash = scryptSync(clave.normalize('NFC'), sal, 32, { N: 16384, r: 8, p: 1 })

console.log('\nCopia estos valores en Netlify → Site configuration → Environment variables')
console.log('(marca «Contains secret values»). No los guardes en ningún archivo del repo.\n')
console.log(`ADMIN_PASSWORD_HASH = scrypt$16384$8$1$${sal.toString('base64')}$${hash.toString('base64')}`)
console.log(`SESSION_SECRET      = ${randomBytes(48).toString('base64url')}`)
console.log('\nSESSION_SECRET solo hace falta crearlo una vez. Cambiar la contraseña cierra todas las sesiones.')
