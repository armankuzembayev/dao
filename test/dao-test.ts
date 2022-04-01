const { expect } = require("chai");
const { ethers } = require("hardhat");

import * as Configs from "../config"

describe("Dao", function ()  {

    let Erc20Token: any;
    let erc20Token: any;
    let Dao: any;
    let dao: any;
    let TestContract: any;
    let testContract: any;

    let owner: any;
    let addr1: any;
    let addr2: any;
    let addr3: any;
    let zeroAddress = ethers.utils.getAddress(Configs.zeroAddress)

    beforeEach(async function() {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        Erc20Token = await ethers.getContractFactory("Erc20");
        const nameErc20Eth = Configs.nameErc20;
        const symbolErc20Eth = Configs.symbolErc20;
        const decimals = Configs.decimals;
        const totalSupply = Configs.totalSupply;

        erc20Token = await Erc20Token.deploy(nameErc20Eth, symbolErc20Eth, decimals, ethers.utils.parseEther(totalSupply));
        await erc20Token.deployed();


        Dao = await ethers.getContractFactory("Dao");

        dao = await Dao.deploy(
            owner.address, erc20Token.address, Configs.minimumQuorum, Configs.debatingPeriodDuration
        );
        await dao.deployed();


        TestContract = await ethers.getContractFactory("TestContract");
        
        testContract = await TestContract.deploy(dao.address);
        await testContract.deployed();
    });

    describe("Deployment", function() {

        it("Should initialize correctly", async function() {
            expect(await dao.chairPerson()).to.equal(owner.address);
            expect(await dao.voteToken()).to.equal(erc20Token.address);
            expect(await dao.minimumQuorum()).to.equal(Configs.minimumQuorum);
            expect(await dao.debatingPeriodDuration()).to.equal(Configs.debatingPeriodDuration);

            expect(await testContract.daoContract()).to.equal(dao.address);
        });
    });

    describe("Setters", function() {

        it("Should set correctly", async function() {
            await dao.setChairPerson(addr1.address);
            expect(await dao.chairPerson()).to.equal(addr1.address);

            await dao.setVoteToken(addr2.address);
            expect(await dao.voteToken()).to.equal(addr2.address);

            await dao.setMinimumQuorum(10000);
            expect(await dao.minimumQuorum()).to.equal(10000);

            await dao.setDebatingPeriodDuration(Configs.debatingPeriodDurationTest);
            expect(await dao.debatingPeriodDuration()).to.equal(Configs.debatingPeriodDurationTest);
        });
    });

    describe("Deposit", function() {

        it("Should revert", async function() {
            await expect(dao.deposit(0)).to.be.revertedWith("Amount should be positive");
        })

        it("Should deposit correctly", async function() {

            await erc20Token.mint(owner.address, ethers.utils.parseEther("1000"));
            await erc20Token.approve(dao.address, ethers.utils.parseEther("1000"));
            await dao.deposit(ethers.utils.parseEther("100"));

            const users = await dao.users(owner.address);
            expect(users.amount).to.be.equal(ethers.utils.parseEther("100"));
        });
    });

    describe("Withdraw", function() {

        it("Should revert", async function() {
            await expect(dao.withdraw()).to.be.revertedWith("User not found");
        })

        it("Should withdraw correctly", async function() {
            await erc20Token.mint(owner.address, ethers.utils.parseEther("1000"));
            await erc20Token.approve(dao.address, ethers.utils.parseEther("1000"));
            await dao.deposit(ethers.utils.parseEther("100"));

            let users = await dao.users(owner.address);
            expect(users.amount).to.be.equal(ethers.utils.parseEther("100"));
            expect(await erc20Token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("900"));

            await dao.withdraw();

            users = await dao.users(owner.address);
            expect(users.amount).to.be.equal(ethers.utils.parseEther("0"));
            expect(await erc20Token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));

        });
    });

    describe("Add proposal", function() {


        it("Should add proposal correctly", async function() {

            var jsonAbi = [{
                "inputs": [],
                "name": "incrementCounter",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
               }
            ];

            const iface = new ethers.utils.Interface(jsonAbi);
            const calldata = iface.encodeFunctionData('incrementCounter',[]);
            const description = "Increments counter";

            expect(await dao.currentId()).to.equal(0);
            await dao.addProposal(calldata, testContract.address, description);
            expect(await dao.currentId()).to.equal(1);
            
        });
    });

    describe("Vote", function() {

        it("Should revert", async function() {
            await expect(dao.vote(0, true)).to.be.revertedWith("Not legit id");


        })

        it("Should vote correctly", async function() {

            var jsonAbi = [{
                "inputs": [],
                "name": "incrementCounter",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
               }
            ];

            const iface = new ethers.utils.Interface(jsonAbi);
            const calldata = iface.encodeFunctionData('incrementCounter',[]);
            const description = "Increments counter";

            await dao.addProposal(calldata, testContract.address, description);
            await dao.addProposal(calldata, testContract.address, description);
            expect(await dao.currentId()).to.equal(2);

            await erc20Token.mint(owner.address, ethers.utils.parseEther("1000"));
            await erc20Token.approve(dao.address, ethers.utils.parseEther("1000"));
            await dao.deposit(ethers.utils.parseEther("100"));

            await dao.vote(0, true);
            await dao.vote(1, false);

            let votes1 = await dao.votes(0);
            expect(votes1.support).to.equal(ethers.utils.parseEther("100"));

            let votes2 = await dao.votes(1);
            expect(votes2.against).to.equal(ethers.utils.parseEther("100"));

            await expect(dao.withdraw()).to.be.revertedWith("Debating period is not finished");
        });

        it("Should vote and update votes", async function() {

            const DaoTemp = await ethers.getContractFactory("Dao");

            const daoTemp = await DaoTemp.deploy(
                owner.address, erc20Token.address, Configs.minimumQuorum, Configs.debatingPeriodDurationTest
            );
            await daoTemp.deployed();

            var jsonAbi = [{
                "inputs": [],
                "name": "incrementCounter",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
               }
            ];

            const iface = new ethers.utils.Interface(jsonAbi);
            const calldata = iface.encodeFunctionData('incrementCounter',[]);
            const description = "Increments counter";

            await daoTemp.addProposal(calldata, testContract.address, description);
            await new Promise(f => setTimeout(f, 5000));
            await daoTemp.addProposal(calldata, testContract.address, description);
            expect(await daoTemp.currentId()).to.equal(2);



            await erc20Token.mint(owner.address, ethers.utils.parseEther("1000"));
            await erc20Token.approve(daoTemp.address, ethers.utils.parseEther("1000"));
            await daoTemp.deposit(ethers.utils.parseEther("100"));

            await daoTemp.vote(1, true);
            await daoTemp.vote(0, true);

            let votes1 = await daoTemp.votes(0);
            expect(votes1.support).to.equal(ethers.utils.parseEther("100"));

            let votes2 = await daoTemp.votes(1);
            expect(votes2.support).to.equal(ethers.utils.parseEther("100"));
        });
    });

    describe("Finish proposal", function() {


        it("Should revert", async function() {
            await expect(dao.finishProposal(0)).to.be.revertedWith("Not legit id");

            var jsonAbi = [{
                "inputs": [],
                "name": "incrementCounters",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
               }
            ];

            const iface = new ethers.utils.Interface(jsonAbi);
            const calldata = iface.encodeFunctionData('incrementCounters',[]);
            const description = "Increments counter";

            await dao.addProposal(calldata, testContract.address, description);

            await expect(dao.finishProposal(0)).to.be.revertedWith("Debating period is not over");

            const DaoTemp = await ethers.getContractFactory("Dao");

            const daoTemp = await DaoTemp.deploy(
                owner.address, erc20Token.address, Configs.minimumQuorum, Configs.debatingPeriodDurationTest
            );
            await daoTemp.deployed();

            await daoTemp.addProposal(calldata, testContract.address, description);
            expect(await daoTemp.currentId()).to.equal(1);


            await erc20Token.mint(owner.address, ethers.utils.parseEther("2000"));
            await erc20Token.approve(daoTemp.address, ethers.utils.parseEther("2000"));
            await daoTemp.deposit(ethers.utils.parseEther("100"));

            await expect(daoTemp.finishProposal(0)).to.be.revertedWith("Less that minimum quorum");

            await daoTemp.deposit(ethers.utils.parseEther("1000"));

            await daoTemp.vote(0, true);
            await new Promise(f => setTimeout(f, 5000));

            await expect(daoTemp.finishProposal(0)).to.be.revertedWith("ERROR call func");
        })

        it("Should finish proposal correctly", async function() {

            const DaoTemp = await ethers.getContractFactory("Dao");

            const daoTemp = await DaoTemp.deploy(
                owner.address, erc20Token.address, Configs.minimumQuorum, Configs.debatingPeriodDurationTest
            );
            await daoTemp.deployed();

            const TestContractTemp = await ethers.getContractFactory("TestContract");
        
            const testContractTemp = await TestContractTemp.deploy(daoTemp.address);
            await testContractTemp.deployed();

            var jsonAbi = [{
                "inputs": [],
                "name": "incrementCounter",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
               }
            ];

            const iface = new ethers.utils.Interface(jsonAbi);
            const calldata = iface.encodeFunctionData('incrementCounter');
            const description = "Increments counter";

            await daoTemp.addProposal(calldata, testContractTemp.address, description);
            await daoTemp.addProposal(calldata, testContractTemp.address, description);
            expect(await daoTemp.currentId()).to.equal(2);


            await erc20Token.mint(owner.address, ethers.utils.parseEther("2000"));
            await erc20Token.approve(daoTemp.address, ethers.utils.parseEther("2000"));
            await daoTemp.deposit(ethers.utils.parseEther("1100"));

            await daoTemp.vote(0, true);
            await daoTemp.vote(1, false);


            await new Promise(f => setTimeout(f, 5000));

            expect(await testContractTemp.counter()).to.equal(0);
            
            await daoTemp.finishProposal(0);
            await daoTemp.finishProposal(1);

            expect(await testContractTemp.counter()).to.equal(1); 
        });
    });


});