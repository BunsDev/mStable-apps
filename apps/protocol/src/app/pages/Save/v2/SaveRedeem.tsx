import React, { FC, useMemo, useState } from 'react'
import { ISavingsContractV2__factory, BoostedSavingsVault__factory } from '@apps/artifacts/typechain'

import { useSigner } from '@apps/base/context/account'
import { usePropose } from '@apps/base/context/transactions'
import { MassetState } from '@apps/data-provider'
import { useTokenSubscription } from '@apps/base/context/tokens'
import { BigDecimal } from '@apps/bigdecimal'

import { AddressOption, Interfaces } from '@apps/types'
import { TransactionManifest } from '@apps/transaction-manifest'
import { useBigDecimalInput, useSelectedMassetState } from '@apps/hooks'
import { AssetExchange, SendButton } from '@apps/components/forms'

import { SaveRoutesOut } from './types'

const formId = 'SaveRedeem'

const titles = {
  [SaveRoutesOut.Withdraw]: 'Withdraw',
  [SaveRoutesOut.VaultWithdraw]: 'Withdraw from Vault',
}

const purposes = {
  [SaveRoutesOut.Withdraw]: {
    past: 'Withdrew from Save',
    present: 'Withdrawing from Save',
  },
  [SaveRoutesOut.VaultWithdraw]: {
    past: 'Withdrew from Save Vault',
    present: 'Withdrawing from Save Vault',
  },
}

export const SaveRedeem: FC = () => {
  const signer = useSigner()
  const propose = usePropose()

  const massetState = useSelectedMassetState() as MassetState

  const {
    address: massetAddress,
    savingsContracts: {
      v2: {
        latestExchangeRate: { rate: saveExchangeRate } = {},
        address: saveAddress,
        boostedSavingsVault: { address: vaultAddress, account } = {},
        token: saveToken,
      },
    },
  } = massetState

  const [inputAmount, inputFormValue, setInputFormValue] = useBigDecimalInput()

  const [inputAddress, setInputAddress] = useState<string | undefined>(saveAddress)

  const inputToken = useTokenSubscription(inputAddress)

  const error = useMemo<string | undefined>(() => {
    if (inputAmount && inputToken && inputToken.balance.exact.lt(inputAmount.exact)) {
      return 'Insufficient balance'
    }
  }, [inputToken, inputAmount])

  const inputAddressOptions = useMemo<AddressOption[]>(() => {
    if (!saveToken) return []
    if (!vaultAddress) return [saveToken as AddressOption]
    return [
      { address: saveAddress as string },
      {
        address: vaultAddress as string,
        label: `${saveToken.symbol} Vault`,
        balance: account?.rawBalance,
        custom: true,
        symbol: `v-${saveToken.symbol}`,
      } as AddressOption,
    ]
  }, [saveAddress, vaultAddress, saveToken, account])

  const outputAddressOptions = useMemo<AddressOption[]>(() => {
    if (inputAddress === vaultAddress) return [{ address: saveAddress }]
    return [{ address: massetAddress as string }]
  }, [inputAddress, vaultAddress, saveAddress, massetAddress])

  const saveRoute = inputAddress === vaultAddress ? SaveRoutesOut.VaultWithdraw : SaveRoutesOut.Withdraw

  const exchangeRate = useMemo(() => {
    if (saveRoute === SaveRoutesOut.VaultWithdraw) {
      return { value: BigDecimal.ONE }
    }
    const value = saveExchangeRate ? saveExchangeRate.divPrecisely(BigDecimal.ONE) : undefined
    return {
      value,
      fetching: !value,
    }
  }, [saveExchangeRate, saveRoute])

  const valid = !!(!error && inputAmount && inputAmount.simple > 0)

  return (
    <AssetExchange
      inputAddressOptions={inputAddressOptions}
      outputAddressOptions={outputAddressOptions}
      inputAddress={inputAddress}
      inputFormValue={inputFormValue}
      outputAddress={outputAddressOptions?.[0].address}
      exchangeRate={exchangeRate}
      handleSetInputAddress={setInputAddress}
      handleSetInputAmount={setInputFormValue}
      handleSetInputMax={() => {
        if (inputToken) {
          setInputFormValue(inputToken.balance.string)
        } else if (inputAddress === vaultAddress && account?.rawBalance) {
          setInputFormValue(account.rawBalance.string)
        }
      }}
    >
      <SendButton
        valid={valid}
        title={error ?? titles[saveRoute]}
        handleSend={() => {
          if (!(signer && saveAddress && inputAmount && saveAddress)) return

          const purpose = purposes[saveRoute]

          switch (saveRoute) {
            case SaveRoutesOut.VaultWithdraw:
              if (!vaultAddress) return
              return propose<Interfaces.BoostedSavingsVault, 'withdraw'>(
                new TransactionManifest(
                  BoostedSavingsVault__factory.connect(vaultAddress, signer),
                  'withdraw',
                  [inputAmount.exact],
                  purpose,
                  formId,
                ),
              )
            default:
              return propose<Interfaces.SavingsContract, 'redeemCredits'>(
                new TransactionManifest(
                  ISavingsContractV2__factory.connect(saveAddress, signer),
                  'redeemCredits',
                  [inputAmount.exact],
                  purpose,
                  formId,
                ),
              )
          }
        }}
      />
    </AssetExchange>
  )
}
