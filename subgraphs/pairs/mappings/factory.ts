/* eslint-disable prefer-const */
import { Factory, Pair, Token } from "../generated/schema";
import { PairCreated } from "../generated/Factory/Factory";
import { fetchDecimals } from "./utils/erc20";

// Constants
let FACTORY_ADDRESS = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";

export function handlePairCreated(event: PairCreated): void {
  let factory = Factory.load(FACTORY_ADDRESS);
  if (factory === null) {
    // Factory
    factory = new Factory(FACTORY_ADDRESS);
  }

  let token0 = Token.load(event.params.token0.toHex());
  if (token0 === null) {
    // Token0
    token0 = new Token(event.params.token0.toHex());
    token0.decimals = fetchDecimals(event.params.token0);
  }

  let token1 = Token.load(event.params.token1.toHex());
  if (token1 === null) {
    // Token1
    token1 = new Token(event.params.token1.toHex());
    token1.decimals = fetchDecimals(event.params.token1);
  }

  // Pair
  let pair = new Pair(event.params.pair.toHex());
  pair.token0 = token0.id;
  pair.token1 = token1.id;

  // Entities
  token0.save();
  token1.save();
  pair.save();
  factory.save();
}
