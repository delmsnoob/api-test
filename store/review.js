const store = require('@store')

// utilities
const CustomError = require('@utilities/custom-error')

const { makeQuery, raw } = require('@utilities/knex-helper')

// libs
const _isUndefined = require('lodash/isUndefined')
const _isEmpty = require('lodash/isEmpty')
const _isNil = require('lodash/isNil')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async list ({ filterBy, q, page, rows, sortBy, sort, isCount, status, adminId }) {
    const filterDictionary = {
      name: 'reviews.name'
    }

    const sortDictionary = {
      id: 'reviews.id'
    }

    try {
      const query = await store.knex('reviews')
        .groupBy('reviews.id')

        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,
            isCount
          })

          if (adminId) {
            knex.leftJoin('admins', 'admins.id', 'reviews.admin_id')
              .select({
                admin_id: 'reviews.admin_id',
                created_at: 'reviews.created_at'
              })
          }

          if (status === 'deleted') {
            knex.whereNotNull('reviews.deleted_at')
              .select({
                deleted_at: 'reviews.deleted_at'
              })
          } else if (status === 'all') {
            knex.whereNull('reviews.deleted_at')
              .select({
                updated_at: 'reviews.updated_at'
              })
          } else {
            knex.where('reviews.is_featured', 1)
          }

          if (isCount) {
            knex.select({ total: raw('COUNT(reviews.id)over()') }).first()
          } else {
            knex.select({
              id: 'reviews.id',
              name: 'reviews.name',
              position: 'reviews.position',
              review: 'reviews.review',
              is_featured: 'reviews.is_featured'
            })
          }
        })

      return query
    } catch (error) {
      console.log(error)
      throw new CustomError(error)
    }
  },

  async store (payload) {
    const errDefaults = { name: 'CREATE_ERROR', status: 400 }

    const fillables = new Set([
      'name',
      'position',
      'review',
      'is_featured',
      'admin_id'
    ])
    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('reviews').insert(data)

      return id
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE', info: error.sqlMessage })
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new CustomError({ ...errDefaults, message: 'UNKNOWN_DATA' })
      }

      console.log(error)
      throw error
    }
  },

  async modify (id, payload) {
    const errDefaults = { name: 'MODIFY_ERROR', status: 400 }
    try {
      const dictionary = {
        name: 'reviews.name',
        review: 'reviews.review',
        position: 'reviews.position',
        is_featured: 'reviews.is_featured',
        deleted_at: 'reviews.deleted_at'
      }

      const updateData = {}
      for (const key in payload) {
        const updateValue = payload[key]
        const currDictionary = dictionary[key]

        if (_isUndefined(updateValue) || !currDictionary) {
          continue
        }

        updateData[currDictionary] = updateValue
      }

      if (_isEmpty(updateData)) {
        return
      }

      return store.knex('reviews')
        .whereIn('reviews.id', id)
        .update(updateData)
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE NAME TAG', info: error.sqlMessage })
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new CustomError({ ...errDefaults, message: 'UNKNOWN_DATA' })
      }
      throw error
    }
  }
}
