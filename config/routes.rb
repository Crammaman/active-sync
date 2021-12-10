ActiveSync::Engine.routes.draw do
  put '/:model/:id', to: 'models#update'
  post '/:model', to: 'models#create'
end
