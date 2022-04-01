import { task } from "hardhat/config";
import * as Configs from "../config"


task("addProposal", "Swap Between Networks")
    .addParam("token", "Token address")
    .addParam("calldata", "Calldata")
    .addParam("recipient", "Recipient's address")
    .addParam("description", "Proposal description")
    .setAction(async  (taskArgs, { ethers }) => {

    const contract = await ethers.getContractAt("Dao", taskArgs.token);
    
    await contract.addProposal(taskArgs.calldata, taskArgs.recipient, taskArgs.description);
});