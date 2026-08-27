// Shared task-name search fixtures, run against every db driver so a driver
// specific search implementation cannot silently diverge.
export const SEARCH_TASK_NAMES = [
  'myapp.tasks.send_email',
  'myapp.tasks.SEND_sms',
  'other.pipeline.run',
  'weird%_name',
  'quote"name'
] as const

export const SEARCH_CASES: {
  title: string
  query: string
  expected: string[]
}[] = [
  {
    title: 'matches a substring shorter than three characters',
    query: 'se',
    expected: ['myapp.tasks.SEND_sms', 'myapp.tasks.send_email']
  },
  {
    title: 'matches a substring in the middle of a name',
    query: 'send',
    expected: ['myapp.tasks.SEND_sms', 'myapp.tasks.send_email']
  },
  {
    title: 'is case insensitive',
    query: 'SEND',
    expected: ['myapp.tasks.SEND_sms', 'myapp.tasks.send_email']
  },
  {
    title: 'matches a name part containing an underscore',
    query: 'send_email',
    expected: ['myapp.tasks.send_email']
  },
  {
    title: 'matches a full dotted task name',
    query: 'myapp.tasks.send_email',
    expected: ['myapp.tasks.send_email']
  },
  {
    title: 'treats % and _ as literal characters, not wildcards',
    query: 'rd%_n',
    expected: ['weird%_name']
  },
  {
    title: 'does not let % act as a wildcard inside the query',
    query: 'p%run',
    expected: []
  },
  {
    title: 'handles a double quote in the query',
    query: 'quote"na',
    expected: ['quote"name']
  },
  {
    title: 'returns nothing for an unknown name',
    query: 'nope',
    expected: []
  }
]
