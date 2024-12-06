import { NotFoundError } from "./exceptions"

export const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1)
    throw new NotFoundError("Found non unique or inexistent value")
  return values[0]!
}
