import { readonlyView } from '../../src/index';

const source = { user: { name: 'Alice', roles: ['admin'] } };
const view = readonlyView(source);

// @ts-expect-error readonly property
view.user.name = 'Bob';
// @ts-expect-error readonly array
view.user.roles.push('editor');

source.user.name = 'Bob';
