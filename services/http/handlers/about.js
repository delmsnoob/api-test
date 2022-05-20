const router = require('koa-router')()
const About = require('@store/about')

const Joi = require('joi')
const _get = require('lodash/get')

const authentication = require('@middleware/authentication')

module.exports = router
  .prefix('/about')

  .use(authentication())

  .get('/', async ctx => {
    try {
      const query = ctx.request.query
      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status,
        adminId: ctx.user.id
      }

      const count = await About.list({ ...params, isCount: true })

      const list = await About.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    const schema = Joi.object({

      title: Joi.string()
        .required(),

      content: Joi.string()
        .required()
    })

    try {
      const request = await schema.validateAsync(ctx.request.body)

      ctx.body = await About.store({
        admin_id: ctx.user.id,
        title: request.title,
        content: request.content
      })
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required(),

      admin_id: Joi.number()
        .required(),

      title: Joi.string()
        .required(),

      content: Joi.string()
        .required()

    })

    try {
      const request = await schema.validateAsync(ctx.request.body)

      ctx.body = await About.modify([request.id], {
        title: request.title,
        content: request.content
      })
    } catch (err) {
      ctx.throw(err)
    }
  })

  .delete('/', async ctx => {
    try {
      ctx.body = await About.modify(ctx.request.body, {
        deleted_at: new Date()
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/restore', async ctx => {
    try {
      ctx.body = await About.modify(ctx.request.body, {
        deleted_at: null
      })

      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })
