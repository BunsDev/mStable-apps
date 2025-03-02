import React, { FC, ReactNode, useMemo, useRef } from 'react'
import { useLocation, useRouteMatch, NavLink } from 'react-router-dom'
import { useToggle } from 'react-use'
import styled from 'styled-components'
import useOnClickOutside from 'use-onclickoutside'

import { AddressOption } from '@apps/types'
import { useTokenSubscription } from '@apps/base/context/tokens'

import { UnstyledButton } from './Button'
import { ThemedSkeleton } from './ThemedSkeleton'
import { Chevron } from './Chevron'
import { TokenIcon, TokenPair } from '../icons'
import { Tooltip } from './ReactTooltip'

export interface DropdownOptions {
  icon?: {
    symbol?: string
    hideNetwork?: boolean
  } // for TokenIcon use
  subtext?: ReactNode
  asset?: AddressOption
}

interface Props {
  className?: string
  defaultOption?: string
  options?: Record<string, DropdownOptions>
  onChange?(title?: string): void
  disabled?: boolean
}

const Icon = styled.div`
  margin-right: 0.5rem !important;
`

const Balance = styled.span`
  ${({ theme }) => theme.mixins.numeric};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.color.bodyAccent};
`

const TokenDetails = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  > div {
    display: flex;
    align-items: center;

    span {
      font-weight: 600;
    }

    > * svg {
      margin-left: 0.5rem;
    }
  }
`
const OptionContainer = styled(UnstyledButton)<{
  active?: boolean
  selected?: boolean
  disabled?: boolean
}>`
  display: flex;
  width: 100%;
  background: ${({ theme, selected, active }) => (selected && active ? `${theme.color.background[1]}` : `none`)};
  text-align: left;
  padding: 0.375rem 0.75rem;
  align-items: center;
  font-size: 1.125rem;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  border-top-left-radius: ${({ active, selected }) => (active ? `0.75rem` : !selected ? 0 : `0.75rem`)};
  border-top-right-radius: ${({ active, selected }) => (active ? `0.75rem` : !selected ? 0 : `0.75rem`)};
  border-bottom-left-radius: ${({ active, selected }) => (active ? 0 : !selected ? 0 : `0.75rem`)};
  border-bottom-right-radius: ${({ active, selected }) => (active ? 0 : !selected ? 0 : `0.75rem`)};

  &:hover {
    color: ${({ theme }) => theme.color.body};
    background: ${({ theme }) => theme.color.background[1]};
  }

  > *:not(:last-child) {
    margin-right: 0.25rem;
  }

  img {
    height: 32px;
    width: 32px;
  }
`

const OptionList = styled.div`
  position: absolute;
  border-radius: 0.75rem;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background: ${({ theme }) => theme.color.background[0]};
  padding: 0.5rem 0;
  margin-top: -1px;
  border: 1px solid ${({ theme }) => theme.color.defaultBorder};
  min-width: 5.5rem;
  z-index: 2;
  width: 100%;
`

const Container = styled.div`
  position: relative;
`

const Asset: FC<{ asset?: AddressOption }> = ({ asset }) => {
  // Subscribe in any case, so that we can show balances before the asset is selected
  useTokenSubscription(asset?.address)

  if (!asset) return null
  const { tip, label, symbol, balance } = asset
  return (
    <>
      <div>
        <span>{label ?? symbol}</span>
        {tip && <Tooltip tip={tip} />}
      </div>
      {(balance?.simple ?? 0) > 0 && <Balance>{balance?.format(2, false)}</Balance>}
    </>
  )
}

const Option: FC<{
  selected?: boolean
  active?: boolean
  onClick: () => void
  optionName?: string
  option?: DropdownOptions
  isDropdown: boolean
  disabled?: boolean
}> = ({ onClick, optionName, option, isDropdown, selected = false, active = false, disabled }) => {
  if (!optionName)
    return (
      <OptionContainer active disabled>
        <ThemedSkeleton height={24} width={84} />
      </OptionContainer>
    )

  const { icon, subtext, asset } = option ?? {}
  const { symbol, hideNetwork } = icon ?? {}
  const symbols = symbol?.split('/')

  return (
    <OptionContainer onClick={onClick} active={active} selected={selected} disabled={disabled}>
      {symbol && (
        <Icon>
          {(symbols?.length ?? 0) < 2 ? <TokenIcon symbol={symbol} hideNetwork={hideNetwork} /> : <TokenPair symbols={symbols} />}
        </Icon>
      )}
      <TokenDetails>
        {asset ? (
          <Asset asset={asset} />
        ) : (
          <>
            <div>
              <span>{symbol ?? optionName}</span>
            </div>
            {!!subtext && subtext}
          </>
        )}
      </TokenDetails>
      {isDropdown && selected && <Chevron direction={active ? 'up' : 'down'} />}
    </OptionContainer>
  )
}

export const Dropdown: FC<Props> = ({ defaultOption, options, onChange, disabled, className }) => {
  const [show, toggleShow] = useToggle(false)

  const selected = useMemo(
    () =>
      defaultOption && options ? Object.keys(options).find(option => defaultOption.toLowerCase() === option.toLowerCase()) : undefined,
    [options, defaultOption],
  )

  const handleSelect = (option?: string): void => {
    toggleShow(false)
    onChange?.(option)
  }

  const container = useRef(null)
  useOnClickOutside(container, () => {
    toggleShow(false)
  })

  const isDropdown = !!(options && Object.keys(options).length > 1)

  return (
    <Container ref={container} className={className}>
      <Option
        onClick={() => {
          if (isDropdown) toggleShow()
        }}
        optionName={selected}
        option={options && selected ? options[selected] : undefined}
        isDropdown={isDropdown}
        selected
        active={show}
        disabled={disabled}
      />
      {options && (
        <OptionList hidden={!show}>
          {Object.keys(options)
            .filter(optionName => optionName !== selected)
            .map(optionName => (
              <Option
                key={optionName}
                onClick={() => {
                  handleSelect(optionName)
                }}
                optionName={optionName}
                option={options[optionName]}
                isDropdown={isDropdown}
              />
            ))}
        </OptionList>
      )}
    </Container>
  )
}

const NavigationOption: FC<{ title: string; path: string; onClick(): void }> = ({ title, path, onClick }) => {
  const routeMatch = useRouteMatch(path)

  return (
    <NavLink to={path}>
      <Option isDropdown={false} onClick={onClick} selected={routeMatch?.isExact} optionName={title}>
        {title}
      </Option>
    </NavLink>
  )
}

const NavContainer = styled(Container)`
  min-width: 7rem;
  ${OptionList} {
    min-width: 7rem;
  }
`

export const NavigationDropdown: FC<{ navItems: { title: string; path: string }[] }> = ({ navItems }) => {
  const location = useLocation()
  const [show, toggleShow] = useToggle(false)

  const handleSelect = (): void => {
    toggleShow(false)
  }

  const container = useRef(null)
  useOnClickOutside(container, () => {
    toggleShow(false)
  })

  const selected = navItems.find(item => location.pathname.startsWith(item.path))

  return (
    <NavContainer ref={container}>
      <Option
        onClick={() => {
          toggleShow()
        }}
        optionName={selected?.title}
        isDropdown
        selected
        active={show}
      />
      <OptionList hidden={!show}>
        {navItems
          .filter(item => item.path !== selected?.path)
          .map(item => (
            <NavigationOption title={item.title} path={item.path} onClick={handleSelect} key={item.path} />
          ))}
      </OptionList>
    </NavContainer>
  )
}
