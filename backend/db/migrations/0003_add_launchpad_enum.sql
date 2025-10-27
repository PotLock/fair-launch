DO $$ BEGIN
  CREATE TYPE launchpad AS ENUM ('potlaunch', 'cookedpad', 'weava');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE tokens
ADD COLUMN IF NOT EXISTS launchpad launchpad;

UPDATE tokens
SET launchpad = 'potlaunch'
WHERE launchpad IS NULL;

ALTER TABLE tokens
ALTER COLUMN launchpad SET NOT NULL;

ALTER TABLE tokens
ALTER COLUMN launchpad SET DEFAULT 'potlaunch';
