/* eslint-disable prefer-const */
import { ethereum } from "@graphprotocol/graph-ts";
import { PancakeDayData } from "../generated/schema";
import { ZERO_BD } from "./utils";

export function updatePancakeDayData(event: ethereum.Event): PancakeDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;

  let pancakeDayData = PancakeDayData.load(dayID.toString());
  if (pancakeDayData === null) {
    pancakeDayData = new PancakeDayData(dayID.toString());
    pancakeDayData.dailyVolumeUSD = ZERO_BD;
  }
  pancakeDayData.save();

  return pancakeDayData as PancakeDayData;
}
