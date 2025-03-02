import { BigNumber, BigNumberish, utils } from 'ethers'
import { BigNumber as FractionalBigNumber } from 'bignumber.js'
import { toK } from '@apps/formatters'

export const SCALE = BigNumber.from((1e18).toString())
export const RATIO_SCALE = BigNumber.from((1e8).toString())

const { commify, formatUnits, parseUnits } = utils

const DEFAULT_DECIMALS = 18

export class BigDecimal {
  static ZERO = new BigDecimal(0)

  static ONE = new BigDecimal((1e18).toString())

  /**
   * Parse a BigDecimal from the given amount string (e.g. "12.32") and decimals
   * @param amountStr
   * @param decimals
   */
  static parse(amountStr: string, decimals = DEFAULT_DECIMALS): BigDecimal {
    // Sanitize the input and limit it to the given decimals
    const [int, fraction = '0'] = amountStr.split('.')
    const sanitizedAmount = `${int}.${fraction.slice(0, decimals)}`

    // Create a fractional BigNumber with the sanitized amount
    const fractionalBn = new FractionalBigNumber(sanitizedAmount)
    const formatted = fractionalBn.decimalPlaces(decimals).toFixed(decimals)

    // Parse a BigNumber with the given decimals
    const parsedBn = parseUnits(formatted, decimals)

    // Create a BigDecimal
    return new BigDecimal(parsedBn, decimals)
  }

  /**
   * Given an amount string (e.g. "12.32"), which may be null, and decimals,
   * parse a BigDecimal if possible.
   *
   * @param amountStr
   * @param decimals
   */
  static maybeParse(amountStr: string | null | undefined, decimals = DEFAULT_DECIMALS): BigDecimal | undefined {
    if (!amountStr || !decimals) {
      return undefined
    }
    return BigDecimal.parse(amountStr, decimals)
  }

  static fromSimple(simpleNumber: number, decimals: number = DEFAULT_DECIMALS): BigDecimal {
    return BigDecimal.parse(simpleNumber.toFixed(decimals), decimals)
  }

  static fromMetric({ decimals, exact }: { decimals: number; exact: string }): BigDecimal {
    return new BigDecimal(exact, decimals)
  }

  static fromJSON(json: string): BigDecimal {
    const { decimals, exact } = JSON.parse(json)
    return new BigDecimal(exact, decimals)
  }

  decimals: number

  exact: BigNumber

  constructor(num: BigNumberish, decimals = DEFAULT_DECIMALS) {
    this.exact = BigNumber.from(num)
    this.decimals = decimals
  }

  /**
   * Returns a "simple number" version of the value.
   * @return simple number value
   */
  get simple(): number {
    return parseFloat(this.string)
  }

  /**
   * Returns a "simple number" version of the value which has been rounded down
   * to 2 decimal places.
   * @return simple number value, rounded down to 2 decimals
   */
  get simpleRounded(): number {
    return parseFloat(this.simple.toFixed(3).slice(0, -1))
  }

  /**
   * Returns a formatted string version of the value, without commas.
   * @return string value
   */
  get string(): string {
    return formatUnits(this.exact, this.decimals)
  }

  toJSON(): string {
    return JSON.stringify({ decimals: this.decimals, exact: this.exact })
  }

  /**
   * Naively set decimals without converting with a ratio
   * @param decimals
   * @return instance
   */
  setDecimals(decimals: number): BigDecimal {
    this.decimals = decimals
    return this
  }

  /**
   * Returns a formatted value to the given decimal places, with optional commas
   * and optional suffix, and round it down
   * @param decimalPlaces
   * @param commas
   * @param suffix
   * @return formatted string value
   */
  format(decimalPlaces = 2, commas = true, suffix?: string): string {
    const [left, right = '00'] = this.simple.toFixed(20).split('.')
    const truncatedRight = right.length > decimalPlaces ? right.slice(0, decimalPlaces) : right
    const rounded = `${left}.${truncatedRight}`
    const formatted = commas ? commify(rounded) : rounded
    return `${formatted}${suffix ? ` ${suffix}` : ''}`
  }

  toFixed(decimalPlaces = 2): string {
    return this.format(decimalPlaces)
  }

  get usd(): string {
    return `$${this.format(2, true)}`
  }

  get abbreviated(): string {
    return toK(this.simple)
  }

  toPercent(decimalPlaces = 2): number {
    return parseFloat((this.simple * 100).toFixed(decimalPlaces).replace(/0+$/, ''))
  }

  /**
   * Multiplies two precise units, and then truncates by the full scale
   * @param other Right hand input to multiplication
   * @return      Result after multiplying the two inputs and then dividing by
   *              the shared scale unit
   */
  mulTruncate(other: BigNumberish): BigDecimal {
    return this.transform(this.exact.mul(other).div(SCALE))
  }

  /**
   * Multiplies and truncates a token ratio, essentially flooring the result
   * i.e. How much mAsset is this bAsset worth?
   * @param ratio bAsset ratio
   * @return      Result after multiplying the two inputs and then dividing by
   *              the ratio scale
   */
  mulRatioTruncate(ratio: BigNumberish): BigDecimal {
    return this.transform(this.exact.mul(ratio).div(RATIO_SCALE))
  }

  /**
   * Precisely divides two ratioed units, by first scaling the left hand operand
   * i.e. How much bAsset is this mAsset worth?
   *
   * @param ratio bAsset ratio
   * @return      Result after multiplying the left operand by the scale, and
   *              executing the division on the right hand input.
   */
  divRatioPrecisely(ratio: BigNumberish): BigDecimal {
    return this.transform(this.exact.mul(RATIO_SCALE).div(ratio))
  }

  /**
   * Scales this BigDecimal to given `decimals` precision; scales up or down.
   * @param decimals
   */
  scale(decimals: number = DEFAULT_DECIMALS): BigDecimal {
    if (this.decimals === decimals) return this

    let scaled: BigNumber

    if (this.exact.eq(0)) {
      scaled = this.exact
    } else if (this.decimals === 0) {
      scaled = this.exact.mul(BigNumber.from(10).pow(decimals))
    } else if (decimals === 0) {
      scaled = this.exact.div(BigNumber.from(10).pow(this.decimals))
    } else {
      const thisScale = BigNumber.from(10).pow(this.decimals - 1)
      const otherScale = BigNumber.from(10).pow(decimals - 1)
      scaled = this.decimals > decimals ? this.exact.mul(otherScale).div(thisScale) : this.exact.mul(otherScale.div(thisScale))
    }

    return new BigDecimal(scaled, decimals)
  }

  /**
   * Precisely divides two units, by first scaling the left hand operand. Useful
   *      for finding percentage weightings, i.e. 8e18/10e18 = 80% (or 8e17)
   * @param other Right hand input to division
   * @return      Result after multiplying the left operand by the scale, and
   *              executing the division on the right hand input.
   */
  divPrecisely(other: BigDecimal): BigDecimal {
    return this.transform(this.exact.mul(SCALE).div(other.exact))
  }

  add(other: BigDecimal | BigNumber): BigDecimal {
    return this.transform(this.exact.add(other instanceof BigNumber ? other : other.exact))
  }

  sub(other: BigDecimal | BigNumber): BigDecimal {
    return this.transform(this.exact.sub(other instanceof BigNumber ? other : other.exact))
  }

  private transform(newValue: BigNumber): BigDecimal {
    return new BigDecimal(newValue, this.decimals)
  }
}
