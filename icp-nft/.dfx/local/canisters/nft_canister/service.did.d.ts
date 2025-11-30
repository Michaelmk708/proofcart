import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface MintRequest {
  'manufacturer' : string,
  'metadata_uri' : string,
  'product_name' : string,
  'serial_number' : string,
}
export interface NFT {
  'id' : bigint,
  'manufacturer' : string,
  'owner' : Principal,
  'metadata_uri' : string,
  'product_name' : string,
  'transfer_history' : Array<TransferRecord>,
  'serial_number' : string,
  'minted_at' : bigint,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export interface TransferRecord {
  'to' : Principal,
  'from' : Principal,
  'timestamp' : bigint,
}
export type TransferResult = { 'Ok' : boolean } |
  { 'Err' : string };
export interface _SERVICE {
  'batch_verify_nfts' : ActorMethod<
    [Array<string>],
    Array<[string, [] | [NFT]]>
  >,
  'get_nft' : ActorMethod<[bigint], [] | [NFT]>,
  'get_owner_nfts' : ActorMethod<[Principal], Array<NFT>>,
  'get_total_nfts' : ActorMethod<[], bigint>,
  'get_transfer_history' : ActorMethod<[bigint], [] | [Array<TransferRecord>]>,
  'mint_nft' : ActorMethod<[MintRequest], Result>,
  'nft_exists' : ActorMethod<[string], boolean>,
  'transfer_nft' : ActorMethod<[bigint, Principal], TransferResult>,
  'verify_nft' : ActorMethod<[string], [] | [NFT]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
