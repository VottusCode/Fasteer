import { cyanBright, gray } from "chalk";
import EventEmitter from "eventemitter3";
import winston from "winston";
import Fasteer from "../types/fasteer";

const createLoggerOptions = (opts: Fasteer.CreateLoggerOptions) => ({
  // Include custom winstonOptions if they're present.
  ...(opts.winstonOptions ? opts.winstonOptions : {}),
  transports: [
    // Attempts to include opts.transports. It can be either an array or a single transport,
    // so we have to check for that.
    ...(opts.transports
      ? Array.isArray(opts.transports)
        ? opts.transports
        : // Make an array and put the single transport inside. It's easier.
          [opts.transports]
      : []),
    // If opts.consoleLogging is present, enable that
    ...(opts.consoleLogging
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(
                // If custom format is present, use that, otherwise use the default one.
                opts.consoleLogging.format
                  ? opts.consoleLogging.format
                  : ({ level, message, timestamp }) =>
                      `(${level}) ${gray(timestamp)}  ${message}`
              )
            ),
            handleExceptions: opts.consoleLogging.logErrors ?? false,
          }),
        ]
      : []),
    // If opts.fileLogging is present, enable that
    ...(opts.fileLogging
      ? [
          new winston.transports.File({
            filename: opts.fileLogging.path,
            // We don't want to handle exceptions if error file is set, so we first check if it's present,
            // if it's not we only check if it's not false (as false is supposed to disable error logging in files altogether).
            // If it's present, we then check if it's a string and that it is not the same as the main file.
            // If it's not a string or is the same, handleExceptions is true, otherwise false.
            handleExceptions: opts.fileLogging.errorPath
              ? opts.fileLogging.errorPath !== "string" ||
                opts.fileLogging.errorPath === opts.fileLogging.path
              : opts.fileLogging.errorPath !== false,
          }),
          // If errorPath is set, is a string and is not the same as the main path, create an error transport.
          ...(opts.fileLogging.errorPath &&
          typeof opts.fileLogging.errorPath === "string" &&
          opts.fileLogging.errorPath !== opts.fileLogging.path
            ? [
                new winston.transports.File({
                  filename: opts.fileLogging.errorPath,
                  handleExceptions: true,
                }),
              ]
            : []),
        ]
      : []),
  ],
});

/**
 * Creates a logger from CreateLoggerOptions.
 *
 * @param opts
 * @returns
 */
const createLogger = (opts: Fasteer.CreateLoggerOptions) => {
  return winston.createLogger(createLoggerOptions(opts));
};

const hookLoggerToEmitter = (emitter: EventEmitter, events: string[]) => (
  app: Fasteer.Fasteer
): void => {
  for (const event in events) {
    emitter.on(event, data => {
      app.logger.info(
        cyanBright(
          `[Emit] [${event}] ${
            typeof data === "object" ? JSON.stringify(data) : data
          }`
        )
      );
    });
  }
};

export { createLogger, createLoggerOptions, hookLoggerToEmitter };

export default createLogger;
