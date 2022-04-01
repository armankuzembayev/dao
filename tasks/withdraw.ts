import { task } from "hardhat/config";
import * as Configs from "../config"


task("withdraw", "Swap Between Networks")
    .addParam("token", "Token address")
    .setAction(async  (taskArgs, { ethers }) => {

    const contract = await ethers.getContractAt("Dao", taskArgs.token);
    
    await contract.withdraw();
});