-- Excluir os 3 planos específicos identificados
DELETE FROM custom_plans 
WHERE id IN (
  '3058eec7-674d-47ec-9b2c-7f2def0998b0',
  '56669fa2-eacc-4a54-a68b-874f8ef3d4ca', 
  '18834207-f205-454d-8d2d-2e99bb3abdda'
);