-- upgrade-5.0.3.0.1-5.0.3.0.2.sql
SELECT acs_log__debug('/packages/sencha-core/sql/postgresql/upgrade/upgrade-5.0.3.0.1-5.0.3.0.2.sql','');


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
	-- Check for duplicate. This is a workaround for very
	-- strange cases where this check in TCL does not work.
	select	preference_id
	into	v_preference_id
	from	im_sencha_preferences
	where	preference_object_id = p_preference_object_id and
		preference_url = p_preference_url and
		preference_key = p_preference_key;

	IF v_preference_id is null THEN
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
	ELSE
		update	im_sencha_preferences
		set	preference_value = p_preference_value
		where	preference_id = v_preference_id;
	END IF;

	return v_preference_id;
END;$body$ language 'plpgsql';

