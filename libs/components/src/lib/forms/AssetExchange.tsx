import React, { FC } from 'react'
import styled from 'styled-components'

import { useTokenSubscription } from '@apps/base/context/tokens'
import { BigDecimal } from '@apps/bigdecimal'
import type { AddressOption } from '@apps/types'

import { AssetInput } from './AssetInput'
import { ExchangeRate } from '../core/ExchangeRate'
import { Arrow } from '../core/Arrow'

export interface Props {
  inputAddress?: string
  inputAddressDisabled?: boolean
  inputAddressOptions: AddressOption[]
  inputFormValue?: string
  handleSetInputAddress?(address?: string): void
  handleSetInputAmount?(formValue?: string): void
  handleSetInputMax?(): void

  outputAddress?: string
  outputAddressDisabled?: boolean
  outputAddressOptions: AddressOption[]
  outputFormValue?: string
  handleSetOutputAddress?(address?: string): void
  handleSetOutputAmount?(formValue?: string): void
  handleSetOutputMax?(): void

  exchangeRate: { value?: BigDecimal; fetching?: boolean } // e.g. for mUSD->imUSD
  className?: string
  // TODO: Combine this with outputFormValue, same with decimals
  isFetching?: boolean
  inputDecimals?: number
  outputDecimals?: number
  inputLabel?: string
  outputLabel?: string
}

const Container = styled.div`
  > * {
    margin: 0.5rem 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
`

export const AssetExchange: FC<Props> = ({
  inputAddressOptions,
  outputAddressOptions,
  exchangeRate,
  handleSetInputAddress,
  handleSetInputAmount,
  handleSetInputMax,
  handleSetOutputAddress,
  handleSetOutputAmount,
  handleSetOutputMax,
  inputAddress,
  inputAddressDisabled,
  inputFormValue,
  outputAddress,
  outputAddressDisabled,
  outputFormValue,
  children,
  className,
  isFetching,
  inputDecimals,
  outputDecimals,
  inputLabel,
  outputLabel,
}) => {
  const inputToken = useTokenSubscription(inputAddress) ?? inputAddressOptions.find(v => v.address === inputAddress)
  const outputToken = useTokenSubscription(outputAddress) ?? outputAddressOptions.find(v => v.address === outputAddress)

  const conversionFormValue =
    inputFormValue && exchangeRate?.value && !outputFormValue
      ? BigDecimal.maybeParse(inputFormValue)?.mulTruncate(exchangeRate.value.exact).string
      : undefined

  return (
    <Container className={className}>
      <AssetInput
        address={inputAddress}
        addressOptions={inputAddressOptions}
        formValue={inputFormValue}
        handleSetAmount={handleSetInputAmount}
        handleSetMax={handleSetInputMax}
        handleSetAddress={handleSetInputAddress}
        addressDisabled={inputAddressDisabled}
        decimals={inputDecimals}
      />
      <div>
        <Arrow />
        <ExchangeRate
          exchangeRate={exchangeRate}
          outputToken={outputToken}
          inputToken={inputToken}
          outputLabel={outputLabel}
          inputLabel={inputLabel}
        />
      </div>
      <AssetInput
        address={outputAddress}
        addressOptions={outputAddressOptions}
        formValue={conversionFormValue ?? outputFormValue}
        amountDisabled={!handleSetOutputAmount}
        handleSetAmount={handleSetOutputAmount}
        handleSetMax={handleSetOutputMax}
        handleSetAddress={handleSetOutputAddress}
        addressDisabled={outputAddressDisabled}
        isFetching={isFetching}
        decimals={outputDecimals}
      />
      {children}
    </Container>
  )
}
