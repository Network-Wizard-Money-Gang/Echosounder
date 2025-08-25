/*!
 * pinia v3.0.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
import { hasInjectionContext, inject, effectScope, ref, markRaw, isRef, isReactive, getCurrentScope, onScopeDispose, getCurrentInstance, reactive, toRef, toRaw, nextTick, computed, watch, toRefs } from './vue.esm-browser.js';

/**
 * setActivePinia must be called to handle SSR at the top of functions like
 * `fetch`, `setup`, `serverPrefetch` and others
 */
let activePinia;
/**
 * Sets or unsets the active pinia. Used in SSR and internally when calling
 * actions and getters
 *
 * @param pinia - Pinia instance
 */
// @ts-expect-error: cannot constrain the type of the return
const setActivePinia = (pinia) => (activePinia = pinia);
/**
 * Get the currently active pinia if there is any.
 */
const getActivePinia = () => (hasInjectionContext() && inject(piniaSymbol)) || activePinia;
const piniaSymbol = (Symbol('pinia') );

/**
 * Creates a Pinia instance to be used by the application
 */
function createPinia() {
    const scope = effectScope(true);
    // NOTE: here we could check the window object for a state and directly set it
    // if there is anything like it with Vue 3 SSR
    const state = scope.run(() => ref({}));
    let _p = [];
    // plugins added before calling app.use(pinia)
    let toBeInstalled = [];
    const pinia = markRaw({
        install(app) {
            // this allows calling useStore() outside of a component setup after
            // installing pinia's plugin
            setActivePinia(pinia);
            pinia._a = app;
            app.provide(piniaSymbol, pinia);
            app.config.globalProperties.$pinia = pinia;
            toBeInstalled.forEach((plugin) => _p.push(plugin));
            toBeInstalled = [];
        },
        use(plugin) {
            if (!this._a) {
                toBeInstalled.push(plugin);
            }
            else {
                _p.push(plugin);
            }
            return this;
        },
        _p,
        // it's actually undefined here
        // @ts-expect-error
        _a: null,
        _e: scope,
        _s: new Map(),
        state,
    });
    return pinia;
}
/**
 * Dispose a Pinia instance by stopping its effectScope and removing the state, plugins and stores. This is mostly
 * useful in tests, with both a testing pinia or a regular pinia and in applications that use multiple pinia instances.
 * Once disposed, the pinia instance cannot be used anymore.
 *
 * @param pinia - pinia instance
 */
function disposePinia(pinia) {
    pinia._e.stop();
    pinia._s.clear();
    pinia._p.splice(0);
    pinia.state.value = {};
    // @ts-expect-error: non valid
    pinia._a = null;
}

function isPlainObject(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
o) {
    return (o &&
        typeof o === 'object' &&
        Object.prototype.toString.call(o) === '[object Object]' &&
        typeof o.toJSON !== 'function');
}
// type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
// TODO: can we change these to numbers?
/**
 * Possible types for SubscriptionCallback
 */
var MutationType;
(function (MutationType) {
    /**
     * Direct mutation of the state:
     *
     * - `store.name = 'new name'`
     * - `store.$state.name = 'new name'`
     * - `store.list.push('new item')`
     */
    MutationType["direct"] = "direct";
    /**
     * Mutated the state with `$patch` and an object
     *
     * - `store.$patch({ name: 'newName' })`
     */
    MutationType["patchObject"] = "patch object";
    /**
     * Mutated the state with `$patch` and a function
     *
     * - `store.$patch(state => state.name = 'newName')`
     */
    MutationType["patchFunction"] = "patch function";
    // maybe reset? for $state = {} and $reset
})(MutationType || (MutationType = {}));

const IS_CLIENT = typeof window !== 'undefined';

/**
 * Checks if a function is a `StoreDefinition`.
 *
 * @param fn - object to test
 * @returns true if `fn` is a StoreDefinition
 */
const isUseStore = (fn) => {
    return typeof fn === 'function' && typeof fn.$id === 'string';
};
/**
 * Mutates in place `newState` with `oldState` to _hot update_ it. It will
 * remove any key not existing in `newState` and recursively merge plain
 * objects.
 *
 * @param newState - new state object to be patched
 * @param oldState - old state that should be used to patch newState
 * @returns - newState
 */
function patchObject(newState, oldState) {
    // no need to go through symbols because they cannot be serialized anyway
    for (const key in oldState) {
        const subPatch = oldState[key];
        // skip the whole sub tree
        if (!(key in newState)) {
            continue;
        }
        const targetValue = newState[key];
        if (isPlainObject(targetValue) &&
            isPlainObject(subPatch) &&
            !isRef(subPatch) &&
            !isReactive(subPatch)) {
            newState[key] = patchObject(targetValue, subPatch);
        }
        else {
            // objects are either a bit more complex (e.g. refs) or primitives, so we
            // just set the whole thing
            newState[key] = subPatch;
        }
    }
    return newState;
}
/**
 * Creates an _accept_ function to pass to `import.meta.hot` in Vite applications.
 *
 * @example
 * ```js
 * const useUser = defineStore(...)
 * if (import.meta.hot) {
 *   import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
 * }
 * ```
 *
 * @param initialUseStore - return of the defineStore to hot update
 * @param hot - `import.meta.hot`
 */
function acceptHMRUpdate(initialUseStore, hot) {
    return (newModule) => {
        const pinia = hot.data.pinia || initialUseStore._pinia;
        if (!pinia) {
            // this store is still not used
            return;
        }
        // preserve the pinia instance across loads
        hot.data.pinia = pinia;
        // console.log('got data', newStore)
        for (const exportName in newModule) {
            const useStore = newModule[exportName];
            // console.log('checking for', exportName)
            if (isUseStore(useStore) && pinia._s.has(useStore.$id)) {
                // console.log('Accepting update for', useStore.$id)
                const id = useStore.$id;
                if (id !== initialUseStore.$id) {
                    console.warn(`The id of the store changed from "${initialUseStore.$id}" to "${id}". Reloading.`);
                    // return import.meta.hot.invalidate()
                    return hot.invalidate();
                }
                const existingStore = pinia._s.get(id);
                if (!existingStore) {
                    console.log(`[Pinia]: skipping hmr because store doesn't exist yet`);
                    return;
                }
                useStore(pinia, existingStore);
            }
        }
    };
}

const noop = () => { };
function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.add(callback);
    const removeSubscription = () => {
        const isDel = subscriptions.delete(callback);
        isDel && onCleanup();
    };
    if (!detached && getCurrentScope()) {
        onScopeDispose(removeSubscription);
    }
    return removeSubscription;
}
function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.forEach((callback) => {
        callback(...args);
    });
}

const fallbackRunWithContext = (fn) => fn();
/**
 * Marks a function as an action for `$onAction`
 * @internal
 */
const ACTION_MARKER = Symbol();
/**
 * Action name symbol. Allows to add a name to an action after defining it
 * @internal
 */
const ACTION_NAME = Symbol();
function mergeReactiveObjects(target, patchToApply) {
    // Handle Map instances
    if (target instanceof Map && patchToApply instanceof Map) {
        patchToApply.forEach((value, key) => target.set(key, value));
    }
    else if (target instanceof Set && patchToApply instanceof Set) {
        // Handle Set instances
        patchToApply.forEach(target.add, target);
    }
    // no need to go through symbols because they cannot be serialized anyway
    for (const key in patchToApply) {
        if (!patchToApply.hasOwnProperty(key))
            continue;
        const subPatch = patchToApply[key];
        const targetValue = target[key];
        if (isPlainObject(targetValue) &&
            isPlainObject(subPatch) &&
            target.hasOwnProperty(key) &&
            !isRef(subPatch) &&
            !isReactive(subPatch)) {
            // NOTE: here I wanted to warn about inconsistent types but it's not possible because in setup stores one might
            // start the value of a property as a certain type e.g. a Map, and then for some reason, during SSR, change that
            // to `undefined`. When trying to hydrate, we want to override the Map with `undefined`.
            target[key] = mergeReactiveObjects(targetValue, subPatch);
        }
        else {
            // @ts-expect-error: subPatch is a valid value
            target[key] = subPatch;
        }
    }
    return target;
}
const skipHydrateSymbol = Symbol('pinia:skipHydration')
    ;
/**
 * Tells Pinia to skip the hydration process of a given object. This is useful in setup stores (only) when you return a
 * stateful object in the store but it isn't really state. e.g. returning a router instance in a setup store.
 *
 * @param obj - target object
 * @returns obj
 */
function skipHydrate(obj) {
    return Object.defineProperty(obj, skipHydrateSymbol, {});
}
/**
 * Returns whether a value should be hydrated
 *
 * @param obj - target variable
 * @returns true if `obj` should be hydrated
 */
function shouldHydrate(obj) {
    return (!isPlainObject(obj) ||
        !Object.prototype.hasOwnProperty.call(obj, skipHydrateSymbol));
}
const { assign } = Object;
function isComputed(o) {
    return !!(isRef(o) && o.effect);
}
function createOptionsStore(id, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id];
    let store;
    function setup() {
        if (!initialState && (!hot)) {
            /* istanbul ignore if */
            pinia.state.value[id] = state ? state() : {};
        }
        // avoid creating a state in pinia.state.value
        const localState = hot
            ? // use ref() to unwrap refs inside state TODO: check if this is still necessary
                toRefs(ref(state ? state() : {}).value)
            : toRefs(pinia.state.value[id]);
        return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
            if (name in localState) {
                console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
            }
            computedGetters[name] = markRaw(computed(() => {
                setActivePinia(pinia);
                // it was created just before
                const store = pinia._s.get(id);
                // allow cross using stores
                // @ts-expect-error
                // return getters![name].call(context, context)
                // TODO: avoid reading the getter while assigning with a global variable
                return getters[name].call(store, store);
            }));
            return computedGetters;
        }, {}));
    }
    store = createSetupStore(id, setup, options, pinia, hot, true);
    return store;
}
function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    /* istanbul ignore if */
    if (!pinia._e.active) {
        throw new Error('Pinia destroyed');
    }
    // watcher options for $subscribe
    const $subscribeOptions = { deep: true };
    /* istanbul ignore else */
    {
        $subscribeOptions.onTrigger = (event) => {
            /* istanbul ignore else */
            if (isListening) {
                debuggerEvents = event;
                // avoid triggering this while the store is being built and the state is being set in pinia
            }
            else if (isListening == false && !store._hotUpdating) {
                // let patch send all the events together later
                /* istanbul ignore else */
                if (Array.isArray(debuggerEvents)) {
                    debuggerEvents.push(event);
                }
                else {
                    console.error('🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.');
                }
            }
        };
    }
    // internal state
    let isListening; // set to true at the end
    let isSyncListening; // set to true at the end
    let subscriptions = new Set();
    let actionSubscriptions = new Set();
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    // avoid setting the state for option stores if it is set
    // by the setup
    if (!isOptionsStore && !initialState && (!hot)) {
        /* istanbul ignore if */
        pinia.state.value[$id] = {};
    }
    const hotState = ref({});
    // avoid triggering too many listeners
    // https://github.com/vuejs/pinia/issues/1129
    let activeListener;
    function $patch(partialStateOrMutator) {
        let subscriptionMutation;
        isListening = isSyncListening = false;
        // reset the debugger events since patches are sync
        /* istanbul ignore else */
        {
            debuggerEvents = [];
        }
        if (typeof partialStateOrMutator === 'function') {
            partialStateOrMutator(pinia.state.value[$id]);
            subscriptionMutation = {
                type: MutationType.patchFunction,
                storeId: $id,
                events: debuggerEvents,
            };
        }
        else {
            mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
            subscriptionMutation = {
                type: MutationType.patchObject,
                payload: partialStateOrMutator,
                storeId: $id,
                events: debuggerEvents,
            };
        }
        const myListenerId = (activeListener = Symbol());
        nextTick().then(() => {
            if (activeListener === myListenerId) {
                isListening = true;
            }
        });
        isSyncListening = true;
        // because we paused the watcher, we need to manually call the subscriptions
        triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore
        ? function $reset() {
            const { state } = options;
            const newState = state ? state() : {};
            // we use a patch to group all changes into one single subscription
            this.$patch(($state) => {
                // @ts-expect-error: FIXME: shouldn't error?
                assign($state, newState);
            });
        }
        : /* istanbul ignore next */
            () => {
                    throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
                }
                ;
    function $dispose() {
        scope.stop();
        subscriptions.clear();
        actionSubscriptions.clear();
        pinia._s.delete($id);
    }
    /**
     * Helper that wraps function so it can be tracked with $onAction
     * @param fn - action to wrap
     * @param name - name of the action
     */
    const action = (fn, name = '') => {
        if (ACTION_MARKER in fn) {
            fn[ACTION_NAME] = name;
            return fn;
        }
        const wrappedAction = function () {
            setActivePinia(pinia);
            const args = Array.from(arguments);
            const afterCallbackSet = new Set();
            const onErrorCallbackSet = new Set();
            function after(callback) {
                afterCallbackSet.add(callback);
            }
            function onError(callback) {
                onErrorCallbackSet.add(callback);
            }
            // @ts-expect-error
            triggerSubscriptions(actionSubscriptions, {
                args,
                name: wrappedAction[ACTION_NAME],
                store,
                after,
                onError,
            });
            let ret;
            try {
                ret = fn.apply(this && this.$id === $id ? this : store, args);
                // handle sync errors
            }
            catch (error) {
                triggerSubscriptions(onErrorCallbackSet, error);
                throw error;
            }
            if (ret instanceof Promise) {
                return ret
                    .then((value) => {
                    triggerSubscriptions(afterCallbackSet, value);
                    return value;
                })
                    .catch((error) => {
                    triggerSubscriptions(onErrorCallbackSet, error);
                    return Promise.reject(error);
                });
            }
            // trigger after callbacks
            triggerSubscriptions(afterCallbackSet, ret);
            return ret;
        };
        wrappedAction[ACTION_MARKER] = true;
        wrappedAction[ACTION_NAME] = name; // will be set later
        // @ts-expect-error: we are intentionally limiting the returned type to just Fn
        // because all the added properties are internals that are exposed through `$onAction()` only
        return wrappedAction;
    };
    const _hmrPayload = /*#__PURE__*/ markRaw({
        actions: {},
        getters: {},
        state: [],
        hotState,
    });
    const partialStore = {
        _p: pinia,
        // _s: scope,
        $id,
        $onAction: addSubscription.bind(null, actionSubscriptions),
        $patch,
        $reset,
        $subscribe(callback, options = {}) {
            const removeSubscription = addSubscription(subscriptions, callback, options.detached, () => stopWatcher());
            const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
                if (options.flush === 'sync' ? isSyncListening : isListening) {
                    callback({
                        storeId: $id,
                        type: MutationType.direct,
                        events: debuggerEvents,
                    }, state);
                }
            }, assign({}, $subscribeOptions, options)));
            return removeSubscription;
        },
        $dispose,
    };
    const store = reactive(assign({
            _hmrPayload,
            _customProperties: markRaw(new Set()), // devtools custom properties
        }, partialStore
        // must be added later
        // setupStore
        )
        );
    // store the partial store now so the setup of stores can instantiate each other before they are finished without
    // creating infinite loops.
    pinia._s.set($id, store);
    const runWithContext = (pinia._a && pinia._a.runWithContext) || fallbackRunWithContext;
    // TODO: idea create skipSerialize that marks properties as non serializable and they are skipped
    const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(() => setup({ action }))));
    // overwrite existing actions to support $onAction
    for (const key in setupStore) {
        const prop = setupStore[key];
        if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
            // mark it as a piece of state to be serialized
            if (hot) {
                hotState.value[key] = toRef(setupStore, key);
                // createOptionStore directly sets the state in pinia.state.value so we
                // can just skip that
            }
            else if (!isOptionsStore) {
                // in setup stores we must hydrate the state and sync pinia state tree with the refs the user just created
                if (initialState && shouldHydrate(prop)) {
                    if (isRef(prop)) {
                        prop.value = initialState[key];
                    }
                    else {
                        // probably a reactive object, lets recursively assign
                        // @ts-expect-error: prop is unknown
                        mergeReactiveObjects(prop, initialState[key]);
                    }
                }
                // transfer the ref to the pinia state to keep everything in sync
                pinia.state.value[$id][key] = prop;
            }
            /* istanbul ignore else */
            {
                _hmrPayload.state.push(key);
            }
            // action
        }
        else if (typeof prop === 'function') {
            const actionValue = hot ? prop : action(prop, key);
            // this a hot module replacement store because the hotUpdate method needs
            // to do it with the right context
            // @ts-expect-error
            setupStore[key] = actionValue;
            /* istanbul ignore else */
            {
                _hmrPayload.actions[key] = prop;
            }
            // list actions so they can be used in plugins
            // @ts-expect-error
            optionsForPlugin.actions[key] = prop;
        }
        else {
            // add getters for devtools
            if (isComputed(prop)) {
                _hmrPayload.getters[key] = isOptionsStore
                    ? // @ts-expect-error
                        options.getters[key]
                    : prop;
                if (IS_CLIENT) {
                    const getters = setupStore._getters ||
                        // @ts-expect-error: same
                        (setupStore._getters = markRaw([]));
                    getters.push(key);
                }
            }
        }
    }
    // add the state, getters, and action properties
    /* istanbul ignore if */
    assign(store, setupStore);
    // allows retrieving reactive objects with `storeToRefs()`. Must be called after assigning to the reactive object.
    // Make `storeToRefs()` work with `reactive()` #799
    assign(toRaw(store), setupStore);
    // use this instead of a computed with setter to be able to create it anywhere
    // without linking the computed lifespan to wherever the store is first
    // created.
    Object.defineProperty(store, '$state', {
        get: () => (hot ? hotState.value : pinia.state.value[$id]),
        set: (state) => {
            /* istanbul ignore if */
            if (hot) {
                throw new Error('cannot set hotState');
            }
            $patch(($state) => {
                // @ts-expect-error: FIXME: shouldn't error?
                assign($state, state);
            });
        },
    });
    // add the hotUpdate before plugins to allow them to override it
    /* istanbul ignore else */
    {
        store._hotUpdate = markRaw((newStore) => {
            store._hotUpdating = true;
            newStore._hmrPayload.state.forEach((stateKey) => {
                if (stateKey in store.$state) {
                    const newStateTarget = newStore.$state[stateKey];
                    const oldStateSource = store.$state[stateKey];
                    if (typeof newStateTarget === 'object' &&
                        isPlainObject(newStateTarget) &&
                        isPlainObject(oldStateSource)) {
                        patchObject(newStateTarget, oldStateSource);
                    }
                    else {
                        // transfer the ref
                        newStore.$state[stateKey] = oldStateSource;
                    }
                }
                // patch direct access properties to allow store.stateProperty to work as
                // store.$state.stateProperty
                // @ts-expect-error: any type
                store[stateKey] = toRef(newStore.$state, stateKey);
            });
            // remove deleted state properties
            Object.keys(store.$state).forEach((stateKey) => {
                if (!(stateKey in newStore.$state)) {
                    // @ts-expect-error: noop if doesn't exist
                    delete store[stateKey];
                }
            });
            // avoid devtools logging this as a mutation
            isListening = false;
            isSyncListening = false;
            pinia.state.value[$id] = toRef(newStore._hmrPayload, 'hotState');
            isSyncListening = true;
            nextTick().then(() => {
                isListening = true;
            });
            for (const actionName in newStore._hmrPayload.actions) {
                const actionFn = newStore[actionName];
                // @ts-expect-error: actionName is a string
                store[actionName] =
                    //
                    action(actionFn, actionName);
            }
            // TODO: does this work in both setup and option store?
            for (const getterName in newStore._hmrPayload.getters) {
                const getter = newStore._hmrPayload.getters[getterName];
                const getterValue = isOptionsStore
                    ? // special handling of options api
                        computed(() => {
                            setActivePinia(pinia);
                            return getter.call(store, store);
                        })
                    : getter;
                // @ts-expect-error: getterName is a string
                store[getterName] =
                    //
                    getterValue;
            }
            // remove deleted getters
            Object.keys(store._hmrPayload.getters).forEach((key) => {
                if (!(key in newStore._hmrPayload.getters)) {
                    // @ts-expect-error: noop if doesn't exist
                    delete store[key];
                }
            });
            // remove old actions
            Object.keys(store._hmrPayload.actions).forEach((key) => {
                if (!(key in newStore._hmrPayload.actions)) {
                    // @ts-expect-error: noop if doesn't exist
                    delete store[key];
                }
            });
            // update the values used in devtools and to allow deleting new properties later on
            store._hmrPayload = newStore._hmrPayload;
            store._getters = newStore._getters;
            store._hotUpdating = false;
        });
    }
    if (IS_CLIENT) {
        const nonEnumerable = {
            writable: true,
            configurable: true,
            // avoid warning on devtools trying to display this property
            enumerable: false,
        };
        ['_p', '_hmrPayload', '_getters', '_customProperties'].forEach((p) => {
            Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
        });
    }
    // apply all plugins
    pinia._p.forEach((extender) => {
        /* istanbul ignore else */
        if (IS_CLIENT) {
            const extensions = scope.run(() => extender({
                store: store,
                app: pinia._a,
                pinia,
                options: optionsForPlugin,
            }));
            Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
            assign(store, extensions);
        }
        else {
            assign(store, scope.run(() => extender({
                store: store,
                app: pinia._a,
                pinia,
                options: optionsForPlugin,
            })));
        }
    });
    if (store.$state &&
        typeof store.$state === 'object' &&
        typeof store.$state.constructor === 'function' &&
        !store.$state.constructor.toString().includes('[native code]')) {
        console.warn(`[🍍]: The "state" must be a plain object. It cannot be\n` +
            `\tstate: () => new MyClass()\n` +
            `Found in store "${store.$id}".`);
    }
    // only apply hydrate to option stores with an initial state in pinia
    if (initialState &&
        isOptionsStore &&
        options.hydrate) {
        options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
}
// allows unused stores to be tree shaken
/*! #__NO_SIDE_EFFECTS__ */
function defineStore(
// TODO: add proper types from above
id, setup, setupOptions) {
    let options;
    const isSetupStore = typeof setup === 'function';
    // the option store setup will contain the actual options in this case
    options = isSetupStore ? setupOptions : setup;
    function useStore(pinia, hot) {
        const hasContext = hasInjectionContext();
        pinia =
            // in test mode, ignore the argument provided as we can always retrieve a
            // pinia instance with getActivePinia()
            (pinia) ||
                (hasContext ? inject(piniaSymbol, null) : null);
        if (pinia)
            setActivePinia(pinia);
        if (!activePinia) {
            throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?\n` +
                `See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.\n` +
                `This will fail in production.`);
        }
        pinia = activePinia;
        if (!pinia._s.has(id)) {
            // creating the store registers it in `pinia._s`
            if (isSetupStore) {
                createSetupStore(id, setup, options, pinia);
            }
            else {
                createOptionsStore(id, options, pinia);
            }
            /* istanbul ignore else */
            {
                // @ts-expect-error: not the right inferred type
                useStore._pinia = pinia;
            }
        }
        const store = pinia._s.get(id);
        if (hot) {
            const hotId = '__hot:' + id;
            const newStore = isSetupStore
                ? createSetupStore(hotId, setup, options, pinia, true)
                : createOptionsStore(hotId, assign({}, options), pinia, true);
            hot._hotUpdate(newStore);
            // cleanup the state properties and the store from the cache
            delete pinia.state.value[hotId];
            pinia._s.delete(hotId);
        }
        if (IS_CLIENT) {
            const currentInstance = getCurrentInstance();
            // save stores in instances to access them devtools
            if (currentInstance &&
                currentInstance.proxy &&
                // avoid adding stores that are just built for hot module replacement
                !hot) {
                const vm = currentInstance.proxy;
                const cache = '_pStores' in vm ? vm._pStores : (vm._pStores = {});
                cache[id] = store;
            }
        }
        // StoreGeneric cannot be casted towards Store
        return store;
    }
    useStore.$id = id;
    return useStore;
}

let mapStoreSuffix = 'Store';
/**
 * Changes the suffix added by `mapStores()`. Can be set to an empty string.
 * Defaults to `"Store"`. Make sure to extend the MapStoresCustomization
 * interface if you are using TypeScript.
 *
 * @param suffix - new suffix
 */
function setMapStoreSuffix(suffix // could be 'Store' but that would be annoying for JS
) {
    mapStoreSuffix = suffix;
}
/**
 * Allows using stores without the composition API (`setup()`) by generating an
 * object to be spread in the `computed` field of a component. It accepts a list
 * of store definitions.
 *
 * @example
 * ```js
 * export default {
 *   computed: {
 *     // other computed properties
 *     ...mapStores(useUserStore, useCartStore)
 *   },
 *
 *   created() {
 *     this.userStore // store with id "user"
 *     this.cartStore // store with id "cart"
 *   }
 * }
 * ```
 *
 * @param stores - list of stores to map to an object
 */
function mapStores(...stores) {
    if (Array.isArray(stores[0])) {
        console.warn(`[🍍]: Directly pass all stores to "mapStores()" without putting them in an array:\n` +
            `Replace\n` +
            `\tmapStores([useAuthStore, useCartStore])\n` +
            `with\n` +
            `\tmapStores(useAuthStore, useCartStore)\n` +
            `This will fail in production if not fixed.`);
        stores = stores[0];
    }
    return stores.reduce((reduced, useStore) => {
        // @ts-expect-error: $id is added by defineStore
        reduced[useStore.$id + mapStoreSuffix] = function () {
            return useStore(this.$pinia);
        };
        return reduced;
    }, {});
}
/**
 * Allows using state and getters from one store without using the composition
 * API (`setup()`) by generating an object to be spread in the `computed` field
 * of a component.
 *
 * @param useStore - store to map from
 * @param keysOrMapper - array or object
 */
function mapState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper)
        ? keysOrMapper.reduce((reduced, key) => {
            reduced[key] = function () {
                // @ts-expect-error: FIXME: should work?
                return useStore(this.$pinia)[key];
            };
            return reduced;
        }, {})
        : Object.keys(keysOrMapper).reduce((reduced, key) => {
            // @ts-expect-error
            reduced[key] = function () {
                const store = useStore(this.$pinia);
                const storeKey = keysOrMapper[key];
                // for some reason TS is unable to infer the type of storeKey to be a
                // function
                return typeof storeKey === 'function'
                    ? storeKey.call(this, store)
                    : // @ts-expect-error: FIXME: should work?
                        store[storeKey];
            };
            return reduced;
        }, {});
}
/**
 * Alias for `mapState()`. You should use `mapState()` instead.
 * @deprecated use `mapState()` instead.
 */
const mapGetters = mapState;
/**
 * Allows directly using actions from your store without using the composition
 * API (`setup()`) by generating an object to be spread in the `methods` field
 * of a component.
 *
 * @param useStore - store to map from
 * @param keysOrMapper - array or object
 */
function mapActions(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper)
        ? keysOrMapper.reduce((reduced, key) => {
            // @ts-expect-error
            reduced[key] = function (...args) {
                // @ts-expect-error: FIXME: should work?
                return useStore(this.$pinia)[key](...args);
            };
            return reduced;
        }, {})
        : Object.keys(keysOrMapper).reduce((reduced, key) => {
            // @ts-expect-error
            reduced[key] = function (...args) {
                // @ts-expect-error: FIXME: should work?
                return useStore(this.$pinia)[keysOrMapper[key]](...args);
            };
            return reduced;
        }, {});
}
/**
 * Allows using state and getters from one store without using the composition
 * API (`setup()`) by generating an object to be spread in the `computed` field
 * of a component.
 *
 * @param useStore - store to map from
 * @param keysOrMapper - array or object
 */
function mapWritableState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper)
        ? keysOrMapper.reduce((reduced, key) => {
            reduced[key] = {
                get() {
                    return useStore(this.$pinia)[key];
                },
                set(value) {
                    return (useStore(this.$pinia)[key] = value);
                },
            };
            return reduced;
        }, {})
        : Object.keys(keysOrMapper).reduce((reduced, key) => {
            reduced[key] = {
                get() {
                    return useStore(this.$pinia)[keysOrMapper[key]];
                },
                set(value) {
                    return (useStore(this.$pinia)[keysOrMapper[key]] = value);
                },
            };
            return reduced;
        }, {});
}

/**
 * Creates an object of references with all the state, getters, and plugin-added
 * state properties of the store. Similar to `toRefs()` but specifically
 * designed for Pinia stores so methods and non reactive properties are
 * completely ignored.
 *
 * @param store - store to extract the refs from
 */
function storeToRefs(store) {
    const rawStore = toRaw(store);
    const refs = {};
    for (const key in rawStore) {
        const value = rawStore[key];
        // There is no native method to check for a computed
        // https://github.com/vuejs/core/pull/4165
        if (value.effect) {
            // @ts-expect-error: too hard to type correctly
            refs[key] =
                // ...
                computed({
                    get: () => store[key],
                    set(value) {
                        store[key] = value;
                    },
                });
        }
        else if (isRef(value) || isReactive(value)) {
            // @ts-expect-error: the key is state or getter
            refs[key] =
                // ---
                toRef(store, key);
        }
    }
    return refs;
}

export { MutationType, acceptHMRUpdate, createPinia, defineStore, disposePinia, getActivePinia, mapActions, mapGetters, mapState, mapStores, mapWritableState, setActivePinia, setMapStoreSuffix, shouldHydrate, skipHydrate, storeToRefs };
