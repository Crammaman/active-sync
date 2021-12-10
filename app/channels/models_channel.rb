# Rails currently doesn't allow namespacing channels in an engine
# module ActiveSync
  class ModelsChannel < ActionCable::Channel::Base
    # To change the data sent implement sync_record in the respective model

    def subscribed
      transmit(subscription_model.where(params[:filter]).map(&:sync_record))
      stream_from params[:model], coder: ActiveSupport::JSON do |message|
        if (params[:filter].to_a - message.to_a).blank?
          transmit([message])
        end
      end
    end

    def unsubscribed
      # Any cleanup needed when channel is unsubscribed
    end

    private

    def subscription_model
      model = params[:model].singularize.camelize.constantize
      raise "Model '#{params[:model]}' is not set up for syncing model" unless model.sync_model?
      model
    end
  end
# end
