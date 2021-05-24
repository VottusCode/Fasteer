import { blueBright } from "chalk";
import fp from "fastify-plugin";
import glob from "glob";

import path from "path";
import { withFasteer } from "../helpers";
import F from "../types/fasteer";

/**
 * RequireJS Compatibility helper
 *
 * Function for cross-compatibility with require()
 *
 * Usage:
 *  module.exports = ctrl((fastify) => {}, "/")
 */
export const ctrl = (controller: F.FCtrl, routePrefix?: string) => ({
  default: controller,
  routePrefix,
  __requireModule: true as true,
});

/**
 * Controller Plugin
 *
 * Registers all controller paths from given paths.
 * Under the hood it uses glob, so it can accept glob syntax as a path.
 *
 * Examples:
 *  - http/controllers/UserController.ts
 *  - http/controllers/*Controller.ts
 */
const controllerPlugin = fp(
  async (
    fastify,
    {
      controllers,
      globalPrefix = "/",
      context = () => ({}),
      injected = {},
    }: F.UseControllers
  ) => {
    controllers = !(controllers instanceof Array) ? [controllers] : controllers;

    const registerController = async (
      ctrl: F.ControllerImport,
      name: string
    ) => {
      /**
       * When using RequireJS, a ctrl() function is provided
       * that adds an additional __requireModule property to let useControllers
       * know that this is a RequireJS export and to use it accordingly.
       */
      if (ctrl.__requireModule) {
        // The object is frozen so it can't be overwritten
        // that's why a new one is created and assigned the original values
        ctrl = Object.assign({}, ctrl);
        ctrl.default = (ctrl as any).default.default;
      }

      /**
       * Controller has a default export that is a function with the following signature:
       *  async (fastify: FastifyInstance) => any
       */
      if (!ctrl.default || typeof ctrl.default !== "function") {
        console.warn(
          log(
            `Controller ${name} does not have a default export or it is not a function. Skipping...`
          )
        );
        return;
      }

      /**
       * Controllers usually have a prefix, eg. Auth Controller
       * has an /auth route prefix.
       * By exporting a String constant routePrefix, you define that prefix
       */
      fastify.register(ctrl.default, {
        prefix: path.join(globalPrefix, ctrl.routePrefix ?? ""),
        ctx: context,
        ...injected,
      } as any);

      console.log(
        log(
          `${name} ${
            ctrl.routePrefix
              ? `(${path.join(globalPrefix, ctrl.routePrefix ?? "")}) `
              : ""
          }registered`
        )
      );
    };

    const log = (...log: any[]) =>
      withFasteer(blueBright("[useControllers]"), ...log);

    let allControllers: (F.ControllerImport | string)[] = [];

    for (const controller of controllers) {
      if (typeof controller !== "string") {
        allControllers.push(controller);
        continue;
      }

      console.info(log("Looking up path", controller));
      allControllers = [...allControllers, ...glob.sync(controller)];
    }
    /**
     * Fasteer imports the controller file using ES6 imports.
     * Controllers need to have a default function export, which has the following signature:
     *  (fastify: FastifyInstance) => any
     *
     * Additionally, a string export "routePrefix" sets a prefix for the following controller.
     */
    for (const controller of allControllers) {
      if (typeof controller === "object") {
        const name = (controller.default as any).controllerName
          ? (controller.default as any).controllerName
          : controller.default.name === ""
          ? "(anonymous controller)"
          : controller.default.name;

        if (controller.__requireModule) {
          delete controller.__requireModule;
        }

        await registerController(controller, name);
        continue;
      }
      await registerController(
        await import(controller),
        path.parse(controller).name
      );
    }
  }
);

export { controllerPlugin };
export default controllerPlugin;
