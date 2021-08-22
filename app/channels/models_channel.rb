# Rails currently doesn't allow namespacing channels in an engine
# module ActiveSync
  class ModelsChannel < ActionCable::Channel::Base
    # For providing DashData with data from rails models
    # To change the data sent (like reducing how much is sent)
    # implement broadcast_model in the respective modelc

    def subscribed
      subscribe_models
    end

    def unsubscribed
      # Any cleanup needed when channel is unsubscribed
    end

    private
    def subscribe_models
      if filter.nil?

        stream_from "#{subscription_model.name}_All"
        transmit( subscription_model.sync_all )

      else

        subscription_model.register_sync_subscription "#{subscription_model.name}_#{checksum}", filter
        stream_from "#{subscription_model.name}_#{checksum}"

        # TODO ensure that params are safe to pass to the model then register for syncing to.
        transmit( subscription_model.sync_filtered( filter.to_h ) )

      end
    end

    def subscription_model
      model = params[:model].camelize.constantize
      model.sync_model? ? model : raise "Model '#{params[:model]}' is not a registered sync model"
    end

    def model_association
      ActiveSync::Sync.get_model_association( subscription_model, filter[:association_name] )
    end

    def checksum
      # A checksum is generated and used in the stream name so all of the same filtered subscriptions should be on the same Stream
      Digest::MD5.hexdigest( Marshal::dump( filter ) )
    end
  end
# end
