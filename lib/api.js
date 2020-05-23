import _ from "./utils.js";

export default function api(options, callback) {
  // Set the url to options.uri or options.url..
  var url = options.url !== undefined ? options.url : options.uri;

  // Make sure it is a valid url..
  if (!_.isURL(url)) {
    url = `https://api.twitch.tv/kraken${url[0] === "/" ? url : `/${url}`}`;
  }

  var opts = _.merge({ method: "GET", json: true }, options, { url });
  fetch(opts)
    .then(res => res.json())
    .then(callback);
}
