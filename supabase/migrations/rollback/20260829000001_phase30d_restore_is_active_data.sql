-- ==============================================================================
-- TARGETED DATA RESTORATION SCRIPT: Pre-Migration is_active Restoration
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Restores the exact 27 opportunities to is_active = true in the event of a rollback.
-- ==============================================================================

UPDATE opportunities
SET is_active = true
WHERE id IN (
  '9cbfc6e9-d64c-44ab-b0fd-affc7340f82a',
  '01148ddc-2800-4491-9118-3e15045933ad',
  'f02c15c3-f741-49b7-a889-9f849728ac89',
  '3a6c73f0-f6d9-4a18-9052-75f0c19e3265',
  '13838ec5-c9cc-447c-8584-cf4703ecb888',
  '20cee3a9-91cc-4099-918b-66904672ff7c',
  '743d1fc6-541e-4f42-bfb6-36273f8722f3',
  'c2e46d15-cf60-4a3c-a5c7-bd5832ce3db0',
  '6141e576-4827-4282-8f4d-85a72d89396f',
  'ae2ad59d-5487-4665-a999-d54a2b4bde42',
  'a1db2115-c2c8-49d3-9002-c01eb3f6aa75',
  'dea5ab20-46e1-4ece-b66e-2648ff0a3d0e',
  '2fc74e2c-cae6-4f4a-bec4-b1368922e735',
  '76107d96-2985-459b-aa54-308e81cd51cc',
  '17f0fd43-c801-48d9-86bc-54548efa2610',
  '28099481-5e93-4260-acbf-ccc878ce0525',
  '6d6804c2-7db1-43e2-b637-f0ac596391c5',
  '0fa96ba1-3aee-4b5e-aa75-b8d84e6adbcb',
  '0aa38d2d-73cc-4373-a143-4bcae7e4fd08',
  '568d1845-c6ed-415d-80aa-45df287d4b5d',
  'f47297b5-b8f2-4bc2-9c4e-9c4ee335ad13',
  '964ae0b1-5854-408f-8f07-e4ea099f765d',
  '1121467e-cb3d-48c0-9665-a065601bb038',
  'e5dd24b6-ffa8-4f35-87ad-bd4db623c692',
  '377fcde4-23f2-4fbf-bdc4-333a9f4e6075',
  'eb0f29fa-63e0-41c5-a1e1-4864e6b534a8',
  '566d22dc-fa60-4619-8f8e-ea7ffc65df4e'
);
