import type { API, Wallet } from 'bnc-onboard/dist/src/interfaces'
import type { FC } from 'react'
import Onboard from 'bnc-onboard'
import type { Provider, Web3Provider as EthersWeb3Provider } from '@ethersproject/providers'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createStateContext, useEffectOnce, useIdle, usePrevious } from 'react-use'
import { ethers, utils } from 'ethers'
import { composedComponent } from '@apps/react-utils'

import { useAddErrorNotification, useAddInfoNotification } from './NotificationsProvider'
import { ChainIds, useChainIdCtx, useJsonRpcProviders, useNetwork, getNetwork } from './NetworkProvider'

export interface OnboardCtx {
  onboard?: API
  connect(): void
  reset(): void
  connected: boolean
  address?: string
  balance?: string
  wallet?: Wallet
}

interface UserAccountCtx {
  address?: string
  masqueradedAccount?: string
  idle: boolean
}

type Masquerade = (account?: string) => void

export const onboardCtx = createContext<OnboardCtx>(null as never)

const [useSignerCtx, SignerProvider] = createStateContext<
  | {
      provider: Provider
      parentChainProvider?: Provider
      signer?: ethers.Signer
    }
  | undefined
>(undefined)

export { useSignerCtx }

const masqueradeCtx = createContext<Masquerade>(null as never)

export const userAccountCtx = createContext<UserAccountCtx>({
  idle: false,
  address: undefined,
  masqueradedAccount: undefined,
})

export const useWallet = (): OnboardCtx['wallet'] => useContext(onboardCtx).wallet

export const useProvider = (): Provider | undefined => useSignerCtx()[0]?.provider

export const useWalletAddress = (): OnboardCtx['address'] => useContext(onboardCtx)?.address

export const useConnect = (): OnboardCtx['connect'] => useContext(onboardCtx).connect

export const useSigner = (): ethers.Signer | undefined => useSignerCtx()[0]?.signer

export const useConnected = (): OnboardCtx['connected'] => useContext(onboardCtx).connected

export const useReset = (): OnboardCtx['reset'] => useContext(onboardCtx).reset

export const useSignerOrProvider = (): ethers.Signer | Provider | undefined => {
  const [signerProvider] = useSignerCtx()
  return signerProvider?.signer ?? signerProvider?.provider
}

export const useMasquerade = (): Masquerade => useContext(masqueradeCtx)

export const useUserState = (): UserAccountCtx => useContext(userAccountCtx)

export const useIsIdle = (): UserAccountCtx['idle'] => useUserState().idle

export const useAccount = (): UserAccountCtx['masqueradedAccount'] | UserAccountCtx['address'] => {
  const { address, masqueradedAccount } = useUserState()
  return masqueradedAccount || address
}

export const useOwnAccount = (): UserAccountCtx['address'] => useUserState().address

export const useIsMasquerading = (): boolean => Boolean(useUserState().masqueradedAccount)

const [useInjectedChainIdCtx, InjectedChainIdProvider] = createStateContext<number | undefined>(undefined)
const [useInjectedProviderCtx, InjectedProviderProvider] = createStateContext<EthersWeb3Provider | undefined>(undefined)
export { useInjectedChainIdCtx, useInjectedProviderCtx }

const OnboardProvider: FC<{
  chainId: ChainIds
}> = ({ children, chainId }) => {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [balance, setBalance] = useState<string | undefined>(undefined)
  const [connected, setConnected] = useState<boolean>(false)
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)

  const [, setInjectedChainId] = useInjectedChainIdCtx()
  const [, setInjectedProvider] = useInjectedProviderCtx()

  const addInfoNotification = useAddInfoNotification()
  const addErrorNotification = useAddErrorNotification()

  const network = useNetwork()
  const rpcUrl = network.rpcEndpoints[0]

  const onboard = useMemo(
    () =>
      Onboard({
        hideBranding: true,
        networkId: parseInt(isNaN(chainId) ? '1' : (chainId as unknown as string)),
        subscriptions: {
          address: account => {
            if (!account) {
              localStorage.removeItem('walletName')
              setWallet(undefined)
              setInjectedProvider(undefined)
              setConnected(false)
              return
            }
            setAddress(account.toLowerCase())
          },
          network: setInjectedChainId,
          balance: setBalance,
          wallet: walletInstance => {
            if (!walletInstance.provider) {
              setWallet(undefined)
              setInjectedProvider(undefined)
              setConnected(false)
              return
            }

            setWallet(walletInstance)
            const ethersProvider = new ethers.providers.Web3Provider(walletInstance.provider, 'any')
            setInjectedProvider(ethersProvider as never)
            setConnected(true)

            if (walletInstance.name) {
              localStorage.setItem('walletName', walletInstance.name)
            } else {
              localStorage.removeItem('walletName')
            }
          },
        },
        walletSelect: {
          agreement: {
            version: '0.1.0',
            termsUrl: 'https://docs.mstable.org/appendix/app-usage-terms-and-conditions',
          },
          wallets: [
            { walletName: 'coinbase', preferred: true },
            { walletName: 'trust', preferred: true, rpcUrl },
            { walletName: 'metamask', preferred: true },
            { walletName: 'gnosis' },
            { walletName: 'dapper' },
            {
              walletName: 'trezor',
              appUrl: window.location.hostname,
              email: 'info@mstable.org',
              rpcUrl,
              preferred: true,
            },
            {
              walletName: 'ledger',
              rpcUrl,
              preferred: true,
            },
            {
              walletName: 'lattice',
              rpcUrl,
              appName: 'mStable',
            },
            {
              walletName: 'fortmatic',
              apiKey: 'pk_live_262AEBF77922D028',
            },
            {
              walletName: 'portis',
              apiKey: 'bd88165a-43d7-481f-91bb-7e2f21e95ce6',
            },
            {
              walletName: 'squarelink',
              apiKey: '3d4c0a80271deecce6da',
            },
            { walletName: 'authereum' },
            {
              walletName: 'walletConnect',
              infuraKey: 'a6daf77ef0ae4b60af39259e435a40fe',
              preferred: true,
            },
            { walletName: 'opera' },
            { walletName: 'operaTouch' },
            { walletName: 'torus' },
            { walletName: 'status' },
            { walletName: 'unilogin' },
            { walletName: 'walletLink', rpcUrl, appName: 'mStable' },
            { walletName: 'imToken', rpcUrl },
            { walletName: 'meetone' },
            { walletName: 'mykey', rpcUrl },
            { walletName: 'huobiwallet', rpcUrl },
            { walletName: 'hyperpay' },
            { walletName: 'wallet.io', rpcUrl },
          ],
        },

        walletCheck: [{ checkName: 'derivationPath' }, { checkName: 'connect' }, { checkName: 'accounts' }, { checkName: 'network' }],
      }),
    [chainId, rpcUrl, setInjectedChainId, setInjectedProvider],
  )

  const connect = useCallback(
    async (walletName?: string) => {
      try {
        const selected = await onboard.walletSelect(walletName)
        if (selected) {
          const checked = await onboard.walletCheck()
          if (!checked) return

          addInfoNotification(
            `Connected${typeof walletName === 'string' ? ` with ${walletName}` : ''}`,
            `${network.protocolName} (${network.chainName})`,
          )
          setConnected(true)
          if (walletName) localStorage.setItem('walletName', walletName)
          return
        }
      } catch (error) {
        console.error(error)
        return
      }

      localStorage.removeItem('walletName')
      onboard.walletReset()
      addErrorNotification('Unable to connect wallet')
      setConnected(false)
      setWallet(undefined)
      setInjectedProvider(undefined)
    },
    [onboard, addErrorNotification, setInjectedProvider, addInfoNotification, network],
  )

  const reset = useCallback(() => {
    onboard.walletReset()
    localStorage.removeItem('walletName')
    setWallet(undefined)
    setConnected(false)
    setInjectedProvider(undefined)
  }, [onboard, setInjectedProvider])

  useEffectOnce(() => {
    const previouslySelectedWallet = localStorage.getItem('walletName')

    if (previouslySelectedWallet && onboard.walletSelect) {
      connect(previouslySelectedWallet).catch(error => {
        console.error(error)
      })
    }
  })

  return (
    <onboardCtx.Provider
      value={useMemo(
        () => ({
          onboard,
          address,
          balance,
          wallet,
          connected,
          connect,
          reset,
        }),
        [onboard, address, balance, wallet, connected, connect, reset],
      )}
    >
      {children}
    </onboardCtx.Provider>
  )
}

const AccountState: FC = ({ children }) => {
  const address = useWalletAddress()
  const idle = useIdle()
  const [masqueradedAccount, masquerade] = useState<UserAccountCtx['masqueradedAccount']>()

  const state = useMemo<UserAccountCtx>(
    () => ({
      address,
      idle,
      masqueradedAccount: masqueradedAccount?.toLowerCase(),
    }),
    [address, idle, masqueradedAccount],
  )

  return (
    <masqueradeCtx.Provider value={masquerade}>
      <userAccountCtx.Provider value={state}>{children}</userAccountCtx.Provider>
    </masqueradeCtx.Provider>
  )
}

const OnboardConnection: FC = ({ children }) => {
  const network = useNetwork()

  const [chainId, setChainId] = useChainIdCtx()
  const [injectedChainId] = useInjectedChainIdCtx()
  const previousInjectedChainId = usePrevious(injectedChainId)

  const jsonRpcProviders = useJsonRpcProviders()
  const [injectedProvider] = useInjectedProviderCtx()
  const [, setSigners] = useSignerCtx()

  useEffect(() => {
    if (chainId) localStorage.setItem('mostRecentChainId', chainId as unknown as string)
  }, [chainId])

  const injectedMismatching = injectedChainId !== chainId

  useEffect(() => {
    if (!chainId || !injectedChainId || !previousInjectedChainId) return

    // Change chainId when injectedChainId changes and doesn't match chainId
    if (injectedMismatching && previousInjectedChainId !== injectedChainId) {
      getNetwork(injectedChainId)
      setChainId(injectedChainId)
    }
  }, [chainId, injectedChainId, injectedMismatching, previousInjectedChainId, setChainId])

  useEffect(() => {
    if (!injectedProvider || network.isMetaMaskDefault) return

    // For non-default chains and an injected provider, prompt to add the chain
    injectedProvider
      .send('wallet_addEthereumChain', [
        {
          chainId: utils.hexStripZeros(utils.hexlify(network.chainId)),
          chainName: `${network.protocolName} (${network.chainName})`,
          nativeCurrency: network.nativeToken,
          rpcUrls: network.rpcEndpoints,
          blockExplorerUrls: [network.getExplorerUrl()],
        },
      ])
      .catch(error => {
        console.warn(error)
      })
  }, [injectedProvider, network])

  useEffect(() => {
    if (!jsonRpcProviders) return setSigners(undefined)

    if (injectedMismatching) {
      return setSigners({
        provider: jsonRpcProviders.provider,
        parentChainProvider: jsonRpcProviders.parentChainProvider,
      })
    }

    setSigners({
      provider: injectedProvider ?? jsonRpcProviders.provider,
      parentChainProvider: jsonRpcProviders.parentChainProvider,
      signer: injectedProvider?.getSigner() as never,
    })
  }, [injectedMismatching, injectedProvider, jsonRpcProviders, setSigners])

  // Remount Onboard when the chainId changes
  // Necessitated by Onboard's design and internal state
  return (
    <OnboardProvider key={chainId} chainId={chainId ?? ChainIds.EthereumMainnet}>
      {children}
    </OnboardProvider>
  )
}

export const AccountProvider = composedComponent(
  SignerProvider,
  InjectedChainIdProvider,
  InjectedProviderProvider,
  OnboardConnection,
  AccountState,
)
