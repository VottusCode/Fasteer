import fp from "fastify-plugin";
import F from "../types/fasteer";
import { blueBright, gray, white, whiteBright } from "chalk";
import {
  formatJson,
  formatStatusCode,
  safeParseJson,
  withFasteer,
} from "../helpers";

/**
 * Winston Plugin
 *
 * Uses the Winston instance and creates Fastify onSend hook
 * for logging the requests.
 */
const winstonPlugin = fp(
  async (fastify, { filterKeys = {}, winston }: F.UseWinston) => {
    console.log(
      withFasteer(
        blueBright("[useWinston]"),
        "Registering a onSend hook for logging"
      )
    );
    fastify.addHook("onSend", async (req, res, payload: string | object) => {
      winston.info(
        gray(
          formatStatusCode(res.statusCode),
          white(req.raw.method),
          white(req.raw.url),
          `(${req.ip})`
        )
      );

      let safeReq =
        typeof req.body === "object"
          ? req.body
          : typeof req.body === "string"
          ? safeParseJson(req.body)
          : req.body;

      if (typeof safeReq === "object") {
        for (const filters in Object.keys(filterKeys).filter(
          p => p === `REQ ${req.method} ${req.url}`
        )) {
          for (const filteredKey of filters) {
            eval(`safeReq.${filteredKey} = '[FILTERED]'`);
          }
        }
      }

      if (safeReq) {
        winston.info(`${whiteBright("Request:")}\n` + formatJson(safeReq));
      }

      let safePayload =
        typeof safeReq === "object" ? payload : formatJson(safeReq);

      if (typeof safePayload === "object") {
        for (const filters in Object.keys(filterKeys).filter(
          p => p === `RES ${req.method} ${req.url}`
        )) {
          for (const filteredKey of filters) {
            eval(`safePayload.${filteredKey} = '[FILTERED]'`);
          }
        }
      }

      if (safePayload)
        winston.info(`${whiteBright("Response:")}\n` + formatJson(safePayload));
    });

    return winston;
  }
);

export { winstonPlugin };
export default winstonPlugin;
