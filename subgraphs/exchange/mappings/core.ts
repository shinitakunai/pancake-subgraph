/* eslint-disable prefer-const */
import { BigDecimal } from "@graphprotocol/graph-ts";
import { Pair, Token, PancakeFactory, Bundle } from "../generated/schema";
import { Swap, Sync } from "../generated/templates/Pair/Pair";
import { updatePancakeDayData } from "./dayUpdates";
import { findBnbPerToken, getTrackedVolumeUSD } from "./pricing";
import { convertTokenToDecimal, FACTORY_ADDRESS, ZERO_BD } from "./utils";

export function handleSync(event: Sync): void {
  let pair = Pair.load(event.address.toHex());
  let token0 = Token.load(pair.token0);
  let token1 = Token.load(pair.token1);

  let reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals);
  pair.reserve0 = reserve0;
  let reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals);
  pair.reserve1 = reserve1;

  if (pair.reserve1.notEqual(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1);
  else pair.token0Price = ZERO_BD;
  if (pair.reserve0.notEqual(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0);
  else pair.token1Price = ZERO_BD;

  let t0DerivedBNB = findBnbPerToken(token0 as Token);
  token0.derivedBNB = t0DerivedBNB;
  token0.save();

  let t1DerivedBNB = findBnbPerToken(token1 as Token);
  token1.derivedBNB = t1DerivedBNB;
  token1.save();

  // use derived amounts within pair
  pair.reserveBNB = reserve0
    .times(token0.derivedBNB as BigDecimal)
    .plus(reserve1.times(token1.derivedBNB as BigDecimal));

  // save entities
  pair.save();
}

export function handleSwap(event: Swap): void {
  let pair = Pair.load(event.address.toHex());
  let token0 = Token.load(pair.token0);
  let token1 = Token.load(pair.token1);
  let amount0In = convertTokenToDecimal(event.params.amount0In, token0.decimals);
  let amount1In = convertTokenToDecimal(event.params.amount1In, token1.decimals);
  let amount0Out = convertTokenToDecimal(event.params.amount0Out, token0.decimals);
  let amount1Out = convertTokenToDecimal(event.params.amount1Out, token1.decimals);

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In);
  let amount1Total = amount1Out.plus(amount1In);

  // BNB/USD prices
  let bundle = Bundle.load("1");

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = getTrackedVolumeUSD(
    bundle as Bundle,
    amount0Total,
    token0 as Token,
    amount1Total,
    token1 as Token
  );

  // update global values, only used tracked amounts for volume
  let pancake = PancakeFactory.load(FACTORY_ADDRESS);
  pancake.totalVolumeUSD = pancake.totalVolumeUSD.plus(trackedAmountUSD);

  pancake.save();

  // update day entities
  let pancakeDayData = updatePancakeDayData(event);
  // swap specific updating
  pancakeDayData.dailyVolumeUSD = pancakeDayData.dailyVolumeUSD.plus(trackedAmountUSD);
  pancakeDayData.save();
}
