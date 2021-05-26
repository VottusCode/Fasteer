import fastify from "fastify";
import fastifyCors from "fastify-cors";
import fastifyHelmet from "fastify-helmet";
import Fasteer from "./types/fasteer";
import winstonPlugin from "./plugins/winstonPlugin";
import { withFasteer } from "./helpers";
import FasteerInstance from "./FasteerInstance";
import { createLogger } from "winston";
import { createLoggerOptions, hookLoggerToEmitter } from "./logger";

export const createFasteer = (config: Fasteer.Config, app = fastify()) => {
  const {
    cors = false,
    helmet = false,
    errorHandler,
    development = false,
    logRequests,
    debug = config.debug ?? config.development ?? false,
    logEmits,
  } = config;

  const loggerConfig = createLoggerOptions(
    config.loggerOptions ?? {
      consoleLogging: {
        logErrors: development,
      },
    }
  );

  const logger = createLogger(loggerConfig);

  if (!app) app = fastify();

  if (cors) {
    // Cors can be both a boolean (= enable plugin with default options) or the
    // actual plugin options.
    app.register(fastifyCors, typeof cors !== "boolean" ? cors : {});
  }

  if (helmet) {
    // As with cors, can be both a boolean (= enable plugin with default options)
    // or the actual plugin options.
    app.register(fastifyHelmet, typeof helmet !== "boolean" ? helmet : {});
  }

  if (logRequests) {
    app.register(winstonPlugin, { winston: logger });
  }

  const fasteerInstance = new FasteerInstance(app, {
    config,
    logger,
    loggerConfig,
  });

  if (logEmits) {
    hookLoggerToEmitter(fasteerInstance, logEmits);
  }

  app.setErrorHandler(
    errorHandler
      ? errorHandler
      : (err, req, res) => {
          logger.error(
            withFasteer(
              "An error occurred while processing route",
              req.method,
              req.url
            )
          );

          fasteerInstance.emit("error", err);

          if (debug) logger.error(withFasteer(err.stack));

          res
            .status(
              res.statusCode ? res.statusCode : err.validation ? 400 : 500
            )
            .send({
              httpCode: res.statusCode
                ? res.statusCode
                : err.validation
                ? 400
                : 500,
              message: err.validation
                ? "Validation Error"
                : err.statusCode
                ? err.message
                : development
                ? err.message
                : "Internal Server Error",
              ...(err.validation ? { validationErrors: err.validation } : {}),
              ...(development && !err.validation ? { stack: err.stack } : {}),
            });
        }
  );

  return fasteerInstance;
};

/**
 * @deprecated use createFasteer()
 */
export const hookFastify = createFasteer;
