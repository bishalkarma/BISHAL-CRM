-- ============================================================
--  Bishal Sales CRM — seed data
--  Stage 2b · run AFTER 01-schema.sql
--
--  Generated from the app's demo data, so the two cannot drift apart.
--  Safe to re-run: clears these tables first, then reloads.
-- ============================================================

-- Order matters: children before parents.
delete from deal_lines;
delete from stage_transitions;
delete from activities;
delete from deals;
delete from contacts;
delete from companies;


-- 15 companies
insert into companies (
  id, name, cluster, emirate, area, lat, lng, business, type,
  contact_name, contact_role, email, phone, whatsapp_same_as_phone,
  owner, lead_source, remarks,
  spancop, spancop_since, lead_status, next_follow_up,
  activity_count, last_activity_at, has_purchase_order, awaiting_payment,
  has_ever_ordered, last_order_at, lifetime_value, created_at
) values
  ('C-001', 'Atlantis The Palm', 'Kerzner Group', 'Dubai', 'Palm Jumeirah', NULL, NULL, 'Hotel', '5★', 'Marco Rossi', 'Executive Chef', 'marco.rossi@atlantis.ae', '+971 50 123 4567', true, 'Bishal Karma', 'Referral', 'Annual contract renewal due in Q3. Prefers morning deliveries.', 'negotiate', '2026-07-14T07:11:25.290Z'::timestamptz, 'hot', '2026-07-28T07:11:25.290Z'::timestamptz, 14, '2026-07-25T07:11:25.290Z'::timestamptz, false, false, true, '2026-06-18T07:11:25.290Z'::timestamptz, 1284000, '2025-06-01T07:11:25.290Z'::timestamptz),
  ('C-002', 'Rixos Marina Residences', 'Rixos Hotels', 'Abu Dhabi', 'Al Maryah Island', NULL, NULL, 'Project', 'New', 'Elena Petrova', 'Purchasing Manager', 'e.petrova@rixosmarina.ae', '+971 55 887 2210', true, 'Priya Nair', 'Exhibition', 'Pre-opening. Target handover in 4 months — order 3 months prior.', 'negotiate', '2026-07-06T07:11:25.290Z'::timestamptz, 'hot', '2026-07-27T07:11:25.290Z'::timestamptz, 9, '2026-07-24T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-04-21T07:11:25.290Z'::timestamptz),
  ('C-003', 'Zuma Restaurant Group', 'Independent', 'Dubai', 'DIFC', NULL, NULL, 'Restaurant', 'Old', 'Kenji Watanabe', 'F&B Manager', 'kenji@zuma.ae', '+971 52 447 9021', false, 'Bishal Karma', 'Existing customer', 'Cold-chain critical. Rejects deliveries after 10am.', 'payment', '2026-07-20T07:11:25.290Z'::timestamptz, 'warm', '2026-07-29T07:11:25.290Z'::timestamptz, 22, '2026-07-25T07:11:25.290Z'::timestamptz, true, true, true, '2026-07-20T07:11:25.290Z'::timestamptz, 795000, '2025-03-03T07:11:25.290Z'::timestamptz),
  ('C-004', 'Nero Coffee Group', 'Independent', 'Sharjah', 'Al Majaz', NULL, NULL, 'Cafe', 'New', 'Sara Khalil', 'Owner', 'sara@nerocoffee.ae', '+971 56 330 1188', true, 'Ahmed Faris', 'Instagram', '12 outlets. Wants single-origin options for the flagship store.', 'negotiate', '2026-07-17T07:11:25.290Z'::timestamptz, 'warm', '2026-07-30T07:11:25.290Z'::timestamptz, 7, '2026-07-23T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-05-29T07:11:25.290Z'::timestamptz),
  ('C-005', 'Jumeirah Beach Hotel', 'Jumeirah Group', 'Dubai', 'Umm Suqeim', NULL, NULL, 'Hotel', '5★', 'Fatima Al Suwaidi', 'Purchasing Manager', 'f.alsuwaidi@jumeirah.com', '+971 50 992 4413', true, 'Priya Nair', 'Referral', 'Buys quarterly. Went quiet after the last amenities order.', 'approach', '2026-05-13T07:11:25.290Z'::timestamptz, 'cold', '2026-07-24T07:11:25.290Z'::timestamptz, 11, '2026-07-10T07:11:25.290Z'::timestamptz, false, false, true, '2026-05-13T07:11:25.290Z'::timestamptz, 432000, '2025-07-11T07:11:25.290Z'::timestamptz),
  ('C-006', 'Emirates Palace Catering', 'Independent', 'Abu Dhabi', 'West Corniche', NULL, NULL, 'Catering', 'Old', 'Omar Haddad', 'Head Chef', 'omar.haddad@epcatering.ae', '+971 54 220 7788', true, 'Ahmed Faris', 'Walk-in', 'Large banquet volumes during wedding season.', 'order', '2026-07-22T07:11:25.290Z'::timestamptz, 'hot', '2026-07-27T07:11:25.290Z'::timestamptz, 16, '2026-07-24T07:11:25.290Z'::timestamptz, true, false, true, '2026-07-22T07:11:25.290Z'::timestamptz, 618000, '2025-10-09T07:11:25.290Z'::timestamptz),
  ('C-007', 'The Farmhouse Bistro', 'Independent', 'Dubai', 'Jumeirah 1', NULL, NULL, 'Restaurant', 'New', 'Claire Dubois', 'Owner', NULL, '+971 58 776 2200', true, 'Lina Haddad', 'Cold call', 'Organic-only sourcing policy.', 'approach', '2026-06-22T07:11:25.290Z'::timestamptz, 'warm', '2026-07-26T07:11:25.290Z'::timestamptz, 3, '2026-07-22T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-06-16T07:11:25.290Z'::timestamptz),
  ('C-008', 'Marriott Cluster Kitchens', 'Marriott Cluster', 'Dubai', 'Al Jaddaf', NULL, NULL, 'Hotel', '4★', 'Hassan Iqbal', 'Executive Chef', 'hassan.iqbal@marriott.com', '+971 50 445 8890', false, 'Priya Nair', 'Referral', 'Won the bakery tender. PO expected this week.', 'close', '2026-07-23T07:11:25.290Z'::timestamptz, 'hot', '2026-07-27T07:11:25.290Z'::timestamptz, 19, '2026-07-23T07:11:25.290Z'::timestamptz, false, false, true, '2026-03-28T07:11:25.290Z'::timestamptz, 962000, '2025-05-02T07:11:25.290Z'::timestamptz),
  ('C-009', 'Bloom Café Chain', 'Independent', 'Dubai', 'Business Bay', NULL, NULL, 'Cafe', 'Old', 'Nadia Rahman', 'General Manager', 'nadia@bloomcafe.ae', '+971 55 118 3344', true, 'Ahmed Faris', 'Instagram', 'Juice supply running smoothly. Good payer.', 'approach', '2026-07-18T07:11:25.290Z'::timestamptz, 'warm', '2026-08-01T07:11:25.290Z'::timestamptz, 13, '2026-07-18T07:11:25.290Z'::timestamptz, false, false, true, '2026-07-18T07:11:25.290Z'::timestamptz, 274000, '2025-12-28T07:11:25.290Z'::timestamptz),
  ('C-010', 'Radisson Blu Deira', 'Independent', 'Dubai', 'Deira', NULL, NULL, 'Hotel', '4★', 'Peter Novak', 'Purchasing Manager', 'p.novak@radissondeira.ae', '+971 50 667 1200', false, 'Bishal Karma', 'Exhibition', 'Lost the equipment tender on price. Revisit next cycle.', 'approach', '2026-07-14T07:11:25.290Z'::timestamptz, 'cold', '2026-08-09T07:11:25.290Z'::timestamptz, 6, '2026-07-14T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-02-16T07:11:25.290Z'::timestamptz),
  ('C-011', 'Gulf Horeca Distributors', 'Independent', 'Dubai', 'Al Quoz', NULL, NULL, 'Catering', 'Old', 'Yusuf Al Otaibi', 'Owner', 'yusuf@gulfhoreca.com', '+971 56 909 4400', true, 'Bishal Karma', 'Referral', 'Potential regional distribution partner for KSA expansion.', 'negotiate', '2026-07-20T07:11:25.290Z'::timestamptz, 'hot', '2026-07-28T07:11:25.290Z'::timestamptz, 5, '2026-07-24T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-05-17T07:11:25.290Z'::timestamptz),
  ('C-012', 'Al Habtoor Banquet Hall', 'Independent', 'Dubai', 'Al Habtoor City', NULL, NULL, 'Banquet', 'Renovation', 'Rashid Al Mansoori', 'General Manager', 'rashid@habtoorbanquet.ae', '+971 52 771 6655', true, 'Lina Haddad', 'Website', 'Reopening after refurbishment. No contact made yet.', 'prospect', '2026-07-01T07:11:25.290Z'::timestamptz, 'warm', NULL, 0, NULL, false, false, false, NULL, 0, '2026-07-01T07:11:25.290Z'::timestamptz),
  ('C-013', 'Sapphire Lounge & Grill', 'Independent', 'Ajman', 'Corniche', NULL, NULL, 'Restaurant', 'New', 'Imran Sheikh', 'Owner', NULL, '+971 50 331 8877', true, 'Lina Haddad', 'Walk-in', '', 'suspect', '2026-06-15T07:11:25.290Z'::timestamptz, 'cold', NULL, 0, NULL, false, false, false, NULL, 0, '2026-06-15T07:11:25.290Z'::timestamptz),
  ('C-014', 'Grand Millennium Barsha', 'Independent', 'Dubai', 'Al Barsha', NULL, NULL, 'Hotel', '4★', 'Anita Verma', 'F&B Manager', 'anita.verma@grandmillennium.ae', '+971 55 664 2299', true, 'Ahmed Faris', 'Cold call', 'Interested but budget locked until next quarter.', 'approach', '2026-06-11T07:11:25.290Z'::timestamptz, 'cold', '2026-08-16T07:11:25.290Z'::timestamptz, 4, '2026-06-25T07:11:25.290Z'::timestamptz, false, false, false, NULL, 0, '2026-04-29T07:11:25.290Z'::timestamptz),
  ('C-015', 'Burj Al Arab Terrace', 'Jumeirah Group', 'Dubai', 'Umm Suqeim 3', NULL, NULL, 'Hotel', '7★', 'Luca Bianchi', 'Executive Chef', 'l.bianchi@jumeirah.com', '+971 50 887 3311', false, 'Bishal Karma', 'Referral', 'Premium range only. Very high service expectations.', 'suspect', '2026-07-17T07:11:25.290Z'::timestamptz, 'warm', NULL, 0, NULL, false, false, false, NULL, 0, '2026-07-17T07:11:25.290Z'::timestamptz);

-- 21 contacts
insert into contacts (
  id, company_id, name, role, email, phone, whatsapp_same_as_phone,
  is_primary, is_decision_maker, notes, created_at
) values
  ('P-001', 'C-001', 'Marco Rossi', 'Executive Chef', 'marco.rossi@atlantis.ae', '+971 50 123 4567', true, true, true, 'Decides all F&B product listings.', '2025-06-01T07:11:25.295Z'::timestamptz),
  ('P-002', 'C-001', 'Reena Thomas', 'Storekeeper', NULL, '+971 55 442 8890', true, false, false, 'Raises most day-to-day requirements.', '2025-09-29T07:11:25.295Z'::timestamptz),
  ('P-003', 'C-001', 'Ankit Singh Chauhan', 'Purchasing Manager', 'a.chauhan@atlantis.ae', '+971 52 118 7733', false, false, true, 'Handles final commercial negotiation and PO issuance.', '2025-10-09T07:11:25.295Z'::timestamptz),
  ('P-021', 'C-001', 'Grace Fernandes', 'Other', NULL, '+971 55 660 4412', true, false, false, 'Housekeeping supervisor — raises amenity requirements.', '2025-11-08T07:11:25.295Z'::timestamptz),
  ('P-004', 'C-002', 'Elena Petrova', 'Purchasing Manager', 'e.petrova@rixosmarina.ae', '+971 55 887 2210', true, true, true, 'Pre-opening procurement lead.', '2026-04-21T07:11:25.295Z'::timestamptz),
  ('P-005', 'C-002', 'Dmitri Volkov', 'General Manager', 'gm@rixosmarina.ae', '+971 50 664 1120', false, false, true, 'Signs off anything above AED 250K.', '2026-04-27T07:11:25.295Z'::timestamptz),
  ('P-006', 'C-003', 'Kenji Watanabe', 'F&B Manager', 'kenji@zuma.ae', '+971 52 447 9021', false, true, true, 'Very strict on cold-chain compliance.', '2025-03-03T07:11:25.295Z'::timestamptz),
  ('P-007', 'C-003', 'Farid Karim', 'Executive Chef', NULL, '+971 56 220 3344', true, false, false, 'Chooses cookware and kitchen equipment.', '2025-06-21T07:11:25.295Z'::timestamptz),
  ('P-008', 'C-004', 'Sara Khalil', 'Owner', 'sara@nerocoffee.ae', '+971 56 330 1188', true, true, true, 'Owner-operator, decides everything herself.', '2026-05-29T07:11:25.295Z'::timestamptz),
  ('P-009', 'C-005', 'Fatima Al Suwaidi', 'Purchasing Manager', 'f.alsuwaidi@jumeirah.com', '+971 50 992 4413', true, true, true, 'Quarterly buying cycle.', '2025-07-11T07:11:25.295Z'::timestamptz),
  ('P-010', 'C-005', 'Grace Mensah', 'Other', NULL, '+971 55 771 2200', true, false, false, 'Housekeeping supervisor — raises amenities requests.', '2026-01-07T07:11:25.295Z'::timestamptz),
  ('P-011', 'C-006', 'Omar Haddad', 'Head Chef', 'omar.haddad@epcatering.ae', '+971 54 220 7788', true, true, true, 'Banquet volumes peak in wedding season.', '2025-10-09T07:11:25.295Z'::timestamptz),
  ('P-012', 'C-007', 'Claire Dubois', 'Owner', NULL, '+971 58 776 2200', true, true, true, 'Organic sourcing only.', '2026-06-16T07:11:25.295Z'::timestamptz),
  ('P-013', 'C-008', 'Hassan Iqbal', 'Executive Chef', 'hassan.iqbal@marriott.com', '+971 50 445 8890', false, true, true, 'Cluster chef across three properties.', '2025-05-02T07:11:25.295Z'::timestamptz),
  ('P-014', 'C-009', 'Nadia Rahman', 'General Manager', 'nadia@bloomcafe.ae', '+971 55 118 3344', true, true, true, 'Reliable payer.', '2025-12-28T07:11:25.295Z'::timestamptz),
  ('P-015', 'C-010', 'Peter Novak', 'Purchasing Manager', 'p.novak@radissondeira.ae', '+971 50 667 1200', false, true, true, 'Price-driven buyer.', '2026-02-16T07:11:25.295Z'::timestamptz),
  ('P-016', 'C-011', 'Yusuf Al Otaibi', 'Owner', 'yusuf@gulfhoreca.com', '+971 56 909 4400', true, true, true, 'Exploring KSA distribution partnership.', '2026-05-17T07:11:25.295Z'::timestamptz),
  ('P-017', 'C-012', 'Rashid Al Mansoori', 'General Manager', 'rashid@habtoorbanquet.ae', '+971 52 771 6655', true, true, true, 'Reopening after refurbishment.', '2026-07-01T07:11:25.295Z'::timestamptz),
  ('P-018', 'C-013', 'Imran Sheikh', 'Owner', NULL, '+971 50 331 8877', true, true, true, '', '2026-06-15T07:11:25.295Z'::timestamptz),
  ('P-019', 'C-014', 'Anita Verma', 'F&B Manager', 'anita.verma@grandmillennium.ae', '+971 55 664 2299', true, true, false, 'Budget locked until next quarter.', '2026-04-29T07:11:25.295Z'::timestamptz),
  ('P-020', 'C-015', 'Luca Bianchi', 'Executive Chef', 'l.bianchi@jumeirah.com', '+971 50 887 3311', false, true, true, 'Premium range only.', '2026-07-17T07:11:25.295Z'::timestamptz);

-- 13 deals
insert into deals (
  id, title, category, company_id, company_name, account_type,
  enquiry_from_id, current_contact_id, contact_trail,
  value, currency, stage, closed_from_stage, probability, on_hold,
  owner, city, priority, tags,
  req_date, expected_close_date, last_activity_at,
  lost_reason, lost_note,
  next_action, task, task_due_date, task_done, remarks,
  sample_sent_at, sample_feedback_at, sample_feedback,
  periods, created_at
) values
  ('D-1041', 'Annual dry goods supply contract', 'BOH — Back of House', 'C-001', 'Atlantis The Palm', 'Hotel', 'P-002', 'P-003', '[{"contactId":"P-002","at":"2026-06-08T07:11:25.319Z","note":"Raised the requirement"},{"contactId":"P-003","at":"2026-06-26T07:11:25.319Z","note":"Commercials moved to purchasing"}]'::jsonb, 491400, 'AED', 'negotiation', NULL, 75, false, 'Bishal Karma', 'Dubai', 'high', ARRAY['Annual contract','Key account']::text[], '2026-08-15T07:11:25.319Z'::timestamptz, '2026-08-04T07:11:25.319Z'::timestamptz, '2026-07-25T07:11:25.319Z'::timestamptz, NULL, NULL, 'They like the revised rates, waiting on the final offer sheet.', 'Send revised final quote', '2026-07-28T07:11:25.319Z'::timestamptz, false, 'Renewal of last year''s contract. Deliveries before 10am only.', NULL, NULL, NULL, '[{"openedAt":"2026-06-08T07:11:25.319Z","closedAt":null}]'::jsonb, '2026-06-08T07:11:25.319Z'::timestamptz),
  ('D-1038', 'Pre-opening F&B tableware package', 'FF&E — Furniture, Fixtures and Equipment', 'C-002', 'Rixos Marina Residences', 'Hotel Project', 'P-004', 'P-004', '[{"contactId":"P-004","at":"2026-06-26T07:11:25.319Z","note":"Sent the enquiry"}]'::jsonb, 234800, 'AED', 'quotation', NULL, NULL, false, 'Priya Nair', 'Abu Dhabi', 'high', ARRAY['Pre-opening','Project']::text[], '2026-10-09T07:11:25.319Z'::timestamptz, '2026-08-16T07:11:25.319Z'::timestamptz, '2026-07-24T07:11:25.319Z'::timestamptz, NULL, NULL, 'Catalogue shared, awaiting shortlist from the GM.', 'Follow up on the tableware shortlist', '2026-07-29T07:11:25.319Z'::timestamptz, false, 'Hotel opens in ~4 months. Order 3 months prior.', NULL, NULL, NULL, '[{"openedAt":"2026-06-26T07:11:25.319Z","closedAt":null}]'::jsonb, '2026-06-26T07:11:25.319Z'::timestamptz),
  ('D-1035', 'Specialty coffee beans — 12 outlets', 'BOH — Back of House', 'C-004', 'Nero Coffee Group', 'Cafe', 'P-008', 'P-008', '[{"contactId":"P-008","at":"2026-06-16T07:11:25.319Z","note":"Walked into the office"}]'::jsonb, 205200, 'AED', 'sampling', NULL, NULL, false, 'Ahmed Faris', 'Sharjah', 'medium', ARRAY['Multi-outlet']::text[], '2026-08-25T07:11:25.319Z'::timestamptz, '2026-08-09T07:11:25.319Z'::timestamptz, '2026-07-23T07:11:25.319Z'::timestamptz, NULL, NULL, 'Samples with the head barista for cupping.', 'Collect cupping feedback', '2026-07-27T07:11:25.319Z'::timestamptz, false, 'Wants single-origin for the flagship store only.', '2026-07-17T07:11:25.319Z'::timestamptz, '2026-07-23T07:11:25.319Z'::timestamptz, 'Liked the Ethiopia; house blend needs a darker roast.', '[{"openedAt":"2026-06-16T07:11:25.319Z","closedAt":null}]'::jsonb, '2026-06-16T07:11:25.319Z'::timestamptz),
  ('D-1031', 'Frozen seafood quarterly rate contract', 'BOH — Back of House', 'C-003', 'Zuma Restaurant Group', 'Restaurant', 'P-006', 'P-006', '[{"contactId":"P-006","at":"2026-06-30T07:11:25.319Z","note":"Sent the enquiry"}]'::jsonb, 73740, 'USD', 'negotiation', NULL, 68, false, 'Bishal Karma', 'Dubai', 'high', ARRAY['Cold chain','Rate contract']::text[], '2026-08-07T07:11:25.319Z'::timestamptz, '2026-07-31T07:11:25.319Z'::timestamptz, '2026-07-25T07:11:25.319Z'::timestamptz, NULL, NULL, 'Negotiating quarterly price lock against USD movement.', 'Confirm cold-chain delivery window', '2026-07-27T07:11:25.319Z'::timestamptz, false, 'Rejects deliveries after 10am.', NULL, NULL, NULL, '[{"openedAt":"2026-06-30T07:11:25.319Z","closedAt":null}]'::jsonb, '2026-06-30T07:11:25.319Z'::timestamptz),
  ('D-1029', 'Housekeeping amenities restock', 'OS&E — Operating Supplies and Equipment', 'C-005', 'Jumeirah Beach Hotel', 'Hotel', 'P-010', 'P-009', '[{"contactId":"P-010","at":"2026-06-22T07:11:25.319Z","note":"Housekeeping raised the need"},{"contactId":"P-009","at":"2026-07-06T07:11:25.319Z","note":"Passed to purchasing"}]'::jsonb, 78300, 'AED', 'qualified', NULL, NULL, true, 'Priya Nair', 'Dubai', 'low', ARRAY['Repeat order']::text[], '2026-09-09T07:11:25.320Z'::timestamptz, '2026-08-23T07:11:25.320Z'::timestamptz, '2026-07-10T07:11:25.320Z'::timestamptz, NULL, NULL, 'Budget review pending until the new quarter.', 'Re-engage after quarter start', '2026-08-09T07:11:25.320Z'::timestamptz, false, 'Buys quarterly. Went quiet after the last order.', NULL, NULL, NULL, '[{"openedAt":"2026-06-22T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-06-22T07:11:25.320Z'::timestamptz),
  ('D-1026', 'Banquet catering disposables', 'OS&E — Operating Supplies and Equipment', 'C-006', 'Emirates Palace Catering', 'Catering', 'P-011', 'P-011', '[{"contactId":"P-011","at":"2026-06-18T07:11:25.320Z","note":"Sent the enquiry"}]'::jsonb, 52050, 'AED', 'quotation', NULL, NULL, false, 'Ahmed Faris', 'Abu Dhabi', 'medium', ARRAY['Banquet']::text[], '2026-08-20T07:11:25.320Z'::timestamptz, '2026-08-12T07:11:25.320Z'::timestamptz, '2026-07-14T07:11:25.320Z'::timestamptz, NULL, NULL, 'Quote issued, chasing approval before wedding season.', 'Chase quote approval', '2026-07-25T07:11:25.320Z'::timestamptz, false, 'Volumes peak during wedding season.', NULL, NULL, NULL, '[{"openedAt":"2026-06-18T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-06-18T07:11:25.320Z'::timestamptz),
  ('D-1022', 'Regional distribution partnership', 'OS&E — Operating Supplies and Equipment', 'C-011', 'Gulf Horeca Distributors', 'Distributor', 'P-016', 'P-016', '[{"contactId":"P-016","at":"2026-07-18T07:11:25.320Z","note":"Introduced via referral"}]'::jsonb, 640000, 'SAR', 'lead', NULL, NULL, false, 'Bishal Karma', 'Riyadh', 'high', ARRAY['Expansion','KSA']::text[], NULL, '2026-09-09T07:11:25.320Z'::timestamptz, '2026-07-20T07:11:25.320Z'::timestamptz, NULL, NULL, 'Initial discussion on territory and margins.', 'Prepare partnership proposal', '2026-07-31T07:11:25.320Z'::timestamptz, false, 'Potential regional partner for KSA expansion.', NULL, NULL, NULL, '[{"openedAt":"2026-07-18T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-07-18T07:11:25.320Z'::timestamptz),
  ('D-1019', 'Organic produce weekly supply', 'BOH — Back of House', 'C-007', 'The Farmhouse Bistro', 'Restaurant', 'P-012', 'P-012', '[{"contactId":"P-012","at":"2026-07-21T07:11:25.320Z","note":"Cold call follow-up"}]'::jsonb, 49440, 'AED', 'lead', NULL, NULL, false, 'Lina Haddad', 'Dubai', 'medium', ARRAY['Organic']::text[], '2026-09-04T07:11:25.320Z'::timestamptz, '2026-09-02T07:11:25.320Z'::timestamptz, '2026-07-22T07:11:25.320Z'::timestamptz, NULL, NULL, 'Asked for organic certification documents.', 'Send certification pack', '2026-07-28T07:11:25.320Z'::timestamptz, false, 'Organic-only sourcing policy.', NULL, NULL, NULL, '[{"openedAt":"2026-07-21T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-07-21T07:11:25.320Z'::timestamptz),
  ('D-1018', 'Bakery ingredients annual tender', 'BOH — Back of House', 'C-008', 'Marriott Cluster Kitchens', 'Hotel', 'P-013', 'P-013', '[{"contactId":"P-013","at":"2026-05-25T07:11:25.320Z","note":"Tender invitation"}]'::jsonb, 262200, 'AED', 'won', 'negotiation', 100, false, 'Priya Nair', 'Dubai', 'high', ARRAY['Tender','Annual contract']::text[], '2026-08-05T07:11:25.320Z'::timestamptz, '2026-07-23T07:11:25.320Z'::timestamptz, '2026-07-23T07:11:25.320Z'::timestamptz, NULL, NULL, 'Tender awarded. PO expected this week.', 'Collect the purchase order', '2026-07-28T07:11:25.320Z'::timestamptz, false, 'Chocolate line dropped — handled by their pastry supplier.', NULL, NULL, NULL, '[{"openedAt":"2026-05-25T07:11:25.320Z","closedAt":"2026-07-23T07:11:25.320Z"}]'::jsonb, '2026-05-25T07:11:25.320Z'::timestamptz),
  ('D-1015', 'Cold-pressed juice supply', 'FOH — Front of House', 'C-009', 'Bloom Café Chain', 'Cafe', 'P-014', 'P-014', '[{"contactId":"P-014","at":"2026-06-12T07:11:25.320Z","note":"Repeat customer enquiry"}]'::jsonb, 54400, 'AED', 'won', 'sampling', 100, false, 'Ahmed Faris', 'Dubai', 'medium', ARRAY['Beverage']::text[], '2026-07-24T07:11:25.320Z'::timestamptz, '2026-07-18T07:11:25.320Z'::timestamptz, '2026-07-18T07:11:25.320Z'::timestamptz, NULL, NULL, 'Won after the tasting. Deliveries started.', '', NULL, true, 'Good payer.', '2026-07-06T07:11:25.320Z'::timestamptz, '2026-07-12T07:11:25.320Z'::timestamptz, 'Approved both blends after tasting.', '[{"openedAt":"2026-06-12T07:11:25.320Z","closedAt":"2026-07-18T07:11:25.320Z"}]'::jsonb, '2026-06-12T07:11:25.320Z'::timestamptz),
  ('D-1012', 'Kitchen equipment refresh', 'FF&E — Furniture, Fixtures and Equipment', 'C-010', 'Radisson Blu Deira', 'Hotel', 'P-015', 'P-015', '[{"contactId":"P-015","at":"2026-05-17T07:11:25.320Z","note":"Met at exhibition"}]'::jsonb, 0, 'AED', 'lost', 'quotation', 0, false, 'Bishal Karma', 'Dubai', 'low', ARRAY['Equipment']::text[], '2026-07-21T07:11:25.320Z'::timestamptz, '2026-07-14T07:11:25.320Z'::timestamptz, '2026-07-14T07:11:25.320Z'::timestamptz, 'Lead time', 'Supplier could not meet their installation date.', 'Lost on lead time. Revisit next refurbishment cycle.', '', NULL, true, 'Price-driven buyer.', NULL, NULL, NULL, '[{"openedAt":"2026-05-17T07:11:25.320Z","closedAt":"2026-07-14T07:11:25.320Z"}]'::jsonb, '2026-05-17T07:11:25.320Z'::timestamptz),
  ('D-1009', 'Premium olive oil range listing', 'FOH — Front of House', 'C-003', 'Zuma Restaurant Group', 'Restaurant', 'P-007', 'P-007', '[{"contactId":"P-007","at":"2026-06-23T07:11:25.320Z","note":"Chef requested samples"}]'::jsonb, 44550, 'AED', 'sampling', NULL, NULL, false, 'Lina Haddad', 'Dubai', 'medium', ARRAY['Premium range']::text[], '2026-08-13T07:11:25.320Z'::timestamptz, '2026-08-06T07:11:25.320Z'::timestamptz, '2026-07-17T07:11:25.320Z'::timestamptz, NULL, NULL, 'Chef tasting the Tuscan EVOO this week.', 'Follow up on tasting outcome', '2026-07-27T07:11:25.320Z'::timestamptz, false, 'Reopened after the first enquiry stalled last quarter.', '2026-07-19T07:11:25.320Z'::timestamptz, NULL, NULL, '[{"openedAt":"2026-03-28T07:11:25.320Z","closedAt":"2026-05-27T07:11:25.320Z"},{"openedAt":"2026-06-23T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-06-23T07:11:25.320Z'::timestamptz),
  ('D-1007', 'Staff canteen bulk grocery', 'BOH — Back of House', 'C-011', 'Gulf Horeca Distributors', 'Distributor', 'P-016', 'P-016', '[{"contactId":"P-016","at":"2026-07-12T07:11:25.320Z","note":"Follow-on enquiry"}]'::jsonb, 88700, 'AED', 'qualified', NULL, NULL, false, 'Ahmed Faris', 'Dubai', 'low', ARRAY['Bulk']::text[], '2026-08-30T07:11:25.320Z'::timestamptz, '2026-08-28T07:11:25.320Z'::timestamptz, '2026-07-24T07:11:25.320Z'::timestamptz, NULL, NULL, 'Confirmed monthly volumes, preparing the quote.', 'Prepare bulk grocery quote', '2026-07-29T07:11:25.320Z'::timestamptz, false, '', NULL, NULL, NULL, '[{"openedAt":"2026-07-12T07:11:25.320Z","closedAt":null}]'::jsonb, '2026-07-12T07:11:25.320Z'::timestamptz);

-- 28 line items
insert into deal_lines (
  id, deal_id, product, brand, quantity, unit, unit_price,
  status, reject_reason, position
) values
  ('L-001', 'D-1041', 'Basmati rice 20kg sack', 'India Gate', 400, 'Pcs', 780, 'quoted', NULL, 0),
  ('L-002', 'D-1041', 'Refined sunflower oil 16L', 'Sunny', 260, 'Pcs', 690, 'quoted', NULL, 1),
  ('L-003', 'D-1038', 'Dinner plate 27cm', 'Steelite', 1200, 'Pcs', 42, 'quoted', NULL, 0),
  ('L-004', 'D-1038', 'Water tumbler 300ml', 'Ocean', 1800, 'Pcs', 18, 'quoted', NULL, 1),
  ('L-005', 'D-1038', 'Cutlery set 24pc', 'Sola', 400, 'Pcs', 380, 'quoted', NULL, 2),
  ('L-006', 'D-1035', 'Single-origin Ethiopia 1kg', 'Bishal Roastery', 480, 'Pcs', 210, 'quoted', NULL, 0),
  ('L-007', 'D-1035', 'House blend 1kg', 'Bishal Roastery', 720, 'Pcs', 145, 'quoted', NULL, 1),
  ('L-008', 'D-1031', 'Black tiger prawn 16/20 2kg', 'Siam Canadian', 300, 'Pcs', 145, 'quoted', NULL, 0),
  ('L-009', 'D-1031', 'Norwegian salmon fillet 1.5kg', 'Leroy', 180, 'Pcs', 168, 'quoted', NULL, 1),
  ('L-010', 'D-1029', 'Shampoo 30ml', 'Ecolab', 6000, 'Pcs', 4.2, 'quoted', NULL, 0),
  ('L-011', 'D-1029', 'Body lotion 30ml', 'Ecolab', 6000, 'Pcs', 4.6, 'quoted', NULL, 1),
  ('L-012', 'D-1029', 'Slippers pair', 'Generic', 3000, 'Pcs', 8.5, 'quoted', NULL, 2),
  ('L-013', 'D-1026', 'Bagasse plate 10in', 'Ecoware', 20000, 'Pcs', 1.35, 'quoted', NULL, 0),
  ('L-014', 'D-1026', 'Wooden cutlery set', 'Ecoware', 15000, 'Pcs', 0.95, 'quoted', NULL, 1),
  ('L-015', 'D-1026', 'Napkin 2ply pack of 100', 'Fine', 900, 'Pcs', 12, 'quoted', NULL, 2),
  ('L-016', 'D-1022', 'KSA distribution rights — year 1', '—', 1, 'Pcs', 640000, 'quoted', NULL, 0),
  ('L-017', 'D-1019', 'Organic mixed leaves 1kg', 'Greenheart', 520, 'Pcs', 68, 'quoted', NULL, 0),
  ('L-018', 'D-1019', 'Organic cherry tomato 500g', 'Greenheart', 640, 'Pcs', 22, 'quoted', NULL, 1),
  ('L-019', 'D-1018', 'Bread flour 25kg', 'Prima', 900, 'Pcs', 118, 'approved', NULL, 0),
  ('L-020', 'D-1018', 'Unsalted butter 25kg', 'Anchor', 300, 'Pcs', 520, 'approved', NULL, 1),
  ('L-021', 'D-1018', 'Dark chocolate callets 10kg', 'Callebaut', 120, 'Pcs', 410, 'rejected', 'Item not in scope', 2),
  ('L-022', 'D-1015', 'Cold-pressed orange 1L', 'Freshly', 1200, 'Pcs', 26, 'approved', NULL, 0),
  ('L-023', 'D-1015', 'Cold-pressed green blend 1L', 'Freshly', 800, 'Pcs', 29, 'approved', NULL, 1),
  ('L-024', 'D-1012', 'Combi oven 10 grid', 'Rational', 2, 'Pcs', 48000, 'rejected', 'Lead time', 0),
  ('L-025', 'D-1012', 'SS work table 1800mm', 'Generic', 12, 'Pcs', 3000, 'rejected', 'Lead time', 1),
  ('L-026', 'D-1009', 'EVOO Tuscan 5L tin', 'Frantoio', 150, 'Pcs', 297, 'quoted', NULL, 0),
  ('L-027', 'D-1007', 'Wheat flour 50kg', 'Generic', 300, 'Pcs', 165, 'quoted', NULL, 0),
  ('L-028', 'D-1007', 'Cooking oil 20L', 'Generic', 160, 'Pcs', 245, 'quoted', NULL, 1);

-- 5 stage transitions (SPANCOP history)
insert into stage_transitions (
  id, company_id, from_stage, to_stage, trigger, reason, at, by_user
) values
  ('T-001', 'C-001', 'approach', 'negotiate', 'accepted-suggestion', 'Deal D-1041 opened', '2026-07-14T07:11:25.290Z'::timestamptz, 'Bishal Karma'),
  ('T-002', 'C-003', 'order', 'payment', 'accepted-suggestion', 'Delivered — payment outstanding', '2026-07-20T07:11:25.290Z'::timestamptz, 'Bishal Karma'),
  ('T-003', 'C-008', 'negotiate', 'close', 'accepted-suggestion', 'Bakery tender won', '2026-07-23T07:11:25.290Z'::timestamptz, 'Priya Nair'),
  ('T-004', 'C-010', 'negotiate', 'approach', 'accepted-suggestion', 'Deal lost — relationship open', '2026-07-14T07:11:25.290Z'::timestamptz, 'Bishal Karma'),
  ('T-005', 'C-009', 'payment', 'approach', 'accepted-suggestion', 'Payment collected — cycle complete', '2026-07-18T07:11:25.290Z'::timestamptz, 'Ahmed Faris');

-- ============================================================
--  Verify — this should return the row counts below.
-- ============================================================
select 'companies' as table_name, count(*) from companies
union all select 'contacts',          count(*) from contacts
union all select 'deals',             count(*) from deals
union all select 'deal_lines',        count(*) from deal_lines
union all select 'stage_transitions', count(*) from stage_transitions
order by table_name;

-- Expected:
--   companies          15
--   contacts           21
--   deal_lines         28
--   deals              13
--   stage_transitions  5
