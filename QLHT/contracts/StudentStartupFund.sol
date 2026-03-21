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
        string teamJson;
        string tokenName;
        string tokenSymbol;
        address tokenAddress;
        uint256 tokenPrice;
        uint256 goal;
        uint256 totalDonated;
        uint256 projectStart;
        uint256 projectEnd;
        uint256 iocStart;
        uint256 iocEnd;
        uint256 trustVotes;
        uint256 withdrawVotes;
        ProjectStatus status;
        bool active;
        uint256 dividendPool;
        uint256 dividendDenominator;
        bool dividendsFinalized;
    }

    struct Comment {
        address user;
        string content;
        uint8 rating;
        uint256 timestamp;
    }

    address public owner;

    Project[] public projects;
    uint256 public projectCount;

    mapping(uint256 => Comment[]) private projectComments;
    mapping(uint256 => mapping(address => uint256)) public donatedByUser;
    mapping(uint256 => mapping(address => uint256)) public claimedDividends;
    mapping(uint256 => mapping(address => bool)) public votedTrust;
    mapping(uint256 => mapping(address => bool)) public votedWithdraw;

    event ProjectCreated(uint256 indexed projectId, string title);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount);
    event CommentAdded(uint256 indexed projectId, address indexed user, uint8 rating, string content);
    event VotedTrust(uint256 indexed projectId, address indexed user);
    event VotedWithdraw(uint256 indexed projectId, address indexed user);
    event Withdrawn(uint256 indexed projectId, address indexed to, uint256 amount);
    event ProjectDisbursed(
        uint256 indexed projectId,
        address indexed treasury,
        uint256 treasuryAmount,
        uint256 dividendPool
    );
    event DividendClaimed(uint256 indexed projectId, address indexed user, uint256 amount);

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

    function _computeStatus(
        uint256 /* projectStart */,
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
                active: true,
                dividendPool: 0,
                dividendDenominator: 0,
                dividendsFinalized: false
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
        require(!projects[projectId].dividendsFinalized, "Already finalized");
        projects[projectId].active = active;
    }

    function getProjectsCount() external view returns (uint256) {
        return projects.length;
    }

    // Donate trong thời gian IOC
    function donate(uint256 projectId)
        external
        payable
        validProject(projectId)
    {
        require(msg.value > 0, "Amount must be > 0");

        Project storage p = projects[projectId];
        require(p.active, "Project inactive");
        require(!p.dividendsFinalized, "Already finalized");
        require(
            block.timestamp >= p.iocStart && block.timestamp <= p.iocEnd,
            "Not in IOC time"
        );

        p.totalDonated += msg.value;
        donatedByUser[projectId][msg.sender] += msg.value;

        emit DonationReceived(projectId, msg.sender, msg.value);
    }

    // Bình luận — không giới hạn thời gian, chỉ cần project còn active
    function addComment(
        uint256 projectId,
        string memory content,
        uint8 rating
    )
        external
        validProject(projectId)
    {
        require(bytes(content).length > 0, "Content required");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");

        Project storage p = projects[projectId];
        require(p.active, "Project inactive");

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

    // Vote tín nhiệm — trong thời gian IOC
    function voteTrust(uint256 projectId)
        external
        validProject(projectId)
    {
        Project storage p = projects[projectId];
        require(p.active, "Project inactive");
        require(!p.dividendsFinalized, "Already finalized");
        require(
            block.timestamp >= p.iocStart && block.timestamp <= p.iocEnd,
            "Not in IOC time"
        );
        require(!votedTrust[projectId][msg.sender], "Already voted");

        votedTrust[projectId][msg.sender] = true;
        projects[projectId].trustVotes += 1;

        emit VotedTrust(projectId, msg.sender);
    }

    // Vote giải ngân — SAU KHI IOC kết thúc, chỉ nhà đầu tư đã donate
    function voteWithdraw(uint256 projectId)
        external
        validProject(projectId)
    {
        Project storage p = projects[projectId];
        require(p.active, "Project inactive");
        require(!p.dividendsFinalized, "Already finalized");
        require(block.timestamp > p.iocEnd, "IOC not ended yet");
        require(donatedByUser[projectId][msg.sender] > 0, "Not a donor");
        require(!votedWithdraw[projectId][msg.sender], "Already voted");

        votedWithdraw[projectId][msg.sender] = true;
        projects[projectId].withdrawVotes += 1;

        emit VotedWithdraw(projectId, msg.sender);
    }

    // Admin chốt cổ tức — chỉ cần IOC đã kết thúc và có donations
    // dividendAmount: số ETH trả cho nhà đầu tư (phần còn lại vào treasury)
    function finalizeDividends(
        uint256 projectId,
        address payable treasury,
        uint256 dividendAmount
    )
        external
        onlyOwner
        validProject(projectId)
    {
        Project storage p = projects[projectId];
        require(!p.dividendsFinalized, "Already finalized");
        require(block.timestamp > p.iocEnd, "IOC not ended");
        require(treasury != address(0), "Zero address");
        require(p.totalDonated > 0, "No donations yet");
        require(dividendAmount <= p.totalDonated, "Exceeds total donated");

        uint256 treasuryAmount = p.totalDonated - dividendAmount;

        p.dividendPool = dividendAmount;
        p.dividendDenominator = p.totalDonated;
        p.dividendsFinalized = true;
        p.active = false;

        if (treasuryAmount > 0) {
            (bool ok, ) = treasury.call{value: treasuryAmount}("");
            require(ok, "Treasury transfer failed");
        }

        emit ProjectDisbursed(projectId, treasury, treasuryAmount, dividendAmount);
    }

    // Nhà đầu tư nhận cổ tức
    function claimDividends(uint256 projectId)
        external
        validProject(projectId)
    {
        uint256 claimable = getClaimableDividends(projectId, msg.sender);
        require(claimable > 0, "Nothing to claim");

        claimedDividends[projectId][msg.sender] += claimable;

        (bool ok, ) = payable(msg.sender).call{value: claimable}("");
        require(ok, "Transfer failed");

        emit DividendClaimed(projectId, msg.sender, claimable);
    }

    function getClaimableDividends(uint256 projectId, address user)
        public
        view
        validProject(projectId)
        returns (uint256)
    {
        Project storage p = projects[projectId];
        if (!p.dividendsFinalized) return 0;
        if (p.dividendPool == 0 || p.dividendDenominator == 0) return 0;

        uint256 userDonated = donatedByUser[projectId][user];
        if (userDonated == 0) return 0;

        uint256 owed = (userDonated * p.dividendPool) / p.dividendDenominator;
        uint256 alreadyClaimed = claimedDividends[projectId][user];
        if (owed <= alreadyClaimed) return 0;
        return owed - alreadyClaimed;
    }

    // Admin rút ETH khẩn cấp (không ảnh hưởng dự án đã finalize)
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
        require(amount > 0, "Amount must be > 0");
        require(amount <= address(this).balance, "Insufficient balance");
        require(!projects[projectId].dividendsFinalized, "Already finalized");

        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Withdrawn(projectId, to, amount);
    }
}
