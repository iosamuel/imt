/*
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export class EventEmitter {
  _events = {};
  _maxListeners = undefined;
  defaultMaxListeners = 10;

  setMaxListeners(n) {
    if (!isNumber(n) || n < 0 || isNaN(n)) {
      throw TypeError("n must be a positive number");
    }

    this._maxListeners = n;

    return this;
  }

  emits(types, values) {
    for (var i = 0; i < types.length; i++) {
      var val = i < values.length ? values[i] : values[values.length - 1];
      this.emit.apply(this, [types[i]].concat(val));
    }
  }

  emit(type) {
    var er, handler, len, args, i, listeners;

    if (!this._events) {
      this._events = {};
    }

    // If there is no 'error' event listener then throw.
    if (type === "error") {
      if (
        !this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)
      ) {
        er = arguments[1];
        if (er instanceof Error) {
          throw er;
        }
        throw TypeError('Uncaught, unspecified "error" event.');
      }
    }

    handler = this._events[type];

    if (isUndefined(handler)) {
      return false;
    }

    if (isFunction(handler)) {
      switch (arguments.length) {
        // fast cases
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          args = Array.prototype.slice.call(arguments, 1);
          handler.apply(this, args);
      }
    } else if (isObject(handler)) {
      args = Array.prototype.slice.call(arguments, 1);
      listeners = handler.slice();
      len = listeners.length;
      for (i = 0; i < len; i++) {
        listeners[i].apply(this, args);
      }
    }

    return true;
  }

  addListener(type, listener) {
    var m;

    if (!isFunction(listener)) {
      throw TypeError("listener must be a function");
    }

    if (!this._events) {
      this._events = {};
    }

    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (this._events.newListener) {
      this.emit(
        "newListener",
        type,
        isFunction(listener.listener) ? listener.listener : listener
      );
    }

    // Optimize the case of one listener. Don't need the extra array object.
    if (!this._events[type]) {
      this._events[type] = listener;
    }
    // If we've already got an array, just append.
    else if (isObject(this._events[type])) {
      this._events[type].push(listener);
    }
    // Adding the second element, need to change to array.
    else {
      this._events[type] = [this._events[type], listener];
    }

    // Check for listener leak
    if (isObject(this._events[type]) && !this._events[type].warned) {
      if (!isUndefined(this._maxListeners)) {
        m = this._maxListeners;
      } else {
        m = EventEmitter.defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error(
          "(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",
          this._events[type].length
        );
        // Not supported in IE 10
        if (typeof console.trace === "function") {
          console.trace();
        }
      }
    }

    return this;
  }

  on() {
    return this.addListener;
  }

  once(type, listener) {
    if (!isFunction(listener)) {
      throw TypeError("listener must be a function");
    }

    var fired = false;

    if (this._events.hasOwnProperty(type) && type.charAt(0) === "_") {
      var count = 1;
      var searchFor = type;

      for (var k in this._events) {
        if (this._events.hasOwnProperty(k) && k.startsWith(searchFor)) {
          count++;
        }
      }
      type = type + count;
    }

    function g() {
      if (type.charAt(0) === "_" && !isNaN(type.substr(type.length - 1))) {
        type = type.substring(0, type.length - 1);
      }
      this.removeListener(type, g);

      if (!fired) {
        fired = true;
        listener.apply(this, arguments);
      }
    }

    g.listener = listener;
    this.on(type, g);

    return this;
  }

  removeListener(type, listener) {
    var list, position, length, i;

    if (!isFunction(listener)) {
      throw TypeError("listener must be a function");
    }

    if (!this._events || !this._events[type]) {
      return this;
    }

    list = this._events[type];
    length = list.length;
    position = -1;
    if (
      list === listener ||
      (isFunction(list.listener) && list.listener === listener)
    ) {
      delete this._events[type];

      if (this._events.hasOwnProperty(type + "2") && type.charAt(0) === "_") {
        var searchFor = type;
        for (var k in this._events) {
          if (this._events.hasOwnProperty(k) && k.startsWith(searchFor)) {
            if (!isNaN(parseInt(k.substr(k.length - 1)))) {
              this._events[
                type + parseInt(k.substr(k.length - 1) - 1)
              ] = this._events[k];
              delete this._events[k];
            }
          }
        }

        this._events[type] = this._events[type + "1"];
        delete this._events[type + "1"];
      }
      if (this._events.removeListener) {
        this.emit("removeListener", type, listener);
      }
    } else if (isObject(list)) {
      for (i = length; i-- > 0; ) {
        if (
          list[i] === listener ||
          (list[i].listener && list[i].listener === listener)
        ) {
          position = i;
          break;
        }
      }

      if (position < 0) {
        return this;
      }

      if (list.length === 1) {
        list.length = 0;
        delete this._events[type];
      } else {
        list.splice(position, 1);
      }

      if (this._events.removeListener) {
        this.emit("removeListener", type, listener);
      }
    }

    return this;
  }

  removeAllListeners(type) {
    var key, listeners;

    if (!this._events) {
      return this;
    }

    // not listening for removeListener, no need to emit
    if (!this._events.removeListener) {
      if (arguments.length === 0) {
        this._events = {};
      } else if (this._events[type]) {
        delete this._events[type];
      }
      return this;
    }

    // emit removeListener for all listeners on all events
    if (arguments.length === 0) {
      for (key in this._events) {
        if (key === "removeListener") {
          continue;
        }
        this.removeAllListeners(key);
      }
      this.removeAllListeners("removeListener");
      this._events = {};
      return this;
    }

    listeners = this._events[type];

    if (isFunction(listeners)) {
      this.removeListener(type, listeners);
    } else if (listeners) {
      while (listeners.length) {
        this.removeListener(type, listeners[listeners.length - 1]);
      }
    }
    delete this._events[type];

    return this;
  }

  listeners(type) {
    var ret;
    if (!this._events || !this._events[type]) {
      ret = [];
    } else if (isFunction(this._events[type])) {
      ret = [this._events[type]];
    } else {
      ret = this._events[type].slice();
    }
    return ret;
  }

  listenerCount(type) {
    if (this._events) {
      var evlistener = this._events[type];

      if (isFunction(evlistener)) {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }
    return 0;
  }

  static listenerCount(emitter, type) {
    return emitter.listenerCount(type);
  }
}

function isFunction(arg) {
  return typeof arg === "function";
}

function isNumber(arg) {
  return typeof arg === "number";
}

function isObject(arg) {
  return typeof arg === "object" && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}
