/// <reference path="../node/node.d.ts" />
/// <reference path="../http-assert/http-assert.d.ts" />


declare module "koa" {
    import * as http from "http";
    import * as httpAssert from "http-assert";

	module koa {
		export interface Application extends NodeJS.EventEmitter {
			env: string;
			subdomainOffset: number;
			middleware: Array<any>;
			proxy: boolean;
			context: Context;
			request: Request;
			response: Response;
			listen(port: number, hostname?: string, backlog?: number, callback?: Function): http.Server;
			listen(port: number, hostname?: string, callback?: Function): http.Server;
			listen(path: string, callback?: Function): http.Server;
			listen(handle: any, listeningListener?: Function): http.Server;
			inspect(): Object;
			toJSON(): Object;
			use(calllback: (next: Function) => any): Application;
			callback(): (req: http.ServerRequest, res: http.ServerResponse) => void;
			createContext(req: http.ServerRequest, res: http.ServerResponse): Context;
			onerror(err: Error): void;
		}
	
		export interface Context {
			inspect(): Object;
			toJSON(): Object;
			assert: httpAssert.Assert;
			throw(): void;
			onerror(err: Error): void;
		}
	
		export interface Request {
		}
	
		export interface Response {
		}
				
	}
	
	function koa(): koa.Application;
	
	export = koa;

}
