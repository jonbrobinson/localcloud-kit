-- Grant the default user permission to use named collections (e.g. msk_cluster used by Kafka engine tables).
-- ClickHouse 23.x+ requires explicit NAMED COLLECTION grants even for XML-defined collections.
GRANT NAMED COLLECTION ON msk_cluster TO default;
