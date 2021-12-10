import Axios from 'axios'
import SnakeCase from 'snake-case'
import CamelCase from 'camelcase'
import Pluralize from 'pluralize'

import Actioncable from "actioncable"

import Util from './util'

export default class Model {

  static recordsLoaded = false
  static urlPathBase = 'active_sync/'

  static consumer = Actioncable.createConsumer()
  
  constructor(args){
    if(!args.id) throw 'Can not create record without an id'
    if(this.constructor.records[args.id]){
      this.constructor.records[args.id].setProperties(args)
    } else {
      this.setProperties(args)
      this.constructor.records[this.id] = this
    }
  }

  setProperties(args){
    Object.keys(args).forEach((property)=>{
      this[property] = args[property]
    })
  }

  static get records(){
    if(!this.recordsObject) this.recordsObject = {}
    return this.recordsObject
  }

  static get all(){
    return this.loadOrSearch()
  }

  static modelUrlPath(singular = false){
    if(singular) {
      return this.urlPathBase + SnakeCase(this.className)
    } else {
      return this.urlPathBase + SnakeCase(Pluralize(this.className))
    }
  }

  static find(id){
    return new Promise((resolve,reject)=>{
      if(!this.records[id]){
        resolve(this.loadRecords({ id: id }).then(()=> this.records[id]))
      } else {
        resolve(this.records[id])
      }
    })
  }

  static where(args){
    return this.loadOrSearch(Util.snakeCaseKeys(args))
  }

  static through(model, args){
    return model.loadRecords(args).then(()=>{
      var linkingIds = [...new Set(model.searchRecords(args).map((record)=> record[CamelCase(this.className)+'Id']))]
      return this.where({id: linkingIds})
    })
  }

  static create(data){
    return Axios.post(this.modelUrlPath(), data)
      .then((response) => {
        new this(response.data)
        return response
      })
  }

  static update(data){
    return Axios.put( `${this.modelUrlPath(true)}/${data.id}`, data)
        .then((response) => {
          // new this(response.data)
          return response
        })
  }

  //Intended as private below here
  static loadOrSearch(args={}){
    let subscriptionParams = { channel: 'ModelsChannel', model: this.className, filter: args }
    if(this.consumer.subscriptions.findAll(JSON.stringify(subscriptionParams)).length === 0){
      return this.loadRecords(subscriptionParams)
    } else {
      return new Promise((resolve, reject) => { resolve(this.searchRecords(args)) } )
    }
  }
  
  static loadRecords(args){
    return new Promise((resolve, reject) => {
      this.consumer.subscriptions.create(args, {
        received: (data) => {
          let records = []
          data.forEach((datum) => {
            records.push(new this(datum))
          })
          resolve(records)
        }
      })
    })
  }

  static searchRecords(args){
    var results = []
    Object.keys(this.records).forEach((id)=>{
      // Its a match if none of the keys don't match (IE terminates when a property doesn't match), if a property is an array it still matches if the corresponding arg is within it.
      var match = !Object.keys(args).some((arg)=> {
        return !(this.records[id][arg] == args[arg] ||
            (Array.isArray(this.records[id][arg]) && this.records[id][arg].some((i)=> typeof i == 'object' && i.id == args[arg])) ||
            (Array.isArray(args[arg]) && args[arg].some((a)=> typeof a == 'object' && a.id == this.records[id][arg] || a == this.records[id][arg]))
        )
      })
      if(match) {
        results.push(this.records[id])
      }
    })
    return results
  }
}