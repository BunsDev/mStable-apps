import React, { FC, useEffect, useLayoutEffect } from 'react'
import { Route, Switch, Redirect, useHistory } from 'react-router-dom'
import { useEffectOnce } from 'react-use'

import { useBaseCtx, MessageHandler } from '@apps/base'
import { ChainIds, useChainIdCtx, useNetwork } from '@apps/base/context/network'
import { BannerMessage, useBannerMessage } from '@apps/base/context/app'
import { useSelectedMassetState, useURLQuery } from '@apps/hooks'
import { useSelectedMasset, useSelectedMassetConfig, useSelectedMassetName } from '@apps/masset-provider'
import { RewardStreamsProvider } from './context/RewardStreamsProvider'
import { SelectedSaveVersionProvider } from './context/SelectedSaveVersionProvider'

import { Balances } from './components/Balances'
import { Save } from './pages/Save'
import { NotFound } from './pages/NotFound'
import { Stats } from './pages/Stats'
import { EarnRedirect } from './pages/EarnRedirect'
import { Pools } from './pages/Pools'
import { PoolDetail } from './pages/Pools/Detail'
import { Exchange } from './pages/Exchange'

const ProtocolRoutes: FC = () => {
  const { supportedMassets } = useNetwork()
  const [massetName] = useSelectedMasset()
  const history = useHistory()

  useEffectOnce(() => {
    if (supportedMassets.includes(massetName)) return

    // Redirect if not supported masset
    const tab = window.location.hash.split('/')?.[2]
    if (tab) history.push(`/musd/${tab}`)
  })

  return (
    <Switch>
      <Route exact path="/:massetName/earn" component={EarnRedirect} />
      <Route exact path="/:massetName/earn/admin" component={EarnRedirect} />
      <Route exact path="/:massetName/earn/:slugOrAddress" component={EarnRedirect} />
      <Route exact path="/:massetName/earn/:slugOrAddress/:userAddress" component={EarnRedirect} />
      <Route exact path="/:massetName/stats" component={Stats} />
      <Route exact path="/:massetName/save" component={Save} />
      <Route exact path="/:massetName/pools" component={Pools} />
      <Route exact path="/:massetName/swap" component={Exchange} />
      <Route exact path="/:massetName/pools/:poolAddress" component={PoolDetail} />
      <Redirect exact path="/" to="/musd/save" />
      <Redirect exact path="/analytics" to="/musd/stats" />
      <Redirect exact path="/save" to="/musd/save" />
      <Redirect exact path="/earn" to="/musd/earn" />
      <Redirect exact path="/mint" to="/musd/swap/mint" />
      <Redirect exact path="/redeem" to="/musd/swap/redeem" />
      <Redirect exact path="/swap" to="/musd/swap/" />
      <Redirect exact path="/musd" to="/musd/swap/" />
      <Redirect exact path="/mbtc" to="/mbtc/swap/" />
      <Redirect exact path="/musd/forge/*" to="/musd/swap/" />
      <Redirect exact path="/mbtc/forge/*" to="/mbtc/swap/" />
      <Redirect exact path="/musd/exchange/*" to="/musd/swap/" />
      <Redirect exact path="/mbtc/exchange/*" to="/mbtc/swap/" />
      <Redirect exact path="/musd/analytics" to="/musd/stats" />
      <Redirect exact path="/mbtc/analytics" to="/mbtc/stats" />
      <Route component={NotFound} />
    </Switch>
  )
}

export const ProtocolApp: FC = () => {
  const massetState = useSelectedMassetState()
  const massetName = useSelectedMassetName()
  const massetConfig = useSelectedMassetConfig()
  const hasFeederPools = massetState?.hasFeederPools
  const [bannerMessage, setBannerMessage] = useBannerMessage()
  const { undergoingRecol } = useSelectedMassetState() ?? {}
  const urlQuery = useURLQuery()
  const [, setChainId] = useChainIdCtx()
  const [, setBaseCtx] = useBaseCtx()

  useEffect(() => {
    const navItems = [
      { title: 'Save', path: `/${massetName}/save` },
      ...(hasFeederPools ? [{ title: 'Pools', path: `/${massetName}/pools` }] : []),
      { title: 'Swap', path: `/${massetName}/swap` },
      { title: 'Stats', path: `/${massetName}/stats` },
    ]

    setBaseCtx({ navItems, AccountModalContent: Balances })
  }, [hasFeederPools, setBaseCtx, massetName])

  // Handle message prioritisation:
  useLayoutEffect(() => {
    let message: BannerMessage | undefined

    if (undergoingRecol) {
      message = (undergoingRecol && MessageHandler.recollat(massetConfig)) || undefined
    }

    if (bannerMessage?.title !== message?.title) {
      setBannerMessage(message)
    }
  }, [bannerMessage, massetConfig, setBannerMessage, undergoingRecol])

  useLayoutEffect(() => {
    const network = urlQuery.get('network')
    if (!network) return
    const networkIds = {
      ethereum: ChainIds['EthereumMainnet'],
      polygon: ChainIds['MaticMainnet'],
    }
    setChainId(networkIds[network] ?? 1)
  }, [])

  return (
    <SelectedSaveVersionProvider>
      <RewardStreamsProvider>
        <ProtocolRoutes />
      </RewardStreamsProvider>
    </SelectedSaveVersionProvider>
  )
}
