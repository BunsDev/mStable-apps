import { useMemo } from 'react'

import type { BoostedSavingsVaultState } from '@apps/data-provider'
import { useTokenSubscription } from '@apps/base/context/tokens'
import { useNetworkAddresses } from '@apps/base/context/network'
import { calculateBoost, calculateBoostImusd, getCoeffs } from '@apps/quick-maths'

export const useCalculateUserBoost = (vault?: BoostedSavingsVaultState): number => {
  const networkAddresses = useNetworkAddresses()
  const vMTA = useTokenSubscription(networkAddresses.vMTA)

  const vMTABalance = vMTA?.balance
  const rawBalance = vault?.account?.rawBalance

  const boost = useMemo<number>(() => {
    if (!vault) return 1

    const coeffs = getCoeffs(vault)
    const { isImusd } = vault

    return isImusd || !coeffs ? calculateBoostImusd(rawBalance, vMTABalance) : calculateBoost(...coeffs, rawBalance, vMTABalance)
  }, [rawBalance, vMTABalance, vault])

  // Fallback to 1x multiplier
  return boost ?? 1
}
