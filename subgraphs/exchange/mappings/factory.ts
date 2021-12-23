/* eslint-disable prefer-const */
import { PancakeFactory, Pair, Token, Bundle } from "../generated/schema";
import { Pair as PairTemplate } from "../generated/templates";
import { PairCreated } from "../generated/Factory/Factory";
import { FACTORY_ADDRESS, ZERO_BD, fetchTokenDecimals } from "./utils";

export function handlePairCreated(event: PairCreated): void {
  let factory = PancakeFactory.load(FACTORY_ADDRESS);
  if (factory === null) {
    factory = new PancakeFactory(FACTORY_ADDRESS);
    factory.totalVolumeUSD = ZERO_BD;

    let bundle = new Bundle("1");
    bundle.bnbPrice = ZERO_BD;
    bundle.save();
  }
  factory.save();

  let token0 = Token.load(event.params.token0.toHex());
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHex());
    let decimals = fetchTokenDecimals(event.params.token0);
    if (decimals === null) {
      return;
    }
    token0.decimals = decimals;
    token0.derivedBNB = ZERO_BD;
    token0.save();
  }

  let token1 = Token.load(event.params.token1.toHex());
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHex());
    let decimals = fetchTokenDecimals(event.params.token1);
    if (decimals === null) {
      return;
    }
    token1.decimals = decimals;
    token1.derivedBNB = ZERO_BD;
    token1.save();
  }

  let pair = new Pair(event.params.pair.toHex()) as Pair;
  pair.token0 = token0.id;
  pair.token1 = token1.id;
  pair.reserve0 = ZERO_BD;
  pair.reserve1 = ZERO_BD;
  pair.reserveBNB = ZERO_BD;
  pair.token0Price = ZERO_BD;
  pair.token1Price = ZERO_BD;
  pair.save();

  PairTemplate.create(event.params.pair);
}
