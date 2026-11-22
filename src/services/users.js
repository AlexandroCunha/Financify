const bcrypt = require('bcrypt')
const users = require('../repositories/users')
const { conflict, notFound, badRequest } = require('../utils/errors')

const HASH_COST = 10
const EMAIL_TAKEN = 'An account with this e-mail already exists.'

const isEmailTaken = (error) => error.code === '23505' && error.constraint === 'users_email_key'

async function signUp({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, HASH_COST)
  try {
    return await users.create({ name, email, passwordHash })
  } catch (error) {
    if (isEmailTaken(error)) throw conflict(EMAIL_TAKEN)
    throw error
  }
}

async function updateProfile(id, data) {
  let user
  try {
    user = await users.update(id, data)
  } catch (error) {
    if (isEmailTaken(error)) throw conflict(EMAIL_TAKEN)
    throw error
  }
  if (!user) throw notFound('User not found.')
  return user
}

async function changePassword(id, { current_password, new_password }) {
  const currentHash = await users.findPassword(id)
  const matches = currentHash !== null && (await bcrypt.compare(current_password, currentHash))
  if (!matches) throw badRequest({ current_password: 'is incorrect' }, 'The current password is incorrect.')
  await users.updatePassword(id, await bcrypt.hash(new_password, HASH_COST))
}

async function deleteAccount(id) {
  await users.remove(id)
}

module.exports = { signUp, updateProfile, changePassword, deleteAccount }
