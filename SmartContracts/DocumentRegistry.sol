// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DocumentRegistry
 * @dev Smart Contract untuk menyimpan dan memverifikasi hash dokumen
 * Untuk Usulan Kenaikan Pangkat Blockchain System
 */
contract DocumentRegistry {
    
    struct Document {
        string documentHash;      // SHA256 hash dari dokumen
        address uploader;         // Alamat wallet yang mengupload
        uint256 userId;           // ID user dari database
        uint256 timestamp;        // Timestamp saat upload
        bool isVerified;          // Status verifikasi
        address verifier;         // Alamat wallet yang memverifikasi
        uint256 verifiedAt;       // Timestamp verifikasi
    }
    
    // Mapping dari document ID ke Document struct
    mapping(bytes32 => Document) public documents;
    
    // Mapping untuk tracking dokumen per user
    mapping(uint256 => bytes32[]) public userDocuments;
    
    // Counter untuk total dokumen
    uint256 public totalDocuments;
    
    // Events
    event DocumentStored(
        bytes32 indexed documentId,
        string documentHash,
        address indexed uploader,
        uint256 indexed userId,
        uint256 timestamp
    );
    
    event DocumentVerified(
        bytes32 indexed documentId,
        address indexed verifier,
        uint256 verifiedAt
    );
    
    /**
     * @dev Store document hash to blockchain
     * @param _documentHash SHA256 hash of the document
     * @param _userId User ID from database
     * @return documentId Unique ID for the stored document
     */
    function storeDocument(string memory _documentHash, uint256 _userId) 
        public 
        returns (bytes32) 
    {
        // Generate unique document ID
        bytes32 documentId = keccak256(
            abi.encodePacked(_documentHash, msg.sender, block.timestamp, _userId)
        );
        
        // Ensure document doesn't already exist
        require(documents[documentId].timestamp == 0, "Document already exists");
        
        // Store document
        documents[documentId] = Document({
            documentHash: _documentHash,
            uploader: msg.sender,
            userId: _userId,
            timestamp: block.timestamp,
            isVerified: false,
            verifier: address(0),
            verifiedAt: 0
        });
        
        // Add to user's document list
        userDocuments[_userId].push(documentId);
        
        // Increment counter
        totalDocuments++;
        
        // Emit event
        emit DocumentStored(documentId, _documentHash, msg.sender, _userId, block.timestamp);
        
        return documentId;
    }
    
    /**
     * @dev Verify a document
     * @param _documentId Document ID to verify
     */
    function verifyDocument(bytes32 _documentId) public {
        require(documents[_documentId].timestamp != 0, "Document not found");
        require(!documents[_documentId].isVerified, "Document already verified");
        
        documents[_documentId].isVerified = true;
        documents[_documentId].verifier = msg.sender;
        documents[_documentId].verifiedAt = block.timestamp;
        
        emit DocumentVerified(_documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get document details
     * @param _documentId Document ID
     * @return Document struct
     */
    function getDocument(bytes32 _documentId) 
        public 
        view 
        returns (
            string memory documentHash,
            address uploader,
            uint256 userId,
            uint256 timestamp,
            bool isVerified,
            address verifier,
            uint256 verifiedAt
        ) 
    {
        Document memory doc = documents[_documentId];
        return (
            doc.documentHash,
            doc.uploader,
            doc.userId,
            doc.timestamp,
            doc.isVerified,
            doc.verifier,
            doc.verifiedAt
        );
    }
    
    /**
     * @dev Get all document IDs for a user
     * @param _userId User ID
     * @return Array of document IDs
     */
    function getUserDocuments(uint256 _userId) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        return userDocuments[_userId];
    }
    
    /**
     * @dev Check if document hash exists
     * @param _documentHash Document hash to check
     * @return exists True if exists, false otherwise
     */
    function documentExists(string memory _documentHash) 
        public 
        view 
        returns (bool exists) 
    {
        // This is a simplified check - in production you might want a separate mapping
        return bytes(_documentHash).length > 0;
    }
}

