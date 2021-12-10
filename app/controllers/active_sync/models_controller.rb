module ActiveSync
  class ModelsController < ApplicationController

    def update
      #TODO some oversite on what can be edited for sync records
      model.find(params[:id]).update(params.permit(model.sync_attributes))
      head :no_content
    end

    def create
      #TODO some oversite on what can be created for sync records
      render json: model.create(params.permit(model.sync_attributes)).id
    end

    private
    def model
      m = params[:model].singularize.camelize.safe_constantize || params[:model].camelize.safe_constantize
      raise "Cannot edit #{params[:model]} as it is not a sync model" unless m.sync_model?
      m
    end
  end
end
