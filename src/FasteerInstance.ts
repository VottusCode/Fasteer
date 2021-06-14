import EventEmitter from "eventemitter3";
import { FastifyInstance } from "fastify";
import { Logger, LoggerOptions } from "winston";
import { withFasteer } from "./helpers";
import controllerPlugin from "./plugins/controllerPlugin";
import Fasteer from "./types/fasteer";

export class FasteerInstance<
  TFastify extends FastifyInstance = FastifyInstance
> extends EventEmitter {
  public logger: Logger;

  /**
   * The compiled Winston logger options, in case
   * you need them for your own instance.
   */
  public readonly loggerConfig: LoggerOptions;

  private readonly _config: Fasteer.Config;

  private _controllerContext: { [key: string]: unknown } = {};

  private _plugins: ((fasteer: this) => any)[] = [];

  private _injected: { [key: string]: any } = {};

  private _started = false;

  constructor(
    public fastify: TFastify,
    { config, logger, loggerConfig }: Fasteer.ConstructorOptions
  ) {
    super();
    this.logger = logger;
    this.loggerConfig = loggerConfig;
    this._config = config;
    this._controllerContext = config.controllerContext ?? {};

    if (this._config.debug)
      this.logger.info(withFasteer("Created Fasteer Instance"));
  }

  private initControllers() {
    this.fastify.register(controllerPlugin, {
      controllers: this._config.controllers,
      globalPrefix: this._config.globalPrefix,
      context: () => this._controllerContext,
      injected: this._injected,
    });
    return this;
  }

  private async initPlugins() {
    for (const plugin of this._plugins) {
      await plugin(this);
    }
    return this;
  }

  async start() {
    if (this._started) {
      throw new Error("Fasteer has already started.");
    }

    this.initControllers();
    await this.initPlugins();

    this.emit("beforeStart");

    const addr = await this.fastify.listen(
      this._config.port,
      this._config.host
    );

    this.emit("afterStart");

    this._started = true;

    return addr;
  }

  public debug() {
    return this._config.debug ?? false;
  }

  public getFastify() {
    return this.fastify;
  }

  public getPort() {
    return this._config.port;
  }

  public getHost() {
    return this._config.host;
  }

  public hasStarted() {
    return this._started;
  }

  /**
   * @deprecated Context is a subject for removal.
   */
  public ctx<TVal extends any = any>(key: string, value?: TVal) {
    if (value !== undefined) this._controllerContext[key] = value;
    return value !== undefined ? this : (this._controllerContext[key] as TVal);
  }

  public plugin(fn: (fasteer: this) => any) {
    this._plugins.push(fn);
    return this;
  }

  public inject<TVal extends any = any>(
    ...[toInject, value]: [string, TVal] | [TVal]
  ) {
    if (this._started)
      throw new Error(
        withFasteer("Cannot inject once Fasteer has been started!")
      );

    // TODO: remove ctx from blacklist when it's removed
    // List of blacklisted keys in the injected container.
    const blacklisted = [
      "ctx", // Fasteer Context
      "prefix", // Route prefix
      "app", // Fasteer Instance
    ];

    if (typeof toInject === "object") {
      for (const key in toInject) {
        const val = toInject[key];
        if (val === undefined)
          throw new Error(
            withFasteer(`Need to specify a value for injected key "${key}"`)
          );

        if (blacklisted.includes(key))
          throw new Error(
            `Key "${toInject}" is blacklisted because it's used in Fasteer's internals."`
          );

        this._injected[key] = val;
      }
      return this;
    }

    if (typeof toInject === "string") {
      if (value === undefined)
        throw new Error(
          withFasteer(`Need to specify a value for injected key "${toInject}"`)
        );

      if (blacklisted.includes(toInject))
        throw new Error(
          withFasteer(
            `Key "${toInject}" is blacklisted because it's used in Fasteer's internals."`
          )
        );

      this._injected[toInject] = value;
      return this;
    }

    throw new Error(
      withFasteer(
        "Invalid usage of FasteerInstance.inject()! Please read the docs for more info!"
      )
    );
  }

  public getLogger() {
    return this.logger;
  }

  public isDebug() {
    return !!this._config.debug;
  }
}

export default FasteerInstance;
