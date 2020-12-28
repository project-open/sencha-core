-- upgrade-5.0.1.0.1-5.0.1.0.2.sql
SELECT acs_log__debug('/packages/sencha-core/sql/postgresql/upgrade/upgrade-5.0.1.0.1-5.0.1.0.2.sql','');


drop index if exists im_sencha_preferences_object_preference_idx;

-- Avoid duplicate entries.
create unique index im_sencha_preferences_object_preference_idx
on im_sencha_preferences(preference_url, preference_object_id, preference_key);

