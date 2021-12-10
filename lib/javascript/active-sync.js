import Model from './model.js'
import CamelCase from 'camelcase'
import Pluralize from 'pluralize'
import SnakeCase from "snake-case";

export default class ActiveSync {

  static models = []

  // ActiveSync dynamically creates model classes when a new instance of it is created
  // Valid arguments are:
  // models:  Used to define custom model. Pass an array of classes in and they will be set up as ActiveSync models.
  //          It's expected that models passed in extend ActiveSync's Model class. They will then receive extra functions
  //          as per anything defined in the modelDescriptions argument (such as associations).
  //
  // modelDescriptions: An object that describes all the models for ActiveSync to create. If the model is not defined in
  //                    the model then an empty model is created. Then all the described associations are added to their
  //                    respective models.
  //                    IE { Customer: { hasMany: ['sites']}, Site: { belongsTo: 'customer' }
  //                    Will add a 'sites' method to the Customer class and a 'customer' method to Site.
  //

  constructor( args ){
    this._models = args.models || [];
    this.buildModels(args.modelDescriptions)
  }

  install( vue ){
    this._models.forEach((model)=> vue.prototype["$" + model.className] = model)
  }

  models(){
    return this._models
  }

  // Creates the models from the modelDescription arg passed in to the constructor
  buildModels(modelDescriptions){
    let modelNames = Object.keys(modelDescriptions || {});

    modelNames.forEach((modelName) => {
      if(!this._models.find((model) => model.className === modelName)){
        this._models.push(this.createModel(modelName))
      }
    })

    this._models.forEach((model) => {
      this.addBelongsToModel(modelDescriptions[model.className], model)
      this.addHasManyToModel(modelDescriptions[model.className], model)
    })
  }

  createModel(name){
    let modelClass = Model
    return eval(`(class ${name} extends modelClass { static className = '${name}' })`)
  }
  
  addBelongsToModel(modelDescription, model){
    ((modelDescription || {}).belongsTo || []).forEach((association) => {
      let associatedModel = this._models.find((model) => model.className === association)
      model[association] = function () {
        return associatedModel.find(this[association + '_id'])
      }
    });
  }
  
  addHasManyToModel(modelDescription, model){
    ((modelDescription || {}).hasMany || []).forEach((association) => {
      let associatedModel = this._models.find((model) => model.className === CamelCase(Pluralize.singular(association), {pascalCase: true}))
      model.prototype[association] = function () {
        let associationQuery = {}
        associationQuery[SnakeCase(model.className + 'Id')] = this.id
        return associatedModel.where(associationQuery)
      }
    });
  }
}



// Code for dynamically requesting Model names and associations.
//
// Object.keys( modelDescriptions ).forEach( ( modelName ) =>{
//   modelDescriptions[modelName].name = modelName
//   this.setupModel( modelDescriptions[modelName] )
// })

// var modelDescriptions = this.requestModelDescriptions()
// this._models.forEach( ( model ) => model.setAssociatedModels( this._models))
// args.afterSetup( this._models )
// requestModelDescriptions(){
//   var xmlHttp = new XMLHttpRequest()
//   xmlHttp.open( "GET", 'active_sync/models', false ) // false for synchronous request
//   xmlHttp.send( null )
//   return JSON.parse(xmlHttp.responseText)
// }