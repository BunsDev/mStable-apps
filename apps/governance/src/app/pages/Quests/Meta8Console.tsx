import React, { FC, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useAccount } from '@apps/base/context/account'
import { useApolloClients } from '@apps/base/context/apollo'
import { useQuestsQuery as useStakingQuestsQuery, useAccountQuery } from '@apps/artifacts/graphql/staking'
import { useQuestsQuery as useQuestbookQuestsQuery } from '@apps/artifacts/graphql/questbook'

import { Typist } from './Typist'
import { Quest } from './Quest'

const Meta8UIContainer = styled.div`
  font-family: 'VT323', monospace;
  font-size: 1.4rem;
  color: white;
  padding: 0.5rem 1rem;
  text-transform: uppercase;
  flex: 1;

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5rem 0;

    > :last-child {
      color: rgba(201, 252, 213, 1);
      text-align: right;
    }

    border-bottom: 1px dashed darkgrey;
  }

  > :last-child {
    padding: 1rem 0.25rem;
    overflow-y: scroll;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.5);
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.5);
    }
    ::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      border: 4px solid rgba(255, 255, 255, 0.5);
    }
  }
`

const Meta8UI: FC = () => {
  const { questId } = useParams<{ questId?: string }>()

  const account = useAccount()
  const clients = useApolloClients()
  const stakingQuestsQuery = useStakingQuestsQuery({ client: clients.staking, nextFetchPolicy: 'cache-only' })
  const accountQuery = useAccountQuery({
    client: clients.staking,
    variables: { id: account ?? '' },
    skip: !account,
    nextFetchPolicy: 'cache-only',
  })
  const questbookQuestsQuery = useQuestbookQuestsQuery({
    client: clients.questbook,
    variables: { account: account ?? '', hasAccount: !!account },
    skip: !account,
    nextFetchPolicy: 'cache-only',
  })

  return (
    <Meta8UIContainer>
      <header>
        <div>
          <Typist>[Quests]</Typist>
        </div>
        <div>
          {accountQuery.data?.account && (
            <>
              <div>Permanent: {accountQuery.data.account.permMultiplier}x</div>
              <div>Season 0: {accountQuery.data.account.seasonMultiplier}x</div>
              <div>Hodl time: 1.1x</div>
            </>
          )}
        </div>
      </header>
      <div>
        {questId ? <Quest questId={questId} /> : stakingQuestsQuery.data?.quests.map(quest => <Quest key={quest.id} questId={quest.id} />)}
      </div>
    </Meta8UIContainer>
  )
}

const Display = styled.div`
  @keyframes scandown {
    0% {
      background-position-y: 0;
    }
    100% {
      background-position-y: -2px;
    }
  }

  background: #2c2b2b;
  box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.25) inset, 0 0 10px 0 rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  flex: 1;
  display: flex;
  padding: 1rem;

  > div {
    flex: 1;
    position: relative;
    background: #564846;
    box-shadow: inset 0 0 10px 5px rgba(0, 0, 0, 0.25);
    border-radius: 18px;

    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 2;
      background-image: linear-gradient(to left bottom, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 50%);
      border-radius: 1rem;
    }
  }

  .scanlines {
    background-image: url('/assets/scanlines.png');
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: soft-light;
    opacity: 0.4;
    animation: scandown 200ms infinite;
  }
`

const Container = styled.div`
  background: url('/assets/beige.jpg') repeat;
  border-radius: 2rem;
  height: 36rem;
  box-shadow: 0 0 10px 4px rgba(255, 255, 255, 0.47) inset;
  padding: 1rem 2rem 0 2rem;
  border: 1px #e8d8c7 solid;

  > div {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;

    > :last-child {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.5rem;

      img {
        width: 8rem;
        height: auto;
      }
    }
  }
`

const Perspective = styled.div`
  perspective: 800px;
  perspective-origin: center bottom;

  > * {
    transform: rotateX(5deg);
  }
`

export const Meta8Console: FC = () => (
  <Container>
    <div>
      <Display>
        <div>
          <Meta8UI />
          <div className="scanlines" />
        </div>
      </Display>
      <div>
        <img src="/assets/meta-8.png" alt="Meta-8" />
      </div>
    </div>
  </Container>
)
