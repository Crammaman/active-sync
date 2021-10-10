module ActiveSync
  module Model
    extend ActiveSupport::Concern

    included do
      # after_update :sync_update
      after_commit :sync_change
    end

    def sync_change
      if sync_model?
        BroadcastChangeJob.perform_later(self)
      end
    end

    def sync_model?
      true
    end


    class_methods do

      def sync_model?
        true
      end

      def register_sync_subscription stream, filter
        @@sync_record_subscriptions[ self.name ] = {} if @@sync_record_subscriptions[ self.name ].nil?
        @@sync_record_subscriptions[ self.name ][ stream ] = filter
      end

      def sync_record_subscriptions
        @@sync_record_subscriptions[ self.name ] || {}
      end

      # #sync sets the #sync_record method that renders the hash to create the JSON object that is broadcast and sets
      # #sync_associations which returns a list of associations that are permitted to be broadcast for this model.
      # define these methods directly in your model if the record sent to the font end needs to be different to what's
      # available with the below configurations
      #
      # This can be passed the following options:
      #
      # Example use in Model:
      # sync :all_attributes, associations: [ :sites ]

      # ATTRIBUTE OPTIONS
      # Attributes are data that is sent in the actual sync data (this will always include the ID)

      # :all_attributes - sync data will have all attributes
      # :attributes - an array of symbols that will be called on the record and sent as attributes

      # ASSOCIATION OPTIONS
      # Associations are lazy loaded, data will not go with the record but if the front end has the association described
      # then records can be subscribed to through the association.

      # :all_associations - sync data will be associated
      # :associations - an array of symbols

      def sync *attributes
        define_method(:sync_record) do
          ActiveSync::Sync.sync_record(self, attributes)
        end
        define_method(:sync_associations) do
          ActiveSync::Sync.sync_associations(self, attributes)
        end
      end

      # Sync hash for all of self records
      def sync_all
      	self.all.map do |record|
          ActiveSync::Sync.sync_record record
        end
      end

      def sync_filtered filter
        self.where( filter ).map do |record|
          ActiveSync::Sync.sync_record record
        end
      end
    end
  end
end
