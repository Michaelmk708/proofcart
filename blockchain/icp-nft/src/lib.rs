use candid::{CandidType, Decode, Encode, Principal};
use ic_cdk::{caller, trap};
use ic_cdk_macros::{init, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct NFTMetadata {
    pub serial_number: String,
    pub product_name: String,
    pub manufacturer: String,
    pub manufacture_date: String,
    pub category: String,
    pub description: String,
    pub specifications: String,
    pub warranty_info: String,
    pub certifications: Vec<String>,
    pub ipfs_metadata_uri: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProductNFT {
    pub nft_id: u64,
    pub serial_number: String,
    pub owner: Principal,
    pub metadata: NFTMetadata,
    pub minted_at: u64,
    pub verified: bool,
    pub ownership_history: Vec<OwnershipRecord>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OwnershipRecord {
    pub owner: Principal,
    pub timestamp: u64,
    pub transaction_type: String, // "mint", "transfer", "sale"
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct MintRequest {
    pub serial_number: String,
    pub product_name: String,
    pub manufacturer: String,
    pub manufacture_date: String,
    pub category: String,
    pub description: String,
    pub specifications: String,
    pub warranty_info: String,
    pub certifications: Vec<String>,
    pub ipfs_metadata_uri: String,
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = 
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static NFTS: RefCell<StableBTreeMap<u64, ProductNFT, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );
    
    static SERIAL_TO_NFT: RefCell<StableBTreeMap<String, u64, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
    
    static NFT_COUNTER: RefCell<u64> = RefCell::new(0);
    
    static ADMIN: RefCell<Principal> = RefCell::new(Principal::anonymous());
}

#[init]
fn init() {
    ADMIN.with(|admin| {
        *admin.borrow_mut() = caller();
    });
}

/// Mint a new product NFT
#[update]
fn mint_product_nft(request: MintRequest) -> Result<ProductNFT, String> {
    let owner = caller();
    
    // Check if serial number already exists
    let serial_exists = SERIAL_TO_NFT.with(|map| {
        map.borrow().get(&request.serial_number).is_some()
    });
    
    if serial_exists {
        return Err(format!("NFT with serial number {} already exists", request.serial_number));
    }
    
    // Generate new NFT ID
    let nft_id = NFT_COUNTER.with(|counter| {
        let id = *counter.borrow();
        *counter.borrow_mut() = id + 1;
        id
    });
    
    let timestamp = ic_cdk::api::time();
    
    let metadata = NFTMetadata {
        serial_number: request.serial_number.clone(),
        product_name: request.product_name,
        manufacturer: request.manufacturer,
        manufacture_date: request.manufacture_date,
        category: request.category,
        description: request.description,
        specifications: request.specifications,
        warranty_info: request.warranty_info,
        certifications: request.certifications,
        ipfs_metadata_uri: request.ipfs_metadata_uri,
    };
    
    let ownership_record = OwnershipRecord {
        owner,
        timestamp,
        transaction_type: "mint".to_string(),
    };
    
    let nft = ProductNFT {
        nft_id,
        serial_number: request.serial_number.clone(),
        owner,
        metadata,
        minted_at: timestamp,
        verified: true,
        ownership_history: vec![ownership_record],
    };
    
    // Store NFT
    NFTS.with(|nfts| {
        nfts.borrow_mut().insert(nft_id, nft.clone());
    });
    
    // Store serial number mapping
    SERIAL_TO_NFT.with(|map| {
        map.borrow_mut().insert(request.serial_number, nft_id);
    });
    
    Ok(nft)
}

/// Verify product authenticity by serial number
#[query]
fn verify_product(serial_number: String) -> Result<ProductNFT, String> {
    let nft_id = SERIAL_TO_NFT.with(|map| {
        map.borrow().get(&serial_number)
    });
    
    match nft_id {
        Some(id) => {
            NFTS.with(|nfts| {
                nfts.borrow().get(&id)
                    .ok_or_else(|| "NFT not found".to_string())
            })
        },
        None => Err(format!("No NFT found for serial number: {}", serial_number))
    }
}

/// Get NFT by ID
#[query]
fn get_nft(nft_id: u64) -> Result<ProductNFT, String> {
    NFTS.with(|nfts| {
        nfts.borrow().get(&nft_id)
            .ok_or_else(|| format!("NFT {} not found", nft_id))
    })
}

/// Transfer NFT ownership
#[update]
fn transfer_nft(nft_id: u64, new_owner: Principal) -> Result<ProductNFT, String> {
    let caller = caller();
    
    let mut nft = NFTS.with(|nfts| {
        nfts.borrow().get(&nft_id)
            .ok_or_else(|| format!("NFT {} not found", nft_id))
    })?;
    
    // Only current owner can transfer
    if nft.owner != caller {
        return Err("Only the owner can transfer this NFT".to_string());
    }
    
    let timestamp = ic_cdk::api::time();
    
    // Update ownership
    nft.owner = new_owner;
    
    // Add to ownership history
    nft.ownership_history.push(OwnershipRecord {
        owner: new_owner,
        timestamp,
        transaction_type: "transfer".to_string(),
    });
    
    // Update storage
    NFTS.with(|nfts| {
        nfts.borrow_mut().insert(nft_id, nft.clone());
    });
    
    Ok(nft)
}

/// Get all NFTs owned by a principal
#[query]
fn get_nfts_by_owner(owner: Principal) -> Vec<ProductNFT> {
    NFTS.with(|nfts| {
        nfts.borrow()
            .iter()
            .filter_map(|(_, nft)| {
                if nft.owner == owner {
                    Some(nft.clone())
                } else {
                    None
                }
            })
            .collect()
    })
}

/// Get NFT metadata by serial number
#[query]
fn get_metadata(serial_number: String) -> Result<NFTMetadata, String> {
    let nft_id = SERIAL_TO_NFT.with(|map| {
        map.borrow().get(&serial_number)
    });
    
    match nft_id {
        Some(id) => {
            NFTS.with(|nfts| {
                nfts.borrow().get(&id)
                    .map(|nft| nft.metadata.clone())
                    .ok_or_else(|| "NFT not found".to_string())
            })
        },
        None => Err(format!("No NFT found for serial number: {}", serial_number))
    }
}

/// Get ownership history for an NFT
#[query]
fn get_ownership_history(nft_id: u64) -> Result<Vec<OwnershipRecord>, String> {
    NFTS.with(|nfts| {
        nfts.borrow().get(&nft_id)
            .map(|nft| nft.ownership_history.clone())
            .ok_or_else(|| format!("NFT {} not found", nft_id))
    })
}

/// Get total number of minted NFTs
#[query]
fn get_total_supply() -> u64 {
    NFT_COUNTER.with(|counter| *counter.borrow())
}

/// Admin: Revoke NFT verification (for counterfeit products)
#[update]
fn revoke_verification(nft_id: u64) -> Result<ProductNFT, String> {
    let caller = caller();
    
    // Check if caller is admin
    let is_admin = ADMIN.with(|admin| *admin.borrow() == caller);
    if !is_admin {
        return Err("Only admin can revoke verification".to_string());
    }
    
    let mut nft = NFTS.with(|nfts| {
        nfts.borrow().get(&nft_id)
            .ok_or_else(|| format!("NFT {} not found", nft_id))
    })?;
    
    nft.verified = false;
    
    NFTS.with(|nfts| {
        nfts.borrow_mut().insert(nft_id, nft.clone());
    });
    
    Ok(nft)
}

/// Export candid interface
ic_cdk::export_candid!();
