module.exports = () => {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      ctx.status = error.status || 500
      ctx.body = {
        name: error.name,
        message: error.message,
        params: error.params
      }
    }
  }
}
