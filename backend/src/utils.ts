// -----------------------------------------------------------------------------
// Type utilities
export function hasProperty<
	Obj extends object,
	Prop extends PropertyKey>
	(obj: Obj, prop: Prop): obj is Obj & Record<Prop, unknown> {
	return prop in obj;
}