// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedVoting
 * @dev A secure, transparent voting system on Ethereum (Sepolia Testnet)
 */
contract DecentralizedVoting {
    
    // ─── Structs ───────────────────────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageHash;   // IPFS hash
        uint256 voteCount;
        bool isActive;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        uint256 totalVotes;
        address creator;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 electionId;
        uint256 registeredAt;
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    address public admin;
    uint256 public electionCount;
    uint256 public totalRegisteredVoters;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => uint256) public candidateCount;
    mapping(uint256 => mapping(address => Voter)) public voters;
    mapping(address => bool) public authorizedOracles; // Backend oracles

    // ─── Events ───────────────────────────────────────────────────────────────

    event ElectionCreated(uint256 indexed electionId, string title, address creator);
    event CandidateAdded(uint256 indexed electionId, uint256 candidateId, string name);
    event VoterRegistered(uint256 indexed electionId, address voter);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address voter);
    event ElectionEnded(uint256 indexed electionId, uint256 totalVotes);
    event ResultsPublished(uint256 indexed electionId);
    event OracleAuthorized(address oracle);
    event OracleRevoked(address oracle);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyAdminOrOracle() {
        require(msg.sender == admin || authorizedOracles[msg.sender], "Unauthorized");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        Election storage e = elections[_electionId];
        require(e.isActive, "Election is not active");
        require(block.timestamp >= e.startTime, "Election has not started");
        require(block.timestamp <= e.endTime, "Election has ended");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    function authorizeOracle(address _oracle) external onlyAdmin {
        authorizedOracles[_oracle] = true;
        emit OracleAuthorized(_oracle);
    }

    function revokeOracle(address _oracle) external onlyAdmin {
        authorizedOracles[_oracle] = false;
        emit OracleRevoked(_oracle);
    }

    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdminOrOracle returns (uint256) {
        require(_startTime < _endTime, "Invalid time range");
        require(_startTime >= block.timestamp, "Start time must be in the future");

        electionCount++;
        elections[electionCount] = Election({
            id: electionCount,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            resultsPublished: false,
            totalVotes: 0,
            creator: msg.sender
        });

        emit ElectionCreated(electionCount, _title, msg.sender);
        return electionCount;
    }

    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _party,
        string memory _imageHash
    ) external onlyAdminOrOracle electionExists(_electionId) returns (uint256) {
        Election storage e = elections[_electionId];
        require(!e.resultsPublished, "Results already published");

        candidateCount[_electionId]++;
        uint256 candidateId = candidateCount[_electionId];

        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            party: _party,
            imageHash: _imageHash,
            voteCount: 0,
            isActive: true
        });

        emit CandidateAdded(_electionId, candidateId, _name);
        return candidateId;
    }

    function registerVoter(
        uint256 _electionId,
        address _voter
    ) external onlyAdminOrOracle electionExists(_electionId) {
        require(!voters[_electionId][_voter].isRegistered, "Already registered");

        voters[_electionId][_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0,
            electionId: _electionId,
            registeredAt: block.timestamp
        });

        totalRegisteredVoters++;
        emit VoterRegistered(_electionId, _voter);
    }

    // ─── Voting Function ──────────────────────────────────────────────────────

    function castVote(
        uint256 _electionId,
        uint256 _candidateId
    ) external electionExists(_electionId) electionActive(_electionId) {
        Voter storage voter = voters[_electionId][msg.sender];
        require(voter.isRegistered, "Voter not registered");
        require(!voter.hasVoted, "Already voted");

        Candidate storage candidate = candidates[_electionId][_candidateId];
        require(candidate.isActive, "Candidate not active");
        require(_candidateId > 0 && _candidateId <= candidateCount[_electionId], "Invalid candidate");

        voter.hasVoted = true;
        voter.votedCandidateId = _candidateId;
        candidate.voteCount++;
        elections[_electionId].totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    // ─── Query Functions ──────────────────────────────────────────────────────

    function getElection(uint256 _electionId)
        external view electionExists(_electionId)
        returns (Election memory)
    {
        return elections[_electionId];
    }

    function getCandidate(uint256 _electionId, uint256 _candidateId)
        external view electionExists(_electionId)
        returns (Candidate memory)
    {
        return candidates[_electionId][_candidateId];
    }

    function getAllCandidates(uint256 _electionId)
        external view electionExists(_electionId)
        returns (Candidate[] memory)
    {
        uint256 count = candidateCount[_electionId];
        Candidate[] memory result = new Candidate[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = candidates[_electionId][i];
        }
        return result;
    }

    function getVoterStatus(uint256 _electionId, address _voter)
        external view electionExists(_electionId)
        returns (bool isRegistered, bool hasVoted, uint256 votedFor)
    {
        Voter storage voter = voters[_electionId][_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedCandidateId);
    }

    function getElectionResults(uint256 _electionId)
        external view electionExists(_electionId)
        returns (Candidate[] memory, uint256 totalVotes)
    {
        uint256 count = candidateCount[_electionId];
        Candidate[] memory result = new Candidate[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = candidates[_electionId][i];
        }
        return (result, elections[_electionId].totalVotes);
    }

    function isElectionLive(uint256 _electionId)
        external view electionExists(_electionId)
        returns (bool)
    {
        Election storage e = elections[_electionId];
        return e.isActive &&
               block.timestamp >= e.startTime &&
               block.timestamp <= e.endTime;
    }

    function endElection(uint256 _electionId)
        external onlyAdminOrOracle electionExists(_electionId)
    {
        elections[_electionId].isActive = false;
        emit ElectionEnded(_electionId, elections[_electionId].totalVotes);
    }

    function publishResults(uint256 _electionId)
        external onlyAdminOrOracle electionExists(_electionId)
    {
        elections[_electionId].resultsPublished = true;
        emit ResultsPublished(_electionId);
    }
}
