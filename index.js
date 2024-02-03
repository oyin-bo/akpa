(function (global_this, global_window, global_self, module_withExports) {

  const akpa = {
    version: '0.0.4',
    streamBuffer,
    streamEvery,
    mergeMap
  };

  if (module_withExports) {
    module_withExports.exports = akpa;
  } else {
    for (const entry in [global_this, global_window, global_self]) {
      entry.akpa = akpa;
    }
  }

  /**
   * @template T
   * @param {({ yield, reject, complete, finally }: {
   *  yield: (item: T) => Promise<void>,
   *  reject: (error: Error) => void,
   *  complete: () => void,
   *  finally: Promise<void>
   * }) => void } callback
   * @returns {AsyncGenerator<T[], void, unknown>}
   */
  async function* streamBuffer(callback) {

    let finallyTrigger = () => { };
    let stop = false;
    let buffer = [];

    let continueTrigger = () => { };
    let continuePromise = new Promise(resolve => continueTrigger = resolve);

    let yieldCompletedTrigger = () => { };
    let yieldCompletedPromise = new Promise(resolve => yieldCompletedTrigger = resolve);

    let rejectError;

    callback({
      yield: yieldFn,
      reject,
      complete,
      finally: new Promise(resolve => finallyTrigger = resolve)
    });

    try {
      while (!stop) {

        await continuePromise;
        if (rejectError)
          throw rejectError.error;
        if (stop) return;

        continuePromise = new Promise(resolve => continueTrigger = resolve);
        const yieldBuffer = buffer;
        buffer = [];

        if (yieldBuffer.length > 0) {
          yield yieldBuffer;

          const yieldCompleted = yieldCompletedTrigger;
          yieldCompletedPromise = new Promise(resolve => yieldCompletedTrigger = resolve);

          yieldCompleted();
        }
      }

    } finally {
      finallyTrigger();
    }

    function yieldFn(item) {
      if (stop) {
        console.error('Cannot yield after complete.');
        return;
      }
      if (rejectError) {
        console.error('Cannot yield after reject.');
        return;
      }

      buffer.push(item);
      continueTrigger();

      return yieldCompletedPromise;
    }

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
    }

    function complete() {
      stop = true;
      continueTrigger();
    }
  }

  /**
   * @template T
   * @template [TProject = T]
   * @param {AsyncIterable<T[] | Iterable<T> | AsyncIterable<T>>} input
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
   * @template [TProject = T]
   * @param {AsyncIterable<T[] | Iterable<T> | AsyncIterable<T>>} input
   * @param {(item: T) => AsyncIterable<TProject[] | Iterable<TProject> | AsyncIterable<TProject>>} [project]
   */
  async function* mergeMap(input, project) {
    for await (const item of input) {
      const mapped = project ? project(item) : item;
      for await (const subItem of mapped) {
        yield subItem;
      }
    }
  }

  /**
   * @template T
   * @param {({ yield, reject, complete, finally }: {
   *  yield: (item: T) => Promise<void>,
   *  reject: (error: Error) => void,
   *  complete: () => void,
   *  finally: Promise<void>
   * }) => void } callback
   */
  function streamEvery(callback) {
    return mergeMap(streamBuffer(callback));
  }

})(
  this,
  typeof window !== 'undefined' && window,
  typeof self !== 'undefined' && self,
  typeof module !== undefined && module && module.exports && module
)