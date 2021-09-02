import React, { FC } from 'react'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import styled, { keyframes } from 'styled-components'

import { TabsOfTruth, createTabsContext } from '@apps/components/core'

import { ClaimForm } from './ClaimForm'
import { ClaimGraph } from './ClaimGraph'
import { StakeSelection } from './StakeSelection'
import { StakeForm } from './StakeForm'
import { StakeGraph } from './StakeGraph'
import { StakeMigration } from './StakeMigration'
import { WithdrawForm } from './WithdrawForm'
import { WithdrawGraph } from './WithdrawGraph'
import { useNetworkAddresses } from '@apps/base/context/network'
import { useTokenSubscription } from '@apps/base/context/tokens'
import { StakingMigrationProvider, useStakingMigration } from '../../hooks/useStakingMigration'

enum Tabs {
  Stake,
  Claim,
  Withdraw,
}

const stakeTabs: { id: Tabs; title: string; heading: string; subheading: string; Form: FC; Graph: FC }[] = [
  {
    id: Tabs.Stake,
    title: 'Stake',
    heading: 'Voting Power',
    subheading: 'Your vMTA balance will increase the longer you stake',
    Form: StakeForm,
    Graph: StakeGraph,
  },
  {
    id: Tabs.Claim,
    title: 'Claim',
    heading: 'MTA Rewards',
    subheading: 'Your vMTA balance will increase the longer you stake',
    Form: ClaimForm,
    Graph: ClaimGraph,
  },
  {
    id: Tabs.Withdraw,
    title: 'Withdraw',
    heading: 'Withdrawal Fee',
    subheading: 'Your withdrawal fee decreases the longer you have staked',
    Form: WithdrawForm,
    Graph: WithdrawGraph,
  },
]

const [useTabs, TabsProvider] = createTabsContext(stakeTabs)

const slide = keyframes`
  0% {
    filter: blur(0);
    opacity: 1;
  }
  100% {
    filter: blur(2px);
    opacity: 0;
  }
`

// Temp scroll, maybe move delegation position
const StyledTransitionGroup = styled(TransitionGroup)`
  overflow-y: scroll;
  height: 100%;
  min-height: 22rem;
  position: relative;

  h3 {
    font-size: 1rem;
    font-weight: 500;
  }

  > * {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
`

const FormTransition = styled.div`
  &.entering {
    > * {
      animation: ${slide} 0.25s ease-in reverse;
    }
  }
  &.exiting {
    > * {
      animation: ${slide} 0.25s ease-out;
    }
  }
  &.exited {
    > * {
      opacity: 0;
      filter: blur(2px);
    }
  }
`

const GraphContainer = styled.div`
  width: 100%;

  h2 {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 2rem;
    color: ${({ theme }) => theme.color.body};
  }

  h4 {
    font-size: 0.75rem;
    line-height: 1.5rem;
    font-weight: 400;
    color: ${({ theme }) => theme.color.bodyTransparent};
  }
`

const FormContainer = styled.div`
  min-height: 20rem;
  min-width: 24rem;
  max-width: 28rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.color.background[1]};
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.75rem;
`

const FormsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: ${({ theme }) => theme.color.background[0]};
  border: 1px ${({ theme }) => theme.color.background[1]} solid;
  border-radius: 1rem;

  > :first-child {
    padding: 1.5rem;
  }
`

const Content: FC = () => {
  const [{ tabs, activeTabIndex }, setActiveIndex] = useTabs()
  const networkAddresses = useNetworkAddresses()
  const balanceV1Simple = useTokenSubscription(networkAddresses.vMTA)?.balance?.simple
  const [withdrawnBalance] = useStakingMigration()

  const { Graph, Form, heading, subheading } = stakeTabs[activeTabIndex]

  return <StakeSelection />

  return !!balanceV1Simple || withdrawnBalance ? (
    <StakeMigration />
  ) : (
    <FormsContainer>
      <GraphContainer>
        <h2>{heading}</h2>
        <h4>{subheading}</h4>
        <Graph />
      </GraphContainer>
      <FormContainer>
        <TabsOfTruth tabs={tabs} activeTabIndex={activeTabIndex} setActiveIndex={setActiveIndex} />
        <StyledTransitionGroup>
          <CSSTransition key={activeTabIndex} timeout={200}>
            {className => (
              <FormTransition className={className}>
                <Form />
              </FormTransition>
            )}
          </CSSTransition>
        </StyledTransitionGroup>
      </FormContainer>
    </FormsContainer>
  )
}

export const StakeForms: FC = () => (
  <StakingMigrationProvider>
    <TabsProvider>
      <Content />
    </TabsProvider>
  </StakingMigrationProvider>
)
