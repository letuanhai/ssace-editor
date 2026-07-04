/**
 * Shared default values for options.js and sw.js.
 *
 * Plain script (no ES modules): loaded via importScripts() in the service worker
 * and via a <script> tag on options.html.
 *
 * DEFAULT_SAS_SNIPPETS is the hand-written custom snippet text that used to live
 * baked into lib/ace/src-noconflict/snippets/sas.js (that file is back to stock
 * ace content now, see DESIGN.md Phase 3 "Snippet un-vendoring"). It's additive
 * over ace's own built-in SAS snippets (parseSnippetFile + register are additive,
 * not a replacement) - native Ace snippet format (`snippet trigger` / tab-indented
 * body), no invented schema.
 */
var DEFAULT_SAS_SNIPPETS = `snippet lua
	proc lua;
	    submit;
	-------- Lua code start --------------*/
	$1
	-------- Lua code end --------------*/
	    endsubmit;
	run;

snippet plog
	putlog \${1:var1}=\${2:var2}=;

snippet cm
	/* $1 */

snippet sqlpass
	proc sql;
		%connect_to_dwh(country=\${1:&country.}, conn_name=dwh);

		create table \${2:tmp_tbl} as
		select * from connection to dwh
		(
	/*-------- Passthrough SQL start --------------*/
		select $4
		from &CONN_WAREHOUSE..$3
	/*-------- Passthrough SQL end --------------*/
		) ;

		disconnect from dwh;
	quit;
`;
