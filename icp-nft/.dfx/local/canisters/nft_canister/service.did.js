export const idlFactory = ({ IDL }) => {
  const TransferRecord = IDL.Record({
    'to' : IDL.Principal,
    'from' : IDL.Principal,
    'timestamp' : IDL.Nat64,
  });
  const NFT = IDL.Record({
    'id' : IDL.Nat64,
    'manufacturer' : IDL.Text,
    'owner' : IDL.Principal,
    'metadata_uri' : IDL.Text,
    'product_name' : IDL.Text,
    'transfer_history' : IDL.Vec(TransferRecord),
    'serial_number' : IDL.Text,
    'minted_at' : IDL.Nat64,
  });
  const MintRequest = IDL.Record({
    'manufacturer' : IDL.Text,
    'metadata_uri' : IDL.Text,
    'product_name' : IDL.Text,
    'serial_number' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const TransferResult = IDL.Variant({ 'Ok' : IDL.Bool, 'Err' : IDL.Text });
  return IDL.Service({
    'batch_verify_nfts' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Opt(NFT)))],
        ['query'],
      ),
    'get_nft' : IDL.Func([IDL.Nat64], [IDL.Opt(NFT)], ['query']),
    'get_owner_nfts' : IDL.Func([IDL.Principal], [IDL.Vec(NFT)], ['query']),
    'get_total_nfts' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_transfer_history' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(IDL.Vec(TransferRecord))],
        ['query'],
      ),
    'mint_nft' : IDL.Func([MintRequest], [Result], []),
    'nft_exists' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'transfer_nft' : IDL.Func([IDL.Nat64, IDL.Principal], [TransferResult], []),
    'verify_nft' : IDL.Func([IDL.Text], [IDL.Opt(NFT)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
