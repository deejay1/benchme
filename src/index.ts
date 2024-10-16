import { Bench } from 'tinybench';
import { InputError } from '@backstage/errors';
import {
    EntitiesSearchFilter,
} from '@backstage/plugin-catalog-node';

const bench = new Bench({ time: 100 });

export function parseEntityFilterString(
    filterString: string,
): EntitiesSearchFilter[] | undefined {
    const statements = filterString
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (!statements.length) {
        return undefined;
    }

    const filtersByKey = new Map<string, EntitiesSearchFilter>();

    for (const statement of statements) {
        const equalsIndex = statement.indexOf('=');

        const key =
            equalsIndex === -1
                ? statement
                : statement.substring(0, equalsIndex).trim();
        const value =
            equalsIndex === -1
                ? undefined
                : statement.substring(equalsIndex + 1).trim();
        if (!key) {
            throw new InputError(
                `Invalid filter, '${statement}' is not a valid statement (expected a string on the form a=b or a= or a)`,
            );
        }

        let f = filtersByKey.get(key);
        if (!f) {
            f = { key };
            filtersByKey.set(key, f);
        }

        if (value !== undefined) {
            f.values = f.values || [];
            f.values.push(value);
        }
    }

    return Array.from(filtersByKey.values());
}

export function oldParseEntityFilterString(
    filterString: string,
): EntitiesSearchFilter[] | undefined {
    const statements = filterString
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (!statements.length) {
        return undefined;
    }

    const filtersByKey: Record<string, EntitiesSearchFilter> = {};

    for (const statement of statements) {
        const equalsIndex = statement.indexOf('=');

        const key =
            equalsIndex === -1
                ? statement
                : statement.substring(0, equalsIndex).trim();
        const value =
            equalsIndex === -1
                ? undefined
                : statement.substring(equalsIndex + 1).trim();
        if (!key) {
            throw new InputError(
                `Invalid filter, '${statement}' is not a valid statement (expected a string on the form a=b or a= or a)`,
            );
        }

        const f =
            key in filtersByKey ? filtersByKey[key] : (filtersByKey[key] = { key });

        if (value !== undefined) {
            f.values = f.values || [];
            f.values.push(value);
        }
    }

    return Object.values(filtersByKey);
}

bench.add('slower', () => {
    parseEntityFilterString('metadata.namespace=default,kind=Component');
}).add('faster', () => {
    oldParseEntityFilterString('metadata.namespace=default,kind=Component');
})

await bench.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
await bench.run();

console.table(bench.table());
