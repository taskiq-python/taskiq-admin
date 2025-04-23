import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { NotFoundError } from './exceptions'

dayjs.extend(utc)

export const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1)
    throw new NotFoundError('Found non unique or inexistent value')
  return values[0]!
}

export const utcNow = () => {
  return dayjs.utc()
}

export const capitalize = (text: string) => {
  return text[0].toUpperCase() + text.slice(1)
}
