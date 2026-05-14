export type CrossIntersect<A, B> =
    A extends unknown ? (B extends unknown ? A & B : never) : never;

export type IsTrue<T extends boolean | undefined> = [T] extends [true] ? true : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type AnyKeyOf<V> = V extends unknown ? keyof V : never;

type StrictAllowedKeysFor<F, V> =
    V extends unknown ? (F extends V ? keyof V : never) : never;

export type AllowedKeysFor<F, V> =
    StrictAllowedKeysFor<F, V> extends infer S extends PropertyKey
    ? [S] extends [never] ? AnyKeyOf<V> : S
    : AnyKeyOf<V>;

export type ExtraKeyError<F, Allowed extends PropertyKey> = {
    [K in Exclude<keyof F, Allowed>]: { __error: `Unexpected key '${K & string}'` };
};