import {
  loadPackageDefinition as grpc_loadPackageDefinition,
  GrpcObject,
} from '@grpc/grpc-js';
import {
  loadSync as grpc_proto_loadSync,
  PackageDefinition as GrpcPackageDefinition
} from '@grpc/proto-loader';

// Default GRPC Proto Options
const GRPC_DEF_OPTS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};


/**
 * Base class for loading gRPC definition and utility functions
 */
export class IbadGrpc {
  // GRPC Loader Functions
  _grpc_proto_loadSync: CallableFunction = grpc_proto_loadSync;
  _grpc_loadPackageDefinition: CallableFunction = grpc_loadPackageDefinition;
  // PKG Definition
  grpc_pkg_def?: GrpcPackageDefinition;
  grpc_proto?: GrpcObject;
  // Verbosity
  verbose: number = 0;

  constructor(opts: any){
    this.verbose = opts?.verbose || 0;
    // Load GRPC Functions if overloaded
    this._grpc_proto_loadSync = opts?.grpc?.proto?.loadSync || grpc_proto_loadSync;
    this._grpc_loadPackageDefinition = opts?.grpc?.loadPackageDefinition || grpc_loadPackageDefinition;
    // Load package defintions
    this.grpc_pkg_def = this._grpc_proto_loadSync?.(opts.grpc?.proto?.path || '.proto', opts.grpc?.proto?.opts || GRPC_DEF_OPTS);
    this.grpc_proto = this._grpc_loadPackageDefinition?.(this.grpc_pkg_def);
  }
  
  
  /* [=== UTILITY METHODS ===] */
  // Logs the specified message under the given verbosity.
  log_msg(verbosity: number, msg: string){
    if(verbosity <= this.verbose){  // Only print if verbosity meets criteria
      console.log(msg);
    }
  }
}