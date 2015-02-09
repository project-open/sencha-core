-- /packages/sencha-core/sql/postgresql/sencha-core-create.sql
--
-- Copyright (c) 2003-2015 ]project-open[
--
-- All rights reserved. Please check
-- http://www.project-open.com/license/ for details.
--
-- @author frank.bergmann@project-open.com

-----------------------------------------------------------
-- Sencha Preferences
--
-- A simple object to store user preferences such as:
-- - A help item that the user does not want to see again
-- - An enabled/disabled feature of a Sencha GUI element
-- - The sort_order of a grid column
-- - ...
-- All preferences return an empty string if they have not been defined previously.
--

SELECT acs_object_type__create_type (
	'im_sencha_preference',				-- object_type - only lower case letters and "_"
	'Sencha Preference',				-- pretty_name - Human readable name
	'Sencha Preferences',				-- pretty_plural - Human readable plural
	'acs_object',					-- supertype - "acs_object" is topmost object type.
	'im_sencha_preferences',			-- table_name - where to store data for this object?
	'preference_id',				-- id_column - where to store object_id in the table?
	'sencha-core',					-- package_name - name of this package
	'f',						-- abstract_p - abstract class or not
	null,						-- type_extension_table
	'im_sencha_preference__name'			-- name_method - a PL/SQL procedure that
							-- returns the name of the object.
);

-- Add additional meta information to allow DynFields to extend the im_sencha_preference object.
update acs_object_types set
        status_type_table = 'im_sencha_preferences',	-- which table contains the status_id field?
        status_column = 'preference_status_id',		-- which column contains the status_id field?
        type_column = 'preference_type_id'		-- which column contains the type_id field?
where object_type = 'im_sencha_preference';

-- Object Type Tables contain the lists of all tables (except for
-- acs_objects...) that contain information about an im_sencha_preference object.
-- This way, developers can add "extension tables" to an object to
-- hold additional DynFields, without changing the program code.
insert into acs_object_type_tables (object_type, table_name, id_column)
values ('im_sencha_preference', 'im_sencha_preferences', 'preference_id');



-- Generic URLs to link to an object of type "im_sencha_preference".
-- These URLs are used by the Full-Text Search Engine and the Workflow
-- to show links to the object type.
insert into im_biz_object_urls (object_type, url_type, url) values (
'im_sencha_preference','view','/sencha-core/preferences/new?display_mode=display&preference_id=');
insert into im_biz_object_urls (object_type, url_type, url) values (
'im_sencha_preference','edit','/sencha-core/preferences/new?display_mode=edit&preference_id=');



-- This table stores one object per row. Links to super-type "acs_object" 
-- using the "preference_id" field, which contains the same object_id as 
-- acs_objects.object_id.
create table im_sencha_preferences (
				-- The object_id: references acs_objects.object_id.
				-- So we can lookup object metadata such as creation_date,
				-- object_type etc in acs_objects.
	preference_id		integer
				constraint im_sencha_preference_id_pk
				primary key
				constraint im_sencha_preference_id_fk
				references acs_objects,
				-- Every ]po[ object should have a "status_id" to control
				-- its lifecycle. Status_id reference im_categories, where 
				-- you can define the list of stati for this object type.
	preference_status_id	integer 
				constraint im_sencha_preference_status_nn
				not null
				constraint im_sencha_preference_status_fk
				references im_categories,
				-- Every ]po[ object should have a "type_id" to allow creating
				-- sub-types of the object. Type_id references im_categories
				-- where you can define the list of subtypes per object type.
	preference_type_id	integer 
				constraint im_sencha_preference_type_nn
				not null
				constraint im_sencha_preference_type_fk
				references im_categories,
				-- The user to whom this preference belongs
	preference_object_id	integer
				constraint im_sencha_preference_user_nn
				not null
				constraint im_sencha_preference_user_fk
				references acs_objects,
				-- Key of the preference - can not be NULL
	preference_url		text
				constraint im_sencha_preference_url_nn
				not null,
				-- Key of the preference - can not be NULL
	preference_key		text
				constraint im_sencha_preference_key_nn
				not null,
	preference_value	text
);

-- Speed up (frequent) queries to find all notes for a specific object.
create index im_sencha_preferences_object_idx on im_sencha_preferences(preference_object_id);

-- Avoid duplicate entries.
create unique index im_sencha_preferences_object_preference_idx 
on im_sencha_preferences(preference_object_id, preference_key);


create or replace function im_sencha_preference__name(integer)
returns varchar as $body$
DECLARE
	p_preference_id		alias for $1;
	v_name			varchar;
BEGIN
	select	acs_object__name(preference_object_id) || ': ' || 
		preference_url || '.' || preference_key || '=' || 
		coalesce(preference_value, 'NULL')
	into	v_name
	from	im_sencha_preferences
	where	preference_id = p_preference_id;

	return v_name;
end; $body$ language 'plpgsql';


create or replace function im_sencha_preference__new (
	integer, varchar, timestamptz,
	integer, varchar, integer,
	integer, integer, integer,
	varchar, varchar, varchar
) returns integer as $body$
DECLARE
	p_preference_id		alias for $1;			-- preference_id  default null
	p_object_type   	alias for $2;			-- object_type default im_sencha_preference
	p_creation_date 	alias for $3;			-- creation_date default now()
	p_creation_user 	alias for $4;			-- creation_user default null
	p_creation_ip   	alias for $5;			-- creation_ip default null
	p_context_id		alias for $6;			-- context_id default null

	p_preference_type_id	alias for $7;			-- type (email, http, text comment, ...)
	p_preference_status_id	alias for $8;			-- status ("active" or "deleted").
	p_preference_object_id	alias for $9;			-- associated object (project, user, ...)
	p_preference_url	alias for $10;			-- associated object (project, user, ...)
	p_preference_key	alias for $11;			-- associated object (project, user, ...)
	p_preference_value	alias for $12;			-- associated object (project, user, ...)

	v_preference_id	integer;
BEGIN
	v_preference_id := acs_object__new (
		p_preference_id,				-- object_id - NULL to create a new id
		p_object_type,					-- object_type - "im_sencha_preference"
		p_creation_date,				-- creation_date - now()
		p_creation_user,				-- creation_user - Current user or "0" for guest
		p_creation_ip,					-- creation_ip - IP from ns_conn, or "0.0.0.0"
		p_context_id,					-- context_id - NULL, not used in ]po[
		't'						-- security_inherit_p - not used in ]po[
	);
	
	insert into im_sencha_preferences (
		preference_id, preference_object_id,
		preference_type_id, preference_status_id,
		preference_url, preference_key, preference_value
	) values (
		v_preference_id, p_preference_object_id,
		p_preference_type_id, p_preference_status_id,
		p_preference_url, p_preference_key, p_preference_value
	);

	return v_preference_id;
END;$body$ language 'plpgsql';


create or replace function im_sencha_preference__delete(integer)
returns integer as $body$
DECLARE
	p_preference_id	alias for $1;
BEGIN
	-- Delete any data related to the object
	delete	from im_sencha_preferences
	where	preference_id = p_preference_id;

	-- Finally delete the object iself
	PERFORM acs_object__delete(p_preference_id);

	return 0;
end;$body$ language 'plpgsql';




-----------------------------------------------------------
-- Categories for Type and Status
--
-- 86000-86099  Sencha Preferences Status
-- 86100-86199  Sencha Preferences Type
-- 86200-86999  Sencha Preferences (available 800)

-- Status
SELECT im_category_new (86000, 'Active', 'Intranet Sencha Preferences Status');
SELECT im_category_new (86002, 'Deleted', 'Intranet Sencha Preferences Status');

-- Type
SELECT im_category_new (86100, 'Default', 'Intranet Sencha Preferences Type');

