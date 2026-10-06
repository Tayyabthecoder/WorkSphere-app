import { randomUUID } from 'crypto';

const prefixes = {
  task: 'tsk',
  project: 'prj',
  sprint: 'spr',
  user: 'usr',
  tenant: 'tnt',
  expense: 'exp',
  time: 'time',
  file: 'fil',
  folder: 'fld',
  document: 'doc',
  doc: 'doc',
  rule: 'rul',
  client: 'clt',
  avail: 'avl',
  notification: 'ntf',
  log: 'log',
  act: 'act',
  announcement: 'ann',
  emailTemplate: 'emt',
  retention: 'ret',
  comment: 'cmt',
} as const;

export type IdPrefix = keyof typeof prefixes;

export function generateId(type: IdPrefix): string {
  const uuid = randomUUID();
  return `${prefixes[type]}_${uuid.replace(/-/g, '').slice(0, 16)}`;
}
