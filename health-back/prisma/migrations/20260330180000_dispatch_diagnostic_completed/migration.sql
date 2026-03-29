-- Extend DISPATCH_STATUS for clinical workflow after arrival.
INSERT INTO "Lookup" ("id", "categoryId", "lookupKey", "lookupValue", "isActive")
SELECT gen_random_uuid(), c.id, 'DIAGNOSTIC', 'Diagnostic', true
FROM "LookupCategory" c
WHERE c."categoryName" = 'DISPATCH_STATUS'
ON CONFLICT ("categoryId", "lookupKey") DO UPDATE
SET "lookupValue" = EXCLUDED."lookupValue", "isActive" = true;

INSERT INTO "Lookup" ("id", "categoryId", "lookupKey", "lookupValue", "isActive")
SELECT gen_random_uuid(), c.id, 'COMPLETED', 'Completed', true
FROM "LookupCategory" c
WHERE c."categoryName" = 'DISPATCH_STATUS'
ON CONFLICT ("categoryId", "lookupKey") DO UPDATE
SET "lookupValue" = EXCLUDED."lookupValue", "isActive" = true;
