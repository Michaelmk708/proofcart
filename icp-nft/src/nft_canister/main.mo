import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor NFTCanister {
    // NFT Data Structure
    public type NFT = {
        id: Nat;
        serialNumber: Text;
        productName: Text;
        manufacturer: Text;
        metadataUri: Text;
        owner: Principal;
        mintedAt: Time.Time;
        transferHistory: [TransferRecord];
    };

    public type TransferRecord = {
        from: Principal;
        to: Principal;
        timestamp: Time.Time;
    };

    public type NFTMetadata = {
        serialNumber: Text;
        productName: Text;
        manufacturer: Text;
        category: Text;
        specifications: Text;
        warrantyInfo: Text;
        certifications: [Text];
    };

    // Storage
    private stable var nextNFTId: Nat = 0;
    private var nfts = HashMap.HashMap<Nat, NFT>(10, Nat.equal, Hash.hash);
    private var serialToNFT = HashMap.HashMap<Text, Nat>(10, Text.equal, Text.hash);
    private var ownerNFTs = HashMap.HashMap<Principal, [Nat]>(10, Principal.equal, Principal.hash);

    // Mint a new NFT for product authenticity
    public shared(msg) func mintNFT(
        serialNumber: Text,
        productName: Text,
        manufacturer: Text,
        metadataUri: Text
    ) : async Nat {
        // Check if serial number already exists
        switch (serialToNFT.get(serialNumber)) {
            case (?_) {
                throw Error.reject("NFT with this serial number already exists");
            };
            case null {
                let nftId = nextNFTId;
                nextNFTId += 1;

                let nft: NFT = {
                    id = nftId;
                    serialNumber = serialNumber;
                    productName = productName;
                    manufacturer = manufacturer;
                    metadataUri = metadataUri;
                    owner = msg.caller;
                    mintedAt = Time.now();
                    transferHistory = [];
                };

                nfts.put(nftId, nft);
                serialToNFT.put(serialNumber, nftId);
                
                // Add to owner's NFTs
                let currentNFTs = Option.get(ownerNFTs.get(msg.caller), []);
                ownerNFTs.put(msg.caller, Array.append(currentNFTs, [nftId]));

                return nftId;
            };
        };
    };

    // Verify NFT by serial number
    public query func verifyNFT(serialNumber: Text) : async ?NFT {
        switch (serialToNFT.get(serialNumber)) {
            case (?nftId) {
                return nfts.get(nftId);
            };
            case null {
                return null;
            };
        };
    };

    // Get NFT by ID
    public query func getNFT(nftId: Nat) : async ?NFT {
        return nfts.get(nftId);
    };

    // Transfer NFT ownership
    public shared(msg) func transferNFT(nftId: Nat, newOwner: Principal) : async Bool {
        switch (nfts.get(nftId)) {
            case (?nft) {
                // Check if caller is current owner
                if (nft.owner != msg.caller) {
                    throw Error.reject("Only the owner can transfer this NFT");
                };

                // Create transfer record
                let transferRecord: TransferRecord = {
                    from = msg.caller;
                    to = newOwner;
                    timestamp = Time.now();
                };

                // Update NFT with new owner and transfer history
                let updatedNFT: NFT = {
                    id = nft.id;
                    serialNumber = nft.serialNumber;
                    productName = nft.productName;
                    manufacturer = nft.manufacturer;
                    metadataUri = nft.metadataUri;
                    owner = newOwner;
                    mintedAt = nft.mintedAt;
                    transferHistory = Array.append(nft.transferHistory, [transferRecord]);
                };

                nfts.put(nftId, updatedNFT);

                // Update owner NFTs mappings
                let oldOwnerNFTs = Option.get(ownerNFTs.get(msg.caller), []);
                ownerNFTs.put(msg.caller, Array.filter(oldOwnerNFTs, func(id: Nat) : Bool { id != nftId }));

                let newOwnerNFTs = Option.get(ownerNFTs.get(newOwner), []);
                ownerNFTs.put(newOwner, Array.append(newOwnerNFTs, [nftId]));

                return true;
            };
            case null {
                throw Error.reject("NFT not found");
            };
        };
    };

    // Get all NFTs owned by a principal
    public query func getOwnerNFTs(owner: Principal) : async [NFT] {
        let nftIds = Option.get(ownerNFTs.get(owner), []);
        let result = Array.mapFilter<Nat, NFT>(nftIds, func(id: Nat) : ?NFT {
            nfts.get(id)
        });
        return result;
    };

    // Get NFT transfer history
    public query func getTransferHistory(nftId: Nat) : async ?[TransferRecord] {
        switch (nfts.get(nftId)) {
            case (?nft) {
                return ?nft.transferHistory;
            };
            case null {
                return null;
            };
        };
    };

    // Check if NFT exists for serial number
    public query func nftExists(serialNumber: Text) : async Bool {
        return Option.isSome(serialToNFT.get(serialNumber));
    };

    // Get total NFTs minted
    public query func getTotalNFTs() : async Nat {
        return nextNFTId;
    };

    // Batch verify multiple serial numbers
    public query func batchVerifyNFTs(serialNumbers: [Text]) : async [(Text, ?NFT)] {
        return Array.map<Text, (Text, ?NFT)>(serialNumbers, func(serial: Text) : (Text, ?NFT) {
            switch (serialToNFT.get(serial)) {
                case (?nftId) {
                    (serial, nfts.get(nftId))
                };
                case null {
                    (serial, null)
                };
            };
        });
    };

    // System functions for upgrades
    system func preupgrade() {
        // Stable variables are automatically persisted
    };

    system func postupgrade() {
        // Rebuild hashmaps from stable data if needed
    };
}
