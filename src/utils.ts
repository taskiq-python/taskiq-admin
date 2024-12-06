import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export const formatDate = (date: string) => {
  return dayjs.utc(date).local().format("MMM D, YYYY hh:mm A")
}
