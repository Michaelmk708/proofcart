# ProofCart: A Blockchain-Powered Commerce Platform

ProofCart is a full‑stack e‑commerce platform that uses blockchains to make online trade safer and more transparent. It combines a modern web app (React + TypeScript), a robust API (Django + DRF), and two on‑chain components—an escrow program on Solana for secure payments, and Solana NFTs (Metaplex) for product authenticity and provenance. The result is a trust‑by‑design marketplace where buyers and sellers can transact with confidence and customers can verify products instantly.

Traditional marketplaces struggle with counterfeit goods, disputed deliveries, and opaque dispute processes. ProofCart addresses these pain points by (1) locking funds in an on‑chain escrow until delivery is confirmed, (2) issuing tamper‑proof product NFTs on Solana that encode serial numbers and ownership history, and (3) providing an auditable trail from listing to settlement. A clean API layer and wallet integration (Phantom for Solana) makes the experience seamless for users while keeping cryptographic guarantees under the hood.

Key capabilities
- Secure payments via Solana escrow (create, lock, release, refund, dispute resolution)
- Product authenticity via Solana NFTs (mint, verify by serial number, transfer, provenance)
- End‑to‑end web experience (marketplace, checkout, dashboards for buyers/sellers/admin)
- QR‑based verification for customers at or after delivery
- Role‑based access, JWT auth, and service abstractions for maintainability

Architecture at a glance
- Frontend: React 18 + TypeScript + Vite + Tailwind (wallet support, API service layer)
- Backend: Django 5 + DRF (auth, products, orders/escrow, NFT services; 40+ endpoints)
- Blockchain: Solana Anchor program (escrow) and Solana NFTs via Metaplex (NFT/provenance)
- Deployability: Netlify (frontend), Render (backend), Devnet/mainnet for chains

With production‑ready code, comprehensive docs, and clear deployment guides, ProofCart provides a practical blueprint for trust‑first digital commerce—bridging Web2 usability with Web3 verifiability. For the Solana hackathon and devnet demos, the architecture is consolidated to Solana for both escrow and authenticity to streamline the user experience and reduce multi‑chain complexity.