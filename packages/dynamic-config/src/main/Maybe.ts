export type MaybeMapping<A, B> =
    (val: A) => B

export type MaybePredicate<T> =
    (val: T) => boolean

export abstract class Maybe<T> {
    public static fromNullable<T>(val: T | undefined | null): Maybe<T> {
        if (val === null || val === undefined) {
            return new Nothing<T>()
        } else {
            return new Just<T>(val)
        }
    }

    public static nothing<T>(): Nothing<T> {
        return new Nothing<T>()
    }

    public static just<T>(val: T): Just<T> {
        return new Just<T>(val)
    }

    /**
     * Returns a new Maybe containing the values, as an array, of the given Maybes. If any of the given
     * Maybes is a Nothing a Nothing is returned.
     */
    public static all<A, B>(a: Maybe<A>, b: Maybe<B>): Maybe<[A, B]>
    public static all<A, B, C>(a: Maybe<A>, b: Maybe<B>, c: Maybe<C>): Maybe<[A, B, C]>
    public static all<A, B, C, D>(a: Maybe<A>, b: Maybe<B>, c: Maybe<C>, d: Maybe<D>): Maybe<[A, B, C, D]>
    public static all(...args: Array<Maybe<any>>): Maybe<any> {
        const values: Array<any> = []
        for (const item of args) {
            if (item.isNothing()) {
                return new Nothing()
            } else {
                values.push(item.get())
            }
        }

        return new Just(values)
    }

    public abstract join<A>(this: Maybe<Maybe<A>>): Maybe<A>

    public abstract fork<B>(justFn: (val: T) => B, _: () => B): B

    public abstract map<B>(mapping: MaybeMapping<T, B>): Maybe<B>

    public abstract chain<B>(mapping: (val: T) => Maybe<B>): Maybe<B>

    public abstract filter(predicate: MaybePredicate<T>): Maybe<T>

    public abstract get(): T

    public abstract getOrElse(defaultValue: T): T

    public abstract isJust(): boolean

    public abstract isNothing(): boolean
}

export class Just<T> extends Maybe<T> {
    public static create<B>(val: B): Just<B> {
        return new Just<B>(val)
    }

    private value: T

    constructor(val: T) {
        super()
        this.value = val
    }

    public toString(): string {
        return `Just(${this.value})`
    }

    /**
     * join :: Maybe (Maybe a) -> Maybe a
     *
     * Takes a nested Maybe and removes one level of nesting.
     *
     * @name join
     * @method
     * @memberof Maybe#
     * @returns {Maybe}
     */
    public join<A>(this: Maybe<Maybe<A>>): Maybe<A> {
        return this.get()
    }

    /**
     * @name fork
     * @method
     * @memberof Maybe#
     * @param {Function} justFn Function to call with value of Just
     * @param {Function} nothingFn Function to call with value of Nothing
     * @returns {*} The return value of the matching function
     */
    public fork<B>(justFn: (val: T) => B, _: () => B): B {
        return justFn(this.value)
    }

    /**
     * map :: Maybe a -> (a -> b) -> Maybe b
     *
     * Transforms the value of a Maybe with the given function.
     *
     * @name map
     * @method
     * @memberof Maybe#
     * @param {Function} mapping Function used to map value of Maybe
     * @returns {Maybe}
     */
    public map<B>(mapping: MaybeMapping<T, B>): Maybe<B> {
        return new Just<B>(mapping(this.value))
    }

    /**
     * chain :: Maybe a -> (a -> Maybe b) -> Maybe b
     *
     * Takes the value of a Maybe and gives it to a function that returns a new Maybe.
     *
     * @name chain
     * @method
     * @memberof Maybe#
     * @param {Function} mapping Function used to create new Maybe
     * @returns {Maybe}
     */
    public chain<B>(mapping: (val: T) => Maybe<B>): Maybe<B> {
        return this.map(mapping).join()
    }

    /**
     * filter :: Maybe a -> (a -> Boolean) -> Maybe a
     *
     * Turns a Just into a Nothing if the predicate returns false
     *
     * @name filter
     * @method
     * @memberof Maybe#
     * @param {Function} predicate Function used to test value
     * @returns {Maybe}
     */
    public filter(predicate: MaybePredicate<T>): Maybe<T> {
        if (predicate(this.value)) {
            return new Just<T>(this.value)
        } else {
            return new Nothing<T>()
        }
    }

    /**
     * get :: Maybe a -> a
     *
     * Extract the value from a Maybe
     *
     * @name get
     * @method
     * @memberof Maybe#
     * @returns {*}
     */
    public get(): T {
        return this.value
    }

    /**
     * getOrElse :: Maybe a -> a -> a
     *
     * @name getOrElse
     * @method
     * @memberof Maybe#
     * @returns {*}
     */
    public getOrElse(_: T): T {
        return this.value
    }

    /**
     * isNothing :: Maybe a -> Boolean
     *
     * @name isNothing
     * @method
     * @memberof Maybe#
     * @returns {Boolean}
     */
    public isNothing(): boolean {
        return false
    }

    /**
     * isJust :: Maybe a -> Boolean
     *
     * @name isJust
     * @method
     * @memberof Maybe#
     * @returns {Boolean}
     */
    public isJust(): boolean {
        return true
    }
}

export class Nothing<T> extends Maybe<T> {
    public static create<B>(): Nothing<B> {
        return new Nothing<B>()
    }

    public toString(): string {
        return 'Nothing'
    }

    public fork<B>(_: (val: T) => B, nothingFn: () => B): B {
        return nothingFn()
    }

    public join<A>(this: Maybe<Maybe<A>>): Maybe<A> {
        return new Nothing<A>()
    }

    public map<B>(_: MaybeMapping<T, B>): Maybe<B> {
        return new Nothing<B>()
    }

    public filter(_: MaybePredicate<T>): Maybe<T> {
        return new Nothing<T>()
    }

    public chain<B>(_: (val: T) => Maybe<B>): Maybe<B> {
        return new Nothing<B>()
    }

    public get(): T {
        throw new Error('Cannot get the value of a Nothing')
    }

    public getOrElse(val: T): T {
        return val
    }

    public isJust(): boolean {
        return false
    }

    public isNothing(): boolean {
        return true
    }
}
