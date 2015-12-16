

declare module "http-assert" {
    
    export interface Assert {
        equal(a, b, status, msg, opts): void;
        notEqual(a, b, status, msg, opts): void;
        strictEqual(a, b, status, msg, opts): void;
        notStrictEqual(a, b, status, msg, opts): void;
        deepEqual(a, b, status, msg, opts): void;
        notDeepEqual(a, b, status, msg, opts): void;        
    }
}
