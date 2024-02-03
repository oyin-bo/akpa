// @ts-check

(function (global_this, global_window, global_self, module_withExports) {

const version = '0.0.14';

/**
 * @template [T=any]
 * @template [TBuffer = T[]]
 * @typedef {{
 *  yield: (item: T, combine?: (buffer: TBuffer | undefined, item: T) => TBuffer) => Promise<void>,
 *  reject: (error: Error) => void,
 *  complete: () => void,
 *  isEnded: boolean,
 *  finally: Promise<void>
 * }} StreamParameters
 */

/**
 * @template [T=any]
 * @template [TBuffer = T[]]
 * @param {(args: StreamParameters<T, TBuffer>) => void } callback
 * @returns {AsyncGenerator<TBuffer, void, unknown>}
 */
async function* streamBuffer(callback) {

  let finallyTrigger = () => { };
  let stop = false;

  /** @type {TBuffer | undefined} */
  let buffer;

  let continueTrigger = () => { };
  /** @type {Promise<void>} */
  let continuePromise = new Promise(resolve => continueTrigger = resolve);

  let yieldPassedTrigger = () => { };
  /** @type {Promise<void>} */
  let yieldPassedPromise = new Promise(resolve => yieldPassedTrigger = resolve);

  /** @type {{ error: Error } | undefined} */
  let rejectError;

  /** @type {Parameters<typeof callback>[0]} */
  const args = {
    yield: yieldFn,
    reject,
    complete,
    isEnded: false,
    finally: new Promise(resolve => finallyTrigger = resolve)
  };

  callback(args);

  try {
    while (!stop) {

      await continuePromise;
      if (rejectError)
        throw rejectError.error;
      if (stop) return;

      continuePromise = new Promise(resolve => continueTrigger = resolve);
      const yieldBuffer = buffer;
      buffer = undefined;

      if (yieldBuffer) {
        yield yieldBuffer;

        const yieldCompleted = yieldPassedTrigger;
        yieldPassedPromise = new Promise(resolve => yieldPassedTrigger = resolve);

        yieldCompleted();
      }
    }

  } finally {
    finallyTrigger();
  }

  /**
   * @param {T} item
   * @param {(buffer: TBuffer | undefined, item: T) => TBuffer} [combine]
   */
  function yieldFn(item, combine) {
    if (stop) {
      console.error('Cannot yield after complete.');
      return /** @type Promise<void> */(new Promise(resolve => resolve()));
    }
    if (rejectError) {
      console.error('Cannot yield after reject.');
      return /** @type Promise<void> */(new Promise(resolve => resolve()));
    }

    if (typeof combine === 'function') {
      buffer = combine(buffer, item);
    } else {
      if (!buffer) buffer = /** @type {TBuffer} */([]);
      /** @type {*} */(buffer).push(item);
    }

    continueTrigger();

    return yieldPassedPromise;
  }

  /** @param {Error} error */
  function reject(error) {
    if (stop) {
      console.error('Cannot reject after complete.');
      return;
    }
    if (rejectError) {
      console.error('Cannot reject after reject.');
      return;
    }

    rejectError = { error };
    args.isEnded = true;
  }

  function complete() {
    stop = true;
    args.isEnded = true;
    continueTrigger();
  }
}

/**
 * @template T
 * @template [TProject = T]
 * @param {AsyncIterable<T>} input
 * @param {(item: T) => TProject} [project]
 */
async function* map(input, project) {
  for await (const item of input) {
    const mapped = project ? project(item) : item;
    yield mapped;
  }
}

/**
 * @template T
 * @template [TProject=T extends Array ? T[0] : T]
 * @param {AsyncIterable<T>} input
 * @param {(item: T) => Iterable<TProject> | AsyncIterable<TProject>} [project]
 * @returns {AsyncIterable<TProject>}
 * }}
 */
async function* mergeMap(input, project) {
  for await (const item of input) {
    const mapped = project ? project(item) : item;
    for await (const subItem of /** @type {AsyncIterable<TProject>} */(mapped)) {
      yield subItem;
    }
  }
}

/**
 * @template T
 * @param {(arg: StreamParameters<T>) => void } callback
 */
function streamEvery(callback) {
  return mergeMap(streamBuffer(callback));
}

const akpa = {
  version,
  streamBuffer,
  streamEvery,
  mergeMap,
  map
};

if (module_withExports) {
  module_withExports.exports = akpa;
} else {
  for (const entry in [global_this, global_window, global_self]) {
    /** @type {{ akpa?: typeof akpa }} */(entry).akpa = akpa;
  }
}

})(
  this,
  typeof window !== 'undefined' && window,
  typeof self !== 'undefined' && self,
  typeof module !== undefined && module && module.exports && module
)