const store = require('@store')
const Content = require('@store/content')

// utilities
const CustomError = require('@utilities/custom-error')

// libs
const _isUndefined = require('lodash/isUndefined')
const _isEmpty = require('lodash/isEmpty')
const _isNil = require('lodash/isNil')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async default () {
    try {
      const settingDefault = await store.knex({ sd: 'setting_default' })
        .select({
          id: 'sd.id',
          name: 'sd.name',
          setting: 'sd.setting',
          deleted_at: 'sd.deleted_at',
          created_at: 'sd.created_at',
          updated_at: 'sd.updated_at'
        })

      for (const key in settingDefault) {
        if (Object.hasOwnProperty.call(settingDefault, key)) {
          const element = settingDefault[key]

          element.setting = JSON.parse(element.setting)
        }
      }
      return settingDefault
    } catch (error) {
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
        title: payload.title,
        content: payload.content,
        url: payload.url,
        admin_id: payload.admin_id
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
        name: 'sd.name',
        setting: 'sd.setting'
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

      const query = await store.knex({ sd: 'setting_default' })
        .where('sd.id', id)
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
