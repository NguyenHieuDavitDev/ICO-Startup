// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StudentStartupFund {
    enum ProjectStatus {
        Upcoming,
        Funding,
        Ongoing,
        Completed,
        Cancelled
    }

    struct Project {
        uint256 id;
        string title;
        string description;
        string image;
        // Thông tin đội ngũ (JSON string mô tả danh sách thành viên)
        string teamJson;
        // Token info
        string tokenName;
        string tokenSymbol;
        address tokenAddress;
        uint256 tokenPrice; // wei per token (0 if not used)
        // Funding
        uint256 goal; // funding goal in wei
        uint256 totalDonated;
        // Timeline
        uint256 projectStart;
        uint256 projectEnd;
        uint256 iocStart;
        uint256 iocEnd;
        // Voting
        uint256 trustVotes;
        uint256 withdrawVotes;
        // Status
        ProjectStatus status;
        bool active;
    }

    struct Comment {
        address user;
        string content;
        uint8 rating;
        uint256 timestamp;
    }

    address public owner;

    // Danh sách dự án
    Project[] public projects;
    uint256 public projectCount;

    // Bình luận theo dự án
    mapping(uint256 => Comment[]) private projectComments;

    // Vote theo dự án
    mapping(uint256 => mapping(address => bool)) public votedTrust;
    mapping(uint256 => mapping(address => bool)) public votedWithdraw;

    event ProjectCreated(uint256 indexed projectId, string title);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount);
    event CommentAdded(uint256 indexed projectId, address indexed user, uint8 rating, string content);
    event VotedTrust(uint256 indexed projectId, address indexed user);
    event VotedWithdraw(uint256 indexed projectId, address indexed user);
    event Withdrawn(uint256 indexed projectId, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier validProject(uint256 projectId) {
        require(projectId < projects.length, "Invalid project");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ============ PROJECT MANAGEMENT ============

    function _computeStatus(
        uint256 projectStart,
        uint256 projectEnd,
        uint256 iocStart,
        uint256 iocEnd
    ) internal view returns (ProjectStatus) {
        if (projectEnd > 0 && block.timestamp > projectEnd) {
            return ProjectStatus.Completed;
        }
        if (block.timestamp >= iocStart && block.timestamp <= iocEnd) {
            return ProjectStatus.Funding;
        }
        if (block.timestamp > iocEnd && block.timestamp <= projectEnd) {
            return ProjectStatus.Ongoing;
        }
        if (block.timestamp < iocStart) {
            return ProjectStatus.Upcoming;
        }
        return ProjectStatus.Upcoming;
    }

    function createProject(
        string memory title,
        string memory description,
        string memory image,
        string memory teamJson,
        string memory tokenName,
        string memory tokenSymbol,
        address tokenAddress,
        uint256 tokenPrice,
        uint256 goal,
        uint256 projectStart,
        uint256 projectEnd,
        uint256 iocStart,
        uint256 iocEnd
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(goal > 0, "Goal must be > 0");

        // Nếu admin không truyền thời gian, gán mặc định theo block.timestamp
        if (projectStart == 0 && projectEnd == 0) {
            projectStart = block.timestamp;
            projectEnd = block.timestamp + 90 days;
        }
        if (iocStart == 0 && iocEnd == 0) {
            iocStart = block.timestamp;
            iocEnd = block.timestamp + 30 days;
        }

        require(iocStart < iocEnd, "IOC start < end");
        require(projectStart <= projectEnd, "Project start <= end");

        uint256 id = projects.length;
        ProjectStatus status = _computeStatus(projectStart, projectEnd, iocStart, iocEnd);

        projects.push(
            Project({
                id: id,
                title: title,
                description: description,
                image: image,
                teamJson: teamJson,
                tokenName: tokenName,
                tokenSymbol: tokenSymbol,
                tokenAddress: tokenAddress,
                tokenPrice: tokenPrice,
                goal: goal,
                totalDonated: 0,
                projectStart: projectStart,
                projectEnd: projectEnd,
                iocStart: iocStart,
                iocEnd: iocEnd,
                trustVotes: 0,
                withdrawVotes: 0,
                status: status,
                active: true
            })
        );

        projectCount = projects.length;

        emit ProjectCreated(id, title);
        return id;
    }

    function setProjectActive(uint256 projectId, bool active)
        external
        onlyOwner
        validProject(projectId)
    {
        projects[projectId].active = active;
    }

    function getProjectsCount() external view returns (uint256) {
        return projects.length;
    }

    // ============ DONATE ============

    function donate(uint256 projectId)
        external
        payable
        validProject(projectId)
    {
        require(msg.value > 0, "Amount must be > 0");

        Project storage p = projects[projectId];
        require(p.active, "Project inactive");
        require(
            block.timestamp >= p.iocStart && block.timestamp <= p.iocEnd,
            "Not in IOC time"
        );

        p.totalDonated += msg.value;

        emit DonationReceived(projectId, msg.sender, msg.value);
    }

    // ============ COMMENTS ============

    function addComment(
        uint256 projectId,
        string memory content,
        uint8 rating
    )
        external
        validProject(projectId)
    {
        require(bytes(content).length > 0, "Content required");
        require(rating >= 1 && rating <= 5, "Rating 1-5");

        projectComments[projectId].push(
            Comment({
                user: msg.sender,
                content: content,
                rating: rating,
                timestamp: block.timestamp
            })
        );

        emit CommentAdded(projectId, msg.sender, rating, content);
    }

    function getCommentsCount(uint256 projectId)
        external
        view
        validProject(projectId)
        returns (uint256)
    {
        return projectComments[projectId].length;
    }

    function getComment(uint256 projectId, uint256 index)
        external
        view
        validProject(projectId)
        returns (
            address user,
            string memory content,
            uint8 rating,
            uint256 timestamp
        )
    {
        require(index < projectComments[projectId].length, "Invalid index");
        Comment storage c = projectComments[projectId][index];
        return (c.user, c.content, c.rating, c.timestamp);
    }

    // ============ VOTING ============

    function voteTrust(uint256 projectId)
        external
        validProject(projectId)
    {
        require(!votedTrust[projectId][msg.sender], "Already voted");
        votedTrust[projectId][msg.sender] = true;
        projects[projectId].trustVotes += 1;

        emit VotedTrust(projectId, msg.sender);
    }

    function voteWithdraw(uint256 projectId)
        external
        validProject(projectId)
    {
        require(!votedWithdraw[projectId][msg.sender], "Already voted");
        votedWithdraw[projectId][msg.sender] = true;
        projects[projectId].withdrawVotes += 1;

        emit VotedWithdraw(projectId, msg.sender);
    }

    // ============ WITHDRAW ============

    function withdraw(
        uint256 projectId,
        address payable to,
        uint256 amount
    )
        external
        onlyOwner
        validProject(projectId)
    {
        require(to != address(0), "Zero address");
        require(amount <= address(this).balance, "Insufficient balance");
        require(projects[projectId].withdrawVotes >= 3, "Not enough votes");

        to.transfer(amount);

        emit Withdrawn(projectId, to, amount);
    }
}
