/*
 * @author: Samuel Burbano
 * @version: 1.0
 */

import tmiclient from "../main.js";
import { config } from "https://deno.land/x/dotenv/mod.ts";

config({
  path: "./example/.env",
  export: true
});

const blacklist = ["svelte", "react", "angular"];
const whitelist = ["vue"];
const saluteslist = ["hola", "buenas", "saludos", "wenas"];

const client = new tmiclient({
  identity: {
    username: Deno.env.get("BOT_USERNAME"),
    password: Deno.env.get("OAUTH_TOKEN")
  },
  channels: Deno.env.get("CHANNELS_NAME").split(",")
});

function sendMessage(target, text, list, message) {
  list.some(t => {
    const includes = text.replace(/ /g, "").includes(t);
    if (includes) client.say(target, message);
    return text.includes(t);
  });
}

client.on("message", (target, context, msg, self) => {
  if (self) return;

  const text = msg.toLowerCase();

  sendMessage(
    target,
    text,
    blacklist,
    `@${context.username} NotLikeThis Shame! - Vue es el unico verdadero framework! PogChamp`
  );

  sendMessage(
    target,
    text,
    whitelist,
    `@${context.username} SeemsGood Veo una persona de cultura. Tu si sabes! 💚`
  );

  sendMessage(target, text, saluteslist, `@${context.username} Vuenas! 💚`);
});

client.on("connected", (addr, port) => {
  console.log(`* Connected to ${addr}:${port}`);
});

client.connect();
