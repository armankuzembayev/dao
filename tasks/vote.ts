import { task } from "hardhat/config";
import * as Configs from "../config"


task("vote", "Swap Between Networks")
    .addParam("token", "Token address")
    .addParam("id", "Proposal Id")
    .addParam("supportAgainst", "Bool for or against")
    .setAction(async  (taskArgs, { ethers }) => {

    const contract = await ethers.getContractAt("Dao", taskArgs.token);
    
    await contract.vote(taskArgs.id, taskArgs.supportAgainst);
});