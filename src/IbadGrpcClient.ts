import {
  ChannelCredentials as GrpcChannelCredentials,
  credentials,
  ServiceClientConstructor,
  GrpcObject
} from '@grpc/grpc-js';
import type {ServiceClient} from '@grpc/grpc-js/build/src/make-client';

import {IbadGrpc} from './IbadGrpc';


/**
 * gRPC Client Service - Represents a single service stub
 */
export class IbadGrpcClientService {
  grpc_stub?: ServiceClient;  // Service Stub
  _client?: IbadGrpcClient;  // Parent IbadGrpcClient instance

  constructor(grpc_stub: ServiceClient, client: IbadGrpcClient){
    this.grpc_stub = grpc_stub;
    this._client = client;
  }
  

  /**
   * Decorates a function as a Unary RPC caller.
   * Unary RPCs have a single request message and a single response message.
   * 
   * @param req_stat - Requires response to have a status with a zero exit code
   * @returns Function decorator
   */
  unary_rpc<T=any>(req_stat=false){
    return (method_cb: CallableFunction, ctx: ClassMethodDecoratorContext) => {
      const func_name = ctx.name.toString();
      const svc = this.grpc_stub!;
      this._client!.log_msg(2, `  Unary RPC: ${ctx.name.toString()}`);
      return ((args: any={})=>{
        return new Promise((resolve, reject)=>{  // Promisify RPC call
          // Ensure RPC definition exists
          const svc_cb = svc?.[func_name]?.bind?.(svc);
          if(!svc_cb) reject();
          // If exists, call RPC
          svc_cb(args, (err: Error, resp: any)=>{
            if(err) reject(err);  // Bubble up errors
            if(req_stat){  // If specified, check for status with zero exit-code
              if(resp?.status && resp.status.code === 0){
                resolve(method_cb(resp));  // Pass results to decorated function
              }else{
                reject(resp?.status?.msg);  // Bubble up error
              }
            }else{
              resolve(method_cb(resp));  // Pass results to decorated function regardless
            }
          });
        });
      }) as T;
    }
  }
}


/**
 * gRPC Client Service - Represents a client to create service stubs
 */
export class IbadGrpcClient extends IbadGrpc {
  // Server Host
  host?: string;
  port?: string|number;
  creds?: GrpcChannelCredentials;

  // Loads connection parameters for client
  constructor(host: string, port: string|number,
    creds: GrpcChannelCredentials=IbadGrpClientCreds.createInsecure(), 
    opts: any={}
  ){
    super(opts);
    // Create Server Instance
    this.host = host;
    this.port = port;
    this.creds = creds;
  }


  /**
   * Creates a Service stub of given service key.
   * Connection follows the client defaults unless specified explicitly.
   */
  addService(key: string, host_?: string, port_?: string|number, creds_?: GrpcChannelCredentials){
    const host = host_ || this.host;
    const port = port_ || this.port;
    const creds = creds_ || this.creds;

    // Resolve Service (iterates through parent packages)
    const key_parts = key.split('.');
    let svc_scope = this.grpc_proto!;
    for(const key of key_parts){
      svc_scope = (svc_scope[key] as GrpcObject);
    }

    const svc_def = ((svc_scope as unknown) as ServiceClientConstructor);
    this.log_msg(2, `Loading gRPC Service: ${key}`);
    const svc_stub = new svc_def(`${host}:${port}`, creds!);
    return new IbadGrpcClientService(svc_stub, this);
  }
}


/**
 * Simple wrapper around gRPC ChannelCredentials
 * Needed to ensure compatibility and simplify imports
 */
export class IbadGrpClientCreds {
  static createInsecure(){
    return credentials.createInsecure();
  }
}