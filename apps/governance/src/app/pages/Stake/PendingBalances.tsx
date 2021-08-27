import { CountdownBar } from '@apps/components/core'
import React, { FC, useMemo } from 'react'
import { useStakedTokenQuery } from '../../context/StakedTokenProvider'

interface Props {
  timestamp?: number
  units?: number
  symbol?: string
}

export const PendingBalances: FC = () => {
  const { data } = useStakedTokenQuery()

  const { timestamp, units } = useMemo<Props>((): Props => {
    const account = data?.stakedToken?.accounts?.[0]
    if (!data || !account) {
      return {}
    }

    const {
      balance: { cooldownTimestamp: timestamp, cooldownUnits: units },
    } = account

    return {
      timestamp,
      units,
      symbol: data?.stakedToken?.stakingToken?.symbol,
    }
  }, [data])

  const dateRange = timestamp - Date.now()
  const percentage = 100 * ((timestamp - Date.now()) / dateRange)

  return (
    <div>
      <CountdownBar width={200} percentage={percentage} end={timestamp} />
      <p>Pending withdraw: {units} </p>
    </div>
  )
}
