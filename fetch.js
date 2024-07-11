import { parseOBJ } from "./parser.js";

export async function fetchOBJ(path) {
  return fetch(path)
    .then((resp) => resp.text())
    .then((text) => parseOBJ(text));
}
