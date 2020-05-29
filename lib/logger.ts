import _ from "./utils.ts";

export enum levels {
  trace,
  debug,
  info,
  warn,
  error,
  fatal
}
let currentLevel = levels.info;

// Logger implementation..
function log(level: levels) {
  // Return a console message depending on the logging level..
  return function (message: string) {
    if (levels[level] >= levels[currentLevel]) {
      console.log(`[${_.formatDate(new Date())}] ${level}: ${message}`);
    }
  };
}

export default {
  // Change the current logging level..
  setLevel: function (level: levels) {
    currentLevel = level;
  },
  trace: log(levels.trace),
  debug: log(levels.debug),
  info: log(levels.info),
  warn: log(levels.warn),
  error: log(levels.error),
  fatal: log(levels.fatal)
};
