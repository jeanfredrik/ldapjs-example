const subject = require("./subject");

function ensureArray(input) {
  if (typeof input === "string") {
    if (input === "") {
      return [];
    }
    return [input];
  }
  return input;
}

function addListener(emitter, events, listener) {
  ensureArray(events).forEach((event) => {
    // (emitter.on || emitter.addEventListener).call(emitter, event, () =>
    //   console.log(event),
    // );
    (emitter.on || emitter.addEventListener).call(emitter, event, listener);
  });
}
function removeListener(emitter, events, listener) {
  ensureArray(events).forEach((event) => {
    (emitter.off || emitter.removeEventListener).call(emitter, event, listener);
  });
}

exports.fromEventEmitter = function fromEventEmitter(
  emitter,
  nextEvents,
  errorEvents = ["error"],
  doneEvents = ["end", "cancel"],
) {
  let [iterator, feed, end, throwError] = subject();
  function handleNextEvent(value) {
    feed(value);
  }
  function handleDoneEvent() {
    removeListener(emitter, nextEvents, handleNextEvent);
    removeListener(emitter, doneEvents, handleDoneEvent);
    removeListener(emitter, errorEvents, handleErrorEvent);
    end();
  }
  function handleErrorEvent(error) {
    throwError(error);
  }
  addListener(emitter, nextEvents, handleNextEvent);
  addListener(emitter, doneEvents, handleDoneEvent);
  addListener(emitter, errorEvents, handleErrorEvent);
  return iterator;
};
