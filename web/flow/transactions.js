import * as fcl from "@onflow/fcl";

export async function initializedAccount() {
    return fcl.mutate({
        cadence: INIT_ACCOUNT,
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 50,
    });
}

const INIT_ACCOUNT = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

transaction(){
    prepare(account: AuthAccount){
        account.save<@NonFungibleToken.Collection>(<- Domains.createEmptyCollection(), to: Domains.DomainsStoragePath)
        account.link<&Domains.Collection{NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver, Domains.CollectionPublic}>(Domains.DomainsPublicPath, target: Domains.DomainsStoragePath)
        account.link<&Domains.Collection>(Domains.DomainsPrivatePath, target: Domains.DomainsStoragePath)
    }
}
`;

export async function registerDomain(name, duration) {
    return fcl.mutate({
        cadence: REGISTER_DOMAIN,
        args: (arg, t) => [arg(name, t.string), arg(duration, t.UFix64)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
    });
}

const REGISTER_DOMAIN = `
import Domains from 0xDomains
import FungibleToken from )xFungibleToken
import NonFungibleToken from 0xNonFungibleToken

transaction(name: String, duration: UFix64) {
    let nftReceiverCap: Capability<&{NonFungibleToken.Receiver}>
    let vault: @FungibleToken.Vault
    prepare(account: AuthAccount) {
        self.nftReceiverCap = account.getCapability<&{NonFungibleToken.Receiver}>(Domains.DomainsPublicPath)
        let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) ??  panic("Could not borrow Flow token vault reference")
        let rentCost = Domains.getRentCost(name: name, duration: duration)
        self.vault <- vaultRef.withdraw(amount: rentCost)
    }

    execute {
        Domains.registerDomain(name: name, duration: duration, feeTokens: <- self.vault, receiver: self.nftReceiverCap)
    }
}
`;