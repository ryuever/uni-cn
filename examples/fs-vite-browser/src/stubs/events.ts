/**
 * Stub for events - Node EventEmitter. Browser minimal polyfill.
 */
class EventEmitter {
  on() {
    return this;
  }
  emit() {
    return false;
  }
  off() {
    return this;
  }
  addListener() {
    return this;
  }
  removeListener() {
    return this;
  }
}
export default EventEmitter;
export { EventEmitter };
