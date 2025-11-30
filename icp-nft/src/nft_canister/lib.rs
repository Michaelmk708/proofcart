use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

// NFT Data Structure
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct NFT {
    pub id: u64,
    pub serial_number: String,
    pub product_name: String,
    pub manufacturer: String,
    pub metadata_uri: String,
    pub owner: Principal,
    pub minted_at: u64,
    pub transfer_history: Vec<TransferRecord>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct TransferRecord {
    pub from: Principal,
    pub to: Principal,
    pub timestamp: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct MintRequest {
    pub serial_number: String,
    pub product_name: String,
    pub manufacturer: String,
    pub metadata_uri: String,
}

// Storage
thread_local! {
    static NEXT_NFT_ID: RefCell<u64> = RefCell::new(0);
    static NFTS: RefCell<HashMap<u64, NFT>> = RefCell::new(HashMap::new());
    static SERIAL_TO_NFT: RefCell<HashMap<String, u64>> = RefCell::new(HashMap::new());
    static OWNER_NFTS: RefCell<HashMap<Principal, Vec<u64>>> = RefCell::new(HashMap::new());
}

// Mint a new NFT
#[update]
fn mint_nft(request: MintRequest) -> Result<u64, String> {
    let caller = ic_cdk::caller();
    
    // Check if serial number already exists
    let exists = SERIAL_TO_NFT.with(|s| s.borrow().contains_key(&request.serial_number));
    if exists {
        return Err("NFT with this serial number already exists".to_string());
    }

    let nft_id = NEXT_NFT_ID.with(|id| {
        let current = *id.borrow();
        *id.borrow_mut() = current + 1;
        current
    });

    let nft = NFT {
        id: nft_id,
        serial_number: request.serial_number.clone(),
        product_name: request.product_name,
        manufacturer: request.manufacturer,
        metadata_uri: request.metadata_uri,
        owner: caller,
        minted_at: time(),
        transfer_history: Vec::new(),
    };

    // Store NFT
    NFTS.with(|nfts| {
        nfts.borrow_mut().insert(nft_id, nft.clone());
    });

    // Map serial number to NFT ID
    SERIAL_TO_NFT.with(|s| {
        s.borrow_mut().insert(request.serial_number, nft_id);
    });

    // Add to owner's NFTs
    OWNER_NFTS.with(|owners| {
        let mut owners = owners.borrow_mut();
        owners.entry(caller).or_insert_with(Vec::new).push(nft_id);
    });

    Ok(nft_id)
}

// Verify NFT by serial number
#[query]
fn verify_nft(serial_number: String) -> Option<NFT> {
    SERIAL_TO_NFT.with(|s| {
        s.borrow().get(&serial_number).and_then(|nft_id| {
            NFTS.with(|nfts| nfts.borrow().get(nft_id).cloned())
        })
    })
}

// Get NFT by ID
#[query]
fn get_nft(nft_id: u64) -> Option<NFT> {
    NFTS.with(|nfts| nfts.borrow().get(&nft_id).cloned())
}

// Transfer NFT ownership
#[update]
fn transfer_nft(nft_id: u64, new_owner: Principal) -> Result<bool, String> {
    let caller = ic_cdk::caller();

    let mut nft = NFTS.with(|nfts| {
        nfts.borrow()
            .get(&nft_id)
            .cloned()
            .ok_or_else(|| "NFT not found".to_string())
    })?;

    // Check if caller is current owner
    if nft.owner != caller {
        return Err("Only the owner can transfer this NFT".to_string());
    }

    // Create transfer record
    let transfer = TransferRecord {
        from: caller,
        to: new_owner,
        timestamp: time(),
    };

    // Update NFT
    nft.owner = new_owner;
    nft.transfer_history.push(transfer);

    // Store updated NFT
    NFTS.with(|nfts| {
        nfts.borrow_mut().insert(nft_id, nft);
    });

    // Update owner mappings
    OWNER_NFTS.with(|owners| {
        let mut owners = owners.borrow_mut();
        
        // Remove from old owner
        if let Some(old_owner_nfts) = owners.get_mut(&caller) {
            old_owner_nfts.retain(|&id| id != nft_id);
        }
        
        // Add to new owner
        owners.entry(new_owner).or_insert_with(Vec::new).push(nft_id);
    });

    Ok(true)
}

// Get all NFTs owned by a principal
#[query]
fn get_owner_nfts(owner: Principal) -> Vec<NFT> {
    OWNER_NFTS.with(|owners| {
        owners
            .borrow()
            .get(&owner)
            .map(|nft_ids| {
                NFTS.with(|nfts| {
                    let nfts = nfts.borrow();
                    nft_ids
                        .iter()
                        .filter_map(|id| nfts.get(id).cloned())
                        .collect()
                })
            })
            .unwrap_or_default()
    })
}

// Get NFT transfer history
#[query]
fn get_transfer_history(nft_id: u64) -> Option<Vec<TransferRecord>> {
    NFTS.with(|nfts| {
        nfts.borrow()
            .get(&nft_id)
            .map(|nft| nft.transfer_history.clone())
    })
}

// Check if NFT exists for serial number
#[query]
fn nft_exists(serial_number: String) -> bool {
    SERIAL_TO_NFT.with(|s| s.borrow().contains_key(&serial_number))
}

// Get total NFTs minted
#[query]
fn get_total_nfts() -> u64 {
    NEXT_NFT_ID.with(|id| *id.borrow())
}

// Batch verify multiple serial numbers
#[query]
fn batch_verify_nfts(serial_numbers: Vec<String>) -> Vec<(String, Option<NFT>)> {
    serial_numbers
        .into_iter()
        .map(|serial| {
            let nft = verify_nft(serial.clone());
            (serial, nft)
        })
        .collect()
}

// Export Candid interface
ic_cdk::export_candid!();
