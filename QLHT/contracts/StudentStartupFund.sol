// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// smart contract StudentStartupFund  mục đích là tạo ra một nền tảng gây quỹ, bình chọn và giám sát các dự án khởi nghiệp của sinh viên
contract StudentStartupFund {
    // emum của status của dự án 
    enum ProjectStatus {
        Upcoming, // chưa bắt đầu
        Funding, // đang funding
        Ongoing, // đang diễn ra
        Completed, // đã hoàn thành
        Cancelled // đã hủy
    }

    // struct của dự án gồm các thông tin của dự án
    struct Project {
        uint256 id; // id của dự án
        string title; // tiêu đề của dự án
        string description; // mô tả của dự án
        string image; // hình ảnh của dự án
        // Thông tin đội ngũ 
        string teamJson; // thông tin đội ngũ của dự án 
        // Token info
        string tokenName; // tên của token
        string tokenSymbol; // symbol của token
        address tokenAddress; // address của token
        uint256 tokenPrice; // giá của token
        // Funding
        uint256 goal; // mục tiêu funding
        uint256 totalDonated; // tổng số tiền đã donate
        // Timeline
        uint256 projectStart; // thời gian bắt đầu dự án
        uint256 projectEnd; // thời gian kết thúc dự án
        uint256 iocStart; // thời gian bắt đầu IOC
        uint256 iocEnd; // thời gian kết thúc IOC
        // Voting
        uint256 trustVotes; // số phiếu tín nhiệm
        uint256 withdrawVotes; // số phiếu giải ngân
        // Status
        ProjectStatus status; // status của dự án
        bool active; // active của dự án
    }

    // struct của bình luận gồm các thông tin của bình luận
    struct Comment {
        address user; // address của người bình luận
        string content; // nội dung của bình luận
        uint8 rating; // đánh giá của bình luận
        uint256 timestamp; // thời gian bình luận
    }

    // address của owner
    address public owner;

    // Danh sách dự án
    Project[] public projects; // danh sách dự án
    uint256 public projectCount; // số lượng dự án

    // Bình luận theo dự án
    mapping(uint256 => Comment[]) private projectComments; // mapping từ id dự án đến danh sách bình luận

    // Vote theo dự án
    mapping(uint256 => mapping(address => bool)) public votedTrust; // mapping từ id dự án đến address của người vote tín nhiệm
    mapping(uint256 => mapping(address => bool)) public votedWithdraw; // mapping từ id dự án đến address của người vote giải ngân
    event ProjectCreated(uint256 indexed projectId, string title); // event tạo dự án
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount); // event donate
    event CommentAdded(uint256 indexed projectId, address indexed user, uint8 rating, string content); // event bình luận
    event VotedTrust(uint256 indexed projectId, address indexed user); // event vote tín nhiệm
    event VotedWithdraw(uint256 indexed projectId, address indexed user); // event vote giải ngân
    event Withdrawn(uint256 indexed projectId, address indexed to, uint256 amount); // event rút tiền


    // modifier chỉ cho owner thực hiện
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner"); // nếu msg.sender không phải owner thì throw error
        _;
    }

    // modifier chỉ cho projectId hợp lệ
    modifier validProject(uint256 projectId) {
        require(projectId < projects.length, "Invalid project"); // nếu projectId không hợp lệ thì throw error
        _;
    }

    // constructor gán owner là msg.sender
    constructor() {
        owner = msg.sender; // gán owner là msg.sender
    }

    // ============ PROJECT MANAGEMENT ============

    // hàm tính toán status của dự án
    function _computeStatus(
        uint256 projectStart, // thời gian bắt đầu dự án
        uint256 projectEnd, // thời gian kết thúc dự án
        uint256 iocStart, // thời gian bắt đầu IOC
        uint256 iocEnd // thời gian kết thúc IOC
    ) internal view returns (ProjectStatus) {
        // nếu thời gian kết thúc dự án lớn hơn 0 và thời gian hiện tại lớn hơn thời gian kết thúc dự án thì return Completed
        if (projectEnd > 0 && block.timestamp > projectEnd) { 
            return ProjectStatus.Completed; 
        }
        // nếu thời gian hiện tại lớn hơn hoặc bằng thời gian bắt đầu IOC và nhỏ hơn hoặc bằng thời gian kết thúc IOC thì return Funding
        if (block.timestamp >= iocStart && block.timestamp <= iocEnd) { 
            return ProjectStatus.Funding; // return Funding
        }
        // nếu thời gian hiện tại lớn hơn thời gian kết thúc IOC và nhỏ hơn hoặc bằng thời gian kết thúc dự án thì return Ongoing
        if (block.timestamp > iocEnd && block.timestamp <= projectEnd) {  
            return ProjectStatus.Ongoing;
        }
        // nếu thời gian hiện tại nhỏ hơn thời gian bắt đầu IOC thì return Upcoming
        if (block.timestamp < iocStart) { // nếu thời gian hiện tại nhỏ hơn thời gian bắt đầu IOC thì return Upcoming
            return ProjectStatus.Upcoming; // return Upcoming
        }
        return ProjectStatus.Upcoming; // return Upcoming
    }

    // hàm tạo dự án
    function createProject(
        string memory title, // tiêu đề của dự án   
        string memory description, // mô tả của dự án
        string memory image, // hình ảnh của dự án
        string memory teamJson, // thông tin đội ngũ của dự án
        string memory tokenName, // tên của token
        string memory tokenSymbol, // symbol của token
        address tokenAddress, // address của token
        uint256 tokenPrice, // giá của token
        uint256 goal, // mục tiêu funding
        uint256 projectStart, // thời gian bắt đầu dự án
        uint256 projectEnd, // thời gian kết thúc dự án
        uint256 iocStart, // thời gian bắt đầu IOC
        uint256 iocEnd // thời gian kết thúc IOC
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0, "Title required"); // nếu tiêu đề của dự án không hợp lệ thì throw error
        require(goal > 0, "Goal must be > 0"); // nếu mục tiêu funding không hợp lệ thì throw error

        // Nếu admin không truyền thời gian, gán mặc định theo block.timestamp
        if (projectStart == 0 && projectEnd == 0) {  // nếu thời gian bắt đầu dự án và thời gian kết thúc dự án không hợp lệ thì gán mặc định theo block.timestamp
            projectStart = block.timestamp; // gán thời gian bắt đầu dự án là thời gian hiện tại
            projectEnd = block.timestamp + 90 days; // gán thời gian kết thúc dự án là thời gian hiện tại + 90 ngày
        }
        if (iocStart == 0 && iocEnd == 0) { // nếu thời gian bắt đầu IOC và thời gian kết thúc IOC không hợp lệ thì gán mặc định theo block.timestamp
            iocStart = block.timestamp; // gán thời gian bắt đầu IOC là thời gian hiện tại
            iocEnd = block.timestamp + 30 days; // gán thời gian kết thúc IOC là thời gian hiện tại + 30 ngày
        }

        require(iocStart < iocEnd, "IOC start < end"); // nếu thời gian bắt đầu IOC lớn hơn thời gian kết thúc IOC thì throw error
        require(projectStart <= projectEnd, "Project start <= end"); // nếu thời gian bắt đầu dự án lớn hơn thời gian kết thúc dự án thì throw error

        uint256 id = projects.length; // gán id của dự án là số lượng dự án hiện tại
        ProjectStatus status = _computeStatus(projectStart, projectEnd, iocStart, iocEnd); // gán status của dự án là status của dự án hiện tại

        // thêm dự án vào danh sách dự án
        projects.push( 
            Project({ // tạo dự án mới
                id: id, // gán id của dự án là id của dự án hiện tại
                title: title, // gán tiêu đề của dự án là tiêu đề của dự án hiện tại
                description: description, // gán mô tả của dự án là mô tả của dự án hiện tại
                image: image, // gán hình ảnh của dự án là hình ảnh của dự án hiện tại
                teamJson: teamJson, // gán thông tin đội ngũ của dự án là thông tin đội ngũ của dự án hiện tại
                tokenName: tokenName, // gán tên của token là tên của token hiện tại
                tokenSymbol: tokenSymbol, // gán symbol của token là symbol của token hiện tại
                tokenAddress: tokenAddress, // gán address của token là address của token hiện tại
                tokenPrice: tokenPrice, // gán giá của token là giá của token hiện tại
                goal: goal, // gán mục tiêu funding là mục tiêu funding hiện tại
                totalDonated: 0, // gán tổng số tiền đã donate là 0
                projectStart: projectStart, // gán thời gian bắt đầu dự án là thời gian bắt đầu dự án hiện tại
                projectEnd: projectEnd, // gán thời gian kết thúc dự án là thời gian kết thúc dự án hiện tại
                iocStart: iocStart, // gán thời gian bắt đầu IOC là thời gian bắt đầu IOC hiện tại
                iocEnd: iocEnd, // gán thời gian kết thúc IOC là thời gian kết thúc IOC hiện tại
                trustVotes: 0, // gán số phiếu tín nhiệm là 0
                withdrawVotes: 0, // gán số phiếu giải ngân là 0
                status: status, // gán status của dự án là status của dự án hiện tại
                active: true // gán active của dự án là true
            })
        );

        projectCount = projects.length; // gán số lượng dự án là số lượng dự án hiện tại

        emit ProjectCreated(id, title); // emit event tạo dự án
        return id; // return id của dự án
    }

    // hàm set active của dự án
    function setProjectActive(uint256 projectId, bool active) // projectId là id của dự án, active là active của dự án
        external // chỉ cho owner thực hiện
        onlyOwner // chỉ cho owner thực hiện
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        projects[projectId].active = active; // gán active của dự án là active
    }   

    // hàm lấy số lượng dự án
    function getProjectsCount() external view returns (uint256) {
        return projects.length; // return số lượng dự án
    }

    // ============ DONATE ============

    function donate(uint256 projectId) // projectId là id của dự án
        external // chỉ cho người dùng thực hiện
        payable // chỉ cho người dùng gửi tiền
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        require(msg.value > 0, "Amount must be > 0"); // nếu số tiền donate không hợp lệ thì throw error

        Project storage p = projects[projectId]; // lấy dự án từ danh sách dự án
        require(p.active, "Project inactive"); // nếu dự án không active thì throw error
        require(
            block.timestamp >= p.iocStart && block.timestamp <= p.iocEnd, // nếu thời gian hiện tại không nằm trong thời gian IOC thì throw error
            "Not in IOC time" // nếu thời gian hiện tại không nằm trong thời gian IOC thì throw error
        );

        p.totalDonated += msg.value; // gán tổng số tiền đã donate là tổng số tiền đã donate hiện tại + số tiền donate

        emit DonationReceived(projectId, msg.sender, msg.value); // emit event donate
    }

    // ============ COMMENTS ============

    function addComment(
        uint256 projectId, // projectId là id của dự án
        string memory content, // nội dung của bình luận
        uint8 rating // đánh giá của bình luận
    )
        external // chỉ cho người dùng thực hiện
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        require(bytes(content).length > 0, "Content required"); // nếu nội dung của bình luận không hợp lệ thì throw error
        require(rating >= 1 && rating <= 5, "Rating 1-5"); // nếu đánh giá của bình luận không hợp lệ thì throw error

        projectComments[projectId].push( // thêm bình luận vào danh sách bình luận
            Comment({
                user: msg.sender, // gán address của người bình luận là address của người bình luận hiện tại
                content: content, // gán nội dung của bình luận là nội dung của bình luận hiện tại
                rating: rating, // gán đánh giá của bình luận là đánh giá của bình luận hiện tại
                timestamp: block.timestamp // gán thời gian bình luận là thời gian bình luận hiện tại
            })
        );

        emit CommentAdded(projectId, msg.sender, rating, content); // emit event bình luận
    }

    function getCommentsCount(uint256 projectId) // projectId là id của dự án
        external // chỉ cho người dùng thực hiện
        view // chỉ cho người dùng xem
        validProject(projectId) // chỉ cho projectId hợp lệ
        returns (uint256) // return số lượng bình luận
    {
        return projectComments[projectId].length; // return số lượng bình luận
    }

    function getComment(uint256 projectId, uint256 index) // projectId là id của dự án, index là index của bình luận
        external // chỉ cho người dùng thực hiện
        view // chỉ cho người dùng xem
        validProject(projectId) // chỉ cho projectId hợp lệ
        returns (
            address user, // return address của người bình luận
            string memory content, // return nội dung của bình luận
            uint8 rating, // return đánh giá của bình luận
            uint256 timestamp // return thời gian bình luận
        )
    {
        require(index < projectComments[projectId].length, "Invalid index"); // nếu index không hợp lệ thì throw error
        Comment storage c = projectComments[projectId][index]; // lấy bình luận từ danh sách bình luận
        return (c.user, c.content, c.rating, c.timestamp); // return bình luận
    }

    // ============ VOTING ============

    function voteTrust(uint256 projectId) // projectId là id của dự án
        external // chỉ cho người dùng thực hiện
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        require(!votedTrust[projectId][msg.sender], "Already voted"); // nếu người dùng đã vote tín nhiệm cho dự án này rồi thì throw error
        votedTrust[projectId][msg.sender] = true; // gán votedTrust của người dùng là true
        projects[projectId].trustVotes += 1; // gán số phiếu tín nhiệm là số phiếu tín nhiệm hiện tại + 1

        emit VotedTrust(projectId, msg.sender); // emit event vote tín nhiệm
    } 

    function voteWithdraw(uint256 projectId) // projectId là id của dự án
        external // chỉ cho người dùng thực hiện
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        require(!votedWithdraw[projectId][msg.sender], "Already voted"); // nếu người dùng đã vote giải ngân cho dự án này rồi thì throw error
        votedWithdraw[projectId][msg.sender] = true; // gán votedWithdraw của người dùng là true
        projects[projectId].withdrawVotes += 1; // gán số phiếu giải ngân là số phiếu giải ngân hiện tại + 1

        emit VotedWithdraw(projectId, msg.sender); // emit event vote giải ngân
    }

    // ============ WITHDRAW là hàm rút tiền ============

    function withdraw(
        uint256 projectId, // projectId là id của dự án
        address payable to, // to là address của người nhận tiền
        uint256 amount // amount là số tiền rút
    )
        external // chỉ cho owner thực hiện
        onlyOwner // chỉ cho owner thực hiện
        validProject(projectId) // chỉ cho projectId hợp lệ
    {
        require(to != address(0), "Zero address"); // nếu address của người nhận tiền là 0 thì throw error
        require(amount <= address(this).balance, "Insufficient balance"); // nếu số tiền rút lớn hơn số tiền trong contract thì throw error
        require(projects[projectId].withdrawVotes >= 3, "Not enough votes"); // nếu số phiếu giải ngân lớn hơn hoặc bằng 3 thì throw error

        to.transfer(amount); // chuyển tiền cho người nhận tiền

        emit Withdrawn(projectId, to, amount); // emit event rút tiền
    }
}
