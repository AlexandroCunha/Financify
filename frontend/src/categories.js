// Expense categories, most used first: the first ones get the most distinct colours.
const EXPENSES = [
  ['Home', '#12485A'],
  ['Groceries', '#2E8FA0'],
  ['Transport', '#C9892E'],
  ['Leisure', '#FF7A5C'],
  ['Subscriptions and Services', '#8AA3AC'],
  ['Food', '#6C8EAD'],
  ['Health', '#B5546B'],
  ['Education', '#5B8C5A'],
  ['Personal Care', '#B7D4DA'],
  ['Family', '#9C7FB8'],
  ['Pets', '#A97C50'],
  ['Gifts', '#D98E73'],
  ['Clothing', '#4F6D7A'],
  ['Other Expenses', '#9AA9AF'],
]

const INCOME = [
  ['Salary', '#0B6E7A'],
  ['Sales', '#4C9F8E'],
  ['Other Income', '#7FB8AE'],
]

const COLOURS = new Map([...EXPENSES, ...INCOME])
const INCOME_NAMES = new Set(INCOME.map(([name]) => name))

export const OTHER_COLOUR = '#B7D4DA'

// A category has the same colour in the chart, in the list and in the form.
export const categoryColour = (name) => COLOURS.get(name) ?? '#8AA3AC'

// The API does not mark a category's type; these three are the income ones.
export const categoriesOfType = (categories, type) =>
  categories.filter((c) => INCOME_NAMES.has(c.name) === (type === 'income'))
