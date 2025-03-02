import type { BigNumber } from 'ethers'
import { Signer } from 'ethers'
import { useEffect } from 'react'
import { useDebounce } from 'react-use'
import { IUniswapV2Router02__factory, FeederPool__factory, Masset__factory, SaveWrapper__factory } from '@apps/artifacts/typechain'
import { MassetState } from '@apps/data-provider'
import { useSigner } from '@apps/base/context/account'
import { AllNetworks, useNetworkAddresses, useNetworkPrices } from '@apps/base/context/network'
import { useSelectedMassetConfig } from '@apps/masset-provider'
import { useFetchState, FetchState, useSelectedMassetState } from '@apps/hooks'
import { sanitizeMassetError } from '@apps/formatters'
import { BigDecimal } from '@apps/bigdecimal'
import { getPriceImpact } from '@apps/quick-maths'

import { useSelectedMassetPrice } from '../../../hooks/useSelectedMassetPrice'
import { SaveOutput, SaveRoutes } from './types'

const getOptimalBasset = async (
  signer: Signer,
  networkAddresses: AllNetworks['addresses'],
  massetAddress: string,
  bAssets: MassetState['bAssets'],
  inputAmount: BigNumber,
): Promise<SaveOutput> => {
  const wrappedNativeToken =
    (networkAddresses.ERC20 as Extract<AllNetworks['addresses'], { ERC20: { WETH: string } }>['ERC20']).WETH ??
    (networkAddresses.ERC20 as Extract<AllNetworks['addresses'], { ERC20: { wMATIC: string } }>['ERC20']).wMATIC

  const uniswap = IUniswapV2Router02__factory.connect(networkAddresses.UniswapRouter02_Like, signer)

  const saveWrapper = SaveWrapper__factory.connect(networkAddresses.SaveWrapper, signer)

  const bassetAmountsOut = [
    ...(await Promise.all(
      Object.keys(bAssets).map(async address => {
        const path = [wrappedNativeToken, address]
        try {
          const [, amountOut] = await uniswap.getAmountsOut(inputAmount, path)
          const estimatedOutput = await saveWrapper.estimate_saveViaUniswapETH(
            massetAddress,
            networkAddresses.UniswapRouter02_Like,
            inputAmount,
            path,
          )

          return {
            path,
            amountOut: new BigDecimal(amountOut, bAssets[address].token.decimals),
            amount: new BigDecimal(estimatedOutput),
          }
        } catch (error) {
          console.error(`Error estimating output for path ${path.join(',')}`, error)
        }
      }),
    )),
  ].filter(Boolean) as SaveOutput[]

  const optimal = bassetAmountsOut.reduce((prev, current) => (current.amount.exact.gt(prev.amount.exact) ? current : prev), {
    amount: BigDecimal.ZERO,
  })

  if (!optimal || optimal.amount.exact.eq(0)) {
    throw new Error('No path found')
  }

  return optimal
}

export const useSaveOutput = (route?: SaveRoutes, inputAddress?: string, inputAmount?: BigDecimal): FetchState<SaveOutput> => {
  const [saveOutput, setSaveOutput] = useFetchState<SaveOutput>()
  const networkAddresses = useNetworkAddresses()
  const networkPrices = useNetworkPrices()
  const nativeTokenPriceSimple = networkPrices.value?.nativeToken
  const selectedMassetPrice = useSelectedMassetPrice()

  const signer = useSigner() as Signer

  const massetState = useSelectedMassetState() as MassetState
  const massetConfig = useSelectedMassetConfig()
  const {
    address: massetAddress,
    bAssets,
    feederPools,
    savingsContracts: {
      v2: { latestExchangeRate: { rate: latestExchangeRate } = {} },
    },
  } = massetState

  const inputAmountSerialized = inputAmount?.toJSON()
  const feederPoolAddress = inputAddress && Object.values(feederPools).find(fp => fp.fasset.address === inputAddress)?.address

  const [update] = useDebounce(
    () => {
      if (!inputAmountSerialized || !inputAddress || !signer) return setSaveOutput.value()

      const _inputAmount = BigDecimal.fromJSON(inputAmountSerialized)

      if (
        !latestExchangeRate ||
        !networkAddresses ||
        !nativeTokenPriceSimple ||
        !selectedMassetPrice.value ||
        ((route === SaveRoutes.SwapAndSave || route === SaveRoutes.SwapAndStake) && !feederPoolAddress)
      ) {
        return setSaveOutput.fetching()
      }

      let promise: Promise<SaveOutput>
      switch (route) {
        case SaveRoutes.Save:
        case SaveRoutes.Stake:
        case SaveRoutes.SaveAndStake:
          promise = Promise.resolve({
            amount: _inputAmount,
          })
          break

        case SaveRoutes.BuyAndSave:
        case SaveRoutes.BuyAndStake:
          promise = (async () => {
            const [{ amount: low }, { amount: high, path, amountOut }] = await Promise.all([
              getOptimalBasset(signer, networkAddresses, massetAddress, bAssets, massetConfig.lowInputValue.exact),
              getOptimalBasset(signer, networkAddresses, massetAddress, bAssets, _inputAmount.exact),
            ])

            const nativeTokenPrice = BigDecimal.fromSimple(nativeTokenPriceSimple).exact
            const massetPrice = BigDecimal.fromSimple(selectedMassetPrice.value)

            const buyLow = massetConfig.lowInputValue.mulTruncate(nativeTokenPrice).divPrecisely(massetPrice)
            const buyHigh = _inputAmount.scale().mulTruncate(nativeTokenPrice).divPrecisely(massetPrice)

            const priceImpact = getPriceImpact([buyLow, buyHigh], [low, high])

            return {
              amount: high,
              amountOut,
              path,
              priceImpact,
            }
          })()
          break

        case SaveRoutes.MintAndSave:
        case SaveRoutes.MintAndStake:
          promise = (async () => {
            const contract = Masset__factory.connect(massetAddress, signer)

            const scaledInputLow = massetConfig.lowInputValue.scale(_inputAmount.decimals)

            const [_low, _high] = await Promise.all([
              contract.getMintOutput(inputAddress, scaledInputLow.exact),
              contract.getMintOutput(inputAddress, _inputAmount.exact),
            ])

            const low = new BigDecimal(_low)
            const high = new BigDecimal(_high)

            const priceImpact = getPriceImpact([massetConfig.lowInputValue, _inputAmount.scale()], [low, high])

            return {
              amount: high,
              priceImpact,
            }
          })()
          break

        case SaveRoutes.SwapAndSave:
        case SaveRoutes.SwapAndStake:
          promise = (async () => {
            const contract = FeederPool__factory.connect(feederPoolAddress as string, signer)

            const scaledInputLow = massetConfig.lowInputValue.scale(_inputAmount.decimals)

            const [_low, _high] = await Promise.all([
              contract.getSwapOutput(inputAddress, massetAddress, scaledInputLow.exact),
              contract.getSwapOutput(inputAddress, massetAddress, _inputAmount.exact),
            ])

            const low = new BigDecimal(_low)
            const high = new BigDecimal(_high)

            const priceImpact = getPriceImpact([massetConfig.lowInputValue, _inputAmount.scale()], [low, high])

            return {
              amount: high,
              priceImpact,
            }
          })()
          break

        default:
          return setSaveOutput.value()
      }

      setSaveOutput.fetching()

      return promise
        .then((output): void => {
          setSaveOutput.value(output)
        })
        .catch((_error: Error): void => {
          setSaveOutput.error(sanitizeMassetError(_error))
        })
    },
    1000,
    [inputAmountSerialized, inputAddress, massetAddress, feederPoolAddress],
  )

  useEffect(() => {
    if (inputAmount?.exact.gt(0) && inputAddress) {
      setSaveOutput.fetching()
      update()
    } else {
      setSaveOutput.value()
    }
  }, [inputAddress, inputAmount, setSaveOutput, update])

  return saveOutput
}
