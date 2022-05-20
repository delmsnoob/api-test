const store = require('@store')
const Seo = require('@store/seo')

// utilities
const CustomError = require('@utilities/custom-error')

const { makeQuery, raw } = require('@utilities/knex-helper')

// libs
const _isNil = require('lodash/isNil')
const _isEmpty = require('lodash/isEmpty')
const _isUndefined = require('lodash/isUndefined')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async list ({ filterBy, q, page, rows, sortBy, sort, isCount, status, adminId }) {
    const filterDictionary = {
      name: 'tags.name'
    }

    const sortDictionary = {
      id: 'tags.id'
    }

    try {
      const query = await store.knex('tags')
        .groupBy('tags.id')
        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,
            isCount
          })

          if (status === 'deleted') {
            knex.whereNotNull('tags.deleted_at')
              .select({
                deleted_at: 'tags.deleted_at'
              })
          } else {
            knex.whereNull('tags.deleted_at')
              .select({
                updated_at: 'tags.updated_at'
              })
          }

          if (adminId) {
            knex.leftJoin('admins', 'admins.id', 'tags.admin_id')
              .select({
                admin_id: 'tags.admin_id',
                created_at: 'tags.created_at'
              })
          }

          if (isCount) {
            knex.select({ total: raw('COUNT(tags.id)over()') }).first()
          } else {
            knex.select({
              id: 'tags.id',
              name: 'tags.name'
            })
          }
        })

      return query
    } catch (error) {
      console.log(error)
      throw new CustomError(error)
    }
  },

  async check (adminId, payload) {
    try {
      const query = await store.knex('tags')
        .select({
          name: 'tags.name'
        })

      const queryTag = query.map(x => x.name)

      if (payload.length > 0) {
        const newTag = payload.filter(item => !queryTag.includes(item))

        if (newTag.length > 0) {
          const finalListTag = newTag.map(x => {
            return {
              name: x,
              admin_id: adminId
            }
          })

          await this.store(finalListTag)
        }
      }

      await Seo.store(query)

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
      'admin_id'
    ])

    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('tags').insert(data)

      return id
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE NAME TAG', info: error.sqlMessage })
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
        name: 'tags.name',
        deleted_at: 'tags.deleted_at'
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

      const query = await store.knex('tags')
        .whereIn('tags.id', id)
        .update(updateData)

      return query
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
