interface queueObject {
  fn: Function;
  delay: number;
}

export default class Queue {
  // Initialize the queue with a specific delay..
  constructor(
    public queue: queueObject[],
    private index = 0,
    public defaultDelay = 3000
  ) {}

  // Add a new function to the queue..
  add(fn: Function, delay: number) {
    this.queue.push({
      fn,
      delay
    });
  }

  // Run the current queue..
  run(index: number | undefined) {
    (index || index === 0) && (this.index = index);
    this.next();
  }

  // Go to the next in queue..
  next() {
    const i = this.index++;
    const at = this.queue[i];
    const next = this.queue[this.index];

    if (!at) {
      return;
    }

    at.fn();
    next &&
      setTimeout(() => {
        this.next();
      }, next.delay || this.defaultDelay);
  }

  // Reset the queue..
  reset() {
    this.index = 0;
  }

  // Clear the queue..
  clear() {
    this.index = 0;
    this.queue = [];
  }
}
