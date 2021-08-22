class BroadcastChangeJob < ApplicationJob
  queue_as :default

  def perform record
    SyncSubscriptions.all.each do | subscription |
      unless filter[:IsReference]

        match = true
        filter.each do | key, value |
          unless self.send( key ) == value
            match = false
            break
          end
        end

        ActionCable.server.broadcast( stream, ActiveSync::Sync.sync_record( self ) ) if match
      end
    end
  end
end
