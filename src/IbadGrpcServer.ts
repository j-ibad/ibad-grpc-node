import {
  Server as GrpcServer,
  ServerCredentials as GrpcServerCredentials,
  ServiceClientConstructor,
  GrpcObject,
  KeyCertPair
} from '@grpc/grpc-js';

import {IbadGrpc} from './IbadGrpc';


/**
 * gRPC Server - Represents a Server
 */
export class IbadGrpcServer extends IbadGrpc {
  // GRPC Loader Functions
  _GrpcServer: typeof GrpcServer = GrpcServer;
  // Server Instance
  grpc_srv?: GrpcServer;

  /**
   * Loads connection parameters for server and creates a server instance.
   */ 
  constructor(opts: any){
    super(opts);
    // Load GRPC Functions if overloaded
    this._GrpcServer = (opts?.grpc?.GrpcServer || GrpcServer);
    // Create Server Instance
    this.grpc_srv = new (this._GrpcServer as any)();
  }

  /**
   * Binds the server to a host & port using the specified credentials
   */
  bind(host: string, port: string|number, 
    creds_: GrpcServerCredentials=IbadGrpcServerCreds.createInsecure(), 
    cb: CallableFunction=(()=>{})
  ){
    const creds = creds_ || IbadGrpcServerCreds.createInsecure();
    return (this.grpc_srv! as any).bindAsync(`${host}:${port}`, creds, cb);
  }


  /**
   * Class Decorator to load class as handler for a Service definition
   */
  addService<A>(key: string){
    // Resolve Service (iterates through parent packages)
    const key_parts = key.split('.');
    let svc_scope = this.grpc_proto!;
    for(const key of key_parts){
      svc_scope = (svc_scope[key] as GrpcObject);
    }
    // Decorate class based off service definition
    const svc_def = ((svc_scope as unknown) as ServiceClientConstructor).service;
    this.log_msg(2, `Loading gRPC Service: ${key}`);
    return (c: A, ctx: ClassDecoratorContext): void|A => {
      // Creates a single instance of the Service class
      const svc_instance = new (c as any)();
      this.grpc_srv!.addService(svc_def, svc_instance);
      return c;
    }
  }

  /**
   * Decorates a function as a Unary RPC handler.
   * Unary RPCs have a single request message and a single response message.
   */
  unary_rpc<T=any>(method_cb: CallableFunction, ctx: ClassMethodDecoratorContext){
    this.log_msg(2, `  Unary RPC: ${ctx.name.toString()}`);
    return ((call: any, callback: CallableFunction) => {
      const retv = method_cb(call.request || {});
      callback(null, retv);
    }) as T;
  }
}


/**
 * Simple wrapper around gRPC Server Credentials.
 * Needed to ensure compatibility and simplify imports
 */
export class IbadGrpcServerCreds {
  static createInsecure(){
    return GrpcServerCredentials.createInsecure();
  }
  static createSSL(root_certs: Buffer|null, key_cert_pairs: KeyCertPair[]){
    return GrpcServerCredentials.createSsl(root_certs, key_cert_pairs);
  }
}