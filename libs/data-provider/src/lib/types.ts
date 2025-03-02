import { BigNumber } from 'ethers'

import { BigDecimal } from '@apps/bigdecimal'
import { SubscribedToken } from '@apps/types'

export enum BassetStatus {
  Default = 'Default',
  Normal = 'Normal',
  BrokenBelowPeg = 'BrokenBelowPeg',
  BrokenAbovePeg = 'BrokenAbovePeg',
  Blacklisted = 'Blacklisted',
  Liquidating = 'Liquidating',
  Liquidated = 'Liquidated',
  Failed = 'Failed',
}

export interface BassetState {
  address: string
  balanceInMasset: BigDecimal
  basketShare: BigDecimal
  isTransferFeeCharged: boolean
  maxWeight?: BigNumber
  maxWeightInMasset?: BigDecimal
  overweight: boolean
  ratio: BigNumber
  status: BassetStatus
  totalVault: BigDecimal
  totalVaultInMasset: BigDecimal
  token: SubscribedToken
}

export interface FassetState extends BassetState {
  feederPoolAddress: string
}

export interface FeederPoolAccountState {
  cumulativeEarned: BigDecimal
  cumulativeEarnedVault: BigDecimal
  balance: BigDecimal
  balanceVault: BigDecimal
  price: BigDecimal
  priceVault: BigDecimal
  lastUpdate: number
  lastUpdateVault: number
}

export interface FeederPoolState {
  address: string
  fasset: FassetState
  masset: FassetState
  token: SubscribedToken
  totalSupply: BigDecimal
  vault?: BoostedSavingsVaultState
  invariantK: BigNumber
  dailyApy: number
  price: BigDecimal
  failed: boolean
  title: string
  liquidity: BigDecimal
  governanceFeeRate: BigNumber
  feeRate: BigNumber
  redemptionFeeRate: BigNumber
  undergoingRecol: boolean
  account?: FeederPoolAccountState
}

export interface MassetState {
  address: string
  bAssets: { [bassetAddress: string]: BassetState }
  fAssets: { [feederPoolAddress: string]: FassetState }
  removedBassets: { [address: string]: SubscribedToken }
  collateralisationRatio?: BigNumber
  hasFeederPools: boolean
  failed: boolean
  feeRate: BigNumber
  invariantStartTime?: number
  invariantStartingCap?: BigNumber
  invariantCapFactor?: BigNumber
  redemptionFeeRate: BigNumber
  token: SubscribedToken
  undergoingRecol: boolean
  savingsContracts: {
    v1?: Extract<SavingsContractState, { version: 1 }>
    v2: Extract<SavingsContractState, { version: 2 }>
  }
  feederPools: {
    [address: string]: FeederPoolState
  }
  userVaults: { [address: string]: number[] }
  vaultIds: { [id: number]: string }
  boostDirector?: string
  bassetRatios: { [address: string]: BigNumber }
}

export interface BoostedSavingsVaultAccountState {
  boostedBalance: BigDecimal
  boostMultiplier: number
  rawBalance: BigDecimal
  lastAction: number
  lastClaim: number
  rewardCount: number
  rewardPerTokenPaid: BigNumber
  rewards: BigNumber
  rewardEntries: {
    finish: number
    start: number
    index: number
    rate: BigNumber
  }[]
}

export interface BoostedSavingsVaultState {
  address: string
  account?: BoostedSavingsVaultAccountState
  lastUpdateTime: number
  lockupDuration: number
  periodDuration: number
  periodFinish: number
  priceCoeff?: number
  boostCoeff?: number
  rewardPerTokenStored: BigNumber
  rewardRate: BigNumber
  platformRewardRate?: BigNumber
  platformRewardPerTokenStored?: BigNumber
  stakingContract: string
  stakingToken: {
    address: string
    symbol: string
  }
  rewardsToken: {
    address: string
    symbol: string
  }
  platformRewardsToken?: {
    address: string
    symbol: string
  }
  totalStakingRewards: BigDecimal
  totalSupply: BigDecimal
  totalRaw: BigDecimal
  unlockPercentage: BigNumber
  isImusd: boolean // FIXME replace
}

export type SavingsContractState = {
  active: boolean
  current: boolean
  address: string
  massetAddress: string
  latestExchangeRate?: {
    timestamp: number
    rate: BigDecimal
  }
  totalSavings: BigDecimal
  dailyAPY: number
  savingsBalance: {
    balance?: BigDecimal
    credits?: BigDecimal
  }
} & (
  | {
      version: 1
      creditBalance?: BigDecimal
      totalCredits: BigDecimal
      massetAllowance: BigDecimal
    }
  | {
      version: 2
      token?: SubscribedToken
      boostedSavingsVault?: BoostedSavingsVaultState
    }
)

export interface DataState {
  musd?: MassetState
  mbtc?: MassetState
}
