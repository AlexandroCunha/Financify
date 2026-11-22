const { schema, text, email, password } = require('./validator')

const signUp = schema({
  name: text({ max: 100 }),
  email: email(),
  password: password(),
})

const login = schema({
  email: email(),
  password: text({ max: 72, trim: false }),
})

const update = schema(
  {
    name: text({ max: 100 }),
    email: email(),
  },
  { partial: true },
)

const passwordChange = schema({
  current_password: text({ max: 72, trim: false }),
  new_password: password(),
})

module.exports = { signUp, login, update, passwordChange }
