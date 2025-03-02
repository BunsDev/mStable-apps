import React, { Fragment, FC, useMemo } from 'react'
import styled from 'styled-components'

import { ExplorerLink, CountUp, ThemedSkeleton, Table, TableCell, TableRow } from '@apps/components/core'
import { TokenIcon as TokenIconBase } from '@apps/components/icons'
import { MassetState, useDataState } from '@apps/data-provider'
import { ChainIds, useChainIdCtx, useNetworkAddresses } from '@apps/base/context/network'
import { useTokenSubscription } from '@apps/base/context/tokens'

const AssetCell = styled(TableCell)`
  height: 4rem;

  > div {
    display: flex;
    align-items: center;

    img {
      width: 100%;
      height: auto;
    }

    span {
      color: ${({ theme }) => theme.color.body};
    }

    span:nth-child(2) {
      font-weight: 600;
    }
  }
`

const Balance = styled(CountUp)`
  > * {
    font-weight: normal !important;
    font-size: 1rem;
  }
`

const TokenIcon = styled(TokenIconBase)<{ outline?: boolean }>`
  width: 2rem;
  height: 2rem;
  margin-right: 0.5rem;
  ${({ outline }) => (outline ? `border: 1px white solid; border-radius: 100%` : '')}
`

const TokenBalance: FC<{ address: string }> = ({ address }) => {
  const token = useTokenSubscription(address)
  return token ? <Balance end={token.balance.simple} /> : <ThemedSkeleton />
}

const StyledTable = styled(Table)`
  > tbody {
    height: 16rem;
    overflow-y: scroll;
  }
`

export const Balances: FC<{ onRowClick?: (symbol: string) => void }> = ({ onRowClick }) => {
  const dataState = useDataState()
  const networkAddresses = useNetworkAddresses()
  const [chainId] = useChainIdCtx()

  const MTA = chainId === ChainIds.EthereumMainnet && {
    name: `Meta (mStable Governance)`,
    symbol: `MTA`,
    address: networkAddresses.MTA,
    decimals: 18,
  }

  const massetTokens = useMemo(
    () =>
      Object.values(dataState).map(({ token: masset, bAssets, savingsContracts: { v1, v2 } }: MassetState) => ({
        masset,
        bassets: Object.values(bAssets).map(b => b.token),
        savingsContractV1: v1
          ? {
              name: `${masset.symbol} Save v1`,
              symbol: masset.symbol,
              address: v1.address,
              decimals: masset.decimals,
              savingsBalance: v1.savingsBalance,
            }
          : undefined,
        savingsContractV2: v2 && v2.token ? v2.token : undefined,
      })),
    [dataState],
  )

  const bassetTokens = massetTokens.map(({ bassets }) => bassets).reduce((a, b) => [...a, ...b], [])
  const headerTitles = ['Asset', 'Balance'].map(t => ({ title: t }))

  return (
    <StyledTable headerTitles={headerTitles}>
      {MTA && (
        <TableRow key={MTA.address} buttonTitle="Explore" onClick={() => onRowClick?.(MTA.symbol)}>
          <AssetCell>
            <TokenIcon symbol={MTA.symbol} outline />
            <span>{MTA.symbol}</span>
            <ExplorerLink data={MTA.address} />
          </AssetCell>
          <TableCell>
            <TokenBalance address={MTA.address} />
          </TableCell>
        </TableRow>
      )}
      {massetTokens.map(({ masset, savingsContractV1, savingsContractV2 }) => {
        return (
          <Fragment key={masset.address}>
            <TableRow key={masset.address} buttonTitle="Explore" onClick={() => onRowClick?.(masset.symbol)}>
              <AssetCell>
                <TokenIcon symbol={masset.symbol} outline />
                <span>{masset.symbol}</span>
                <ExplorerLink data={masset.address} />
              </AssetCell>
              <TableCell>
                <TokenBalance address={masset.address} />
              </TableCell>
            </TableRow>
            {savingsContractV1 && (
              <TableRow key={savingsContractV1.address} buttonTitle="Explore" onClick={() => onRowClick?.(savingsContractV1.name)}>
                <AssetCell>
                  <TokenIcon symbol={savingsContractV1.symbol} outline />
                  <span>{savingsContractV1.name}</span>
                </AssetCell>
                <TableCell>
                  {savingsContractV1.savingsBalance.balance ? (
                    <Balance end={savingsContractV1.savingsBalance.balance.simple} />
                  ) : (
                    <ThemedSkeleton />
                  )}
                </TableCell>
              </TableRow>
            )}
            {savingsContractV2 && (
              <TableRow key={savingsContractV2.address} buttonTitle="Explore" onClick={() => onRowClick?.(savingsContractV2.symbol)}>
                <AssetCell>
                  <TokenIcon symbol={savingsContractV2.symbol} outline />
                  <span>{savingsContractV2.symbol}</span>
                </AssetCell>
                <TableCell>{savingsContractV2.balance ? <Balance end={savingsContractV2.balance.simple} /> : <ThemedSkeleton />}</TableCell>
              </TableRow>
            )}
          </Fragment>
        )
      })}
      {bassetTokens.map(({ address, symbol }) => (
        <TableRow key={address} buttonTitle="Explore" onClick={() => onRowClick?.(symbol)}>
          <AssetCell>
            <TokenIcon symbol={symbol} />
            <span>{symbol}</span>
            <ExplorerLink data={address} />
          </AssetCell>
          <TableCell>
            <TokenBalance address={address} />
          </TableCell>
        </TableRow>
      ))}
    </StyledTable>
  )
}
