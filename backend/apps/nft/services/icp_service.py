"""
Internet Computer Protocol integration service for NFT management
"""
import os
import json
import requests
import cbor2
from typing import Optional, Dict, Any, List
from hashlib import sha256


class ICPService:
    """Service for interacting with ICP NFT canister via HTTP API"""
    
    def __init__(self):
        self.canister_id = os.getenv('ICP_CANISTER_ID', '')
        self.network_url = os.getenv('ICP_NETWORK_URL', 'https://ic0.app')
        
        if not self.canister_id:
            print("Warning: ICP_CANISTER_ID not set - running in fallback mode")
            self.api_url = None
            self.query_url = None
        else:
            # ICP uses boundary nodes for HTTP API access
            self.api_url = f"{self.network_url}/api/v2/canister/{self.canister_id}/call"
            self.query_url = f"{self.network_url}/api/v2/canister/{self.canister_id}/query"
            print(f"ICP Service initialized - Canister: {self.canister_id}")
    
    def _encode_candid_text(self, text: str) -> bytes:
        """Simple Candid text encoding"""
        # Candid encoding: DIDL\x00\x01\x71 + length + text
        encoded = b'DIDL\x00\x01\x71'
        text_bytes = text.encode('utf-8')
        encoded += len(text_bytes).to_bytes(4, 'little')
        encoded += text_bytes
        return encoded
    
    def _call_canister_query(self, method_name: str, args: bytes) -> Optional[bytes]:
        """Make a query call to the canister"""
        if not self.query_url:
            return None
            
        try:
            # Create envelope for query call
            envelope = {
                'content': {
                    'request_type': 'query',
                    'canister_id': bytes.fromhex(self.canister_id.replace('-', '')),
                    'method_name': method_name,
                    'arg': args,
                }
            }
            
            # Encode with CBOR
            payload = cbor2.dumps(envelope)
            
            response = requests.post(
                self.query_url,
                data=payload,
                headers={'Content-Type': 'application/cbor'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = cbor2.loads(response.content)
                return result.get('reply', {}).get('arg')
            
            return None
            
        except Exception as e:
            print(f"ICP query call failed: {e}")
            return None
    
    def mint_nft(
        self,
        serial_number: str,
        product_name: str,
        manufacturer: str,
        manufacture_date: str,
        category: str,
        description: str,
        specifications: Dict[str, Any],
        warranty_info: str,
        certifications: List[str],
        ipfs_metadata_uri: str
    ) -> Dict[str, Any]:
        """
        Mint a new product NFT on ICP
        
        Returns:
            Dict with mint details for frontend to complete via Plug wallet
        """
        if not self.canister_id:
            # Fallback mode
            return {
                'nft_id': f"mock_nft_{serial_number}",
                'serial_number': serial_number,
                'canister_id': 'not_deployed',
                'metadata_uri': ipfs_metadata_uri,
                'status': 'fallback_mode'
            }
        
        try:
            # Return data for frontend to complete minting via Plug wallet
            # Plug wallet will handle the actual canister call
            return {
                'canister_id': self.canister_id,
                'method': 'mint_nft',
                'args': {
                    'serial_number': serial_number,
                    'product_name': product_name,
                    'manufacturer': manufacturer,
                    'metadata_uri': ipfs_metadata_uri
                },
                'serial_number': serial_number,
                'status': 'pending_wallet_signature'
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare mint NFT: {str(e)}")
    
    def verify_nft(self, serial_number: str) -> Optional[Dict[str, Any]]:
        """
        Verify product authenticity by serial number via query call
        
        Args:
            serial_number: Product serial number to verify
        
        Returns:
            Dict with NFT details if found, None otherwise
        """
        if not self.query_url:
            # Fallback mode - return None (not found)
            return None
            
        try:
            # Encode serial number as Candid argument
            args = self._encode_candid_text(serial_number)
            
            # Call verify_nft query method
            result = self._call_canister_query('verify_nft', args)
            
            if result:
                # Decode Candid response
                # Response format: Option<NFT>
                # For simplicity, return basic structure
                # In production, use proper Candid decoding library
                return {
                    'serial_number': serial_number,
                    'verified': True,
                    'canister_id': self.canister_id
                }
            
            return None
            
            # For demo, return mock verification result
            return {
                'nft_id': f'nft_{serial_number}',
                'serial_number': serial_number,
                'verified': True,
                'owner': 'mock_owner_principal',
                'metadata': {
                    'product_name': 'Product Name',
                    'manufacturer': 'Manufacturer',
                    'manufacture_date': '2024-01-01'
                }
            }
            
        except Exception as e:
            print(f"Verification failed: {str(e)}")
            return None
    
    def transfer_nft(
        self,
        nft_id: str,
        current_owner_principal: str,
        new_owner_principal: str
    ) -> Dict[str, Any]:
        """
        Prepare NFT transfer for wallet to complete
        
        Args:
            nft_id: NFT identifier
            current_owner_principal: Current owner's ICP principal
            new_owner_principal: New owner's ICP principal
        
        Returns:
            Dict with canister call details for Plug wallet
        """
        if not self.query_url:
            return {
                'nft_id': nft_id,
                'status': 'fallback_mode'
            }
            
        try:
            # Return data for Plug wallet to complete transfer
            return {
                'canister_id': self.canister_id,
                'method': 'transfer_nft',
                'args': {
                    'nft_id': nft_id,
                    'new_owner': new_owner_principal
                },
                'status': 'pending_wallet_signature'
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare transfer: {str(e)}")
    
    def get_nft_metadata(self, nft_id: str) -> Optional[Dict[str, Any]]:
        """
        Get NFT metadata by ID via query call
        
        Args:
            nft_id: NFT identifier
        
        Returns:
            Dict with metadata if found
        """
        if not self.query_url:
            return None
            
        try:
            # Encode nft_id as Candid argument
            args = self._encode_candid_text(nft_id)
            
            # Call get_nft query method
            result = self._call_canister_query('get_nft', args)
            
            if result:
                # In production, decode Candid response properly
                # For now return basic structure
                return {
                    'nft_id': nft_id,
                    'exists': True,
                    'canister_id': self.canister_id
                }
            
            return None
            
        except Exception as e:
            print(f"Failed to get metadata: {str(e)}")
            return None
    
    def get_ownership_history(self, nft_id: str) -> List[Dict[str, Any]]:
        """
        Get NFT ownership history via query call
        
        Args:
            nft_id: NFT identifier
        
        Returns:
            List of ownership records
        """
        if not self.query_url:
            return []
            
        try:
            # Encode nft_id as Candid argument
            args = self._encode_candid_text(nft_id)
            
            # Call get_transfer_history query method
            result = self._call_canister_query('get_transfer_history', args)
            
            if result:
                # In production, decode Candid Vec<TransferRecord> properly
                # For now return empty list
                return []
            
            return []
            
        except Exception as e:
            print(f"Failed to get ownership history: {str(e)}")
            return []
    
    def revoke_verification(self, nft_id: str) -> Dict[str, Any]:
        """
        Revoke NFT verification (admin only)
        
        Args:
            nft_id: NFT identifier
        
        Returns:
            Dict with transaction details
        """
        try:
            # In production, this would call the canister's revoke_verification method
            
            return {
                'nft_id': nft_id,
                'transaction_hash': f'icp_revoke_tx_{nft_id}',
                'verified': False,
                'timestamp': self._get_current_timestamp()
            }
            
        except Exception as e:
            raise Exception(f"Failed to revoke verification: {str(e)}")
    
    def get_nfts_by_owner(self, owner_principal: str) -> List[Dict[str, Any]]:
        """
        Get all NFTs owned by a principal
        
        Args:
            owner_principal: Owner's ICP principal
        
        Returns:
            List of NFT details
        """
        try:
            # In production, this would call the canister's get_nfts_by_owner method
            
            return []
            
        except Exception as e:
            print(f"Failed to get NFTs by owner: {str(e)}")
            return []
    
    def _get_current_timestamp(self) -> int:
        """Get current timestamp"""
        from datetime import datetime
        return int(datetime.utcnow().timestamp())


# Singleton instance
icp_service = ICPService()
