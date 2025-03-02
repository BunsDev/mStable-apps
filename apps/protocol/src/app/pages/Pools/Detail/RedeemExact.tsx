import type { FC } from 'react'
import React, { useMemo } from 'react'

import { usePropose } from '@apps/base/context/transactions'
import { useWalletAddress } from '@apps/base/context/account'
import { TransactionManifest, Interfaces } from '@apps/transaction-manifest'
import { SendButton } from '@apps/components/forms'
import { AddressOption } from '@apps/types'
import { OneToManyAssetExchange, useMultiAssetExchangeState } from '@apps/components/forms'
import { BigDecimal } from '@apps/bigdecimal'
import { useMaximumOutput } from '@apps/hooks'

import { useSelectedMassetPrice } from '../../../hooks/useSelectedMassetPrice'
import { Route, useEstimatedOutputMulti } from '../../../hooks/useEstimatedOutputMulti'
import { useExchangeRateForFPInputs } from '../../../hooks/useMassetExchangeRate'
import { useSelectedFeederPoolContract, useSelectedFeederPoolState } from '../FeederPoolProvider'

const formId = 'RedeemExact'

export const RedeemExact: FC = () => {
  const feederPool = useSelectedFeederPoolState()
  const contract = useSelectedFeederPoolContract()
  const propose = usePropose()
  const walletAddress = useWalletAddress()
  const outputTokens = useMemo(() => [feederPool.masset.token, feederPool.fasset.token], [feederPool])

  const massetPrice = useSelectedMassetPrice()
  const isLowLiquidity = feederPool?.liquidity.simple * (massetPrice.value ?? 0) < 100000

  const [inputValues, slippage] = useMultiAssetExchangeState()

  const { estimatedOutputAmount, priceImpact } = useEstimatedOutputMulti(
    contract,
    inputValues,
    { price: feederPool.price, isInput: false },
    Route.Redeem,
  )

  const { impactWarning } = priceImpact?.value ?? {}

  const exchangeRate = useExchangeRateForFPInputs(feederPool.address, estimatedOutputAmount, inputValues)

  const touched = useMemo(() => Object.values(inputValues).filter(v => v.touched), [inputValues])

  const inputAmount = useMemo(() => {
    if (!touched.length) return

    const massetAmount = touched.find(({ address }) => address === feederPool.masset.address)?.amount

    const fassetAmount = touched.find(({ address }) => address === feederPool.fasset.address)?.amount

    if (fassetAmount && massetAmount) {
      return fassetAmount.mulRatioTruncate(feederPool.fasset.ratio).add(massetAmount).setDecimals(18)
    }

    return massetAmount ?? fassetAmount
  }, [feederPool, touched])

  const { maxOutputAmount } = useMaximumOutput(slippage?.simple, inputAmount, estimatedOutputAmount.value)

  const outputOption = feederPool.token as AddressOption

  const outputLabel = useMemo(
    () =>
      touched
        .map(
          v =>
            (
              outputTokens.find(t => t.address === v.address) as {
                symbol: string
              }
            ).symbol,
        )
        .join(', '),
    [touched, outputTokens],
  )

  const error = useMemo<string | undefined>(() => {
    if (!touched.length) return 'Enter an amount'

    if (isLowLiquidity) {
      const minAssetSimple = (inputAmount?.simple ?? 0) * 0.4

      if (touched.length !== Object.keys(inputValues).length) {
        return 'Assets must be withdrawn in pairs'
      }

      if (touched.find(v => (v.amount?.simple ?? 0) < minAssetSimple)) {
        return 'Assets must be withdrawn at a minimum 40/60 ratio'
      }
    }

    if (estimatedOutputAmount.error) return estimatedOutputAmount.error

    if (feederPool.token.balance.exact && estimatedOutputAmount.value?.exact.gt(feederPool.token.balance.exact)) {
      return 'Insufficient balance'
    }

    if (estimatedOutputAmount.fetching) return 'Validating…'

    return estimatedOutputAmount.error
  }, [estimatedOutputAmount, feederPool, touched, isLowLiquidity, inputValues, inputAmount])

  return (
    <OneToManyAssetExchange
      exchangeRate={exchangeRate}
      inputAddress={outputOption?.address as string}
      inputLabel={outputOption?.symbol}
      inputAmount={estimatedOutputAmount}
      outputLabel={outputLabel}
      maxOutputAmount={maxOutputAmount}
      priceImpact={priceImpact?.value}
      price={feederPool.price.simple}
    >
      <SendButton
        title={error ?? 'Redeem'}
        warning={!error && impactWarning}
        valid={!error}
        handleSend={() => {
          if (!contract || !walletAddress || !maxOutputAmount) return

          const addresses = touched.map(v => v.address)
          const amounts = touched.map(v => (v.amount as BigDecimal).exact)

          return propose<Interfaces.FeederPool, 'redeemExactBassets'>(
            new TransactionManifest(
              contract,
              'redeemExactBassets',
              [addresses, amounts, maxOutputAmount.exact, walletAddress],
              { past: 'Redeemed', present: 'Redeeming' },
              formId,
            ),
          )
        }}
      />
    </OneToManyAssetExchange>
  )
}
