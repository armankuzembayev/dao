import { task } from "hardhat/config";
import * as Configs from "../config"


task("finish", "Swap Between Networks")
    .addParam("token", "Token address")
    .addParam("id", "Proposal Id")
    .setAction(async  (taskArgs, { ethers }) => {

    const contract = await ethers.getContractAt("Dao", taskArgs.token);
    
    await contract.finishProposal(taskArgs.id);
});