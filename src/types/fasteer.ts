import {
  FastifyRequest,
  FastifyReply,
  FastifyError,
  FastifyInstance,
} from "fastify";
import { FastifyCorsOptions } from "fastify-cors";
import helmet from "helmet";
import { format, Logger, LoggerOptions } from "winston";
import { Context, Injected } from "..";
import FasteerInstance from "../FasteerInstance";

export type FastifyHelmetOptions = Parameters<typeof helmet>[0] & {
  enableCSPNonces?: boolean;
};

declare module "fastify" {
  interface FastifyInstance {
    fasteer: FasteerInstance;
  }
}

/**
 * Fasteer Typings
 */
export namespace Fasteer {
  /**
   * The ES import() for controllers
   */
  export interface ControllerImport<
    TFastify extends FastifyInstance = FastifyInstance,
    TContext extends object = object,
    TInjected extends object = object
  > {
    default: (
      fastify: TFastify,
      opts: { ctx: () => TContext & Context } & TInjected & Injected
    ) => any;
    routePrefix?: string;
    __requireModule?: true;
  }

  /**
   * Functional Controller
   */
  export type FunctionalController<
    TFastify extends FastifyInstance = FastifyInstance,
    TContext extends object = object,
    TInjected extends object = object
  > = ControllerImport<TFastify, TContext, TInjected>["default"];

  /**
   * Alias for Fasteer.FunctionalController
   */
  export type FCtrl<
    TFastify extends FastifyInstance = FastifyInstance,
    TContext extends object = object,
    TInjected extends object = object
  > = FunctionalController<TFastify, TContext, TInjected>;

  /**
   * Configuration for init createFasteer()
   */
  export interface Config {
    controllers: UseControllers["controllers"];
    /**
     * @deprecated
     */
    controllerContext?: { [key: string]: unknown };
    globalPrefix?: string;
    cors?: boolean | FastifyCorsOptions;
    helmet?: boolean | FastifyHelmetOptions;
    errorHandler?: (
      this: FastifyInstance,
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply
    ) => void;
    development?: boolean;
    port: number | string;
    host?: string;
    loggerOptions?: CreateLoggerOptions; // ignored when logger is present
    logRequests?: "file" | "all";
    logErrors?: false; // deprecated, included in debug
    logEmits?: string[];
    debug?: boolean; // by default = development
  }

  export interface BaseInjected {
    app: Fasteer.Fasteer;
    logger: Logger;
  }

  export type Ctx<
    TContext extends object = object,
    TInjected extends object = object
  > = {
    /**
     * @deprecated
     */
    ctx: () => TContext;
  } & TInjected &
    BaseInjected;

  /**
   * Options for FasteerInstance.
   * @internal
   */
  export interface ConstructorOptions {
    config: Config;
    logger: Logger;
    loggerConfig: LoggerOptions;
  }

  /**
   * Options for useControllers() hook
   */
  export interface UseControllers {
    controllers: string | ControllerImport | (string | ControllerImport)[];
    globalPrefix?: string;
    /**
     * @deprecated
     */
    context?: () => object;
    injected?: object;
  }

  /**
   * Options for useWinston() hook
   */
  export interface UseWinston {
    winston: Logger;
    filterKeys?: { [key: string]: string[] };
  }

  export interface CreateLoggerOptions {
    winstonOptions?: LoggerOptions;
    fileLogging?: {
      /**
       * does log errors if errorPath is not set
       * if you dont want to log in path nor have separate file,
       * set errorPath = boolean
       */
      path: string;
      /**
       * otherwise path is used
       */
      errorPath?: string | boolean;
      format?: Parameters<typeof format["printf"]>[0];
    };
    consoleLogging?: {
      logErrors?: boolean;
      format?: Parameters<typeof format["printf"]>[0];
    };
    /**
     * Custom transports
     * Merges with
     */
    transports?: LoggerOptions["transports"];
    json?: {
      filterKeys?: { [key: string]: string[] };
    };
  }

  /**
   * FasteerInstance
   */
  export type Fasteer = FasteerInstance;
}

export default Fasteer;
