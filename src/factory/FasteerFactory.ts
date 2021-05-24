import { FastifyInstance } from "fastify";
import FasteerInstance from "../FasteerInstance";
import Fasteer from "../types/fasteer";

/**
 * Factory for the FasteerInstance
 * @deprecated Use new FasteerInstance()
 */
export class FasteerFactory {
  static create<TFastify extends FastifyInstance = FastifyInstance>(
    fastify: TFastify,
    options: Fasteer.ConstructorOptions
  ) {
    return new FasteerInstance(fastify, options);
  }
}

export default FasteerFactory;
