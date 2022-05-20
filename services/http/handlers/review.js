const router = require('koa-router')()

const Reviews = require('@store/review')

const Joi = require('joi')
const _get = require('lodash/get')

const authentication = require('@middleware/authentication')

module.exports = router
  .prefix('/reviews')

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

      const count = await Reviews.list({ ...params, isCount: true })

      const list = await Reviews.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    const schema = Joi.object({
      position: Joi.required(),

      name: Joi.string()
        .lowercase()
        .required(),

      is_featured: Joi.required(),

      review: Joi.string()
        .lowercase()
        .required()
    })

    try {
      const request = await schema.validateAsync(ctx.request.body)

      ctx.body = await Reviews.store({
        admin_id: ctx.user.id,
        review: request.review,
        position: request.position,
        name: request.name,
        is_featured: request.is_featured
      })
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required(),
      position: Joi.required(),
      name: Joi.string()
        .lowercase()
        .required(),
      is_featured: Joi.required(),
      review: Joi.string()
        .required(),
      admin_id: Joi.number()
        .required()
    })

    try {
      delete ctx.request.body.created_at
      delete ctx.request.body.updated_at
      delete ctx.request.body.deleted_at

      const request = await schema.validateAsync(ctx.request.body)

      ctx.body = await Reviews.modify([request.id], {
        name: request.name,
        review: request.review,
        position: request.position,
        is_featured: request.is_featured
      })
    } catch (err) {
      console.log(err)

      ctx.throw(err)
    }
  })

  .delete('/', async ctx => {
    try {
      ctx.body = await Reviews.modify(ctx.request.body, {
        deleted_at: new Date()
      })

      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/restore/', async ctx => {
    try {
      ctx.body = await Reviews.modify(ctx.request.body, {
        deleted_at: null
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })
