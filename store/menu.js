const store = require('@store')
const Content = require('@store/content')

// utilities
const CustomError = require('@utilities/custom-error')
const { makeQuery, raw, jsonObject } = require('@utilities/knex-helper')

// libs
const _isUndefined = require('lodash/isUndefined')
const _isEmpty = require('lodash/isEmpty')
const _isNil = require('lodash/isNil')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async list ({ filterBy, q, page, rows, sortBy, sort, isCount, status, id, adminId }) {
    const filterDictionary = {
      name: 'menu.name'
    }

    const sortDictionary = {
      id: 'menu.id'
    }

    try {
      const query = await store.knex('menu')
        .leftJoin({ con: 'contents' }, 'con.menu_id', 'menu.id')
        .groupBy('menu.id')
        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,
            isCount
          })

          if (id) {
            knex.where('con.menu_id', id)
          }

          if (adminId) {
            knex.leftJoin('admins', 'admins.id', 'menu.admin_id')
              .select({
                admin_id: 'menu.admin_id',
                created_at: 'menu.created_at'
              })
          }

          if (status === 'deleted') {
            knex.whereNotNull('menu.deleted_at')
              .select({
                deleted_at: 'menu.deleted_at'
              })
          } else if (status === 'all') {
            knex.whereNull('menu.deleted_at')
              .select({
                updated_at: 'menu.updated_at'
              })
          }

          if (isCount) {
            knex.select({ total: raw('COUNT(menu.id)over()') }).first()
          } else {
            knex.select({
              id: 'menu.id',
              name: 'menu.name',
              content: raw(`JSON_ARRAYAGG(${jsonObject({
                id: 'con.id',
                title: 'con.title',
                description: 'con.description',
                image: 'con.image'
              })})`)
            })
          }
        })

      const list = await query
      if (list) {
        for (let i = 0; i < list.length; i++) {
          const element = list[i]

          element.content = JSON.parse(element.content)
          if (element.content[0]) {
            element.content = element.content[0]

            if (element.content.image) {
              element.content.image = element.content.image.replace(/\\/g, '/')
            }
          }
        }
      }

      if (id && list) {
        return list[0]
      }

      if (isCount) {
        return list
      }

      return list
    } catch (error) {
      console.log(error)
      throw new CustomError(error)
    }
  },

  async store (payload) {
    const errDefaults = { name: 'CREATE_ERROR', status: 400 }

    const fillables = new Set([
      'admin_id',
      'name'
    ])

    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('menu').insert(data)

      await Content.store({
        menu_id: id,
        ...payload.content
      })

      return id
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE NAME MENU', info: error.sqlMessage })
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
        name: 'menu.name',
        deleted_at: 'menu.deleted_at'
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

      const query = await store.knex('menu')
        .whereIn('menu.id', id)
        .update(updateData)

      await Content.modify(payload.content)

      return query
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE NAME MENU', info: error.sqlMessage })
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new CustomError({ ...errDefaults, message: 'UNKNOWN_DATA' })
      }

      console.log(error)
      throw error
    }
  }
}
