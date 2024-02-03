![md(()=>{/*](akpa-icon-128.png)

# AsynKronous Primitive Algebra

&#128092;Akpa is a library to handle async iterators with some of the similar to RX.js:
  * streamBuffer
  * streamEvery
  * map
  * mergeMap

# `streamBuffer*(callback)`

```ts
async function* streamBuffer<T>(
  callback:
    (arg: {
      yield,
      reject,
      complete,
      finally }) => void
): AsyncGenerator<T[]>

type StreamParameters = {
  yield: (item: T) => Promise<void>,
  reject: (error: Error) => void,
  complete: () => void,
  finally: Promise<void>
}
```

Controlling async generator by programmatically pushing (buffering) inputs.

The callback receives 4 facilities to drive the generation:

* `yield(item: T) => Promise<void>` <br>
  pushes item into a buffer for async generator, and immediately returns a Promise
  (you are free to wait, or keep pushing more) <br>&nbsp;
* `reject(error: Error)` <br>
  injects error into the async generator, which will fire AFTER
  all the alerady buffered entries consumed <br>&nbsp;
* `complete()` <br>
  compeltes the async generator, which will reach the consumer
  only after all the already buffered entries are consumed <br>&nbsp;
* `finally: Promise` <br>
  this promise will settle after the async generator ends
  (whether by consumer or producer, successfully or by error)


# `streamAll*(callback)`

Same as the streamBuffer above, but the consumer will be given individual yielded items,
instead of the buffered chunks.

# `map*(input[, project])`

Takes an input async generator, and executes a projection function on every element.

# `mergeMap*(input[, project])`

Flattens a sequence of sequences into simple sequence of elements.

The input is a generator, and optional projection. For each element of this parent generator
the `mergeMap*` function expects a child generator.

These generators are all merged into output in the order of the parent generator.

<!-- */})]// -->