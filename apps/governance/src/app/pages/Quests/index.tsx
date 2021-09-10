import React, { FC, useRef } from 'react'
import styled from 'styled-components'

import { GovernancePageHeader } from '../../components/GovernancePageHeader'
import { Meta8Console } from './Meta8Console'

const MyQuestsContainer = styled.div`
  @import url('https://fonts.cdnfonts.com/css/vcr-osd-mono');
  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  padding: 36px 50px;

  * {
    font-family: 'VCR OSD Mono', monospace;
    text-transform: uppercase;
  }

  h3 {
    font-size: 16px;
    line-height: 16px;
    letter-spacing: 0.05em;
    color: #ffffff;
    text-shadow: -1px 1px 0 #86dccd, -1px 1px 0 #ec5ba2;
    margin-bottom: 2rem;
  }

  > div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 2rem;
  }

  .quest {
    &:nth-child(1) .header > div img {
      animation-delay: -5s;
    }
    &:nth-child(2) .header > div img {
      animation-delay: -2s;
    }
    &:nth-child(3) .header > div img {
      animation-delay: 0s;
    }

    &.seasonal {
      background: linear-gradient(333.23deg, #3b1e8b 30.23%, #e364b8 135.17%);
      border: 4px #654fa2 solid;
      h5 {
        color: #fecbea;
        text-shadow: -1px 1px 0 #cd40ff;
      }
      .multiplier {
        background: linear-gradient(180deg, #4b2da5 0%, #381d89 100%);
        box-shadow: 0 4px 10px #2b1274;
      }
    }

    &.permanent {
      background: linear-gradient(333.23deg, #8b1e59 30.23%, #e364b8 135.17%);
      border: 4px #f99bd3 solid;
      h5 {
        text-shadow: -1px 1px 0 #fe33ad;
      }
      .multiplier {
        background: linear-gradient(180deg, #a62e6f 0%, #8b1f5a 100%);
        box-shadow: 0 4px 10px #78144a;
      }
    }

    box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
    border-radius: 18px;
    //border-image-source: linear-gradient(180deg, #f99bd3 0%, #c66b9c 100%);
    padding: 32px;

    .header {
      display: flex;
      flex-direction: column;
      justify-content: center;

      h4 {
        color: white;
        font-size: 24px;
        margin-bottom: 0.5rem;
      }

      h5 {
        font-size: 18px;
        min-height: 3rem;
      }

      > div {
        mix-blend-mode: lighten;
        border-radius: 16px;
        background: rgba(254, 203, 234, 0.1);
        overflow: hidden;
        width: 168px;
        align-self: center;
        margin: 1.4rem 0;

        img {
          width: 168px;
          height: auto;
          animation: rotating 32s linear infinite reverse;
          align-self: center;
        }
      }
    }

    .details {
      display: flex;
      justify-content: center;
      align-items: center;
      border-top: 1px rgba(255, 255, 255, 0.25) solid;
      padding-top: 1rem;

      .multiplier {
        color: white;
        border-radius: 16px;
        font-size: 18px;
        padding: 0.5rem 1rem;
      }
    }
  }
`

// TODO
// Proper components, kill these classnames, etc
// Just for drafting ideas
const MyQuests: FC = () => {
  return (
    <MyQuestsContainer>
      <h3>Quests Accomplished</h3>
      <div>
        <div className="quest permanent">
          <div className="header">
            <h4>Migrated</h4>
            <h5>From staking v1</h5>
            <div>
              <img src="/assets/metanaut.gif" />
            </div>
          </div>
          <div className="details">
            <div className="multiplier">+1.2x</div>
          </div>
        </div>
        <div className="quest seasonal">
          <div className="header">
            <h4>MTA Whale</h4>
            <h5>So big. Much wow</h5>
            <div>
              <img src="/assets/mta.gif" />
            </div>
          </div>
          <div className="details">
            <div className="multiplier">+1.1x</div>
          </div>
        </div>
        <div className="quest permanent">
          <div className="header">
            <h4>mUSD minter</h4>
            <h5>Good work</h5>
            <div>
              <img src="/assets/musd.gif" />
            </div>
          </div>
          <div className="details">
            <div className="multiplier">+1.1x</div>
          </div>
        </div>
      </div>
    </MyQuestsContainer>
  )
}

const Screen = styled.div`
  background: #202020;
  box-shadow: inset 0 0 10px 5px rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
`

const ConsoleContainer = styled.div`
  perspective: 900px;
  perspective-origin: 0 -10%;

  > div {
    transform: rotateX(3deg) rotateY(1deg);
    background: linear-gradient(65deg, #d0d099 0%, #ccbd97 100%);
    border-radius: 2rem;
    padding: 1.5rem 3rem 0 3rem;

    > :last-child {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      font-weight: 600;
      font-size: 1.2rem;
      text-align: center;
      color: #fff9e4;
      text-shadow: #8d5b0e -1px 1px 1px;
      padding: 1rem;

      img {
        width: 2rem;
        height: auto;
      }
    }
  }
`

export const Quests: FC = () => (
  <div>
    <GovernancePageHeader title="Quests" subtitle="Completing quests boosts your voting power" />
    <Meta8Console />
  </div>
)
