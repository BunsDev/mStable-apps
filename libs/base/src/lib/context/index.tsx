import { composedComponent } from '@apps/react-utils'

import { AppProvider } from './AppProvider'
import { NotificationsProvider } from './NotificationsProvider'
import { TransactionsProvider } from './TransactionsProvider'
import { ThemeProvider } from './ThemeProvider'
import { TokensProvider } from './TokensProvider'
import { BlockProvider } from './BlockProvider'
import { ApolloProvider } from './ApolloProvider'
import { NetworkProvider } from './NetworkProvider'
import { AccountProvider } from './AccountProvider'
import { PricesProvider } from './PricesProvider'

const Providers = composedComponent(
  NetworkProvider,
  NotificationsProvider,
  ApolloProvider,
  AccountProvider,
  BlockProvider,
  TransactionsProvider,
  TokensProvider,
  PricesProvider,
  AppProvider,
  ThemeProvider,
)

export { Providers }
