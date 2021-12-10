class BroadcastChangeJob < ApplicationJob
  queue_as :active_sync

  include ActionCable::Channel::Broadcasting

  def perform record
    ActionCable.server.broadcast(record.class.name, record.sync_record)
  end
end
