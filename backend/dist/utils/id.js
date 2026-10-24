"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
const crypto_1 = require("crypto");
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
    inv: 'inv',
    invitation: 'inv',
    team: 'team',
    blog: 'blg',
};
function generateId(type) {
    const uuid = (0, crypto_1.randomUUID)();
    return `${prefixes[type]}_${uuid.replace(/-/g, '').slice(0, 16)}`;
}
