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

export async function updateBioForDomain(nameHash, bio) {
    return fcl.mutate({
        cadence: UPDATE_BIO_FOR_DOMAIN,
        args: (arg, t) => [arg(nameHash, t.String), arg(bio, t.String)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
    });
}

const UPDATE_BIO_FOR_DOMAIN = `

import Domains from 0xDomains

transaction(nameHash: String, bio: String) {
    prepare(account: AuthAccount) {
        var domain: &{Domains.DomainPrivate}? = nil
        let collecttionPvt = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath) ?? panic("Could not load collection private")

        let id = Domains.nameHashToIDs[nameHash]
        if id == nil {
            panic("Could not find domain")
        }

        domain = collectionPvt.borrowDomainPrivate(id: id!)
        self.domain = domain!

    }

    execute {
        self.domain.setBio(bio:bio)
    }
}
`;

export async function updateAddressForDomain(nameHash, addr) {
    return fcl.mutate({
        cadence: UPDATE_ADDRESS_FOR_DOMAIN,
        args: (arg, t) => [arg(nameHash, t.String), arg(addr, t.Address)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,

    });
}

const UPDATE_ADDRESS_FOR_DOMAIN = `

import Domains from 0xDomains

transaction(nameHash: String, addr: Address) {
    var domain: &{Domains.DomainPrivate}
    prepare(account: AuthAccount) {
        var domain: &{Domains.DomainPrivate}? = nil
        let collectionPvt = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath)

        let id = Domains.nameHashToIDs[nameHash]
        if id == nil {
            panic("Could not find domain")
        }

        domain = collectionPvt.borrowDomainPrivate(id:id!)
        self.domain = domain!
    }

    execute {
        self.domain.setAddress(addr: addr)
    }
}
`;
 

export async function renewDomain(name, duration) {
    return fcl.mutate({
        caence: RENEW_DOMAIN,
        args: (arg, t) => [arg(name, t.String), arg(duration, t.UFix64)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
    });
}

const RENEW_DOMAIN = `
import Domains from 0xDomains
import FungibleToken from 0xFungibleToken
import NonFungibleToken from 0xNonFungibleToken

transaction(name: String, duration: UFix64) {
    let vault: @FungibleToken.Vault
    var domain: &Domains.NFT
    prepare(account: AuthAcount) {
        let collectionRef = account.borrow<&{Domains.CollectionPublic}>(from: Domains.DomainsStoragePath) ?? panic("Could not borrow collection public")
        var domain: &Domains.NFT? =nil
        let collectionPrivateRef = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath) ?? panic("Could not borrow collection private")

        let nameHash = Domains.getDomainNameHash(name: name)
        let domainId = Domains.namehashToIDs[nameHash]
        log(domainId)
        if domainId == nil {
            panic("You don't own this domain)
        }

        domain = colllectionPrivateRef.borrowDomainPrivate(id: domainId!)
        self.domain = domain!
        let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) ?? panic("Could not borrow FLOW token vault reference")
        let rentCost = Domains.getRentCost(name: name, duration: duration)
        self.vault <- vaultRef.withdraw(amount: rentCost)
    }
    execute {
        Domains.renewDomain(domain: self.domain, duration: duration, feeTokens <- self.vault)
}
`;