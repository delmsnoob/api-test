const router = require('koa-router')()

const Login = require('@store/login')

module.exports = router
  .prefix('/login')

  .post('/', async (ctx, next) => {
    try {
      ctx.body = await Login.log({
        loginId: ctx.request.body.loginId,
        password: ctx.request.body.password
      })
    } catch (err) {
      ctx.throw(err)
    }
  })
