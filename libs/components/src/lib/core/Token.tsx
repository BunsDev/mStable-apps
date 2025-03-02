import React, { FC } from 'react'
import styled from 'styled-components'

import { TokenIcon } from '../icons'

interface Props {
  symbol: string
  color?: string
  className?: string
}

const Container = styled.div<{ color?: string; transparent?: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.l};
  font-weight: bold;
  color: ${({ color, theme }) => theme.color.body ?? color};

  > :first-child {
    padding-right: 6px;
    width: 36px;
    height: 36px;
  }
}
`

export const Token: FC<Props> = ({ symbol, color, className }) => (
  <Container color={color} className={className}>
    <TokenIcon symbol={symbol} />
    <div>{symbol}</div>
  </Container>
)
