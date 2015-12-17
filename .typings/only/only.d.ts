declare module "only" {
    // Return whitelisted properties of an object.
    // An array or space-delimited string may be given:
    function only(obj, keys):Object;
	export = only;
}
