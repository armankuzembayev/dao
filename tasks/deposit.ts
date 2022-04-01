import { task } from "hardhat/config";
import * as Configs from "../config"


task("deposit", "Swap Between Networks")
    .addParam("token", "Token address")
    .addParam("amount", "Amount")
    .setAction(async  (taskArgs, { ethers }) => {

    const contract = await ethers.getContractAt("Dao", taskArgs.token);
    
    await contract.deposit(taskArgs.amount);
});