const actionMessageRegex = /^\u0001ACTION ([^\u0001]+)\u0001$/;
const justinFanRegex = /^(justinfan)(\d+$)/;
const unescapeIRCRegex = /\\([sn:r\\])/g;

interface IRCEscapedChars {
  s: " ";
  n: "";
  ":": ";";
  r: "";
}

const ircEscapedChars: IRCEscapedChars = {
  s: " ",
  n: "",
  ":": ";",
  r: ""
};

const self = {
  // Return the second value if the first value is undefined..
  get: (obj1: any, obj2: any) => (typeof obj1 === "undefined" ? obj2 : obj1),

  // Value is a boolean..
  isBoolean: (obj: any) => typeof obj === "boolean",

  // Value is a finite number..
  isFinite: (int: number) => isFinite(int) && !isNaN(int),

  // Value is an integer..
  isInteger: (int: string) => !isNaN(self.toNumber(int, 0)),

  // Username is a justinfan username..
  isJustinfan: (username: string) => justinFanRegex.test(username),

  // Value is null..
  isNull: (obj: any) => obj === null,

  // Value is a regex..
  isRegex: (str: string) => /[\|\\\^\$\*\+\?\:\#]/.test(str),

  // Value is a string..
  isString: (str: any) => typeof str === "string",

  // Value is a valid url..
  isURL: (str: string) =>
    new RegExp(
      "^(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?)(?::\\d{2,5})?(?:[/?#]\\S*)?$",
      "i"
    ).test(str),

  // Return a random justinfan username..
  justinfan: () => `justinfan${Math.floor(Math.random() * 80000 + 1000)}`,

  // Return a valid token..
  token: (str: string) => (str ? str.toLowerCase().replace("oauth:", "") : ""),

  // Return a valid password..
  password: (str: string) => {
    const token = self.token(str);
    return token ? `oauth:${token}` : "";
  },

  // Race a promise against a delay..
  promiseDelay: (time: number) =>
    new Promise(resolve => setTimeout(resolve, time)),

  unescapeHtml: (safe: string) =>
    safe
      .replace(/\\&amp\\;/g, "&")
      .replace(/\\&lt\\;/g, "<")
      .replace(/\\&gt\\;/g, ">")
      .replace(/\\&quot\\;/g, '"')
      .replace(/\\&#039\\;/g, "'"),

  // Escaping values:
  // http://ircv3.net/specs/core/message-tags-3.2.html#escaping-values
  unescapeIRC: (msg: string) =>
    !msg || !msg.includes("\\")
      ? msg
      : msg.replace(unescapeIRCRegex, (m: string, p: keyof IRCEscapedChars) =>
          p in ircEscapedChars ? ircEscapedChars[p] : p
        ),

  actionMessage: (msg: string) => msg.match(actionMessageRegex),

  // Return a valid channel name..
  channel: (str: string) => {
    const channel = (str ? str : "").toLowerCase();
    return channel[0] === "#" ? channel : "#" + channel;
  },

  // Extract a number from a string..
  extractNumber: (str: string) => {
    const parts = str.split(" ");
    for (let i = 0; i < parts.length; i++) {
      if (self.isInteger(parts[i])) {
        return ~~parts[i];
      }
    }
    return 0;
  },

  // Format the date..
  formatDate: (date: Date) => {
    const currHours = date.getHours();
    const currMins = date.getMinutes();

    const hours = (currHours < 10 ? "0" : "") + currHours;
    const mins = (currMins < 10 ? "0" : "") + currMins;

    return `${hours}:${mins}`;
  },

  // Merge two objects..
  merge: Object.assign,

  // Split a line but try not to cut a word in half..
  splitLine: (input: string, length: number) => {
    let lastSpace = input.substring(0, length).lastIndexOf(" ");
    // No spaces found, split at the very end to avoid a loop..
    if (lastSpace === -1) {
      lastSpace = length - 1;
    }
    return [input.substring(0, lastSpace), input.substring(lastSpace + 1)];
  },

  // Parse string to number. Returns NaN if string can't be parsed to number..
  toNumber: (num: string, precision: number) => {
    if (num === null) {
      return 0;
    }
    const factor = Math.pow(10, self.isFinite(precision) ? precision : 0);
    return Math.round(+num * factor) / factor;
  },

  // Merge two arrays..
  union: (a: string[], b: string[]) => [...new Set([...a, ...b])],

  // Return a valid username..
  username: (str: string) => {
    const username = (str ? str : "").toLowerCase();
    return username[0] === "#" ? username.slice(1) : username;
  }
};

export default self;
