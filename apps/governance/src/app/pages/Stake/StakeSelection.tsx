import React, { FC } from 'react'
import styled from 'styled-components'

import { Button } from '@apps/components/core'
import { ViewportWidth } from '@apps/base/theme'
import { ReactComponent as MTAIcon } from '@apps/components/icons/tokens/MTA.svg'
import { ReactComponent as BPTIcon } from '@apps/components/icons/tokens/BPT-MTA-ETH.svg'
import { ReactComponent as CheckmarkIcon } from '@apps/components/icons/checkmark.svg'

const MTAContainer = styled.div`
  width: 6rem;

  svg {
    width: 100%;
    height: 100%;
  }
`

const BPTContainer = styled.div`
  width: 7.25rem;

  svg {
    width: 100%;
    height: 100%;
  }
`

const Checklist = styled.div`
  display: flex;
  justify-content: flex-start;
  color: ${({ theme }) => theme.color.bodyAccent};
  font-size: 0.75rem;

  > div {
    display: flex;
    background: linear-gradient(124.57deg, #2c6fd7 29.6%, #1a57b5 100%);
    padding: 0.25rem 0.5rem;
    border-radius: 0.625rem;
    align-items: center;
    margin-right: 0.75rem;

    svg {
      width: 0.75rem;
      height: 0.75rem;

      path {
        fill: white;
      }
    }
  }
`

const Header = styled.div`
  display: flex;
  flex-direction: row;

  > div:first-child {
    display: flex;
    flex-direction: column;

    h2 {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    h4 {
      color: ${({ theme }) => theme.color.bodyAccent};
      font-size: 0.875rem;
    }
  }
`

const SelectionBox = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  background: ${({ theme }) => theme.color.background[0]};
  border: 1px solid ${({ theme }) => theme.color.defaultBorder};
  border-radius: 1rem;
  padding: 2.25rem 1rem;
  justify-content: space-between;
  gap: 2rem;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 1.125rem;
  background: ${({ theme }) => theme.color.background[1]};
  border: 1px solid ${({ theme }) => theme.color.defaultBorder};
  padding: 1rem;
  gap: 1rem;

  @media (min-width: ${ViewportWidth.m}) {
  }

  @media (min-width: ${ViewportWidth.l}) {
    flex-direction: row;
  }
`

export const StakeSelection: FC = () => {
  return (
    <Container>
      <SelectionBox>
        <Header>
          <div>
            <h2>Stake MTA</h2>
            <h4>In return for participating in governance, you will receive MTA rewards. Learn about the risks</h4>
          </div>
          <MTAContainer>
            <MTAIcon />
          </MTAContainer>
        </Header>
        <Checklist>
          <div>
            <CheckmarkIcon />
          </div>
          MTA Rewards
        </Checklist>
        <Button highlighted scale={1.125} onClick={() => {}}>
          Stake MTA
        </Button>
      </SelectionBox>
      <SelectionBox>
        <Header>
          <div>
            <h2>Stake MTA/ETH BPT</h2>
            <h4>In return for participating in governance, you will receive MTA, BAL rewards and trading fees. Learn about the risks</h4>
          </div>
          <BPTContainer>
            <BPTIcon />
          </BPTContainer>
        </Header>
        <Checklist>
          <div>
            <CheckmarkIcon />
          </div>
          MTA Rewards, BAL Rewards, Trading Fees
        </Checklist>
        <Button highlighted scale={1.125} onClick={() => {}}>
          Stake BPT
        </Button>
      </SelectionBox>
    </Container>
  )
}
