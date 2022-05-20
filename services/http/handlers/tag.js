const router = require('koa-router')()

const Tag = require('@store/tag')
const authentication = require('@middleware/authentication')

const Joi = require('joi')
const _get = require('lodash/get')

module.exports = router
  .prefix('/tag')

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

      const count = await Tag.list({ ...params, isCount: true })

      const list = await Tag.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    try {
      ctx.body = await Tag.check(ctx.user.id, ctx.request.body)
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required(),
      name: Joi.string()
        .required(),
      admin_id: Joi.number()
        .required()
    })

    try {
      const request = await schema.validateAsync(ctx.request.body)

      ctx.body = await Tag.modify([request.id], {
        name: request.name
      })
    } catch (err) {
      ctx.throw(err)
    }
  })

  .delete('/', async ctx => {
    try {
      ctx.body = await Tag.modify(ctx.request.body, {
        deleted_at: new Date()
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/restore/', async ctx => {
    try {
      ctx.body = await Tag.modify(ctx.request.body, {
        deleted_at: null
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })
