-- KayArt - donnees de test catalogue.
-- A lancer dans Supabase SQL Editor apres avoir synchronise le schema Prisma.
-- Le script est relancable: il met a jour les memes slugs/SKU et remplace leurs attributs.

begin;

insert into categories (slug, name, description, position, is_active, updated_at)
values
  ('pagaies', 'Pagaies', 'Pagaies carbone neuves fabriquees a l''atelier.', 1, true, now()),
  ('sur-mesure', 'Sur mesure', 'Modeles personnalisables et fabrications a la demande.', 2, true, now()),
  ('imparfaits', 'Imparfaits', 'Pieces neuves avec defaut visuel documente.', 3, true, now()),
  ('reparation', 'Reparation', 'Diagnostics et services de reparation carbone.', 4, true, now())
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position,
  is_active = excluded.is_active,
  updated_at = now();

insert into products (
  category_id,
  name,
  slug,
  sku,
  short_description,
  description,
  condition,
  availability,
  price_cents,
  compare_at_price_cents,
  currency,
  stock_quantity,
  is_featured,
  is_reservable,
  is_customizable,
  published_at,
  updated_at
)
values
  (
    (select id from categories where slug = 'pagaies'),
    'Pagaie carbone sprint',
    'pagaie-carbone-sprint',
    'DEMO-PAG-SPRINT',
    'Pagaie neuve nerveuse pour sorties rapides.',
    'Pagaie carbone neuve, legere et reactive, pensee pour les pratiquants qui veulent une reponse directe sur l''eau.',
    'new',
    'available',
    12000,
    null,
    'EUR',
    6,
    true,
    false,
    false,
    now(),
    now()
  ),
  (
    (select id from categories where slug = 'sur-mesure'),
    'Pagaie marathon sur mesure',
    'pagaie-marathon-sur-mesure',
    'DEMO-PAG-MARATHON',
    'Modele personnalisable fabrique a la demande.',
    'Pagaie carbone ajustee au gabarit, au niveau et au style de navigation du client.',
    'new',
    'made_to_order',
    null,
    null,
    'EUR',
    null,
    true,
    false,
    true,
    now(),
    now()
  ),
  (
    (select id from categories where slug = 'pagaies'),
    'Protection de pale carbone',
    'protection-pale-carbone',
    'DEMO-ACC-PROTECTION',
    'Accessoire simple pour proteger une pale.',
    'Protection legere pour limiter les petits impacts et prolonger la duree de vie de la pale.',
    'new',
    'available',
    3900,
    4900,
    'EUR',
    14,
    false,
    false,
    false,
    now(),
    now()
  ),
  (
    (select id from categories where slug = 'reparation'),
    'Diagnostic reparation carbone',
    'diagnostic-reparation-carbone-demo',
    'DEMO-SRV-DIAG',
    'Analyse atelier avec retour personnalise.',
    'Service de diagnostic pour evaluer une fissure, un choc ou une renovation carbone avant intervention.',
    'service',
    'available',
    4500,
    null,
    'EUR',
    null,
    false,
    false,
    false,
    now(),
    now()
  ),
  (
    (select id from categories where slug = 'pagaies'),
    'Prototype pale large',
    'prototype-pale-large',
    'DEMO-PROTO-LARGE',
    'Produit brouillon pour tester le statut admin.',
    'Prototype interne non visible cote boutique, utile pour tester les filtres et les actions admin.',
    'new',
    'draft',
    9800,
    null,
    'EUR',
    2,
    false,
    false,
    false,
    null,
    now()
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  sku = excluded.sku,
  short_description = excluded.short_description,
  description = excluded.description,
  condition = excluded.condition,
  availability = excluded.availability,
  price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents,
  currency = excluded.currency,
  stock_quantity = excluded.stock_quantity,
  is_featured = excluded.is_featured,
  is_reservable = excluded.is_reservable,
  is_customizable = excluded.is_customizable,
  published_at = excluded.published_at,
  updated_at = now();

insert into products (
  base_product_id,
  category_id,
  name,
  slug,
  sku,
  short_description,
  description,
  defect_description,
  condition,
  availability,
  price_cents,
  compare_at_price_cents,
  currency,
  stock_quantity,
  is_featured,
  is_reservable,
  is_customizable,
  published_at,
  updated_at
)
values
  (
    (select id from products where slug = 'pagaie-carbone-sprint'),
    (select id from categories where slug = 'imparfaits'),
    'Pagaie carbone sprint - Imparfait',
    'pagaie-carbone-sprint-imparfait-demo',
    'DEMO-PAG-SPRINT-IMP',
    'Piece unique neuve avec defaut visuel.',
    'Pagaie neuve issue du modele sprint, proposee avec remise car un defaut visuel est present sans impact fonctionnel.',
    'Petite bulle visible dans la resine pres du bord de pale. Defaut uniquement visuel.',
    'imperfect',
    'available',
    9000,
    12000,
    'EUR',
    1,
    false,
    true,
    false,
    now(),
    now()
  )
on conflict (slug) do update set
  base_product_id = excluded.base_product_id,
  category_id = excluded.category_id,
  name = excluded.name,
  sku = excluded.sku,
  short_description = excluded.short_description,
  description = excluded.description,
  defect_description = excluded.defect_description,
  condition = excluded.condition,
  availability = excluded.availability,
  price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents,
  currency = excluded.currency,
  stock_quantity = excluded.stock_quantity,
  is_featured = excluded.is_featured,
  is_reservable = excluded.is_reservable,
  is_customizable = excluded.is_customizable,
  published_at = excluded.published_at,
  updated_at = now();

with seeded_products as (
  select id, slug
  from products
  where slug in (
    'pagaie-carbone-sprint',
    'pagaie-marathon-sur-mesure',
    'protection-pale-carbone',
    'diagnostic-reparation-carbone-demo',
    'prototype-pale-large',
    'pagaie-carbone-sprint-imparfait-demo'
  )
),
deleted_attributes as (
  delete from product_attributes
  where product_id in (select id from seeded_products)
)
insert into product_attributes (product_id, label, value, unit, position)
select seeded_products.id, attributes.label, attributes.value, attributes.unit, attributes.position
from seeded_products
join (
  values
    ('pagaie-carbone-sprint', 'Matiere', 'Carbone', null, 0),
    ('pagaie-carbone-sprint', 'Poids', '0.68', 'kg', 1),
    ('pagaie-carbone-sprint', 'Dimensions', '210 cm x 18 cm', null, 2),
    ('pagaie-carbone-sprint', 'Usage', 'Sprint', null, 3),
    ('pagaie-marathon-sur-mesure', 'Matiere', 'Carbone', null, 0),
    ('pagaie-marathon-sur-mesure', 'Fabrication', 'Sur mesure', null, 1),
    ('pagaie-marathon-sur-mesure', 'Delai', 'Sur devis', null, 2),
    ('protection-pale-carbone', 'Matiere', 'Carbone', null, 0),
    ('protection-pale-carbone', 'Compatibilite', 'Pales KayArt', null, 1),
    ('diagnostic-reparation-carbone-demo', 'Entree', 'Photos client', null, 0),
    ('diagnostic-reparation-carbone-demo', 'Retour', 'Avis atelier', null, 1),
    ('prototype-pale-large', 'Etat', 'Brouillon', null, 0),
    ('prototype-pale-large', 'Usage', 'Test interne', null, 1),
    ('pagaie-carbone-sprint-imparfait-demo', 'Etat', 'Neuf imparfait', null, 0),
    ('pagaie-carbone-sprint-imparfait-demo', 'Defaut', 'Visuel uniquement', null, 1),
    ('pagaie-carbone-sprint-imparfait-demo', 'Stock', 'Piece unique', null, 2)
) as attributes(product_slug, label, value, unit, position)
  on attributes.product_slug = seeded_products.slug;

commit;
