import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskSelect } from '~/server/db/schema'

dayjs.extend(utc)

export function formatDate(date: string, includeMilliseconds: boolean = false) {
  let formatString = 'MMM D, YYYY HH:mm:ss'
  if (includeMilliseconds) {
    formatString += '.SSS'
  }
  return dayjs.utc(date).local().format(formatString)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function limitText(text: string, length: number) {
  if (text.length > length) {
    return text.slice(0, length).trim() + '...'
  }
  return text
}

export function formatReturnValue(task: TaskSelect) {
  if (task.returnValue === null) {
    return '...'
  } else {
    if (task.returnValue?.return_value) {
      return task.returnValue.return_value
    }
    return 'null'
  }
}

// temporarily, while dishka hasn't fixed it's module naming bug
export function formatTaskName(taskName: string) {
  if (taskName.includes(':')) {
    const parts = taskName.split(':')
    return parts[parts.length - 1]
  } else {
    return taskName
  }
}
