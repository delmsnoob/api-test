const store = require('@store')

// utilities
const CustomError = require('@utilities/custom-error')

// libs
const _isUndefined = require('lodash/isUndefined')
const _isEmpty = require('lodash/isEmpty')
const _isNil = require('lodash/isNil')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async list (id) {
    try {
      const query = await store.knex({ con: 'contents' })
        .select({
          id: 'con.id',
          menu_id: 'con.menu_id',
          title: 'con.title',
          description: 'con.description',
          image: 'con.image'
        })
        .first()
        .modify(knex => {
          knex.where('con.menu_id', id)
        })

      const list = await query
      if (list) {
        if (list.image) {
          list.image = list.image.replace(/\\/g, '/')
        }
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
      'menu_id',
      'title',
      'description',
      'image'
    ])

    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('contents').insert(data)

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

  async modify (payload) {
    const errDefaults = { name: 'MODIFY_ERROR', status: 400 }
    try {
      const dictionary = {
        title: 'con.title',
        description: 'con.description',
        image: 'con.image'
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

      const query = await store.knex({ con: 'contents' })
        .whereIn('con.id', [payload.id])
        .update(updateData)

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
