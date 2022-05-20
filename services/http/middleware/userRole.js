/**
 Must be used after `authentication` middleware

Usage

const userRole = require('@middleware/userRole')

.use(userRole('admin'))
.get('/', async ctx => {
  ...
})

.use(userRole(['admin', 'client']))
.get('/', async ctx => {
  ...
})

.get('/', userRole('client'), async ctx => {
  ...
})

.get('/', userRole(['client', 'admin']), async ctx => {
  ...
})

 */
const _castArray = require('lodash/castArray')

module.exports = role => { // args => options
  return async (ctx, next) => { // logic
    try {
      if (!ctx.user) {
        ctx.throw(401)
      }

      const isValidUser = _castArray(role).includes(ctx.user.role)
      if (!isValidUser) {
        ctx.throw(403)
      }

      await next() // => proceed to next route
    } catch (error) {
      ctx.throw(error)
    }
  }
}
