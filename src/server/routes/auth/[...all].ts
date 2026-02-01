import { defineHandler } from "nitro/h3";
import { auth } from "../../lib/auth";

export default defineHandler((event) => {
  return auth.handler(toWebRequest(event));
});
