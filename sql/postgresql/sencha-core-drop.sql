-- /package/sencha-core/sql/postgresql/sencha-core-drop.sql
--
-- Copyright (c) 2003-2015 ]project-open[
--
-- All rights reserved. Please check
-- http://www.project-open.com/license/ for details.
--
-- @author frank.bergmann@project-open.com


-- Drop plugins and menus for the module
--
select  im_component_plugin__del_module('sencha-core');
select  im_menu__del_module('sencha-core');


-----------------------------------------------------------
-- Drop functions
--
drop  function im_sencha_preference__name(integer);
drop  function im_sencha_preference__new (
        integer, varchar, timestamptz,
        integer, varchar, integer,
        integer, integer, integer,
        varchar, varchar);
drop  function im_sencha_preference__new (
        integer, varchar, timestamptz,
        integer, varchar, integer,
        integer, integer, integer,
        varchar, varchar, varchar);
drop	function im_sencha_preference__delete(integer);


-----------------------------------------------------------
-- Drop Table
--
drop table im_sencha_preferences;


-----------------------------------------------------------
-- Drop Categories
--
delete from im_categories where category_type = 'Intranet Sencha Preferences Status';
delete from im_categories where category_type = 'Intranet Sencha Preferences Type';


-----------------------------------------------------------
-- Completely delete the object type from the
-- object system

delete from im_biz_object_urls
where object_type = 'im_sencha_preference';

delete from acs_object_type_tables
where object_type = 'im_sencha_preference';

-- Delete entries from acs_objects
delete from acs_objects where object_type = 'im_sencha_preference';


-----------------------------------------------------------
-- Delete the REST object_type_id generated automatically
-- by the REST interface
--
delete from im_rest_object_types
where object_type = 'im_sencha_preference';

-- Delete permissions for deleted REST object types
delete from acs_permissions
where	object_id in (
		select	object_id
		from	acs_objects
		where	object_type = 'im_rest_object_type'
	) and
	object_id not in (
		select	object_type_id
		from	im_rest_object_types
	);

--
delete from acs_objects 
where	object_type = 'im_rest_object_type' and
	object_id not in (
		select	object_type_id
		from	im_rest_object_types
	);


-----------------------------------------------------------
-- Finally drop the entire object type
--
SELECT acs_object_type__drop_type ('im_sencha_preference', 't');
