import { readonlyView } from '../dist/index.js';

const source = { user: { name: 'Alice' } };
const view = readonlyView(source);
const output = document.querySelector<HTMLOutputElement>('#demo-output')!;

document.querySelector('#owner-mutate')?.addEventListener('click', () => {
    source.user.name = 'Bob';
    output.value = "view.user.name → '" + view.user.name + "'";
    output.dataset.state = 'success';
});

document.querySelector('#view-mutate')?.addEventListener('click', () => {
    try {
        Reflect.set(view.user, 'name', 'Eve');
    } catch (error) {
        output.value =
            error instanceof Error
                ? error.name + ' — source unchanged'
                : 'Mutation rejected';
        output.dataset.state = 'error';
    }
});

document.querySelector('[data-copy]')?.addEventListener('click', (event) => {
    void navigator.clipboard
        .writeText('npm install @nipe-solutions/readonly-view')
        .then(() => {
            if (event.currentTarget instanceof HTMLButtonElement)
                event.currentTarget.textContent = 'Copied';
        });
});
