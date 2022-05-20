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
      title: 'abs.title'
    }

    const sortDictionary = {
      id: 'abs.id'
    }

    try {
      const query = await store.knex({ abs: 'about_us' })
        .groupBy('abs.id')
        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,
            isCount
          })

          if (status === 'deleted') {
            knex.whereNotNull('abs.deleted_at')
              .select({
                deleted_at: 'abs.deleted_at'
              })
          } else if (status === 'all') {
            knex.whereNull('abs.deleted_at')
              .select({
                updated_at: 'abs.updated_at'
              })
          }

          if (adminId) {
            knex.leftJoin('admins', 'admins.id', 'abs.admin_id')
              .select({
                admin_id: 'abs.admin_id',
                created_at: 'abs.created_at'
              })
          }

          if (isCount) {
            knex.select({ total: raw('COUNT(abs.id)over()') }).first()
          } else {
            knex.select({
              id: 'abs.id',
              title: 'abs.title',
              content: 'abs.content'
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
      'title',
      'content',
      'admin_id'
    ])

    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('about_us').insert(data)

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
    try {
      const dictionary = {
        title: 'abs.title',
        content: 'abs.content',
        deleted_at: 'abs.deleted_at'
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

      const query = await store.knex({ abs: 'about_us' })
        .whereIn('abs.id', id)
        .update(updateData)

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
