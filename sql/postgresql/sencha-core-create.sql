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
-- Please Note: A user or admin may delete the contents of the preferences
-- table at any moment if necessary. You need to define the default behavior 
-- in the TCL/Sencha code if there are no preferences in the table. 

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
				-- For Sencha page: URL of the page
				-- For Portlets: label of the portlet
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
on im_sencha_preferences(preference_url, preference_object_id, preference_key);


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
-- 86200-86299  Sencha Column Configurations Status
-- 86300-86399  Sencha Column Configurations Type
-- 86400-86299  Sencha Column Configurations (available 800)


-- Status
SELECT im_category_new (86000, 'Active', 'Intranet Sencha Preferences Status');
SELECT im_category_new (86002, 'Deleted', 'Intranet Sencha Preferences Status');

-- Type
SELECT im_category_new (86100, 'Default', 'Intranet Sencha Preferences Type');





-----------------------------------------------------------
-- Sencha Column Configurations
--
-- A simple object to store user column_configs such as:
-- - A help item that the user does not want to see again
-- - An enabled/disabled feature of a Sencha GUI element
-- - The sort_order of a grid column
-- - ...
-- All column_configs return an empty string if they have not been defined previously.
-- Please Note: A user or admin may delete the contents of the column_configs
-- table at any moment if necessary. You need to define the default behavior 
-- in the TCL/Sencha code if there are no column_configs in the table. 

SELECT acs_object_type__create_type (
	'im_sencha_column_config',			-- object_type - only lower case letters and "_"
	'Sencha Column Configuration',			-- pretty_name - Human readable name
	'Sencha Column Configurations',			-- pretty_plural - Human readable plural
	'acs_object',					-- supertype - "acs_object" is topmost object type.
	'im_sencha_column_configs',			-- table_name - where to store data for this object?
	'column_config_id',				-- id_column - where to store object_id in the table?
	'sencha-core-config',					-- package_name - name of this package
	'f',						-- abstract_p - abstract class or not
	null,						-- type_extension_table
	'im_sencha_column_config__name'			-- name_method - a PL/SQL procedure that
							-- returns the name of the object.
);

-- Add additional meta information to allow DynFields to extend the im_sencha_column_config object.
update acs_object_types set
        status_type_table = 'im_sencha_column_configs',	-- which table contains the status_id field?
        status_column = 'column_config_status_id',		-- which column contains the status_id field?
        type_column = 'column_config_type_id'		-- which column contains the type_id field?
where object_type = 'im_sencha_column_config';

-- Object Type Tables contain the lists of all tables (except for
-- acs_objects...) that contain information about an im_sencha_column_config object.
-- This way, developers can add "extension tables" to an object to
-- hold additional DynFields, without changing the program code.
insert into acs_object_type_tables (object_type, table_name, id_column)
values ('im_sencha_column_config', 'im_sencha_column_configs', 'column_config_id');



-- Generic URLs to link to an object of type "im_sencha_column_config".
-- These URLs are used by the Full-Text Search Engine and the Workflow
-- to show links to the object type.
insert into im_biz_object_urls (object_type, url_type, url) values (
'im_sencha_column_config','view','/sencha-core/column_configs/new?display_mode=display&column_config_id=');
insert into im_biz_object_urls (object_type, url_type, url) values (
'im_sencha_column_config','edit','/sencha-core/column_configs/new?display_mode=edit&column_config_id=');


create table im_sencha_column_configs (
	-- Admin section
					-- The object_id: references acs_objects.object_id.
					-- So we can lookup object metadata such as creation_date,
					-- object_type etc in acs_objects.
	column_config_id		integer
					constraint im_sencha_column_config_id_pk
					primary key
					constraint im_sencha_column_config_id_fk
					references acs_objects,
					-- Every ]po[ object should have a "status_id" to control
					-- its lifecycle. Status_id reference im_categories, where 
					-- you can define the list of stati for this object type.
	column_config_status_id		integer 
					constraint im_sencha_column_config_status_nn
					not null
					constraint im_sencha_column_config_status_fk
					references im_categories,
					-- Every ]po[ object should have a "type_id" to allow creating
					-- sub-types of the object. Type_id references im_categories
					-- where you can define the list of subtypes per object type.
	column_config_type_id		integer 
					constraint im_sencha_column_config_type_nn
					not null
					constraint im_sencha_column_config_type_fk
					references im_categories,
	-- Key Section
					-- The user to whom this column_config belongs
	column_config_object_id		integer
					constraint im_sencha_column_config_object_nn
					not null
					constraint im_sencha_column_config_object_fk
					references acs_objects,
					-- For Sencha page: URL of the page
					-- For Portlets: label of the portlet
	column_config_url		text
					constraint im_sencha_column_config_url_nn
					not null,

	column_config_name		text
					constraint im_sencha_column_config_name_nn
					not null,
	-- Value Section
	column_config_sort_order	integer default 0,
	column_config_hidden		text default 'false',
	column_config_width		integer default 80
);

-- Speed up (frequent) queries to find all notes for a specific object.
create index im_sencha_column_configs_object_idx on im_sencha_column_configs(column_config_object_id);

-- Avoid duplicate entries.
create unique index im_sencha_column_configs_object_column_config_idx 
on im_sencha_column_configs(column_config_object_id, column_config_url, column_config_name);


create or replace function im_sencha_column_config__name(integer)
returns varchar as $body$
DECLARE
	p_column_config_id		alias for $1;
	v_name			varchar;
BEGIN
	select	acs_object__name(column_config_object_id) || ': ' || 
		column_config_url || '.' || column_config_name
	into	v_name
	from	im_sencha_column_configs
	where	column_config_id = p_column_config_id;

	return v_name;
end; $body$ language 'plpgsql';


create or replace function im_sencha_column_config__new (
	integer, varchar, timestamptz,
	integer, varchar, integer,
	integer, integer, integer,
	varchar, varchar
) returns integer as $body$
DECLARE
	p_column_config_id		alias for $1;			-- column_config_id  default null
	p_object_type   		alias for $2;			-- object_type default im_sencha_column_config
	p_creation_date 		alias for $3;			-- creation_date default now()
	p_creation_user 		alias for $4;			-- creation_user default null
	p_creation_ip   		alias for $5;			-- creation_ip default null
	p_context_id			alias for $6;			-- context_id default null

	p_column_config_type_id		alias for $7;			-- type (email, http, text comment, ...)
	p_column_config_status_id	alias for $8;			-- status ("active" or "deleted").
	p_column_config_object_id	alias for $9;			-- associated object (project, user, ...)
	p_column_config_url		alias for $10;			-- associated object (project, user, ...)
	p_column_config_name		alias for $11;			-- associated object (project, user, ...)

	v_column_config_id		integer;
BEGIN
	v_column_config_id := acs_object__new (
		p_column_config_id,				-- object_id - NULL to create a new id
		p_object_type,					-- object_type - "im_sencha_column_config"
		p_creation_date,				-- creation_date - now()
		p_creation_user,				-- creation_user - Current user or "0" for guest
		p_creation_ip,					-- creation_ip - IP from ns_conn, or "0.0.0.0"
		p_context_id,					-- context_id - NULL, not used in ]po[
		't'						-- security_inherit_p - not used in ]po[
	);
	
	insert into im_sencha_column_configs (
		column_config_id, column_config_object_id,
		column_config_type_id, column_config_status_id,
		column_config_url, column_config_name
	) values (
		v_column_config_id, p_column_config_object_id,
		p_column_config_type_id, p_column_config_status_id,
		p_column_config_url, p_column_config_name
	);

	return v_column_config_id;
END;$body$ language 'plpgsql';


create or replace function im_sencha_column_config__delete(integer)
returns integer as $body$
DECLARE
	p_column_config_id	alias for $1;
BEGIN
	-- Delete any data related to the object
	delete	from im_sencha_column_configs
	where	column_config_id = p_column_config_id;

	-- Finally delete the object iself
	PERFORM acs_object__delete(p_column_config_id);

	return 0;
end;$body$ language 'plpgsql';


-----------------------------------------------------------
-- Categories for Type and Status
--
-- 86200-86299  Sencha Column Configurations Status
-- 86300-86399  Sencha Column Configurations Type
-- 86400-86299  Sencha Column Configurations (available 800)

-- Status
SELECT im_category_new (86200, 'Active', 'Intranet Sencha Column Configurations Status');
SELECT im_category_new (86202, 'Deleted', 'Intranet Sencha Column Configurations Status');

-- Type
SELECT im_category_new (86300, 'Default', 'Intranet Sencha Column Configurations Type');

