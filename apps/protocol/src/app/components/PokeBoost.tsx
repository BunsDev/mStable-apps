import React, { FC } from 'react'
import CountUp from 'react-countup'
import styled from 'styled-components'

import { BoostedSavingsVault__factory } from '@apps/artifacts/typechain'
import { useSigner, useWalletAddress } from '@apps/base/context/account'
import { BoostedSavingsVaultState } from '@apps/data-provider'
import { BoostedCombinedAPY } from '@apps/types'
import { useRewardStreams } from '../context/RewardStreamsProvider'
import { usePropose } from '@apps/base/context/transactions'
import { useCalculateUserBoost } from '@apps/hooks'
import { FetchState } from '@apps/hooks'
import { ViewportWidth } from '@apps/base/theme'
import { TransactionManifest, Interfaces } from '@apps/transaction-manifest'
import { Button } from '@apps/components/core'

import { SelectBoost } from './SelectBoost'

interface Props {
  apy: FetchState<BoostedCombinedAPY>
  vault?: BoostedSavingsVaultState
}

const CurrentMultiplier = styled(CountUp)`
  color: ${({ theme }) => theme.color.orange};
`

const UpdatedMultiplier = styled(CountUp)`
  color: ${({ theme }) => theme.color.green};
`

const Info = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  flex-direction: column;
  width: 100%;

  > *:not(:last-child) {
    margin-right: 0.5rem;
  }

  > *:last-child {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 1rem;
    align-items: center;
    min-width: 16rem;

    > *:not(:last-child) {
      margin-right: 0.5rem;
    }
  }

  @media (min-width: ${ViewportWidth.m}) {
    align-items: flex-end;
  }

  @media (min-width: ${ViewportWidth.l}) {
    flex-direction: row;

    > *:last-child {
      margin: 0;
    }
  }
`

const APY = styled.div`
  min-width: 11rem;
  margin-bottom: 1rem;

  > *:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  @media (min-width: ${ViewportWidth.m}) {
    margin: 0;
  }
`

const Container = styled.div`
  display: flex;
  border: 1px dashed ${({ theme }) => theme.color.defaultBorder};
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  flex-direction: column;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  span {
    font-size: 1.125rem;
  }

  @media (min-width: ${ViewportWidth.m}) {
    flex-direction: row;
    align-items: center;
  }
`

export const PokeBoost: FC<Props> = ({ apy, vault }) => {
  const propose = usePropose()
  const signer = useSigner()
  const address = useWalletAddress()

  const { account, address: vaultAddress, isImusd } = vault ?? {}
  const userBoost = useCalculateUserBoost(vault)
  const rewardStreams = useRewardStreams()

  const boostNeedsPoke = !!account?.boostMultiplier && (account.boostMultiplier ?? 0) < (userBoost ?? 0)
  const boostNeedsDirector = boostNeedsPoke && account?.boostMultiplier === 1
  const message = isImusd ? 'Claim rewards to update your reward rate.' : 'Poke the contract or claim rewards to update your reward rate.'

  if (boostNeedsDirector) return <SelectBoost vault={vault} />
  if (!boostNeedsPoke) return null

  return (
    <Container>
      <APY>
        <h3>Boosted APY</h3>
        <CurrentMultiplier end={(account?.boostMultiplier ?? 1) * (apy?.value?.rewards.base ?? 0)} decimals={2} suffix="%" />
        <span>&nbsp;⭢&nbsp;</span>
        <UpdatedMultiplier end={(userBoost ?? 0) * (apy?.value?.rewards.base ?? 0)} decimals={2} suffix="%" />
      </APY>
      <Info>
        <p>
          <b>Your boost is out of sync.</b>&nbsp;
          {message}
        </p>
        <div>
          <Button
            highlighted
            onClick={() => {
              if (!signer || !vaultAddress || !rewardStreams) return
              propose<Interfaces.BoostedSavingsVault, 'claimRewards(uint256,uint256)'>(
                new TransactionManifest(
                  BoostedSavingsVault__factory.connect(vaultAddress, signer),
                  'claimRewards(uint256,uint256)',
                  rewardStreams.claimRange,
                  {
                    present: 'Claiming rewards',
                    past: 'Claimed rewards',
                  },
                ),
              )
            }}
          >
            Claim Rewards
          </Button>
          {!isImusd && (
            <Button
              highlighted
              onClick={() => {
                if (!signer || !address || !vaultAddress) return
                propose<Interfaces.BoostedSavingsVault, 'pokeBoost'>(
                  new TransactionManifest(BoostedSavingsVault__factory.connect(vaultAddress, signer), 'pokeBoost', [address], {
                    present: `Update boost`,
                    past: `Updated boost`,
                  }),
                )
              }}
            >
              Poke
            </Button>
          )}
        </div>
      </Info>
    </Container>
  )
}
