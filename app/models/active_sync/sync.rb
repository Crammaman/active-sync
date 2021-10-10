module ActiveSync
  class Sync
    #Hash used in all general sync communication for a given model.
    def self.sync_record record, args
      args.reduce({}) do |hash, option|
        case option
        when :all_attributes_and_associations, :all_attributes
          hash.merge(model.attributes)
        when ->(option){ option.is_a?(Hash) }
          option[:attributes]&.each { |attribute| hash[attribute] = record.call(attribute) }
        else
          raise "Unknown sync record option #{option.inspect}"
        end
        hash
      end
    end

    def self.sync_associations record, args
      args.reduce([]) do |associations, option|
        case option
        when :all_attributes_and_associations, :all_attributes
          associations + record.class.reflect_on_all_associations.map { |a| a.name }
        when ->(option){ option.is_a?(Hash) }
          associations + option[:associations]
        else
          raise "Unknown sync associations option #{option.inspect}"
        end
        associations
      end
    end
  end
end
