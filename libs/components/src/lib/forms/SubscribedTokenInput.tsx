import React, { FC, useMemo } from 'react'
import styled from 'styled-components'

import { useTokens, useTokenSubscription } from '@apps/base/context/tokens'
import { AddressOption } from '@apps/types'

import { AssetDropdown } from '../core/AssetDropdown'

interface Props {
  value?: string
  options?: (AddressOption | string)[]
  onChange?(tokenAddress?: string): void
  error?: string
  disabled?: boolean
  className?: string
}

const StyledDropdown = styled(AssetDropdown)`
  height: 100%;

  > button {
    height: 100%;
  }
`

export const SubscribedTokenInput: FC<Props> = ({ value, options: _options = [], onChange, disabled = false }) => {
  // Subscribe to the selected token or use custom
  const subscribedToken = useTokenSubscription(value)
  const token =
    (_options.filter(option => typeof option !== 'string' && option?.custom) as AddressOption[])?.find(v => v?.address === value) ??
    subscribedToken

  // Subscribe the other options
  const tokens = useTokens(
    _options
      .filter((option: AddressOption | string) => typeof option === 'string' || !option?.custom)
      .map(option => (typeof option === 'string' ? option : option?.address)),
  )

  const options = useMemo<AddressOption[]>(
    () =>
      // Merge selected token, subscribed options and custom options & filter out token duplication
      [
        token,
        ...tokens.filter(t => t?.address !== token?.address),
        ..._options.filter(option => typeof option !== 'string' && option?.custom && option?.label !== (token as AddressOption)?.label),
      ].filter(Boolean) as AddressOption[],
    [_options, token, tokens],
  )

  const prefixRemovedOptions = options.map(option => ({ ...option, symbol: option.symbol?.replace(/POS-/gi, '') }))

  return <StyledDropdown onChange={onChange} addressOptions={prefixRemovedOptions} defaultAddress={value} disabled={disabled} />
}
