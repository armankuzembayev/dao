const { expect } = require("chai");
const { ethers } = require("hardhat");

import * as Configs from "../config"

describe("ERC20", function ()  {

    let Token: any;
    let hardhatToken: any;
    let owner: any;
    let addr1: any;
    let addr2: any;
    let addr3: any;
    let zeroAddress = ethers.utils.getAddress(Configs.zeroAddress)

    beforeEach(async function() {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        Token = await ethers.getContractFactory("Erc20");
        const name = Configs.nameErc20;
        const symbol = Configs.symbolErc20;
        const decimals = Configs.decimals;
        const totalSupply = Configs.totalSupply;

        hardhatToken = await Token.deploy(name, symbol, decimals, ethers.utils.parseEther(totalSupply));
        await hardhatToken.deployed();

        await hardhatToken.mint(owner.address, ethers.utils.parseEther("1000"));
        await hardhatToken.mint(addr1.address, ethers.utils.parseEther("1000"));
        await hardhatToken.mint(addr2.address, ethers.utils.parseEther("1000"));
    });

    describe("Deployment", function() {

        it("Should initialize correctly", async function() {
            expect(await hardhatToken.name()).to.equal(Configs.nameErc20);
            expect(await hardhatToken.symbol()).to.equal(Configs.symbolErc20);
            expect(await hardhatToken.decimals()).to.equal(18);
            expect(await hardhatToken.totalSupply()).to.equal(ethers.utils.parseEther("1000000000000000000003000"));
            expect(await hardhatToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));
            expect(await hardhatToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
            expect(await hardhatToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("1000"));
            expect(await hardhatToken.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther("0"));
        });
    });

    describe("Transfer", function() {

        it("Should transfer right amount", async function() {

            await expect(hardhatToken.transfer(addr1.address, ethers.utils.parseEther("100"))).
            to.emit(hardhatToken, "Transfer").withArgs(owner.address, addr1.address, ethers.utils.parseEther("100"))

            expect(await hardhatToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("900"))
            expect(await hardhatToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1100"))
            expect(await hardhatToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("1000"))
            expect(await hardhatToken.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther("0"))
        });

        it("Should revert due to not enough balance", async function() {
            await expect(hardhatToken.transfer(addr1.address, ethers.utils.parseEther("10000"))).to.be.revertedWith("Not enough balance")
        });

        it("Should revert due to zero address", async function() {
            await expect(hardhatToken.transfer(zeroAddress, ethers.utils.parseEther("10000"))).to.be.revertedWith("Cannot be zero address")
        });
    })

    describe("TransferFrom", function() {

        
        it("Should revert due to not enough balance", async function() {
            await expect(hardhatToken.transferFrom(addr1.address, addr2.address, ethers.utils.parseEther("10"))).to.be.revertedWith("Not enough allowance")
        });

        it("Should revert due to zero address", async function() {
            await expect(hardhatToken.transferFrom(addr1.address, zeroAddress, ethers.utils.parseEther("10000"))).
            to.be.revertedWith("Cannot be zero address")
            await expect(hardhatToken.transferFrom(zeroAddress, addr1.address, ethers.utils.parseEther("10000"))).
            to.be.revertedWith("Cannot be zero address")
        });

        it("Should transfer from owner to addr2 by addr1", async function() {
            await expect(hardhatToken.approve(zeroAddress, ethers.utils.parseEther("10000"))).
            to.be.revertedWith("Cannot be zero address");

            await expect(hardhatToken.approve(addr1.address, ethers.utils.parseEther("100"))).
            to.emit(hardhatToken, "Approval").
            withArgs(owner.address, addr1.address, ethers.utils.parseEther("100"))

            expect(await hardhatToken.allowance(owner.address, addr1.address)).
            to.equal(ethers.utils.parseEther("100"))

            await expect(hardhatToken.connect(addr1).transferFrom(owner.address, addr2.address, 
            ethers.utils.parseEther("1000"))).
            to.be.revertedWith("Not enough allowance")

            await expect(hardhatToken.connect(addr1).transferFrom(owner.address, addr2.address, 
            ethers.utils.parseEther("100"))).
            to.emit(hardhatToken, "Transfer").
            withArgs(owner.address, addr2.address, ethers.utils.parseEther("100"))

            expect(await hardhatToken.allowance(owner.address, addr1.address)).to.equal(ethers.utils.parseEther("0"))

            expect(await hardhatToken.balanceOf(owner.address)).
            to.equal(ethers.utils.parseEther("900"))
            expect(await hardhatToken.balanceOf(addr1.address)).
            to.equal(ethers.utils.parseEther("1000"))
            expect(await hardhatToken.balanceOf(addr2.address)).
            to.equal(ethers.utils.parseEther("1100"))
            expect(await hardhatToken.balanceOf(addr3.address)).
            to.equal(ethers.utils.parseEther("0"))

            await expect(hardhatToken.approve(addr1.address, ethers.utils.parseEther("2000"))).
            to.emit(hardhatToken, "Approval").
            withArgs(owner.address, addr1.address, ethers.utils.parseEther("2000"))

            await expect(hardhatToken.connect(addr1).
            transferFrom(owner.address, addr2.address, ethers.utils.parseEther("1500"))).
            to.be.revertedWith("Not enough balance")
        });

        describe("Increase and Decrease Allowance", function() {

            it("Should revert due to zero address", async function() {
                await expect(hardhatToken.increaseAllowance(zeroAddress, 
                ethers.utils.parseEther("10000"))).to.be.revertedWith("Cannot be zero address");
                await expect(hardhatToken.decreaseAllowance(zeroAddress, 
                ethers.utils.parseEther("10000"))).to.be.revertedWith("Cannot be zero address");
            });
    
            it("Should increase allowance and transfer from owner to addr2 by addr1", async function() {
                await hardhatToken.increaseAllowance(addr1.address, ethers.utils.parseEther("100"))
                
                await expect(hardhatToken.connect(addr1).
                transferFrom(owner.address, addr2.address, ethers.utils.parseEther("1000"))).
                to.be.revertedWith("Not enough allowance")

                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("100"))
    
                await expect(hardhatToken.connect(addr1).
                transferFrom(owner.address, addr2.address, ethers.utils.parseEther("100"))).
                to.emit(hardhatToken, "Transfer").
                withArgs(owner.address, addr2.address, ethers.utils.parseEther("100"))
    
                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("0"))
    
                expect(await hardhatToken.balanceOf(owner.address)).
                to.equal(ethers.utils.parseEther("900"))
                expect(await hardhatToken.balanceOf(addr1.address)).
                to.equal(ethers.utils.parseEther("1000"))
                expect(await hardhatToken.balanceOf(addr2.address)).
                to.equal(ethers.utils.parseEther("1100"))
                expect(await hardhatToken.balanceOf(addr3.address)).
                to.equal(ethers.utils.parseEther("0"))
            });

            it("Should decrease allowance and transfer from owner to addr2 by addr1", async function() {
                await hardhatToken.increaseAllowance(addr1.address, ethers.utils.parseEther("1000"))
                
                await expect(hardhatToken.connect(addr1).
                transferFrom(owner.address, addr2.address, ethers.utils.parseEther("10000"))).
                to.be.revertedWith("Not enough allowance")

                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("1000"))

                await hardhatToken.decreaseAllowance(addr1.address, ethers.utils.parseEther("100"))

                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("900"))
    
                await expect(hardhatToken.connect(addr1).
                transferFrom(owner.address, addr2.address, ethers.utils.parseEther("100"))).
                to.emit(hardhatToken, "Transfer").
                withArgs(owner.address, addr2.address, ethers.utils.parseEther("100"))
    
                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("800"))
    
                expect(await hardhatToken.balanceOf(owner.address)).
                to.equal(ethers.utils.parseEther("900"))
                expect(await hardhatToken.balanceOf(addr1.address))
                .to.equal(ethers.utils.parseEther("1000"))
                expect(await hardhatToken.balanceOf(addr2.address)).
                to.equal(ethers.utils.parseEther("1100"))
                expect(await hardhatToken.balanceOf(addr3.address)).
                to.equal(ethers.utils.parseEther("0"))
            });

            it("Should decrease allowance to 0 when amount is larger than current allowance", async function() {
                await hardhatToken.increaseAllowance(addr1.address, ethers.utils.parseEther("1000"))
                
                await expect(hardhatToken.connect(addr1).
                transferFrom(owner.address, addr2.address, ethers.utils.parseEther("10000"))).
                to.be.revertedWith("Not enough allowance")

                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("1000"))

                await hardhatToken.decreaseAllowance(addr1.address, ethers.utils.parseEther("2000"))

                expect(await hardhatToken.allowance(owner.address, addr1.address)).
                to.equal(ethers.utils.parseEther("0"))
            });
        });


        describe("Mint and burn", function() {

            it("Should mint", async function() {

                await expect(hardhatToken.mint(owner.address, ethers.utils.parseEther("1000"))).
                to.emit(hardhatToken, "Transfer").
                withArgs(zeroAddress, owner.address, ethers.utils.parseEther("1000"))

                expect(await hardhatToken.totalSupply()).
                to.equal(ethers.utils.parseEther("1000000000000000000004000"));
                expect(await hardhatToken.balanceOf(owner.address)).
                to.equal(ethers.utils.parseEther("2000"))
            });

            it("Should burn", async function() {

                await expect(hardhatToken.burn(owner.address, ethers.utils.parseEther("1000000000000000000000000000"))).
                to.be.revertedWith("Amount exceeds total supply");

                await expect(hardhatToken.burn(owner.address, ethers.utils.parseEther("1000"))).
                to.emit(hardhatToken, "Transfer").
                withArgs(owner.address, zeroAddress, ethers.utils.parseEther("1000"))

                await expect(hardhatToken.burn(owner.address, ethers.utils.parseEther("2000"))).
                to.be.revertedWith("Not enough balance");

                expect(await hardhatToken.totalSupply()).
                to.equal(ethers.utils.parseEther("1000000000000000000002000"));
                expect(await hardhatToken.balanceOf(owner.address)).
                to.equal(ethers.utils.parseEther("0"))
            });

            it("Should revert due to zero address", async function() {
                await expect(hardhatToken.burn(zeroAddress, ethers.utils.parseEther("10000"))).
                to.be.revertedWith("Cannot be zero address");
                await expect(hardhatToken.mint(zeroAddress, ethers.utils.parseEther("10000"))).
                to.be.revertedWith("Cannot be zero address");
            });
        });


    })
});