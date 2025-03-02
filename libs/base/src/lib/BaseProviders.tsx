import React, { FC } from 'react'
import { HashRouter } from 'react-router-dom'

import { createStateContext, useEffectOnce } from 'react-use'

import { Providers } from './context'
import { Updaters } from './updaters'

export { BannerMessage } from './components/layout/BannerMessage'

interface BaseContext {
  navItems: { path: string; title: string }[]
  AccountModalContent?: FC<any>
}

export const [useBaseCtx, BaseCtxProvider, baseCtx] = createStateContext<BaseContext>({ navItems: [] })

export const BaseProviders: FC = ({ children }) => {
  useEffectOnce(() => {
    // Redirect for legacy links (without hash)
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/ipfs/')) {
      window.location.hash = window.location.pathname
      window.location.pathname = ''
    }
  })

  return (
    <BaseCtxProvider>
      <HashRouter>
        <Providers>
          <Updaters />
          {children}
        </Providers>
      </HashRouter>
    </BaseCtxProvider>
  )
}
